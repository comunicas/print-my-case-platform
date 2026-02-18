
# Novos Testes Unitários: useUploads, useDashboard e useProductAnalytics

## Contexto e Estratégia

Os hooks dependem de Supabase, React Query e outros hooks internos. Para testá-los de forma isolada (sem chamadas reais ao banco), a estratégia é:

- **useUploads** — o que vale testar é o comportamento do `useEffect` que reseta a página. O melhor ponto de teste é a função pura `usePagination` (já usada internamente) + o efeito de reset via `renderHook`. Como o hook tem muitas dependências externas (auth, perfil, supabase), os testes se concentram na lógica de paginação isolada e no efeito de filtro via mock completo.
- **useDashboard** — a lógica de filtro de cancelamentos vive inteiramente em `dashboardUtils.ts` (funções puras `getLossesByDay`, `calculateKPIs`) e na query do Supabase. Os testes cobrem as funções puras que calculam as métricas de cancelamento, que é onde o bug estava.
- **useProductAnalytics** — a função central é `filterSalesByProduct` (já em `productNormalization.ts`). Os testes focam em cenários com sufixos `+`/`-` que são o caso crítico reportado.

## Análise do que já existe

Os testes existentes em `productNormalization.test.ts` já cobrem `filterSalesByProduct` com casos básicos (linhas 261-297). O que **falta** são:
1. Casos com `+` e `-` em `filterSalesByProduct` (Galaxy S24 vs Galaxy S24+)
2. Casos com `filterSalesByProduct` simulando dados vindos de `useProductAnalytics` (product_name no formato que o banco retorna)
3. Testes de `usePagination` (reset de página)
4. Testes das funções de cancelamento em `dashboardUtils`

## Abordagem por arquivo

### 1. `src/hooks/__tests__/usePagination.test.ts` (NOVO)

Testa a lógica de reset de página ao mudar filtros — isola `usePagination` do `useUploads` para testar o comportamento puro:

```typescript
// Testa: página reseta para 1 quando setPage(1) é chamado
// Testa: getRange() com page=3 retorna { from: 100, to: 149 }
// Testa: setPage respeita limites (não vai abaixo de 1)
// Testa: setPageSize reseta para página 1 automaticamente
```

### 2. `src/hooks/__tests__/useUploads.test.ts` (NOVO)

Testa o comportamento do `useEffect` de reset de página usando `renderHook` com mocks:

```typescript
// Mock de useAuth, useProfile, usePagination, supabase
// Testa: ao mudar pdvId, setPage(1) é chamado
// Testa: ao mudar type, setPage(1) é chamado
// Testa: ao mudar status, setPage(1) é chamado
// Testa: ao mudar search, setPage(1) é chamado
```

### 3. `src/lib/__tests__/dashboardUtils.test.ts` (ADIÇÃO no arquivo existente)

Adiciona uma nova `describe` block para as funções de cancelamento:

```typescript
describe('calculateKPIs — cancelamentos em português', () => {
  // Testa: status "Cancelado" é excluído do revenue (não contabiliza como venda)
  // Testa: status "Cancelled" (EN) é excluído
  // Testa: status "Canceled" (EN variação) é excluído  
  // Testa: status "Concluído" (PT) é incluído no revenue
  // Testa: totalCancellations = soma de amount dos registros com status cancelado
})
```

**Observação importante:** `calculateKPIs` em `dashboardUtils.ts` recebe apenas records já filtrados pelo caller (o hook já aplica o filtro de status na query do Supabase). Portanto, os testes de cancelamento serão sobre `getLossesByDay` e sobre como os dados mockados refletem o filtro de status que o hook aplica.

### 4. `src/lib/__tests__/productNormalization.test.ts` (ADIÇÃO no arquivo existente)

Adiciona casos críticos de `+`/`-` ao `describe('filterSalesByProduct')` existente:

```typescript
describe('CRÍTICO: sufixos + e - distinguem modelos', () => {
  // Galaxy S24 NÃO deve bater Galaxy S24+
  // Galaxy S24+ NÃO deve bater Galaxy S24 Ultra
  // Galaxy S24+ deve bater Galaxy S24+ (mesmo modelo)
  // iPhone 15 NÃO deve bater iPhone 15 Pro-Max
  // Casos com dados no formato exato que o banco retorna
})
```

## Arquivos a criar/editar

| Arquivo | Ação | Conteúdo |
|---|---|---|
| `src/hooks/__tests__/usePagination.test.ts` | CRIAR | Testes puros de `usePagination` (renderHook, sem mocks de Supabase) |
| `src/hooks/__tests__/useUploads.test.ts` | CRIAR | Testes do reset de página com mocks de todos os deps externos |
| `src/lib/__tests__/dashboardUtils.test.ts` | EDITAR | Adicionar describe para cancelamentos em PT/EN |
| `src/lib/__tests__/productNormalization.test.ts` | EDITAR | Adicionar casos com `+`/`-` em filterSalesByProduct |

## Detalhe técnico: mocks necessários para useUploads

O `useUploads` depende de:
- `useAuth` → `vi.mock('@/contexts/AuthContext', () => ...)`
- `useProfile` → `vi.mock('@/hooks/useProfile', () => ...)`
- Supabase client → `vi.mock('@/integrations/supabase/client', () => ...)`
- `toast` (sonner) → `vi.mock('sonner', () => ...)`

O `usePagination` **não tem dependências externas** (só `useState`/`useCallback`) — ideal para testar em isolamento com `renderHook`.

## Cenários de teste detalhados

### usePagination (foco: reset de página)

```
Cenário 1: página inicial é 1
Cenário 2: setPage(3) → page === 3, getRange() === { from: 100, to: 149 }
Cenário 3: setPageSize(10) → page reseta para 1 automaticamente
Cenário 4: setPage(0) → page permanece 1 (limite inferior)
Cenário 5: totalPages calculado corretamente com 105 itens, pageSize=50 → totalPages=3
Cenário 6: hasNextPage e hasPrevPage corretos em cada página
```

### filterSalesByProduct — sufixos críticos (foco da tarefa)

```
Cenário 1: Galaxy S24 NÃO inclui Galaxy S24+     ← caso real do code review
Cenário 2: Galaxy S24+ SÓ inclui Galaxy S24+
Cenário 3: Galaxy S24 Ultra não confunde com S24
Cenário 4: Samsung Galaxy S24+ (com marca) bate com Galaxy S24+ (sem marca)
Cenário 5: dados com product_name no formato exato do banco ("SAMSUNG Galaxy S24+")
Cenário 6: iPhone 15 Pro-Max não bate iPhone 15 Pro (hífen no nome)
```

### dashboardUtils — cancelamentos

```
Cenário 1: getLossesByDay com registros de cancelamento PT ("Cancelado")
Cenário 2: getLossesByDay sem cancelamentos → lossesByDay zerado
Cenário 3: getLossesByDay com mix de cancelamentos EN e PT no mesmo período
Cenário 4: cálculo do totalCancellations = soma dos amounts
Cenário 5: cancellationsChange: período anterior zerado → change = 0
```

## Resultado esperado após implementação

- `src/hooks/__tests__/usePagination.test.ts` — ~12 testes novos
- `src/hooks/__tests__/useUploads.test.ts` — ~8 testes novos
- `src/lib/__tests__/dashboardUtils.test.ts` — ~10 testes adicionados
- `src/lib/__tests__/productNormalization.test.ts` — ~8 testes adicionados

Total: ~38 testes novos somados aos 263 existentes → **~301 testes no total**
