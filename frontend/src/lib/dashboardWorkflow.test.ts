import { buildDashboardWorkflowState } from './dashboardWorkflow';

describe('buildDashboardWorkflowState', () => {
  it('returns onboarding guidance when the workspace is still empty', () => {
    const state = buildDashboardWorkflowState({
      orders: [],
      bookings: [],
      payments: [],
      promotions: [],
      notifications: [],
      loyaltyPoints: 0,
    });

    expect(state.progressScore).toBeLessThan(60);
    expect(state.nextActions[0].title).toContain('première offre');
    expect(state.focusAreas[0].title).toBe('Prochaine action');
    expect(state.healthMessage).toContain('démarrer');
  });

  it('prioritizes pending payments and upcoming bookings when data exists', () => {
    const state = buildDashboardWorkflowState({
      orders: [{ status: 'PENDING' }],
      bookings: [{ status: 'CONFIRMED' }],
      payments: [{ status: 'pending' }],
      promotions: [{}],
      notifications: [{ read: false }],
      loyaltyPoints: 240,
    });

    expect(state.progressScore).toBeGreaterThan(60);
    expect(state.nextActions.some((action) => action.title.includes('paiements'))).toBe(true);
    expect(state.focusAreas.some((area) => area.title === 'Réservations')).toBe(true);
  });
});
