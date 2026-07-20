import type { ApiClientMethods } from './api-client.types';

export function injectVoiceCatalogue(api: ApiClientMethods) {
  api.getVoiceCommands = function () {
    return this.get('/voice/commands');
  };
  api.createVoiceCommand = function (data: any) {
    return this.post('/voice/commands', data);
  };
  api.updateVoiceCommand = function (id: string, data: any) {
    return this.put('/voice/commands/' + id, data);
  };
  api.deleteVoiceCommand = function (id: string) {
    return this.delete('/voice/commands/' + id);
  };
  api.getVoiceQueries = function () {
    return this.get('/voice/queries');
  };
  api.createVoiceQuery = function (data: any) {
    return this.post('/voice/queries', data);
  };
  api.getVoiceStats = function () {
    return this.get('/voice/stats');
  };
}
