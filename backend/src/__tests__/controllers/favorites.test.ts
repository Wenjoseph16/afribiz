import * as favoriteCtrl from '../../controllers/favorites';

jest.mock('../../services/favoriteService', () => ({
  getFavorites: jest.fn(),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

import { getFavorites, addFavorite, removeFavorite } from '../../services/favoriteService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.status = jest.fn().mockReturnValue(r);
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return { user: { id: 'u1' }, params: {}, body: {}, query: {}, ...overrides } as any;
}

describe('favorites controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    const res = mockRes();
    const next = jest.fn();
    favoriteCtrl.list(req(), res, next);
    await flush();
    expect(getFavorites).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('add returns 201', async () => {
    (addFavorite as jest.Mock).mockResolvedValue({ id: 'f1' });
    const res = mockRes();
    const next = jest.fn();
    favoriteCtrl.add(req({ body: { productId: 'p1' } }), res, next);
    await flush();
    expect(addFavorite).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('remove', async () => {
    (removeFavorite as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    favoriteCtrl.remove(req({ params: { id: 'f1' } }), res, next);
    await flush();
    expect(removeFavorite).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    favoriteCtrl.list({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
