import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';

export const getMessageReactions = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { messageId } = req.params;

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
    });

    // Group by emoji and count
    const grouped: Record<string, { count: number; users: string[] }> = {};
    for (const r of reactions) {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, users: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.userId);
    }

    const currentUserId = req.user!.id;
    const myReactions = reactions.filter((r) => r.userId === currentUserId).map((r) => r.emoji);

    res.json(
      successResponse({
        reactions: grouped,
        myReactions,
      })
    );
  }
);

export const addReaction = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    throw new AppError('Emoji requis', 400);
  }

  // Verify message exists and user has access
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        select: { participants: true },
      },
    },
  });

  if (!message) {
    throw new AppError('Message introuvable', 404);
  }

  if (!message.conversation.participants.includes(req.user!.id)) {
    throw new AppError('Acces refuse', 403);
  }

  // Upsert: create or skip if already exists
  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user!.id,
        emoji,
      },
    },
  });

  if (existing) {
    res.json(successResponse({ reaction: existing }, 'Reaction deja presente'));
    return;
  }

  const reaction = await prisma.messageReaction.create({
    data: {
      messageId,
      userId: req.user!.id,
      emoji,
    },
  });

  res.status(201).json(successResponse({ reaction }, 'Reaction ajoutee'));
});

export const removeReaction = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { messageId, emoji } = req.params;

  const existing = await prisma.messageReaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user!.id,
        emoji,
      },
    },
  });
  if (!existing) {
    throw new AppError('Reaction introuvable', 404);
  }
  await prisma.messageReaction.delete({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: req.user!.id,
        emoji,
      },
    },
  });

  res.json(successResponse(null, 'Reaction retiree'));
});
