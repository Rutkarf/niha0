import { test, expect } from '@playwright/test';

test.describe('Critical path smokes', () => {
  test('login page is reachable and accessible', async ({ page }) => {
    const res = await page.goto('/login');
    expect(res?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'NIHAO' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible();
  });

  test('login → AI Office (live stack)', async ({ page, request }) => {
    test.skip(process.env['E2E_LIVE'] !== '1', 'Set E2E_LIVE=1 with backend+frontend running');

    const apiBase = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:8080/api';
    const health = await request.get(`${apiBase}/actuator/health`).catch(() => null);
    test.skip(!health || !health.ok(), 'Backend API not reachable — start ./mvnw spring-boot:run');

    await page.goto('/login');
    await page.locator('#email').fill('rutkarf@optimustest.fr');
    await page.locator('#password').fill('Demo2026!');
    await page.locator('button.login-btn[type="submit"]').click();
    await page.waitForURL(/\/app\/(ai-office|onboarding)/, { timeout: 30_000 });
    if (page.url().includes('onboarding')) {
      test.info().annotations.push({ type: 'note', description: 'Onboarding incomplete — expected for fresh orgs' });
      return;
    }
    await expect(page.locator('.ai-office, canvas, [class*="ai-office"]').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
