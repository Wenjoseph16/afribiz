import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ===== Helpers =====
async function getBusiness(userId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  return business;
}

// ===== TRAINING CRUD =====
export async function listBusinessTrainings(userId: string, filters: any = {}) {
  const business = await getBusiness(userId);
  const where: any = { businessId: business.id, deletedAt: null };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }
  if (filters.category) where.category = filters.category;
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 20;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.training.findMany({
      where,
      include: {
        _count: { select: { users: true, TrainingLesson: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.training.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getBusinessTraining(userId: string, trainingId: string) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({
    where: { id: trainingId, businessId: business.id, deletedAt: null },
    include: {
      TrainingLesson: {
        orderBy: { sortOrder: 'asc' },
        include: { TrainingQuiz: { include: { QuizQuestion: { orderBy: { sortOrder: 'asc' } } } } },
      },
      users: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { users: true, TrainingLesson: true } },
    },
  });
  if (!training) throw new AppError('Training not found', 404);
  return training;
}

export async function createBusinessTraining(userId: string, data: any) {
  const business = await getBusiness(userId);
  return prisma.training.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description,
      category: data.category,
      duration: data.duration,
    },
    include: { _count: { select: { users: true, TrainingLesson: true } } },
  });
}

export async function updateBusinessTraining(userId: string, trainingId: string, data: any) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({ where: { id: trainingId, businessId: business.id, deletedAt: null } });
  if (!training) throw new AppError('Training not found', 404);
  return prisma.training.update({
    where: { id: trainingId },
    data,
    include: { _count: { select: { users: true, TrainingLesson: true } } },
  });
}

export async function deleteBusinessTraining(userId: string, trainingId: string) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({ where: { id: trainingId, businessId: business.id, deletedAt: null } });
  if (!training) throw new AppError('Training not found', 404);
  await prisma.training.update({ where: { id: trainingId }, data: { deletedAt: new Date() } });
  return { message: 'Formation supprimée' };
}

// ===== STUDENTS =====
export async function getTrainingStudents(userId: string, trainingId: string, filters: any = {}) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({ where: { id: trainingId, businessId: business.id, deletedAt: null } });
  if (!training) throw new AppError('Training not found', 404);
  const where: any = { trainingId };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.user = {
      OR: [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
        { email: { contains: filters.search } },
      ],
    };
  }
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 30;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.userTraining.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.userTraining.count({ where }),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function getTrainingStats(userId: string) {
  const business = await getBusiness(userId);
  const where: any = { businessId: business.id, deletedAt: null };
  const [total, totalStudents, completedStudents] = await Promise.all([
    prisma.training.count({ where }),
    prisma.userTraining.count({ where: { training: { ...where } } }),
    prisma.userTraining.count({ where: { training: { ...where }, status: 'COMPLETED' } }),
  ]);
  const studentsByTraining = await prisma.training.findMany({
    where,
    select: { id: true, title: true, _count: { select: { users: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return { total, totalStudents, completedStudents, studentsByTraining };
}

// ===== LESSONS =====
export async function listLessons(userId: string, trainingId: string) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({ where: { id: trainingId, businessId: business.id, deletedAt: null } });
  if (!training) throw new AppError('Training not found', 404);
  return prisma.trainingLesson.findMany({
    where: { trainingId },
    orderBy: { sortOrder: 'asc' },
    include: { TrainingQuiz: { include: { QuizQuestion: { orderBy: { sortOrder: 'asc' } } } } },
  });
}

export async function createLesson(userId: string, data: any) {
  const business = await getBusiness(userId);
  const training = await prisma.training.findFirst({ where: { id: data.trainingId, businessId: business.id, deletedAt: null } });
  if (!training) throw new AppError('Training not found', 404);
  const lesson = await prisma.trainingLesson.create({
    data: {
      trainingId: data.trainingId,
      title: data.title,
      description: data.description,
      content: data.content,
      videoUrl: data.videoUrl,
      duration: data.duration || 0,
      sortOrder: data.sortOrder || 0,
      isFree: data.isFree || false,
    },
  });
  // Update lesson count on training
  const count = await prisma.trainingLesson.count({ where: { trainingId: data.trainingId } });
  await prisma.training.update({ where: { id: data.trainingId }, data: { lessons: count } });
  return lesson;
}

export async function updateLesson(userId: string, lessonId: string, data: any) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || !lesson.training.business || lesson.training.business.ownerId !== userId) throw new AppError('Leçon non trouvée', 404);
  return prisma.trainingLesson.update({ where: { id: lessonId }, data });
}

export async function deleteLesson(userId: string, lessonId: string) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || !lesson.training.business || lesson.training.business.ownerId !== userId) throw new AppError('Leçon non trouvée', 404);
  const trainingId = lesson.trainingId;
  await prisma.trainingLesson.delete({ where: { id: lessonId } });
  // Update lesson count
  const count = await prisma.trainingLesson.count({ where: { trainingId } });
  await prisma.training.update({ where: { id: trainingId }, data: { lessons: count } });
  return { message: 'Leçon supprimée' };
}

// ===== QUIZ =====
export async function createQuiz(userId: string, data: any) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: data.lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || !lesson.training.business || lesson.training.business.ownerId !== userId) throw new AppError('Lecon non trouvee', 404);
  const quiz = await prisma.trainingQuiz.create({
    data: {
      lessonId: data.lessonId,
      title: data.title,
      description: data.description,
      passingScore: data.passingScore || 70,
      maxAttempts: data.maxAttempts || 3,
      timeLimit: data.timeLimit,
      QuizQuestion: data.questions ? {
        create: data.questions.map((q: any, i: number) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          sortOrder: i,
        })),
      } : undefined,
    },
    include: { QuizQuestion: { orderBy: { sortOrder: 'asc' } } },
  });
  return quiz;
}

export async function deleteQuiz(userId: string, quizId: string) {
  const quiz = await prisma.trainingQuiz.findUnique({
    where: { id: quizId },
    include: { lesson: { include: { training: { select: { business: { select: { ownerId: true } } } } } } },
  });
  if (!quiz || !quiz.lesson.training.business || quiz.lesson.training.business.ownerId !== userId) throw new AppError('Quiz non trouve', 404);
  await prisma.trainingQuiz.delete({ where: { id: quizId } });
  return { message: 'Quiz supprime' };
}
