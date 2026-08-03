import { buildLaunchJourneyState } from './launchJourney';

describe('buildLaunchJourneyState', () => {
  it('builds a first-launch journey for a new user', () => {
    const state = buildLaunchJourneyState({
      hasProfile: false,
      hasPublicPage: false,
      hasProducts: false,
      hasPayments: false,
      hasPromotions: false,
    });

    expect(state.progressScore).toBeLessThan(40);
    expect(state.currentStep.title).toContain('profil');
    expect(state.steps[0].done).toBe(false);
  });

  it('moves the next action toward offers once the profile and public page are ready', () => {
    const state = buildLaunchJourneyState({
      hasProfile: true,
      hasPublicPage: true,
      hasProducts: false,
      hasPayments: true,
      hasPromotions: false,
    });

    expect(state.progressScore).toBeGreaterThan(50);
    expect(state.currentStep.title).toContain('produits');
  });
});
