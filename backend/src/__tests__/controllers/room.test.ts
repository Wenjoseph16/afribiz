import { mockPrisma } from '../setup';
import * as roomCtrl from '../../controllers/room';

jest.mock('../../services/room', () => ({
  listRooms: jest.fn(),
  createRoom: jest.fn(),
  deleteRoom: jest.fn(),
  getRoomStats: jest.fn(),
  toggleRoomActive: jest.fn(),
}));

const roomService = jest.requireMock('../../services/room');

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

describe('room controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listRooms - success', async () => {
    (roomService.listRooms as jest.Mock).mockResolvedValue({ rooms: [], total: 0 });
    const res = mockRes();
    roomCtrl.listRooms(req({ query: { page: '1', limit: '10' } }), res, jest.fn());
    await flush();
    expect(roomService.listRooms).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ page: 1, limit: 10 })
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('listRooms - 401', async () => {
    const res = mockRes();
    const next = jest.fn();
    roomCtrl.listRooms({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('createRoom - success 201', async () => {
    (roomService.createRoom as jest.Mock).mockResolvedValue({ id: 'r1' });
    const res = mockRes();
    roomCtrl.createRoom(req({ body: { name: 'Suite' } }), res, jest.fn());
    await flush();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Chambre créée avec succès' })
    );
  });

  it('createRoom - 401', async () => {
    const res = mockRes();
    const next = jest.fn();
    roomCtrl.createRoom({} as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('deleteRoom - message', async () => {
    (roomService.deleteRoom as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    roomCtrl.deleteRoom(req({ params: { id: 'r1' } }), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Chambre supprimée' });
  });

  it('getRoomStats - success', async () => {
    (roomService.getRoomStats as jest.Mock).mockResolvedValue({ total: 10, active: 7 });
    const res = mockRes();
    roomCtrl.getRoomStats(req(), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { total: 10, active: 7 } });
  });

  it('toggleRoomActive - success', async () => {
    (roomService.toggleRoomActive as jest.Mock).mockResolvedValue({ id: 'r1', isActive: false });
    const res = mockRes();
    roomCtrl.toggleRoomActive(req({ params: { id: 'r1' } }), res, jest.fn());
    await flush();
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'r1', isActive: false },
      message: 'Chambre désactivée',
    });
  });
});
