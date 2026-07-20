import { prisma } from '../lib/db';
import { CommentTargetType, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { publishCommentCreated, publishCommentDeleted } from '../events/publishers';

interface CreateCommentParams {
  userId: string;
  type: CommentTargetType;
  referenceId: string;
  content: string;
  parentId?: string;
}

interface UpdateCommentParams {
  content: string;
}

export async function createComment(params: CreateCommentParams) {
  if (params.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: params.parentId },
      select: { id: true, type: true, referenceId: true },
    });
    if (!parent || parent.type !== params.type || parent.referenceId !== params.referenceId) {
      throw new AppError('Parent comment invalide', 400);
    }
  }

  const comment = await prisma.comment.create({
    data: {
      userId: params.userId,
      type: params.type,
      referenceId: params.referenceId,
      content: params.content,
      parentId: params.parentId,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  publishCommentCreated({
    userId: params.userId,
    commentId: comment.id,
    targetType: params.type,
    content: params.content,
  });

  return comment;
}

export async function getComments(
  type: CommentTargetType,
  referenceId: string,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: Prisma.CommentWhereInput = {
    type,
    referenceId,
    parentId: null,
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        replies: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    items: comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getCommentById(commentId: string) {
  return prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      replies: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function updateComment(
  commentId: string,
  userId: string,
  params: UpdateCommentParams
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true },
  });
  if (!comment) return null;
  if (comment.userId !== userId) throw new AppError('Non autorisé', 403);

  return prisma.comment.update({
    where: { id: commentId },
    data: { content: params.content },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, type: true },
  });
  if (!comment) return false;
  if (comment.userId !== userId) throw new AppError('Non autorisé', 403);

  await prisma.comment.delete({ where: { id: commentId } });

  publishCommentDeleted({
    userId,
    commentId,
    targetType: comment.type,
  });

  return true;
}

export async function countComments(type: CommentTargetType, referenceId: string) {
  return prisma.comment.count({ where: { type, referenceId } });
}
