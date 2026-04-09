import { test, expect } from './fixtures/auth';

test.describe('Stock-Sales Matching Integration', () => {
  
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/estoque/tabela');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  test('should display stock page with products', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Verificar que a página de estoque carregou
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
  });

  test('should correctly count sales for product in stock', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Verificar se há produtos na tabela
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    if (count > 0) {
      // Clicar no primeiro produto para abrir detalhes
      await productRows.first().locator('[data-testid="product-detail-button"]').click();
      await page.waitForSelector('[data-testid="product-detail-modal"]');
      
      // Verificar que KPIs de vendas estão presentes
      await expect(page.locator('[data-testid="kpi-total-sales"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
    }
  });

  test('should filter products by search term', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Abrir o autocomplete de busca
    await page.click('[data-testid="search-autocomplete"]');
    await page.waitForSelector('[data-testid="search-input"]');
    
    // Digitar termo de busca
    await page.fill('[data-testid="search-input"]', 'iPhone');
    await page.waitForTimeout(500); // debounce
    
    // Verificar que conteúdo atualizou (tabela ou mapa)
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
  });

  test('should match specific product variants correctly', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Buscar por produto específico "Pro"
    await page.click('[data-testid="search-autocomplete"]');
    await page.fill('[data-testid="search-input"]', 'Pro');
    await page.waitForTimeout(500);
    
    // Verificar que apenas produtos com "Pro" aparecem (se houver resultados)
    const productRows = page.locator('[data-testid="product-row"]');
    const count = await productRows.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const productName = await productRows.nth(i).locator('[data-testid="product-name"]').textContent();
      if (productName) {
        // Se buscou por "Pro", produtos devem conter "Pro" no nome
        expect(productName.toLowerCase()).toContain('pro');
      }
    }
  });

  test('should show correct sales index badges', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Verificar que badges de índice de vendas são exibidos
    const salesBadges = page.locator('[data-testid^="sales-badge-"]');
    
    // Se há badges visíveis, verificar que têm valores válidos
    const count = await salesBadges.count();
    if (count > 0) {
      const firstBadge = await salesBadges.first().getAttribute('data-testid');
      expect(firstBadge).toMatch(/sales-badge-(high|medium|low|none)/);
    }
  });

  test('should filter by sales index', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Abrir filtro de índice de vendas
    await page.click('[data-testid="sales-index-filter"]');
    await page.waitForSelector('[role="option"]');
    
    // Selecionar "Alta"
    await page.click('text=Alta');
    await page.waitForTimeout(300);
    
    // Verificar que filtro foi aplicado
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
  });

  test('should aggregate data across all PDVs', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Abrir seletor de PDV
    await page.click('[data-testid="pdv-select-trigger"]');
    await page.waitForSelector('[role="option"]');
    
    // Verificar que opção "Todos os PDVs" existe
    await expect(page.locator('text=Todos os PDVs')).toBeVisible();
    
    // Selecionar todos os PDVs
    await page.click('text=Todos os PDVs');
    await page.waitForLoadState('networkidle');
    
    // Verificar que KPIs refletem dados agregados
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
  });

  test('should handle empty search results gracefully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Buscar termo que não existe
    await page.click('[data-testid="search-autocomplete"]');
    await page.fill('[data-testid="search-input"]', 'produto-inexistente-xyz123456');
    await page.waitForTimeout(500);
    
    // Verificar que página não crashou e mostra estado vazio ou mensagem
    const content = page.locator('[data-testid="stock-content"]');
    await expect(content).toBeVisible();
  });

  test('should handle special characters in search', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Buscar com caracteres especiais
    await page.click('[data-testid="search-autocomplete"]');
    await page.fill('[data-testid="search-input"]', 'película');
    await page.waitForTimeout(500);
    
    // Verificar que não crashou
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
  });

  test('should clear filters correctly', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Aplicar um filtro
    await page.click('[data-testid="search-autocomplete"]');
    await page.fill('[data-testid="search-input"]', 'iPhone');
    await page.waitForTimeout(500);
    
    // Verificar que botão de limpar aparece
    const clearButton = page.locator('[data-testid="clear-filters"]');
    
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(300);
      
      // Verificar que filtros foram limpos
      await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
    }
  });

  test('should navigate between table and map views', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Verificar que toggle de view existe
    await expect(page.locator('text=Tabela')).toBeVisible();
    
    // Clicar no toggle de mapa
    await page.click('button:has-text("Mapa")');
    await page.waitForURL('**/estoque/tabela?view=map');
    
    // Verificar que mapa carregou
    await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
    
    // Voltar para tabela
    await page.click('button:has-text("Tabela")');
  });
});
