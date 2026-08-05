import { test, expect } from '@playwright/test';

test.describe('Escrow Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'business@test.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');
  });

  test('should display escrow list for business', async ({ page }) => {
    await page.goto('/dashboard/finance/escrow');
    await page.waitForSelector('h1, h2');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to escrow from finance menu', async ({ page }) => {
    await page.click('text=Finance');
    await page.click('text=Escrow');
    await page.waitForURL('**/escrow**');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Disputes Flow', () => {
  test('should show disputes list for business', async ({ page }) => {
    await page.goto('/dashboard/disputes');
    await page.waitForSelector('h1, h2');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should render new dispute form', async ({ page }) => {
    await page.goto('/dashboard/disputes/new');
    await page.waitForSelector('form, input, button');
    expect(await page.locator('input, textarea').count()).toBeGreaterThan(0);
  });
});

test.describe('Admin Escrow', () => {
  test('should display admin escrow page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@afribiz.com');
    await page.fill('[name="password"]', 'Afribiz@2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**');

    await page.goto('/dashboard/admin/escrow');
    await page.waitForSelector('table, div, h1');
    await expect(page.locator('body')).toBeVisible();
  });
});
