import type { ApiClientMethods } from './api-client.types';

export function injectStories(api: ApiClientMethods) {
  api.getActiveStories = function () {
    return this.get('/stories');
  };
  api.getBusinessStories = function (businessId: string) {
    return this.get('/stories/business/' + businessId);
  };
  api.createStory = function (data: any) {
    return this.post('/stories', data);
  };
  api.viewStory = function (storyId: string) {
    return this.post('/stories/' + storyId + '/view');
  };
  api.clickStory = function (storyId: string) {
    return this.post('/stories/' + storyId + '/click');
  };
  api.deleteStory = function (id: string) {
    return this.delete('/stories/' + id);
  };
  api.updateStory = function (id: string, data: any) {
    return this.put('/stories/' + id, data);
  };
  api.addSticker = function (storyId: string, sticker: any) {
    return this.post('/stories/' + storyId + '/stickers', sticker);
  };
  api.removeSticker = function (storyId: string, stickerId: string) {
    return this.delete('/stories/' + storyId + '/stickers/' + stickerId);
  };
  api.getHighlights = function (businessId: string) {
    return this.get('/stories/highlights/' + businessId);
  };
  api.toggleHighlight = function (storyId: string, isHighlight: boolean) {
    return this.put('/stories/' + storyId + '/highlight', { isHighlight });
  };
}
