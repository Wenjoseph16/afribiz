import { buildLaunchChecklistState } from './launchChecklist';

describe('buildLaunchChecklistState', () => {
  it('returns an onboarding state for a brand-new workspace', () => {
    const state = buildLaunchChecklistState({
      hasPublicPage: false,
      hasProducts: false,
      hasPayments: false,
      hasBookings: false,
      hasPromotions: false,
      hasProfile: false,
    });

    expect(state.progressScore).toBeLessThan(40);
    expect(state.primaryAction.title).toContain('Présentez');
    expect(state.steps.some((step) => step.id === 'profile')).toBe(true);
  });

  it('prioritizes the next best move when a business already has a public page', () => {
    const state = buildLaunchChecklistState({
      hasPublicPage: true,
      hasProducts: false,
      hasPayments: true,
      hasBookings: true,
      hasPromotions: false,
      hasProfile: true,
    });

    expect(state.progressScore).toBeGreaterThan(50);
    expect(state.primaryAction.title).toContain('Publiez');
    expect(state.steps.find((step) => step.id === 'offers')?.done).toBe(false);
  });
});
