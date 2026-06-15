import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function enrollInTraining(userId: string, trainingId: string) {
  const training = await prisma.training.findUnique({ where: { id: trainingId } });
  if (!training) throw new AppError('Formation non trouvée', 404);

  const existing = await prisma.userTraining.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
  });
  if (existing) throw new AppError('Vous êtes déjà inscrit à cette formation', 409);

  return prisma.userTraining.create({
    data: { userId, trainingId, status: 'NOT_STARTED', progress: 0 },
    include: { training: true },
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
