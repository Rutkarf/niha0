import { test, expect } from '@playwright/test';

test.describe('Marketing surfaces', () => {
  test('landing shows brand and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'NIHAO' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: /Not For Human Conception/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Créer mon espace|Create workspace/i }).first()).toBeVisible();
    await expect(page.locator('footer.foot a[href="/privacy"]')).toBeVisible();
  });

  test('pricing page lists FREE PRO BUSINESS', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { name: /FREE/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /PRO/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /BUSINESS/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Créer mon espace|Create workspace|Commencer/i }).first()).toBeVisible();
  });
});
