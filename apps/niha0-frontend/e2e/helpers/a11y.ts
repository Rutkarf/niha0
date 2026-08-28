import AxeBuilder from '@axe-core/playwright';
import { Page, expect } from '@playwright/test';

/** WCAG 2.1 AA scan — excludes canvas/WebGL (AI Office) from color-contrast noise. */
export async function expectNoCriticalA11yViolations(page: Page, context?: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('canvas')
    .analyze();

  const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, context ?? page.url()).toEqual([]);
}
