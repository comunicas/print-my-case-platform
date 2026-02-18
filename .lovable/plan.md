
# Testes E2E — Fluxo de Notificações

## Análise do Componente

Ao ler o `NotificationsPopover.tsx`, identifiquei 3 estados possíveis do popover:

1. **Sem notificações** — exibe "Nenhuma notificação" e **NÃO** renderiza o botão "Gerenciar preferências"
2. **Com notificações** — exibe lista de itens clicáveis + botão "Gerenciar preferências"
3. **Carregando** — exibe "Carregando..."

Isso cria um desafio real: os testes não podem assumir que o usuário de teste tem notificações no banco. A estratégia é:

- **Testes condicionais com `skip` automático** quando não há notificações (mesmo padrão dos outros spec files com `if (count > 0)`)
- **Teste de abertura do popover** — sempre executa, verifica que o popover abre e exibe um dos dois estados válidos
- **Teste de navegação "Gerenciar preferências"** — executa somente se houver notificações
- **Teste de navegação por notificação de produto** — executa somente se houver notificação do tipo `product_request`
- **Teste de fallback de rota** — verifica diretamente a URL de destino `/settings?tab=requests` sem depender de notificações

## Seletores Identificados

A partir do código do componente:

| Elemento | Seletor a usar |
|---|---|
| Botão do sino (trigger) | `button:has(svg[data-lucide="bell"])` ou texto do aria + `[data-testid="notifications-trigger"]` (a adicionar) |
| Header "Notificações" | `h4:has-text("Notificações")` |
| Empty state | `text=Nenhuma notificação` |
| Botão "Gerenciar preferências" | `text=Gerenciar preferências de notificação` |
| Notificação de produto (ShoppingBag) | ícone + tipo no container |
| Botão "Marcar todas como lidas" | `text=Marcar todas como lidas` |

Para tornar os seletores mais robustos, vou adicionar `data-testid` a 3 elementos críticos no `NotificationsPopover.tsx`:
- `data-testid="notifications-trigger"` no `PopoverTrigger`
- `data-testid="notifications-popover-content"` no `PopoverContent`
- `data-testid="notification-item"` em cada `NotificationItem`
- `data-testid="manage-preferences-btn"` no botão "Gerenciar preferências"

## Arquivos a Criar/Editar

| Arquivo | Operação | Motivo |
|---|---|---|
| `e2e/notifications.spec.ts` | CRIAR | Arquivo principal com todos os testes |
| `src/components/layout/NotificationsPopover.tsx` | EDITAR | Adicionar `data-testid` nos elementos testáveis |

## Estrutura dos Testes (9 cenários)

### Suite principal: `Notifications Popover — Navigation Flow`

**Cenário 1 — Abertura do Popover**
- Navega para `/` (dashboard)
- Aguarda carregamento
- Clica no botão do sino (trigger)
- Verifica que `h4` com texto "Notificações" está visível
- Verifica que está em um dos estados válidos: empty state OU lista de notificações

**Cenário 2 — Estado vazio exibe mensagem correta**
- Abre o popover
- Se empty state visível: confirma texto "Nenhuma notificação"
- Confirma que botão "Gerenciar preferências" NÃO está visível (comportamento correto do componente)

**Cenário 3 — Fecha o popover ao pressionar Escape**
- Abre o popover
- Pressiona `Escape`
- Verifica que popover fechou

**Cenário 4 — Botão "Gerenciar preferências" navega para `?tab=preferences`**
- Abre o popover
- `if` botão "Gerenciar preferências" visível: clica nele
- Aguarda navegação
- Verifica URL contém `/settings`
- Verifica que a aba "Preferências" está visualmente ativa (via `TabsTrigger[data-state="active"]` com texto "Preferências") **OU** verifica `searchParams.tab=preferences` na URL
- Este é o teste central do Bug 2 corrigido na Fase 7

**Cenário 5 — Notificação de `product_request` navega para `?tab=requests`**
- Abre o popover
- Busca por notificação com ícone ShoppingBag (`[data-testid="notification-item"][data-type="product_request"]`)
- Se encontrado: clica na notificação
- Verifica URL contém `/settings?tab=requests` **OU** verifica aba "Pedidos" ativa
- Este é o teste central do Bug 3 corrigido na Fase 7

**Cenário 6 — Notificação de `upload_processed` navega para `/uploads/:id`**
- Abre o popover
- Busca por notificação do tipo `upload_processed`
- Se encontrado com `metadata.upload_id`: verifica que navega para `/uploads/[uuid]`
- Se sem upload_id: verifica que navega para `/uploads`

**Cenário 7 — Notificação de `stock_alert` navega para `/estoque`**
- Abre o popover, clica em stock_alert se disponível
- Verifica navegação para `/estoque`

**Cenário 8 — Notificação de `team_member` navega para `?tab=team`**
- Abre o popover, clica em team_member se disponível
- Verifica URL com `tab=team` e aba "Equipe" ativa

**Cenário 9 — "Meu Perfil" no header navega para `?tab=profile`**
- Clica no dropdown de avatar no header
- Clica em "Meu Perfil"
- Verifica URL com `tab=profile` e aba "Perfil" ativa visualmente
- Este testa o Bug 1 corrigido na Fase 7

## Estratégia de Resiliência

Seguindo o padrão do projeto (`if (count > 0)`):
- Testes que dependem de notificações existentes usam `const hasNotifications = await notificationItems.count() > 0`
- Se não houver dados: o teste passa com skip implícito (sem `expect` executado), evitando falhas em CI com banco vazio
- A verificação de navegação usa `page.waitForURL` com timeout de 5s para ser resiliente a latência

## Verificação de Tab Ativa

Para confirmar que a aba correta está selecionada após navegação (mais robusto que verificar apenas a URL):

```typescript
// Verifica aba ativa pelo atributo data-state do Radix UI Tabs
await expect(
  page.locator('[role="tab"][data-state="active"]')
).toContainText("Preferências"); // ou "Pedidos", "Perfil", "Equipe"
```

Isso garante que o routing funcionou E o componente React respondeu à mudança de URL, validando o fluxo completo de ponta a ponta.

## Atributos `data-testid` a Adicionar no Componente

```tsx
// PopoverTrigger Button
<Button data-testid="notifications-trigger" ...>

// PopoverContent
<PopoverContent data-testid="notifications-popover-content" ...>

// Div do NotificationItem
<div data-testid="notification-item" data-type={notification.type} data-id={notification.id} ...>

// Botão "Gerenciar preferências"
<Button data-testid="manage-preferences-btn" ...>
```
