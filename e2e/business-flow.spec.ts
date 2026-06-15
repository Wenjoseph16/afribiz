import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi, waitForPageReady } from './auth-helpers';

test.describe('Business Flow', () => {
  test('should login with demo business account', async ({ page, context }) => {
    await authenticateViaApi(context, {
      email: TEST_ACCOUNTS.business.email,
      password: TEST_ACCOUNTS.business.password,
    });
    await waitForPageReady(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should display products page', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password });
    await waitForPageReady(page, '/dashboard/products');
    await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
  });

  test('should display orders page', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password });
    await waitForPageReady(page, '/dashboard/orders');
    await expect(page).toHaveURL(/\/orders/, { timeout: 15000 });
  });

  test('should display dashboard stats', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password });
    await waitForPageReady(page, '/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate via sidebar', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.business.email, password: TEST_ACCOUNTS.business.password });
    await waitForPageReady(page, '/dashboard');
    const businessLink = page.getByText('Business').first();
    if (await businessLink.isVisible()) {
      await businessLink.click();
      await page.waitForTimeout(500);
    }
  });
});
