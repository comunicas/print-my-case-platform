
# Correção do Seletor Frágil no Cenário 09 dos Testes E2E

## Diagnóstico Completo

### O que foi verificado manualmente

Todos os 9 cenários foram inspecionados no browser em sessão autenticada real. Resultado:

- **Cenários 01, 02, 03, 04, 06, 07, 08** — passam corretamente. A lógica, os `data-testid` e as rotas estão funcionando conforme esperado.
- **Cenário 05** (`product_request`) — não há notificações desse tipo no banco do ambiente de teste. O skip implícito está correto e o cenário retorna sem executar `expect`. Não é um bug.
- **Cenário 09** ("Meu Perfil" → `?tab=profile`) — **tem um seletor que vai falhar em Playwright**.

### Causa raiz do problema no Cenário 09

O teste usa:
```typescript
const avatarBtn = page.locator('header button').filter({
  has: page.locator('span[class*="AvatarFallback"]'),
}).first();
```

O componente `AvatarFallback` do Radix UI, após compilação pelo Tailwind, **não gera uma classe com o nome literal `AvatarFallback`**. As classes no DOM são Tailwind puras:
```html
<span class="bg-primary text-primary-foreground text-xs md:text-sm ...">RB</span>
```

O seletor `span[class*="AvatarFallback"]` não encontra nenhum elemento → o `filter()` retorna zero resultados → `avatarBtn.click()` falha com timeout.

**Confirmado visualmente:** o dropdown de avatar abre corretamente quando o terceiro botão do header é clicado diretamente. A funcionalidade está 100% correta — só o seletor do teste está errado.

## Solução

Substituir o seletor frágil por um seletor robusto baseado em estrutura estável do header. Existem duas abordagens válidas:

**Opção A (mais robusta):** Adicionar `data-testid="user-menu-trigger"` no `DropdownMenuTrigger` do `AppHeader.tsx`, igual ao padrão já adotado para `notifications-trigger`.

**Opção B (sem mudança de componente):** Usar `page.locator('[role="button"]', { hasText: /^[A-Z]{1,2}$/ })` no header — mas isso é mais frágil se o nome do usuário mudar.

**Decisão: Opção A** — adicionar o `data-testid` no `AppHeader.tsx` e atualizar o seletor no teste. Isso segue o padrão já estabelecido no projeto (`notifications-trigger`, `manage-preferences-btn`) e torna o teste completamente independente de classes CSS geradas pelo Radix UI.

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/components/layout/AppHeader.tsx` | Adicionar `data-testid="user-menu-trigger"` no `Button` do `DropdownMenuTrigger` |
| `e2e/notifications.spec.ts` | Substituir o seletor do Cenário 09 por `[data-testid="user-menu-trigger"]` |

## Detalhe das Alterações

### `AppHeader.tsx` — linha 83

```tsx
// ANTES
<Button variant="ghost" className="gap-2 px-1 md:px-2">

// DEPOIS
<Button data-testid="user-menu-trigger" variant="ghost" className="gap-2 px-1 md:px-2">
```

### `e2e/notifications.spec.ts` — Cenário 09 (linhas 196-221)

```typescript
// ANTES — seletor frágil que não funciona
const avatarBtn = page.locator('header button').filter({
  has: page.locator('span[class*="AvatarFallback"]'),
}).first();

await avatarBtn.click();

// DEPOIS — seletor robusto via data-testid
await page.click('[data-testid="user-menu-trigger"]');
```

O restante do Cenário 09 (aguardar "Meu Perfil", clicar, verificar URL e aba ativa) permanece idêntico e está correto.

## Escopo Mínimo

Apenas 2 arquivos, 2 linhas modificadas. Nenhuma lógica de negócio, nenhuma migração de banco, nenhuma Edge Function envolvida.
