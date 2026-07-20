import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

const postInclude = {
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  business: { select: { id: true, name: true, slug: true, logo: true } },
  _count: { select: { likes: true, comments: true } },
} as const;

type CreatePostInput = {
  title?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  images?: string[];
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

type UpdatePostInput = Partial<CreatePostInput> & { isPinned?: boolean };

export async function createPost(authorId: string, businessId: string, data: CreatePostInput) {
  const post = await prisma.post.create({
    data: {
      businessId,
      authorId,
      title: data.title || null,
      content: data.content,
      excerpt: data.excerpt || null,
      coverImage: data.coverImage || null,
      images: data.images || [],
      tags: data.tags || [],
      status: data.status || 'PUBLISHED',
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
    },
    include: postInclude,
  });
  return post;
}

export async function updatePost(authorId: string, postId: string, data: UpdatePostInput) {
  const existing = await prisma.post.findFirst({
    where: { id: postId, authorId, deletedAt: null },
  });
  if (!existing) throw new AppError('Post non trouvé', 404);
  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.images !== undefined) updateData.images = data.images;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'PUBLISHED' && !existing.publishedAt) updateData.publishedAt = new Date();
  }
  if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;
  return prisma.post.update({ where: { id: postId }, data: updateData, include: postInclude });
}

export async function deletePost(authorId: string, postId: string) {
  const existing = await prisma.post.findFirst({
    where: { id: postId, authorId, deletedAt: null },
  });
  if (!existing) throw new AppError('Post non trouvé', 404);
  await prisma.post.update({
    where: { id: postId },
    data: { deletedAt: new Date(), status: 'ARCHIVED' },
  });
}

export async function getPost(postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, deletedAt: null },
    include: postInclude,
  });
  if (!post) throw new AppError('Post non trouvé', 404);
  await prisma.post
    .update({ where: { id: postId }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});
  return post;
}

export async function listPosts(
  businessId: string | null,
  params: { page?: number; limit?: number; status?: string; tag?: string }
) {
  const where: Prisma.PostWhereInput = { deletedAt: null };
  if (businessId) where.businessId = businessId;
  if (params.status) where.status = params.status as any;
  if (params.tag) where.tags = { has: params.tag };
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);
  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function toggleLike(userId: string, postId: string) {
  const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null } });
  if (!post) throw new AppError('Post non trouvé', 404);
  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
    return { liked: false };
  }
  await prisma.postLike.create({ data: { postId, userId } });
  await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });
  return { liked: true };
}

export async function getFeed(params: { page?: number; limit?: number }) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const posts = await prisma.post.findMany({
    where: { deletedAt: null, status: 'PUBLISHED' },
    include: postInclude,
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
  });
  const total = await prisma.post.count({ where: { deletedAt: null, status: 'PUBLISHED' } });
  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}
