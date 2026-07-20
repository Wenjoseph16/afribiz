import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { publishNewMessage } from '../events/publishers';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { getIO } from '../services/socket';
import { searchIdsByText } from '../lib/fulltext';

export const getConversations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { type } = req.query;

    const where: any = {
      participants: { has: req.user.id },
    };
    if (type === 'business') {
      // Les clients créent des conversations avec les business en type 'direct'
      // On inclut les deux types pour que les business voient tous leurs messages
      where.type = { in: ['business', 'direct'] };
    } else if (type) {
      where.type = type;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: req.user!.id },
                read: false,
              },
            },
          },
        },
      },
    });

    // Batch résoudre les noms des participants — 2 requêtes au lieu de N
    const otherUserIds: string[] = [];
    for (const conv of conversations) {
      const otherUserId = conv.participants.find((pid: string) => pid !== req.user!.id);
      if (otherUserId) otherUserIds.push(otherUserId);
    }

    // 1 requête unique pour tous les business via ownerId
    const allBusinesses = await prisma.business.findMany({
      where: { ownerId: { in: otherUserIds }, isActive: true },
      select: { ownerId: true, name: true, logo: true, slug: true },
    });
    const businessByOwner = new Map(allBusinesses.map((b) => [b.ownerId, b]));

    // Fallback : chercher les business par nom pour TOUS les sujets de conversation
    const allSubjects = conversations.map((c) => c.subject).filter((s): s is string => !!s);
    const fallbackBusinesses =
      allSubjects.length > 0
        ? await prisma.business.findMany({
            where: { name: { in: allSubjects }, isActive: true },
            select: { name: true, logo: true, slug: true },
          })
        : [];
    const businessBySubject = new Map(fallbackBusinesses.map((b) => [b.name, b]));

    // 1 requête unique pour tous les utilisateurs restants
    const businessOwnerIds = new Set(allBusinesses.map((b) => b.ownerId));
    const userLookupIds = otherUserIds.filter((id) => !businessOwnerIds.has(id));
    const otherUsers =
      userLookupIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userLookupIds } },
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          })
        : [];
    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    // Construire la réponse en mémoire — pas de requête supplémentaire
    const conversationsWithDetails = conversations.map((conv) => {
      const unreadCount = conv._count?.messages ?? 0;
      const otherUserId = conv.participants.find((pid: string) => pid !== req.user!.id);
      let businessName = '';
      let otherUserName = '';
      let otherUserAvatar: string | null = null;
      let otherUserInitial = '';

      if (otherUserId) {
        const business = businessByOwner.get(otherUserId);

        if (business) {
          businessName = business.name;
          otherUserAvatar = business.logo;
          otherUserInitial = business.name.charAt(0).toUpperCase();
        } else {
          const otherUser = userMap.get(otherUserId);
          if (otherUser) {
            const fullName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
            businessName = fullName || otherUser.email.split('@')[0];
            otherUserName = fullName;
            otherUserAvatar = otherUser.avatar;
            otherUserInitial = (fullName.charAt(0) || otherUser.email.charAt(0)).toUpperCase();
          }
        }
      }

      // Fallback : utiliser le sujet comme nom du business
      if (!businessName && conv.subject) {
        const biz = businessBySubject.get(conv.subject);
        if (biz) {
          businessName = biz.name;
          otherUserAvatar = biz.logo || otherUserAvatar;
          otherUserInitial = biz.name.charAt(0).toUpperCase();
        } else {
          businessName = conv.subject;
        }
      }

      const lastMsg = conv.messages?.[0];
      return {
        ...conv,
        businessName,
        otherUserName,
        otherUserAvatar,
        otherUserInitial,
        unreadCount,
        unread: unreadCount,
        lastMessage: lastMsg?.content || '',
        lastMessageAt: lastMsg?.createdAt || conv.lastMessageAt,
      };
    });

    res.json(successResponse({ conversations: conversationsWithDetails }));
  }
);

export const getMessages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { has: req.user.id } },
  });
  if (!conversation) {
    throw new AppError('Conversation introuvable', 404);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  const updated = await prisma.message.updateMany({
    where: { conversationId, senderId: { not: req.user.id }, read: false },
    data: { read: true, readAt: new Date() },
  });

  // Notifier l'expéditeur que ses messages ont été lus (✓✓ bleu, façon WhatsApp)
  if (updated.count > 0 && req.user) {
    const io = getIO();
    if (io) {
      const readBy = req.user.id;
      const otherSenderIds = [
        ...new Set(messages.filter((m) => m.senderId !== readBy).map((m) => m.senderId)),
      ];
      for (const sid of otherSenderIds) {
        io.to(`user:${sid}`).emit('message:read', { conversationId, readBy });
      }
    }
  }

  res.json(successResponse({ messages, conversation }));
});

export const sendMessage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { conversationId } = req.params;
  const { content, attachment } = req.body;
  if (!content?.trim()) {
    throw new AppError('Le message ne peut pas être vide', 400);
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { has: req.user.id } },
  });
  if (!conversation) {
    throw new AppError('Conversation introuvable', 404);
  }

  const message = await prisma.message.create({
    data: { conversationId, senderId: req.user.id, content: content.trim(), attachment },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Broadcast new message via Socket.IO to all conversation participants
  const io = getIO();
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message:new', message);
    io.to(`user:${req.user.id}`).emit('message:sent', message);
  }

  const sender = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { firstName: true, lastName: true },
  });
  const fromName = sender
    ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilisateur'
    : 'Utilisateur';
  const recipientIds = conversation.participants.filter((id: string) => id !== req.user!.id);
  for (const uid of recipientIds) {
    publishNewMessage({ userId: uid, fromName, conversationId });

    // 🔔 Émettre notification temps réel au destinataire
    if (io) {
      io.to(`user:${uid}`).emit('notification:new', {
        id: `msg-${message.id}`,
        type: 'NEW_MESSAGE',
        title: `Nouveau message de ${fromName}`,
        description: (message.content || '').slice(0, 100),
        link: '/dashboard/messages',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  res.status(201).json(successResponse({ message }, 'Message envoyé'));
});

export const sendMessageByBody = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { conversationId, content, attachment } = req.body;
    if (!conversationId) {
      throw new AppError('conversationId requis', 400);
    }
    if (!content?.trim()) {
      throw new AppError('Le message ne peut pas être vide', 400);
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, participants: { has: req.user.id } },
    });
    if (!conversation) {
      throw new AppError('Conversation introuvable', 404);
    }

    const message = await prisma.message.create({
      data: { conversationId, senderId: req.user.id, content: content.trim(), attachment },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Broadcast new message via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', message);
      io.to(`user:${req.user.id}`).emit('message:sent', message);
    }

    const sender = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { firstName: true, lastName: true },
    });
    const fromName = sender
      ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilisateur'
      : 'Utilisateur';
    const recipientIds = conversation.participants.filter((id: string) => id !== req.user!.id);
    for (const uid of recipientIds) {
      publishNewMessage({ userId: uid, fromName, conversationId });

      // 🔔 Émettre notification temps réel au destinataire
      const io = getIO();
      if (io) {
        io.to(`user:${uid}`).emit('notification:new', {
          id: `msg-${message.id}`,
          type: 'NEW_MESSAGE',
          title: `Nouveau message de ${fromName}`,
          description: (message.content || '').slice(0, 100),
          link: '/dashboard/messages',
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.status(201).json(successResponse({ message }, 'Message envoyé'));
  }
);

export const createConversation = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { recipientId, subject, initialMessage } = req.body;
    if (!recipientId) {
      throw new AppError('Destinataire requis', 400);
    }
    if (recipientId === req.user.id) {
      throw new AppError('Vous ne pouvez pas vous envoyer un message à vous-même', 400);
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    const participantIds = [req.user.id, recipientId].sort();
    const existing = await prisma.conversation.findFirst({
      where: {
        participants: { hasEvery: participantIds },
        type: 'direct',
      },
    });
    if (existing) {
      if (initialMessage?.trim()) {
        await prisma.message.create({
          data: {
            conversationId: existing.id,
            senderId: req.user.id,
            content: initialMessage.trim(),
          },
        });
        await prisma.conversation.update({
          where: { id: existing.id },
          data: { lastMessageAt: new Date() },
        });
      }
      res.json(
        successResponse({ conversation: existing, existing: true }, 'Conversation existante')
      );
      return;
    }

    // Détecter si le destinataire est propriétaire d'un business → type 'business'
    const recipientBusiness = await prisma.business.findFirst({
      where: { ownerId: recipientId, isActive: true },
      select: { id: true },
    });
    const convType = recipientBusiness ? 'business' : 'direct';

    const conversation = await prisma.conversation.create({
      data: {
        type: convType,
        subject: subject?.trim() || null,
        participants: participantIds,
      },
    });

    if (initialMessage?.trim()) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: req.user.id,
          content: initialMessage.trim(),
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    // 🔔 Notifier le destinataire de la nouvelle conversation
    const io = getIO();
    if (io) {
      io.to(`user:${recipientId}`).emit('conversation:new', {
        id: conversation.id,
        type: 'NEW_CONVERSATION',
        title: 'Nouvelle conversation',
        description: `${subject || initialMessage?.slice(0, 50) || 'Nouveau message'}`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    res.status(201).json(successResponse({ conversation }, 'Conversation créée'));
  }
);

export const createSupportTicket = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { subject, description } = req.body;
    if (!subject?.trim() || !description?.trim()) {
      throw new AppError('Sujet et description requis', 400);
    }

    const conversation = await prisma.conversation.create({
      data: {
        type: 'support',
        subject: subject.trim(),
        participants: [req.user.id],
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: req.user.id,
        content: description.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    res.status(201).json(successResponse({ conversation }, 'Ticket créé'));
  }
);

export const getBusinessConversations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findUnique({
      where: { ownerId: req.user.id },
      select: { id: true, name: true, logo: true },
    });
    if (!business) {
      res.json(successResponse({ conversations: [] }));
      return;
    }
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { has: req.user.id },
        OR: [{ type: 'business' }, { type: 'direct' }, { type: 'support' }],
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: req.user!.id },
                read: false,
              },
            },
          },
        },
      },
    });

    // Batch résoudre les noms des clients — 1 requête au lieu de N
    const otherUserIds: string[] = [];
    for (const conv of conversations) {
      const oid = conv.participants.find((pid: string) => pid !== req.user!.id);
      if (oid) otherUserIds.push(oid);
    }
    const otherUsers =
      otherUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: otherUserIds } },
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          })
        : [];
    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    // Construire la réponse en mémoire
    const conversationsWithDetails = conversations.map((conv) => {
      const unreadCount = conv._count?.messages ?? 0;
      const otherUserId = conv.participants.find((pid: string) => pid !== req.user!.id);
      let clientName = 'Client';
      let clientAvatar: string | null = null;
      let clientInitial = 'C';

      if (otherUserId) {
        const otherUser = userMap.get(otherUserId);
        if (otherUser) {
          const fullName = `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim();
          clientName = fullName || otherUser.email.split('@')[0] || 'Client';
          clientAvatar = otherUser.avatar;
          clientInitial = (fullName.charAt(0) || otherUser.email.charAt(0)).toUpperCase();
        }
      }

      const lastMsg = conv.messages?.[0];
      return {
        ...conv,
        businessName: clientName,
        otherUserName: clientName,
        otherUserAvatar: clientAvatar,
        otherUserInitial: clientInitial,
        unreadCount,
        unread: unreadCount,
        lastMessage: lastMsg?.content || '',
        lastMessageAt: lastMsg?.createdAt || conv.lastMessageAt,
      };
    });

    res.json(successResponse({ conversations: conversationsWithDetails }));
  }
);

export const getUnreadMessageCount = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const total = await prisma.message.count({
      where: {
        conversation: {
          participants: { has: req.user.id },
        },
        senderId: { not: req.user.id },
        read: false,
      },
    });

    res.json(successResponse({ total }));
  }
);

export const searchRecipients = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const q = ((req.query.q as string) || '').trim();
    const type = (req.query.type as string) || '';
    const city = (req.query.city as string) || '';
    const minRating = Number(req.query.minRating) || 0;
    const limit = Math.min(Number(req.query.limit) || 12, 50);

    // Construire le filtre where dynamiquement
    const where: any = { isActive: true, deletedAt: null };

    if (q && q.length >= 2) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { skills: { has: q.toLowerCase() } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minRating > 0) {
      where.rating = { gte: minRating };
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { rating: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        coverImage: true,
        type: true,
        city: true,
        country: true,
        rating: true,
        reviewCount: true,
        shortDescription: true,
        skills: true,
        ownerId: true,
      },
    });

    const userIds = businesses.map((b) => b.ownerId).filter(Boolean);
    const owners = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    // Récupérer les types distincts pour le filtre
    const allTypes = await prisma.business.findMany({
      where: { isActive: true, deletedAt: null },
      distinct: ['type'],
      select: { type: true },
      take: 50,
    });

    const results = businesses.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      coverImage: b.coverImage,
      type: b.type,
      city: b.city,
      country: b.country,
      rating: b.rating,
      reviewCount: b.reviewCount,
      shortDescription: b.shortDescription,

      ownerId: b.ownerId,
      owner: b.ownerId ? ownerMap.get(b.ownerId) || null : null,
      _type: 'business' as const,
    }));

    res.json(
      successResponse({
        results,
        filters: {
          types: allTypes.map((t) => t.type).filter(Boolean),
        },
      })
    );
  }
);
