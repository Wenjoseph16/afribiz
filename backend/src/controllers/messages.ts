import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { publishNewMessage } from '../events/publishers';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { getIO } from '../services/socket';
import { searchIdsByText } from '../lib/fulltext';

export const getConversations = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { type } = req.query;

  const where: any = {
    participants: { has: req.user.id },
  };
  if (type) where.type = type;

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: req.user!.id },
        read: false,
      },
    });
    return { ...conv, unreadCount };
  }));

  res.json(successResponse({ conversations: conversationsWithUnread }));
});

export const getMessages = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { conversationId } = req.params;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { has: req.user.id } },
  });
  if (!conversation) { res.status(404).json({ success: false, error: 'Conversation introuvable' }); return; }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: req.user.id }, read: false },
    data: { read: true, readAt: new Date() },
  });

  res.json(successResponse({ messages, conversation }));
});

export const sendMessage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { conversationId } = req.params;
  const { content, attachment } = req.body;
  if (!content?.trim()) { res.status(400).json({ success: false, error: 'Le message ne peut pas être vide' }); return; }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { has: req.user.id } },
  });
  if (!conversation) { res.status(404).json({ success: false, error: 'Conversation introuvable' }); return; }

  const message = await prisma.message.create({
    data: { conversationId, senderId: req.user.id, content: content.trim(), attachment },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Broadcast new message via Socket.IO to all conversation participants
  const io = getIO();
  io.to(`conversation:${conversationId}`).emit('message:new', message);
  io.to(`user:${req.user.id}`).emit('message:sent', message);

  const fromName = req.user.email.split('@')[0] || 'Utilisateur';
  const recipientIds = conversation.participants.filter((id: string) => id !== req.user!.id);
  for (const uid of recipientIds) {
    publishNewMessage({ userId: uid, fromName, conversationId });
  }

  res.status(201).json(successResponse({ message }, 'Message envoyé'));
});

export const sendMessageByBody = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { conversationId, content, attachment } = req.body;
  if (!conversationId) { res.status(400).json({ success: false, error: 'conversationId requis' }); return; }
  if (!content?.trim()) { res.status(400).json({ success: false, error: 'Le message ne peut pas être vide' }); return; }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, participants: { has: req.user.id } },
  });
  if (!conversation) { res.status(404).json({ success: false, error: 'Conversation introuvable' }); return; }

  const message = await prisma.message.create({
    data: { conversationId, senderId: req.user.id, content: content.trim(), attachment },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // Broadcast new message via Socket.IO
  const io = getIO();
  io.to(`conversation:${conversationId}`).emit('message:new', message);
  io.to(`user:${req.user.id}`).emit('message:sent', message);

  const fromName = req.user.email.split('@')[0] || 'Utilisateur';
  const recipientIds = conversation.participants.filter((id: string) => id !== req.user!.id);
  for (const uid of recipientIds) {
    publishNewMessage({ userId: uid, fromName, conversationId });
  }

  res.status(201).json(successResponse({ message }, 'Message envoyé'));
});

export const createConversation = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { recipientId, subject, initialMessage } = req.body;
  if (!recipientId) { res.status(400).json({ success: false, error: 'Destinataire requis' }); return; }
  if (recipientId === req.user.id) { res.status(400).json({ success: false, error: 'Vous ne pouvez pas vous envoyer un message à vous-même' }); return; }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient) { res.status(404).json({ success: false, error: 'Utilisateur non trouvé' }); return; }

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
        data: { conversationId: existing.id, senderId: req.user.id, content: initialMessage.trim() },
      });
      await prisma.conversation.update({
        where: { id: existing.id },
        data: { lastMessageAt: new Date() },
      });
    }
    res.json(successResponse({ conversation: existing, existing: true }, 'Conversation existante'));
    return;
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: 'direct',
      subject: subject?.trim() || null,
      participants: participantIds,
    },
  });

  if (initialMessage?.trim()) {
    await prisma.message.create({
      data: { conversationId: conversation.id, senderId: req.user.id, content: initialMessage.trim() },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });
  }

  res.status(201).json(successResponse({ conversation }, 'Conversation créée'));
});

export const createSupportTicket = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { subject, description } = req.body;
  if (!subject?.trim() || !description?.trim()) { res.status(400).json({ success: false, error: 'Sujet et description requis' }); return; }

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
});

export const searchRecipients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const q = (req.query.q as string || '').trim();
  if (!q || q.length < 2) { res.json(successResponse({ results: [] })); return; }

  const searchableIds = await searchIdsByText('Business', ['name', 'description', 'city'], q, '"isActive" = true AND "deletedAt" IS NULL');

  const businesses = await prisma.business.findMany({
    where: searchableIds.length > 0
      ? { id: { in: searchableIds }, isActive: true, deletedAt: null }
      : { name: { contains: q, mode: 'insensitive' }, isActive: true, deletedAt: null },
    take: 8,
    select: {
      id: true, name: true, slug: true, logo: true, city: true,
      country: true, ownerId: true,
    },
  });

  const userIds = businesses.map(b => b.ownerId).filter(Boolean);
  const owners = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  const ownerMap = new Map(owners.map(o => [o.id, o]));

  const results = businesses.map(b => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo: b.logo,
    city: b.city,
    country: b.country,
    ownerId: b.ownerId,
    owner: b.ownerId ? ownerMap.get(b.ownerId) || null : null,
    _type: 'business' as const,
  }));

  res.json(successResponse({ results }));
});
