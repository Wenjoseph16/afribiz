import type { ApiClientMethods } from './api-client.types';

export function injectProfile(api: ApiClientMethods) {
  api.getProfile = function () {
    return this.get('/users/profile');
  };
  api.updateProfile = function (data: any) {
    return this.put('/users/profile', data);
  };
  api.updatePassword = function (data: { currentPassword: string; newPassword: string }) {
    return this.put('/users/password', data);
  };
  api.uploadAvatar = function (file: File) {
    const form = new FormData();
    form.append('avatar', file);
    return this.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
  api.uploadMedia = function (file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.post('/upload/media', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
  api.uploadMultipleMedia = function (files: File[]) {
    const form = new FormData();
    files.forEach((f: File) => form.append('files', f));
    return this.post('/upload/media/multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };
}
