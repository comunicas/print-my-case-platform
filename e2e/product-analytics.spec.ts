import { test, expect } from './fixtures/auth';

test.describe('Product Analytics Integration', () => {
  
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/estoque');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should open product detail modal', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Verificar se há produtos na tabela
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      // Clicar no botão de detalhes do primeiro produto
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      
      // Verificar que modal abriu
      await expect(page.locator('[data-testid="product-detail-modal"]')).toBeVisible();
    }
  });

  test('should display analytics KPIs in modal', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Verificar KPIs
      await expect(page.locator('[data-testid="kpi-total-sales"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-average-ticket"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-stock-level"]')).toBeVisible();
    }
  });

  test('should navigate between analytics tabs', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Verificar tabs existem
      const tabs = ['resumo', 'vendas', 'horarios', 'estoque'];
      
      for (const tab of tabs) {
        await page.click(`[data-testid="tab-${tab}"]`);
        await expect(page.locator(`[data-testid="tabcontent-${tab}"]`)).toBeVisible();
      }
    }
  });

  test('should show sales history chart', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Verificar que chart de histórico está presente na aba resumo
      await expect(page.locator('[data-testid="sales-history-chart"]')).toBeVisible();
    }
  });

  test('should show sales by hour chart', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Navegar para aba de horários
      await page.click('[data-testid="tab-horarios"]');
      
      // Verificar que chart de horários está presente
      await expect(page.locator('[data-testid="sales-by-hour-chart"]')).toBeVisible();
    }
  });

  test('should show slots list in stock tab', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Navegar para aba de estoque
      await page.click('[data-testid="tab-estoque"]');
      
      // Verificar que lista de slots está presente
      await expect(page.locator('[data-testid="slots-list"]')).toBeVisible();
    }
  });

  test('should close modal with escape key', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Fechar com Escape
      await page.keyboard.press('Escape');
      
      // Verificar que modal fechou
      await expect(page.locator('[data-testid="product-detail-modal"]')).not.toBeVisible();
    }
  });

  test('should filter analytics by PDV', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Selecionar um PDV específico
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    
    const options = page.locator('[role="option"]');
    const optionsCount = await options.count();
    
    if (optionsCount > 1) {
      // Selecionar segundo PDV (primeiro geralmente é "Todos")
      await options.nth(1).click();
      await page.waitForLoadState('networkidle');
      
      // Abrir detalhes de produto
      const productRows = page.locator('[data-testid="product-row"]');
      const count = await productRows.count();
      
      if (count > 0) {
        await productRows.first().locator('[data-testid="product-detail-button"]').click();
        await page.waitForSelector('[data-testid="product-detail-modal"]');
        
        // Verificar que modal mostra badge de PDV filtrado
        await expect(page.locator('[data-testid="pdv-filter-badge"]')).toBeVisible();
      }
    }
  });

  test('should open modal by clicking product name', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      // Clicar no nome do produto (não no botão)
      await productRows.first().locator('[data-testid="product-name"]').click();
      
      // Verificar que modal abriu
      await expect(page.locator('[data-testid="product-detail-modal"]')).toBeVisible();
    }
  });
});
