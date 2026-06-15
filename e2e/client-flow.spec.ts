import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi, waitForPageReady } from './auth-helpers';

test.describe('Client Flow', () => {
  test('should login with client account', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
    await waitForPageReady(page, '/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('should access marketplace', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
    await waitForPageReady(page, '/marketplace');
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 15000 });
  });

  test('should access cart', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
    await waitForPageReady(page, '/dashboard/cart');
    await expect(page).toHaveURL(/\/cart/, { timeout: 15000 });
  });

  test('should access profile', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
    await waitForPageReady(page, '/dashboard/profile');
    await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
  });

  test('should access bookings', async ({ page, context }) => {
    await authenticateViaApi(context, { email: TEST_ACCOUNTS.client.email, password: TEST_ACCOUNTS.client.password });
    await waitForPageReady(page, '/dashboard/bookings');
    await expect(page).toHaveURL(/\/bookings/, { timeout: 15000 });
  });
});
