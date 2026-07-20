import type { ApiClientMethods } from './api-client.types';

export function injectWhatsApp(api: ApiClientMethods) {
  api.getWhatsAppTemplates = function () {
    return this.get('/whatsapp/templates');
  };
  api.createWhatsAppTemplate = function (data: any) {
    return this.post('/whatsapp/templates', data);
  };
  api.updateWhatsAppTemplate = function (id: string, data: any) {
    return this.put('/whatsapp/templates/' + id, data);
  };
  api.deleteWhatsAppTemplate = function (id: string) {
    return this.delete('/whatsapp/templates/' + id);
  };
  api.getWhatsAppSessions = function () {
    return this.get('/whatsapp/sessions');
  };
  api.getWhatsAppMessages = function (sessionId: string) {
    return this.get('/whatsapp/sessions/' + sessionId + '/messages');
  };
  api.sendWhatsAppMessage = function (data: any) {
    return this.post('/whatsapp/messages', data);
  };
  api.getWhatsAppStats = function () {
    return this.get('/whatsapp/stats');
  };
}
