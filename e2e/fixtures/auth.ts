import { test as base, Page } from '@playwright/test';

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, runAuthenticatedPage) => {
    // Navigate to login page
    await page.goto('/auth');
    
    // Fill credentials from environment variables
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'testpassword123';
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to home/dashboard
    await page.waitForURL('/', { timeout: 10000 });
    
    await runAuthenticatedPage(page);
  },
});

export { expect } from '@playwright/test';
