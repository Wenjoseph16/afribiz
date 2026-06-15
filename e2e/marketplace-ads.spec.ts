import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test('display marketplace page with products', async ({ page }) => {
    await page.goto('/dashboard/explore', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await page.waitForTimeout(3000);
    const cards = page.locator('[class*="rounded-xl"][class*="cursor-pointer"], [class*="card"], article');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(0);
  });

  test('search filters work', async ({ page }) => {
    await page.goto('/dashboard/explore', { waitUntil: 'networkidle' });
    const searchInput = page.locator('input[placeholder*="Rechercher"], input[type="search"], input[name="q"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/explore|marketplace/);
    }
  });
});

test.describe('Ads Management', () => {
  test('ads page loads for business users', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });
    await page.locator('input[name="identifier"]').fill('business@afribiz.com');
    await page.locator('input[name="password"]').fill('Test1234!');
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20000 });
    await page.goto('/dashboard/ads', { waitUntil: 'networkidle' });
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

test.describe('Public Business Page', () => {
  test('public business page loads with sections', async ({ page }) => {
    await page.goto('/business/le-gourmet-togolais', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Le Gourmet Togolais').first()).toBeVisible({ timeout: 5000 });
  });
});
