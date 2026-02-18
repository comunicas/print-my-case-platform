
# Próxima Etapa: Code Review dos Testes E2E (Fase 4)

## Contexto

Os testes unitários (314 testes) estão todos passando. A próxima etapa natural do code review é auditar e corrigir os 3 arquivos de testes E2E em `e2e/`, que nunca foram atualizados após as fases 1-3 do code review.

## Problemas Identificados por Análise Estática

### Problema 1 — `product-analytics.spec.ts`: data-testid inexistente

O teste espera `[data-testid="kpi-stock-level"]`, mas o componente `ProductAnalyticsKPIs` não usa esse identificador. O componente recebe `stockPercentage` e renderiza o bloco de estoque dentro da própria aba, não como um KPI separado com esse testid.

```
// Teste atual (ERRADO):
await expect(page.locator('[data-testid="kpi-stock-level"]')).toBeVisible();

// O componente ProductAnalyticsKPIs expõe:
// data-testid="kpi-total-sales"
// data-testid="kpi-total-revenue"
// data-testid="kpi-average-ticket"
// (sem kpi-stock-level)
```

**Correção:** Remover a asserção de `kpi-stock-level` ou substituir por verificação do bloco de estoque existente na aba Resumo.

### Problema 2 — `stock-sales-matching.spec.ts`: fluxo de busca incorreto

O teste clica em `[data-testid="search-autocomplete"]` e depois preenche `[data-testid="search-input"]` como dois elementos separados. No componente `ProductSearchAutocomplete`, o `data-testid="search-autocomplete"` está no wrapper `<div>` e o input está dentro do componente Command. O `page.fill()` num `<div>` não funciona — precisa interagir diretamente com o `<input>`.

```
// Teste atual (FRÁGIL):
await page.click('[data-testid="search-autocomplete"]');
await page.fill('[data-testid="search-input"]', 'iPhone');

// Correto — verificar se há data-testid="search-input" dentro do componente,
// caso não exista, usar seletor de input dentro do wrapper
```

### Problema 3 — `stock-sales-matching.spec.ts`: URLs com query params não verificadas

O teste espera `waitForURL('**/estoque?tab=mapa')` mas a navegação por tabs no componente pode não atualizar a URL com query params, dependendo de como o React Router está configurado para essa rota.

### Problema 4 — `e2e/fixtures/auth.ts`: variáveis de ambiente não carregadas

O `playwright.config.ts` não configura `dotenv` para carregar `.env.test`. As variáveis `TEST_USER_EMAIL` e `TEST_USER_PASSWORD` usadas no fixture `auth.ts` ficarão como `undefined` em ambiente de CI, fazendo os testes falharem silenciosamente com credenciais `test@example.com` / `testpassword123`.

### Problema 5 — `product-analytics.spec.ts`: fluxo de abertura de modal por linha

Os testes de tab navigation (`tab-resumo`, `tab-vendas`, etc.) e abertura do modal estão corretos — os `data-testid` existem no `ProductDetailModal`. Porém, o teste "filter analytics by PDV" usa `[data-testid="pdv-select-trigger"]` que existe em `PDVFilter`. Isso está correto.

## Arquivos a Editar

| Arquivo | Mudança |
|---|---|
| `playwright.config.ts` | Adicionar `require('dotenv').config({ path: '.env.test' })` no topo para carregar credenciais de teste |
| `e2e/product-analytics.spec.ts` | Remover asserção de `kpi-stock-level` (testid inexistente), corrigir para verificar os 3 KPIs corretos |
| `e2e/stock-sales-matching.spec.ts` | Corrigir fluxo de busca (fill direto no input), remover `waitForURL` com tab params, adicionar `waitForSearchInput` adequado |

## Detalhes técnicos das correções

### playwright.config.ts

```typescript
// Adicionar no topo antes de defineConfig:
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
```

### product-analytics.spec.ts — teste de KPIs

```typescript
// ANTES (linha 38-41):
await expect(page.locator('[data-testid="kpi-total-sales"]')).toBeVisible();
await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
await expect(page.locator('[data-testid="kpi-average-ticket"]')).toBeVisible();
await expect(page.locator('[data-testid="kpi-stock-level"]')).toBeVisible(); // ← NÃO EXISTE

// DEPOIS (corrigido):
await expect(page.locator('[data-testid="kpi-total-sales"]')).toBeVisible();
await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
await expect(page.locator('[data-testid="kpi-average-ticket"]')).toBeVisible();
// kpi-stock-level removido — estoque aparece como barra de progresso, não KPI separado
```

### stock-sales-matching.spec.ts — fluxo de busca

```typescript
// ANTES (frágil — fill em div wrapper):
await page.click('[data-testid="search-autocomplete"]');
await page.waitForSelector('[data-testid="search-input"]');
await page.fill('[data-testid="search-input"]', 'iPhone');

// DEPOIS (robusto — fill direto no input dentro do wrapper):
await page.click('[data-testid="search-autocomplete"] input');
await page.fill('[data-testid="search-autocomplete"] input', 'iPhone');
await page.waitForTimeout(500); // debounce
```

### stock-sales-matching.spec.ts — navegação por tabs

```typescript
// ANTES (pode falhar se URL não atualiza):
await page.waitForURL('**/estoque?tab=mapa');

// DEPOIS (verifica conteúdo, não URL):
await page.click('text=Mapa');
await expect(page.locator('[data-testid="stock-content"]')).toBeVisible();
```

## Resultado esperado

- `playwright.config.ts` — carrega `.env.test` corretamente
- `product-analytics.spec.ts` — remove 1 asserção inválida, mantém 8 testes sólidos
- `stock-sales-matching.spec.ts` — corrige 4 seletores frágeis, mantém 10 testes funcionais
- `pdv-filter.spec.ts` — já está correto (usa `data-testid` que existem em `PDVFilter`)

Total: 3 arquivos editados, sem novos testes criados — apenas os existentes tornados corretos e resilientes.
