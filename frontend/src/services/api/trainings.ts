import type { ApiClientMethods } from './api-client.types';

export function injectTrainings(api: ApiClientMethods) {
  api.getTrainingProgress = function (trainingId: string) {
    return this.get('/trainings/advanced/' + trainingId + '/progress');
  };
  api.getLesson = function (lessonId: string) {
    return this.get('/trainings/advanced/lessons/' + lessonId);
  };
  api.generateCertificate = function (trainingId: string) {
    return this.post('/trainings/' + trainingId + '/certificate');
  };
  api.submitQuizAttempt = function (quizId: string, data: any) {
    return this.post('/trainings/advanced/quiz/' + quizId + '/attempt', data);
  };
}
