import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function enrollInTraining(userId: string, trainingId: string) {
  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) throw new AppError('Formation non trouvée', 404);

  const existing = await prisma.userTraining.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
  });
  if (existing) throw new AppError('Vous êtes déjà inscrit à cette formation', 409);

  const isPaidTraining = training.price && Number(training.price) > 0;

  return prisma.userTraining.create({
    data: {
      userId,
      trainingId,
      status: 'NOT_STARTED',
      progress: 0,
      isPaid: isPaidTraining ? false : true,
    },
    include: { training: true },
  });
}

export async function confirmTrainingPayment(
  userId: string,
  trainingId: string,
  amount: number,
  paymentRef: string
) {
  const enrollment = await prisma.userTraining.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
  });
  if (!enrollment) throw new AppError('Inscription non trouvée', 404);
  if (enrollment.isPaid) throw new AppError('Déjà payé', 400);
  return prisma.userTraining.update({
    where: { userId_trainingId: { userId, trainingId } },
    data: {
      isPaid: true,
      paidAt: new Date(),
      amountPaid: amount,
      paymentRef: paymentRef,
      completedAt: new Date(),
    },
  });
}

export async function listAllTrainings() {
  return prisma.training.findMany({
    where: { deletedAt: null },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserTrainings(userId: string) {
  const userTrainings = await prisma.userTraining.findMany({
    where: { userId },
    include: {
      training: {
        include: {
          business: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { training: { createdAt: 'desc' } },
  });

  return userTrainings.map((ut) => ({
    id: ut.trainingId,
    title: ut.training.title,
    description: ut.training.description,
    category: ut.training.category,
    duration: ut.training.duration,
    lessons: ut.training.lessons,
    status: ut.status,
    progress: ut.progress,
    businessName: ut.training.business?.name || null,
    business: ut.training.business?.name || null,
    instructor: ut.training.business?.name || null,
    url: ut.url,
    certificate: ut.certificateUrl,
  }));
}
