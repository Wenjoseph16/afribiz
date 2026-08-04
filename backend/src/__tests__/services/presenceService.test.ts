import { presenceService } from '../../services/presenceService';

describe('presenceService', () => {
  beforeEach(() => {
    presenceService.reset();
  });

  it('starts empty', () => {
    expect(presenceService.getConnectedCount()).toBe(0);
    expect(presenceService.getPresenceSnapshot().byRole).toEqual({});
  });

  it('counts a connected user', () => {
    presenceService.registerConnection('u1', 's1', 'CLIENT');
    expect(presenceService.getConnectedCount()).toBe(1);
    expect(presenceService.getPresenceSnapshot().byRole).toEqual({ CLIENT: 1 });
  });

  it('supports multi-onglets (plusieurs sockets par user = 1 utilisateur)', () => {
    presenceService.registerConnection('u1', 's1', 'CLIENT');
    presenceService.registerConnection('u1', 's2', 'CLIENT');
    presenceService.registerConnection('u2', 's3', 'BUSINESS');
    const snap = presenceService.getPresenceSnapshot();
    expect(snap.count).toBe(2);
    expect(snap.byRole).toEqual({ CLIENT: 1, BUSINESS: 1 });
  });

  it('decrements on disconnect and removes the user when all sockets close', () => {
    presenceService.registerConnection('u1', 's1', 'CLIENT');
    presenceService.registerConnection('u1', 's2', 'CLIENT');
    presenceService.unregisterConnection('u1', 's1');
    expect(presenceService.getConnectedCount()).toBe(1);
    presenceService.unregisterConnection('u1', 's2');
    expect(presenceService.getConnectedCount()).toBe(0);
    expect(presenceService.getPresenceSnapshot().byRole).toEqual({});
  });

  it('lists connected user ids', () => {
    presenceService.registerConnection('u1', 's1', 'ADMIN');
    presenceService.registerConnection('u2', 's2', 'CLIENT');
    expect(presenceService.getConnectedUserIds()).toEqual(['u1', 'u2']);
  });
});
