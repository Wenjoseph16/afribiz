import { mockPrisma } from '../setup';

jest.mock('../../services/agentNetworkService', () => ({
  listAgents: jest.fn(),
  getAgent: jest.fn(),
  createAgent: jest.fn(),
  updateAgent: jest.fn(),
  deleteAgent: jest.fn(),
  recordAgentTransaction: jest.fn(),
  listAgentTransactions: jest.fn(),
  getAgentStats: jest.fn(),
}));

import * as agentNetworkCtrl from '../../controllers/agentNetworkController';
import * as agentService from '../../services/agentNetworkService';

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
  return { user: { id: 'u1' }, query: {}, params: {}, body: {}, ...overrides } as any;
}

describe('agentNetwork controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('list success', async () => {
    const data = [{ id: 'a1', name: 'Alpha' }];
    (agentService.listAgents as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.list(req(), res, next);
    await flush();
    expect(agentService.listAgents).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('list returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.list({ query: {}, params: {}, body: {} } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.listAgents).not.toHaveBeenCalled();
  });

  it('get success', async () => {
    const data = { id: 'a1', name: 'Alpha' };
    (agentService.getAgent as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.get(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(agentService.getAgent).toHaveBeenCalledWith('u1', 'a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('get returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.get({ params: { id: 'a1' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.getAgent).not.toHaveBeenCalled();
  });

  it('create success', async () => {
    const data = { id: 'a1', name: 'Alpha', phone: '+22890123456' };
    (agentService.createAgent as jest.Mock).mockResolvedValue(data);
    const body = { name: 'Alpha', phone: '+22890123456' };
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.create(req({ body }), res, next);
    await flush();
    expect(agentService.createAgent).toHaveBeenCalledWith('u1', body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('create returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.create({ body: { name: 'Alpha', phone: '+22890123456' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.createAgent).not.toHaveBeenCalled();
  });

  it('update success', async () => {
    const data = { id: 'a1', name: 'Alpha Updated' };
    (agentService.updateAgent as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.update(
      req({ params: { id: 'a1' }, body: { name: 'Alpha Updated' } }),
      res,
      next
    );
    await flush();
    expect(agentService.updateAgent).toHaveBeenCalledWith('u1', 'a1', { name: 'Alpha Updated' });
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('update returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.update({ params: { id: 'a1' }, body: {} } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.updateAgent).not.toHaveBeenCalled();
  });

  it('remove success', async () => {
    (agentService.deleteAgent as jest.Mock).mockResolvedValue(undefined);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.remove(req({ params: { id: 'a1' } }), res, next);
    await flush();
    expect(agentService.deleteAgent).toHaveBeenCalledWith('u1', 'a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Agent supprimé' });
  });

  it('remove returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.remove({ params: { id: 'a1' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.deleteAgent).not.toHaveBeenCalled();
  });

  it('recordTransaction success', async () => {
    const data = { id: 't1', agentId: 'a1', type: 'DEPOSIT', amount: 50000 };
    (agentService.recordAgentTransaction as jest.Mock).mockResolvedValue(data);
    const body = { agentId: 'a1', type: 'DEPOSIT', amount: 50000 };
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.recordTransaction(req({ body }), res, next);
    await flush();
    expect(agentService.recordAgentTransaction).toHaveBeenCalledWith('u1', body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('recordTransaction returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.recordTransaction(
      { body: { agentId: 'a1', type: 'DEPOSIT', amount: 50000 } } as any,
      res,
      next
    );
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.recordAgentTransaction).not.toHaveBeenCalled();
  });

  it('listTransactions success', async () => {
    const data = [{ id: 't1', agentId: 'a1', type: 'DEPOSIT', amount: 50000 }];
    (agentService.listAgentTransactions as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.listTransactions(req({ query: { agentId: 'a1' } }), res, next);
    await flush();
    expect(agentService.listAgentTransactions).toHaveBeenCalledWith('u1', 'a1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('listTransactions returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.listTransactions({ query: { agentId: 'a1' } } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.listAgentTransactions).not.toHaveBeenCalled();
  });

  it('stats success', async () => {
    const data = {
      totalAgents: 5,
      activeAgents: 3,
      totalTransactions: 42,
      totalCommissions: 150000,
    };
    (agentService.getAgentStats as jest.Mock).mockResolvedValue(data);
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.stats(req(), res, next);
    await flush();
    expect(agentService.getAgentStats).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data });
  });

  it('stats returns 401 if no user', async () => {
    const res = mockRes();
    const next = jest.fn();
    agentNetworkCtrl.stats({ query: {}, params: {}, body: {} } as any, res, next);
    await flush();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(agentService.getAgentStats).not.toHaveBeenCalled();
  });
});
