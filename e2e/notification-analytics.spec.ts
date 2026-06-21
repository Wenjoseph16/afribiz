import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi, waitForPageReady } from './auth-helpers';

test.describe('Notification Analytics (Admin)', () => {
  test.describe('Access Control', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/dashboard/admin/notification-analytics', { waitUntil: 'networkidle' });
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });

    test('should prevent client access', async ({ page, context }) => {
      await authenticateViaApi(context, {
        email: TEST_ACCOUNTS.client.email,
        password: TEST_ACCOUNTS.client.password,
      });
      await waitForPageReady(page, '/dashboard/admin/notification-analytics');
      await expect(page.getByText(/Acces reserve|Administrateurs uniquement/i)).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Page Rendering', () => {
    test('should display analytics dashboard for admin', async ({ page, context }) => {
      await authenticateViaApi(context, {
        email: TEST_ACCOUNTS.business.email,
        password: TEST_ACCOUNTS.business.password,
      });
      await waitForPageReady(page, '/dashboard/admin/notification-analytics');
      await expect(page.getByText(/Analyses des notifications/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Total notifications/i)).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button[title*="CSV"]')).toBeVisible();
      await expect(page.locator('button[title*="PDF"]')).toBeVisible();
      await expect(page.locator('button[title*="taux"]')).toBeVisible();
    });
  });

  test.describe('Charts', () => {
    test('should render recharts components', async ({ page, context }) => {
      await authenticateViaApi(context, {
        email: TEST_ACCOUNTS.business.email,
        password: TEST_ACCOUNTS.business.password,
      });
      await waitForPageReady(page, '/dashboard/admin/notification-analytics');
      const count = await page.locator('.recharts-responsive-container').count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Actions', () => {
    test('should show failure check result', async ({ page, context }) => {
      await authenticateViaApi(context, {
        email: TEST_ACCOUNTS.business.email,
        password: TEST_ACCOUNTS.business.password,
      });
      await waitForPageReady(page, '/dashboard/admin/notification-analytics');
      await page.locator('button[title*="taux"]').click();
      await page.waitForTimeout(3000);
      const feedback = page.locator('.animate-slide-in');
      await expect(feedback).toBeVisible({ timeout: 10000 });
    });
  });
});
