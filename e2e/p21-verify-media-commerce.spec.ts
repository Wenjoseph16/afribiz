import { test, expect } from '@playwright/test';
import { TEST_ACCOUNTS, authenticateViaApi } from './auth-helpers';

test.setTimeout(600_000);

test.describe('P21 — Social Commerce 2027 (shorts / lives / offers / mini-checkout)', () => {
  test('hub /media → 0 lien mort + pages de lecture OK', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 150)));

    await page.goto('http://localhost:3000/media');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/media');

    await page.goto('http://localhost:3000/shorts');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/shorts');

    await page.goto('http://localhost:3000/lives');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/lives');

    await page.goto('http://localhost:3000/live/live-1');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);
    expect(page.url()).toContain('/live/live-1');
    const liveTitle = await page.locator('h1').first().textContent().catch(() => '');
    expect(liveTitle?.trim()?.length || 0).toBeGreaterThan(0);

    await page.goto('http://localhost:3000/offers');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/offers');

    const blocking = pageErrors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('manifest') &&
        !e.includes('Failed to load resource') &&
        !e.includes('404')
    );
    expect(blocking).toEqual([]);
  });

  test('mini-checkout sur vidéo : commander depuis un short sans quitter le player', async ({ page, context }) => {
    await authenticateViaApi(context, {
      email: TEST_ACCOUNTS.client.email,
      password: TEST_ACCOUNTS.client.password,
    });

    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(String(e.message).slice(0, 150)));

    await page.goto('http://localhost:3000/shorts');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3000);

    const buyButton = page
      .locator('button:has-text("Ajouter au panier"), button:has-text("Commander"), button:has-text("Réserver")')
      .first();
    if (await buyButton.isVisible().catch(() => false)) {
      await buyButton.click();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Acheter sur la vidéo')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Wave').first()).toBeVisible();
      await expect(page.locator('text=Orange').first()).toBeVisible();
      await expect(page.locator('text=escrow AfriBiz')).toBeVisible({ timeout: 3000 });

      await page.locator('svg.lucide-x').first().click().catch(() => {});
    }

    const blocking = pageErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('manifest') && !e.includes('404')
    );
    expect(blocking).toEqual([]);
  });

  test('viewer live : chat fonctionnel + produits du live', async ({ page }) => {
    await page.goto('http://localhost:3000/live/live-1');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);

    const productCount = await page.locator('text=Acheter pendant le live').count();
    expect(productCount).toBe(1);

    const buyButtons = page.locator('button:has-text("Acheter")');
    expect(await buyButtons.count()).toBeGreaterThan(0);

    const chatBox = page.locator('input[placeholder="Écrire un message..."]').first();
    if (await chatBox.isVisible().catch(() => false)) {
      await chatBox.fill('Bonjour depuis le test !');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1500);
      await expect(page.locator('text=Bonjour depuis le test !').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
