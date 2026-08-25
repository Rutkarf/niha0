import { test, expect } from '@playwright/test';
import { installAiOfficeApiMocks, loginAsDemo } from './helpers/ai-office-mocks';

test.describe('AI Office — mocked API', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('niha0_office_onboarded', '1');
      localStorage.setItem('niha0_bubbles', '1');
      localStorage.setItem('niha0_scene_preset', 'night');
      localStorage.setItem('niha0_theme_mode', 'CYBERPUNK');
      localStorage.setItem('niha0_locale', 'fr');
    });
    await installAiOfficeApiMocks(page);
  });

  test('login lands on AI Office command center', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });
    await expect(page.locator('.ai-office')).toBeVisible();
    await expect(page.getByText('AI Office / Command Center')).toBeVisible();
    await expect(page.locator('a.link-dash')).toBeVisible();
  });

  test('shows 3D canvas or 2D fallback with agents', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });

    const canvas = page.locator('.canvas-host');
    const fallback = page.locator('.fallback-grid');
    await expect(canvas.or(fallback)).toBeVisible({ timeout: 30_000 });

    if (await fallback.isVisible()) {
      await expect(page.getByText('WebGL indisponible')).toBeVisible();
      await expect(page.locator('.agent-card').first()).toBeVisible();
    } else {
      await expect(page.locator('#office-hint')).toContainText(/orbiter|zoomer/i);
      await expect(canvas).toHaveAttribute('role', 'application');
    }
  });

  test('theme switcher exposes Solar / Night / Cyberpunk / Corporate / Auto', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });

    const themeBtn = page.getByRole('button', { name: /Thème courant/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    await expect(page.getByRole('menuitemradio', { name: /Solar/i })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: /Night/i })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: /Cyberpunk/i })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: /Corporate/i })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: /Auto/i })).toBeVisible();
    await page.getByRole('menuitemradio', { name: /Solar/i }).click();
    await expect(themeBtn).toContainText(/Solar/i);
  });

  test('pending validations chip opens CEO panel; Escape closes', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });

    const chip = page.locator('button.pending-chip');
    await expect(chip).toBeVisible({ timeout: 20_000 });
    await chip.click();

    const ceoPanel = page.locator('aside.ceo-panel');
    await expect(ceoPanel).toBeVisible({ timeout: 10_000 });
    await expect(ceoPanel.getByText('Approuver campagne Q3')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(ceoPanel).toHaveCount(0);
  });

  test('CEO panel search filters approvals', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });
    await page.locator('button.pending-chip').click();
    await expect(page.locator('aside.ceo-panel')).toBeVisible({ timeout: 10_000 });

    const search = page.locator('#ceo-search');
    await expect(search).toBeVisible();
    await search.fill('inexistant-xyz');
    await expect(page.getByText('Aucun résultat')).toBeVisible();
    await search.fill('campagne');
    await expect(page.getByText('Approuver campagne Q3')).toBeVisible();
  });

  test('2D fallback agent card opens agent panel', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });

    // Force fallback path if WebGL works: open via CEO then use keyboard is hard;
    // only assert when fallback grid is present (CI headless may still have WebGL).
    const fallback = page.locator('.fallback-grid');
    if (!(await fallback.isVisible().catch(() => false))) {
      test.info().annotations.push({
        type: 'note',
        description: 'WebGL scene active — skip 2D agent card panel assertion',
      });
      return;
    }

    await page.locator('.agent-card').filter({ hasText: 'Agent CRM' }).click();
    const agentPanel = page.getByRole('dialog', { name: /agent/i });
    await expect(agentPanel).toBeVisible();
    await expect(agentPanel.getByRole('heading', { name: /Agent CRM/i })).toBeVisible();
    await page.getByRole('button', { name: /Fermer le panneau agent/i }).click();
    await expect(agentPanel).toHaveCount(0);
  });

  test('onboarding overlay appears for first visit then dismisses', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('niha0_office_onboarded');
    });
    await installAiOfficeApiMocks(page);
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });

    const onboard = page.getByRole('dialog', { name: /Bienvenue dans l’AI Office|Bienvenue dans l'AI Office/i });
    await expect(onboard).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /Compris/i }).click();
    await expect(onboard).toHaveCount(0);
  });

  test('bubbles toggle is accessible', async ({ page }) => {
    await loginAsDemo(page);
    await page.waitForURL(/\/app\/ai-office/, { timeout: 30_000 });
    const toggle = page.getByLabel(/Bulles BD/i);
    await expect(toggle).toBeVisible();
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
    await toggle.check();
    await expect(toggle).toBeChecked();
  });
});

test.describe('AI Office — live stack', () => {
  test('login → AI Office with real backend', async ({ page, request }) => {
    test.skip(process.env['E2E_LIVE'] !== '1', 'Set E2E_LIVE=1 with backend+frontend running');

    const apiBase = process.env['E2E_API_URL'] ?? 'http://127.0.0.1:8080/api';
    const health = await request.get(`${apiBase}/actuator/health`).catch(() => null);
    test.skip(!health || !health.ok(), 'Backend API not reachable');

    await page.addInitScript(() => {
      localStorage.setItem('niha0_office_onboarded', '1');
    });

    await page.goto('/login');
    await page.locator('#email').fill('rutkarf@optimustest.fr');
    await page.locator('#password').fill('Demo2026!');
    await page.locator('button.login-btn[type="submit"]').click();
    await page.waitForURL(/\/app\/(ai-office|onboarding)/, { timeout: 30_000 });

    if (page.url().includes('onboarding')) {
      test.info().annotations.push({
        type: 'note',
        description: 'Onboarding incomplete — skip office assertions',
      });
      return;
    }

    await expect(page.locator('.ai-office')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('AI Office / Command Center')).toBeVisible();
    await expect(page.locator('.canvas-host, .fallback-grid').first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
