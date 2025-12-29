import { test, expect } from './fixtures/auth';

test.describe('PDV Filter - Default PDV Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to Stock page
    await authenticatedPage.goto('/estoque');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should show save button when specific PDV is selected', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Open PDV select
    await page.click('[data-testid="pdv-select-trigger"]');
    
    // Wait for options to appear and select first available PDV (not "Todos os PDVs")
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    // Skip first option ("Todos os PDVs") and click the second one if available
    if (optionsCount > 1) {
      await options.nth(1).click();
      
      // Verify save button appears
      await expect(page.locator('[data-testid="save-default-pdv"]')).toBeVisible();
    }
  });

  test('should save PDV as default and show confirmation toast', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Open and select a specific PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      
      // Click save as default button
      await page.click('[data-testid="save-default-pdv"]');
      
      // Verify confirmation toast
      await expect(page.locator('text=Preferências salvas')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should persist default PDV after page reload', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Get the PDV name before saving
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      const pdvName = await options.nth(1).textContent();
      await options.nth(1).click();
      
      // Save as default
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify PDV is still selected
      await expect(page.locator('[data-testid="pdv-select-trigger"]')).toContainText(pdvName!);
    }
  });

  test('should show Auto badge after reload with default PDV', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Configure default PDV first
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify Auto badge is visible
      await expect(page.locator('[data-testid="auto-badge"]')).toBeVisible();
    }
  });

  test('should show clear button when selected PDV matches default', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Configure default PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify clear button (StarOff) is visible
      await expect(page.locator('[data-testid="clear-default-pdv"]')).toBeVisible();
    }
  });

  test('should clear default PDV and show confirmation', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // First, configure a default PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload to get the clear button
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Click clear default button
      await page.click('[data-testid="clear-default-pdv"]');
      
      // Verify toast
      await expect(page.locator('text=Preferências salvas')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should revert to "Todos os PDVs" after clearing default and reloading', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Configure and then clear default PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await page.click('[data-testid="clear-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload again
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify reverted to "Todos os PDVs"
      await expect(page.locator('[data-testid="pdv-select-trigger"]')).toContainText('Todos os PDVs');
    }
  });

  test('should hide Auto badge with animation when PDV changed manually', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Configure default PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      await options.nth(1).click();
      await page.click('[data-testid="save-default-pdv"]');
      await page.waitForSelector('text=Preferências salvas');
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify badge is visible
      await expect(page.locator('[data-testid="auto-badge"]')).toBeVisible();
      
      // Change PDV manually to "Todos os PDVs"
      await page.click('[data-testid="pdv-select-trigger"]');
      await page.waitForSelector('[role="option"]');
      await page.locator('[role="option"]').first().click();
      
      // Wait for animation (200ms) and verify badge disappears
      await expect(page.locator('[data-testid="auto-badge"]')).not.toBeVisible({ timeout: 500 });
    }
  });
});
