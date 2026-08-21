import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function getBusinessFaqs(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  return prisma.businessFaq.findMany({
    where: { businessId: business.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, question: true, answer: true, category: true },
  });
}

export async function getMyFaqs(userId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  return prisma.businessFaq.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function createFaq(
  userId: string,
  data: { question: string; answer: string; category?: string; sortOrder?: number }
) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  return prisma.businessFaq.create({
    data: {
      businessId: business.id,
      question: data.question,
      answer: data.answer,
      category: data.category || 'general',
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function updateFaq(
  userId: string,
  faqId: string,
  data: {
    question?: string;
    answer?: string;
    category?: string;
    sortOrder?: number;
    isActive?: boolean;
  }
) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const faq = await prisma.businessFaq.findFirst({
    where: { id: faqId, businessId: business.id },
  });
  if (!faq) throw new AppError('FAQ non trouvée', 404);

  return prisma.businessFaq.update({
    where: { id: faqId },
    data,
  });
}

export async function deleteFaq(userId: string, faqId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const faq = await prisma.businessFaq.findFirst({
    where: { id: faqId, businessId: business.id },
  });
  if (!faq) throw new AppError('FAQ non trouvée', 404);

  await prisma.businessFaq.delete({ where: { id: faqId } });
}

export async function reorderFaqs(userId: string, faqIds: string[]) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  await prisma.$transaction(
    faqIds.map((id, index) =>
      prisma.businessFaq.updateMany({
        where: { id, businessId: business.id },
        data: { sortOrder: index },
      })
    )
  );
}
