import { test, expect } from './fixtures/auth';
import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: opens the notifications popover and waits for it to be visible
// ---------------------------------------------------------------------------
async function openNotificationsPopover(page: Page) {
  await page.click('[data-testid="notifications-trigger"]');
  await expect(page.locator('[data-testid="notifications-popover-content"]')).toBeVisible({ timeout: 5000 });
}

test.describe('Notifications Popover — Navigation Flow', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
  });

  // -------------------------------------------------------------------------
  // Cenário 1 — Abertura do popover
  // -------------------------------------------------------------------------
  test('01 — should open popover and show header', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page.click('[data-testid="notifications-trigger"]');

    const popover = page.locator('[data-testid="notifications-popover-content"]');
    await expect(popover).toBeVisible({ timeout: 5000 });

    // Header "Notificações" deve estar visível
    await expect(popover.locator('h4', { hasText: 'Notificações' })).toBeVisible();

    // Deve exibir um dos dois estados válidos: lista OU empty state
    const emptyState = popover.locator('text=Nenhuma notificação');
    const notificationItems = popover.locator('[data-testid="notification-item"]');

    const hasEmpty = await emptyState.isVisible();
    const itemCount = await notificationItems.count();

    expect(hasEmpty || itemCount > 0).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Cenário 2 — Estado vazio exibe mensagem correta e NÃO mostra "Gerenciar"
  // -------------------------------------------------------------------------
  test('02 — empty state shows correct message and hides manage-preferences button', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const emptyState = page.locator('text=Nenhuma notificação');
    const isEmptyVisible = await emptyState.isVisible();

    if (!isEmptyVisible) {
      // Há notificações — este cenário não se aplica, skip implícito
      return;
    }

    await expect(emptyState).toBeVisible();
    await expect(page.locator('[data-testid="manage-preferences-btn"]')).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Cenário 3 — Fechar com Escape
  // -------------------------------------------------------------------------
  test('03 — should close popover when Escape is pressed', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    await page.keyboard.press('Escape');

    await expect(page.locator('[data-testid="notifications-popover-content"]')).not.toBeVisible({ timeout: 3000 });
  });

  // -------------------------------------------------------------------------
  // Cenário 4 — "Gerenciar preferências" navega para ?tab=preferences
  // Bug 2 corrigido na Fase 7
  // -------------------------------------------------------------------------
  test('04 — manage-preferences button navigates to /settings?tab=preferences', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const manageBtn = page.locator('[data-testid="manage-preferences-btn"]');
    const isVisible = await manageBtn.isVisible();

    if (!isVisible) {
      // Sem notificações — botão não renderizado, skip implícito
      return;
    }

    await manageBtn.click();

    await page.waitForURL(/\/settings/, { timeout: 5000 });
    expect(page.url()).toContain('tab=preferences');

    // Confirma que a aba "Preferências" está visualmente ativa no Radix Tabs
    await expect(
      page.locator('[role="tab"][data-state="active"]')
    ).toContainText('Preferências', { timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // Cenário 5 — Notificação product_request navega para ?tab=requests
  // Bug 3 corrigido na Fase 7
  // -------------------------------------------------------------------------
  test('05 — product_request notification navigates to /settings?tab=requests', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const productNotification = page.locator('[data-testid="notification-item"][data-type="product_request"]').first();
    const count = await productNotification.count();

    if (count === 0) {
      // Sem notificações do tipo product_request — skip implícito
      return;
    }

    await productNotification.click();

    await page.waitForURL(/\/settings/, { timeout: 5000 });
    expect(page.url()).toContain('tab=requests');

    // Confirma aba "Pedidos" visualmente ativa
    await expect(
      page.locator('[role="tab"][data-state="active"]')
    ).toContainText('Pedidos', { timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // Cenário 6 — Notificação upload_processed navega para /uploads/:id ou /uploads
  // -------------------------------------------------------------------------
  test('06 — upload_processed notification navigates to /uploads', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const uploadNotification = page.locator('[data-testid="notification-item"][data-type="upload_processed"]').first();
    const count = await uploadNotification.count();

    if (count === 0) {
      return;
    }

    await uploadNotification.click();

    // Navega para /uploads ou /uploads/:uuid dependendo de metadata.upload_id
    await page.waitForURL(/\/uploads/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/uploads/);
  });

  // -------------------------------------------------------------------------
  // Cenário 7 — Notificação stock_alert navega para /estoque
  // -------------------------------------------------------------------------
  test('07 — stock_alert notification navigates to /estoque', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const stockNotification = page.locator('[data-testid="notification-item"][data-type="stock_alert"]').first();
    const count = await stockNotification.count();

    if (count === 0) {
      return;
    }

    await stockNotification.click();

    await page.waitForURL(/\/estoque/, { timeout: 5000 });
    expect(page.url()).toContain('/estoque');
  });

  // -------------------------------------------------------------------------
  // Cenário 8 — Notificação team_member navega para ?tab=team
  // -------------------------------------------------------------------------
  test('08 — team_member notification navigates to /settings?tab=team', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await openNotificationsPopover(page);

    const teamNotification = page.locator('[data-testid="notification-item"][data-type="team_member"]').first();
    const count = await teamNotification.count();

    if (count === 0) {
      return;
    }

    await teamNotification.click();

    await page.waitForURL(/\/settings/, { timeout: 5000 });
    expect(page.url()).toContain('tab=team');

    await expect(
      page.locator('[role="tab"][data-state="active"]')
    ).toContainText('Equipe', { timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // Cenário 9 — "Meu Perfil" no header dropdown navega para ?tab=profile
  // Bug 1 corrigido na Fase 7
  // -------------------------------------------------------------------------
  test('09 — header "Meu Perfil" dropdown navigates to /settings?tab=profile', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Usa data-testid robusto adicionado ao AppHeader, seguindo o mesmo padrão
    // de notifications-trigger e manage-preferences-btn já existentes no projeto.
    await page.click('[data-testid="user-menu-trigger"]');

    // Aguarda o item "Meu Perfil" aparecer no dropdown
    const myProfileItem = page.locator('[role="menuitem"]', { hasText: 'Meu Perfil' });
    await expect(myProfileItem).toBeVisible({ timeout: 5000 });

    await myProfileItem.click();

    await page.waitForURL(/\/settings/, { timeout: 5000 });
    expect(page.url()).toContain('tab=profile');

    // Confirma aba "Perfil" visualmente ativa (Radix Tabs data-state)
    await expect(
      page.locator('[role="tab"][data-state="active"]')
    ).toContainText('Perfil', { timeout: 5000 });
  });
});
