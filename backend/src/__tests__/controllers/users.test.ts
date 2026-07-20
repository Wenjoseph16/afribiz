import {
  getMyProfile,
  updateMyProfile,
  updateMyPassword,
  toggleMy2FA,
  uploadMyAvatar,
} from '../../controllers/users';

jest.mock('../../services/profileService', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  toggle2FA: jest.fn(),
  uploadAvatar: jest.fn(),
}));

import {
  getProfile,
  updateProfile,
  updatePassword,
  toggle2FA,
  uploadAvatar,
} from '../../services/profileService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}

describe('getMyProfile', () => {
  it('should return user profile', async () => {
    (getProfile as jest.Mock).mockResolvedValue({ id: 'u1', email: 'a@b.com' });
    const res = mockRes();
    const next = jest.fn();
    getMyProfile({ user: { id: 'u1' } } as any, res, next);
    await flush();
    expect(getProfile).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    getMyProfile({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});

describe('updateMyProfile', () => {
  it('should update profile', async () => {
    (updateProfile as jest.Mock).mockResolvedValue({ id: 'u1' });
    const res = mockRes();
    const next = jest.fn();
    updateMyProfile({ user: { id: 'u1' }, body: { name: 'Test' } } as any, res, next);
    await flush();
    expect(updateProfile).toHaveBeenCalledWith('u1', { name: 'Test' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});

describe('updateMyPassword', () => {
  it('should update password', async () => {
    (updatePassword as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    updateMyPassword(
      { user: { id: 'u1' }, body: { currentPassword: 'old', newPassword: 'new' } } as any,
      res,
      next
    );
    await flush();
    expect(updatePassword).toHaveBeenCalledWith('u1', 'old', 'new');
  });
});

describe('toggleMy2FA', () => {
  it('should toggle 2FA', async () => {
    (toggle2FA as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    toggleMy2FA({ user: { id: 'u1' }, body: { enable: true } } as any, res, next);
    await flush();
    expect(toggle2FA).toHaveBeenCalledWith('u1', true);
  });
});

describe('uploadMyAvatar', () => {
  it('should upload avatar', async () => {
    (uploadAvatar as jest.Mock).mockResolvedValue('https://cdn.example.com/avatar.jpg');
    const res = mockRes();
    const next = jest.fn();
    uploadMyAvatar({ user: { id: 'u1' }, file: { path: '/tmp/avatar.jpg' } } as any, res, next);
    await flush();
    expect(uploadAvatar).toHaveBeenCalledWith('u1', { path: '/tmp/avatar.jpg' });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
