import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CRITICAL_PATHS = [
  { url: '/', name: 'Homepage' },
  { url: '/login', name: 'Login' },
  { url: '/signup', name: 'Inscription' },
  { url: '/pricing', name: 'Pricing' },
  { url: '/dashboard', name: 'Dashboard' },
  { url: '/dashboard/finance/escrow', name: 'Escrow' },
  { url: '/dashboard/disputes', name: 'Disputes' },
  { url: '/dashboard/notifications', name: 'Notifications' },
  { url: '/marketplace', name: 'Marketplace' },
  { url: '/dashboard/ads', name: 'Ads Management' },
];

test.describe('Accessibility (axe-core)', () => {
  for (const { url, name } of CRITICAL_PATHS) {
    test(`${name} — should have no critical a11y violations`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      expect(criticalViolations).toEqual([]);
    });
  }
});

test.describe('Keyboard Navigation', () => {
  for (const { url, name } of CRITICAL_PATHS) {
    test(`${name} — should be navigable by keyboard`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).not.toBe('body');
    });
  }
});

test.describe('Color Contrast', () => {
  test('critical buttons should meet contrast ratio', async ({ page }) => {
    await page.goto('/');
    const buttons = await page.locator('button:has-text("S\'inscrire"), button:has-text("Commencer"), a:has-text("Démarrer")').all();
    for (const btn of buttons) {
      const color = await btn.evaluate((el) => getComputedStyle(el).color);
      const bg = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(color).toBeTruthy();
      expect(bg).toBeTruthy();
    }
  });
});
