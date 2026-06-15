import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishTrainingPurchased } from '../events/publishers';

// ── Lessons ──
export async function listLessons(ownerId: string, trainingId: string) {
  const training = await prisma.training.findFirst({
    where: { id: trainingId, business: { ownerId } },
  });
  if (!training) throw new AppError('Formation non trouvée', 404);
  return prisma.trainingLesson.findMany({
    where: { trainingId },
    orderBy: { sortOrder: 'asc' },
    include: { quiz: true } as any,
  });
}

export async function getLesson(lessonId: string) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: {
      quiz: { include: { questions: { orderBy: { sortOrder: 'asc' } } } as any },
      training: { select: { id: true, title: true, businessId: true } },
    } as any,
  });
  if (!lesson) throw new AppError('Leçon non trouvée', 404);
  return lesson;
}

export async function createLesson(ownerId: string, data: any) {
  const training = await prisma.training.findFirst({
    where: { id: data.trainingId, business: { ownerId } },
  });
  if (!training) throw new AppError('Formation non trouvée', 404);
  return prisma.trainingLesson.create({
    data: {
      trainingId: data.trainingId,
      title: data.title,
      description: data.description || null,
      content: data.content || null,
      videoUrl: data.videoUrl || null,
      duration: data.duration || 0,
      sortOrder: data.sortOrder || 0,
      isFree: data.isFree || false,
    },
  });
}

export async function updateLesson(ownerId: string, lessonId: string, data: any) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || (lesson.training as any).business.ownerId !== ownerId) throw new AppError('Leçon non trouvée', 404);
  const upd: any = {};
  if (data.title !== undefined) upd.title = data.title;
  if (data.description !== undefined) upd.description = data.description;
  if (data.content !== undefined) upd.content = data.content;
  if (data.videoUrl !== undefined) upd.videoUrl = data.videoUrl;
  if (data.duration !== undefined) upd.duration = data.duration;
  if (data.sortOrder !== undefined) upd.sortOrder = data.sortOrder;
  if (data.isFree !== undefined) upd.isFree = data.isFree;
  return prisma.trainingLesson.update({ where: { id: lessonId }, data: upd });
}

export async function deleteLesson(ownerId: string, lessonId: string) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || (lesson.training as any).business.ownerId !== ownerId) throw new AppError('Leçon non trouvée', 404);
  await prisma.trainingLesson.delete({ where: { id: lessonId } });
}

// ── Quiz ──
export async function createQuiz(ownerId: string, data: any) {
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: data.lessonId },
    include: { training: { select: { business: { select: { ownerId: true } } } } },
  });
  if (!lesson || (lesson.training as any).business.ownerId !== ownerId) throw new AppError('Leçon non trouvée', 404);
  return prisma.trainingQuiz.create({
    data: {
      lessonId: data.lessonId,
      title: data.title,
      description: data.description || null,
      passingScore: data.passingScore || 70,
      maxAttempts: data.maxAttempts || 3,
      timeLimit: data.timeLimit || null,
      questions: data.questions ? {
        create: data.questions.map((q: any, i: number) => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation || null,
          sortOrder: i,
        })),
      } : undefined,
    } as any,
    include: { questions: { orderBy: { sortOrder: 'asc' } } } as any,
  });
}

export async function submitQuizAttempt(userId: string, quizId: string, answers: number[]) {
  const quiz = await prisma.trainingQuiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { sortOrder: 'asc' } } } as any,
  });
  if (!quiz) throw new AppError('Quiz non trouvé', 404);

  let score = 0;
  const totalQuestions = quiz.questions.length;
  const gradedAnswers = quiz.questions.map((q: any, i: number) => ({
    questionId: q.id,
    question: q.question,
    selectedAnswer: answers[i],
    correctAnswer: q.correctIndex,
    isCorrect: answers[i] === q.correctIndex,
  }));

  score = gradedAnswers.filter(a => a.isCorrect).length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= quiz.passingScore;

  const attempt = await prisma.userQuizAttempt.create({
    data: {
      userId,
      quizId,
      score: percentage,
      totalQuestions,
      answers: gradedAnswers,
      passed,
    },
  });

  // Update training progress
  const lesson = await prisma.trainingLesson.findUnique({
    where: { id: quiz.lessonId },
    select: { trainingId: true },
  });
  if (lesson) {
    await updateTrainingProgress(userId, lesson.trainingId);
  }

  return { attempt, passed, score: percentage, totalQuestions, answers: gradedAnswers };
}

export async function getUserQuizAttempts(userId: string, quizId: string) {
  return prisma.userQuizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { completedAt: 'desc' },
  });
}

// ── Progress ──
export async function updateTrainingProgress(userId: string, trainingId: string) {
  const totalLessons = await prisma.trainingLesson.count({ where: { trainingId } });
  const completedQuizzes = await prisma.userQuizAttempt.count({
    where: {
      userId,
      passed: true,
      quiz: { lesson: { trainingId } },
    },
  });
  const progress = totalLessons > 0 ? Math.round((completedQuizzes / totalLessons) * 100) : 0;
  return prisma.userTraining.update({
    where: { userId_trainingId: { userId, trainingId } },
    data: { progress, status: progress >= 100 ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED' },
  });
}

export async function getUserTrainingProgress(userId: string, trainingId: string) {
  const training = await prisma.training.findUnique({
    where: { id: trainingId },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: {
          quiz: {
            include: {
              questions: { orderBy: { sortOrder: 'asc' } },
            } as any,
          },
        } as any,
      },
    } as any,
  });
  if (!training) throw new AppError('Formation non trouvée', 404);
  const attempts = await prisma.userQuizAttempt.findMany({
    where: { userId, quiz: { lesson: { trainingId } } },
    orderBy: { completedAt: 'desc' },
  });
  const userTraining = await prisma.userTraining.findUnique({
    where: { userId_trainingId: { userId, trainingId } },
  });
  return { training, attempts, progress: userTraining?.progress || 0, status: userTraining?.status || 'NOT_STARTED' };
}
