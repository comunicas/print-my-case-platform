

# Analise de Performance: Queries, Re-renders e Bundle Size

## 1. Queries Lentas e Ineficientes

### 1.1 Dashboard: 9 queries paralelas em cascata (ALTO IMPACTO)
O `useDashboard` dispara 6 queries em `Promise.all`, mas antes disso faz uma sub-query de PDVs (linhas 102-107). Para super admins, ha mais 3 queries globais (linhas 199-203). Alem disso, `Index.tsx` tambem chama `useSlotsData` e `useStockHistory` -- dados de **estoque** que nao pertencem ao dashboard.

**Problema**: O dashboard carrega dados de estoque (slots + historico) que poderiam ser lazy-loaded ou removidos se o usuario nao scrollar ate essa secao.

**Solucao**: Mover `useSlotsData` e `useStockHistory` para dentro dos componentes `StockByBrandChart` e `StockHistoryChart` (que ja sao lazy-loaded). Assim os dados so sao buscados quando o chart renderiza.

### 1.2 ProductAnalytics: busca 10.000 registros para filtrar client-side (ALTO IMPACTO)
O `useProductAnalytics` (linha 51) busca ate 10.000 vendas com `select('*, order_time')` e depois filtra no JS com `filterSalesByProduct`. Isso transfere megabytes de dados para computar metricas de um unico produto.

**Solucao**: Usar `ilike` no banco para pre-filtrar por produto e depois refinar client-side. Ou criar uma RPC (database function) que compute as metricas diretamente no banco.

### 1.3 Dashboard Sales: DASHBOARD_SALES_LIMIT = 10.000 (MEDIO IMPACTO)
A constante `DASHBOARD_SALES_LIMIT` em 10.000 e excessiva para gerar graficos. Os graficos de "vendas por dia" e "top produtos" nao precisam de 10.000 registros raw -- poderiam ser pre-agregados no banco.

**Solucao**: Reduzir o limite para 5.000 ou implementar agregacao server-side via database function.

### 1.4 PRODUCT_STOCK_SALES_LIMIT = 5.000 para indice de vendas (MEDIO)
O `useProductStock` busca 5.000 vendas so para contar quantas vezes cada produto foi vendido. Isso poderia ser um `GROUP BY product_name` no banco.

**Solucao**: Criar query com `select('product_name')` + agrupar no banco, ou usar uma RPC que retorne contagens ja agregadas.

### 1.5 useDashboardDataRange: 2 queries para min/max (BAIXO)
Dispara 2 queries separadas (min e max) quando poderia usar uma unica query com `SELECT MIN(payment_date), MAX(payment_date)` via RPC.

---

## 2. Re-renders Desnecessarios

### 2.1 useProfile chamado 24+ vezes (ALTO IMPACTO)
O `useProfile()` e chamado em 24 arquivos diferentes. Cada chamada cria subscricoes independentes no React Query. Embora o cache seja compartilhado, cada componente re-renderiza quando o profile muda -- causando cascata de re-renders em toda a arvore.

**Solucao**: O AuthContext ja tem o `user`. Considerar mover `profile` e `role` para um contexto dedicado (ProfileContext) que evite re-renders em componentes que so precisam do `role`.

### 2.2 AuthContext: value object recriado a cada render (MEDIO)
O `AuthProvider` (linhas 93-95) cria um novo objeto `value` a cada render, forcando re-render de todos os consumidores.

**Solucao**: Usar `useMemo` no value do Provider:
```typescript
const value = useMemo(() => ({
  user, session, loading, signIn, signUp, signOut, resetPassword, updatePassword
}), [user, session, loading]);
```

### 2.3 ActiveOrgContext: mesma questao do value object (MEDIO)
O `ActiveOrgProvider` (linhas 56-67) recria o value a cada render. Alem disso, `organizations.find()` e `activeOrgId === profile?.organization_id` sao computados sem memo.

**Solucao**: `useMemo` no value.

### 2.4 StockGridView: re-renders em todo o grid quando um slot muda (BAIXO)
O `StockGridView` renderiza todos os slots inline. Quando `focusedSlot` muda, todo o grid re-renderiza. Os `SlotStack` individuais deveriam ser memoizados com `React.memo`.

---

## 3. Bundle Size

### 3.1 Lucide icons: importacoes individuais estao corretas
As importacoes de lucide usam tree-shaking (`import { X } from 'lucide-react'`), entao nao ha problema.

### 3.2 xlsx importado estaticamente (MEDIO)
O pacote `xlsx` (~200KB gzipped) e usado apenas para export de dados. Se importado estaticamente, adiciona peso ao bundle principal.

**Solucao**: Verificar se ja e lazy-loaded. Se nao, usar `import('xlsx')` dinamico apenas quando o usuario clica "Exportar".

### 3.3 date-fns ja tem chunk separado (OK)
O `vite.config.ts` ja separa `date-fns` e `recharts` em chunks manuais.

### 3.4 Recharts charts: lazy load correto (OK)
O `Index.tsx` ja usa `lazy()` para todos os charts pesados.

---

## 4. Oportunidades Adicionais

### 4.1 Notifications polling sem visibilidade (BAIXO)
O `useNotifications` faz polling a cada 60s mesmo com a aba em background (`refetchInterval: 60 * 1000`). Deveria usar `refetchIntervalInBackground: false` para economizar requests.

### 4.2 usePrefetchRoutes: prefetch com query keys divergentes (BUG)
O `prefetchStock` usa `queryKey: ["slots-data", undefined, profile?.id]` mas o `useSlotsData` real usa `queryKey: ['slots-data', pdvId, allowedPdvIds]`. As keys **nao batem**, entao o prefetch nunca acerta o cache e os dados sao buscados duas vezes.

**Solucao**: Alinhar as query keys do prefetch com as do hook real.

### 4.3 usePrefetchRoutes: prefetch do dashboard tambem diverge (BUG)
O `prefetchDashboard` usa uma queryFn simplificada que retorna `{ salesData }`, mas o `useDashboard` espera o tipo `DashboardData` completo. O prefetch popula o cache com dados incompativeis, que serao descartados quando o hook real executa.

---

## Resumo por Prioridade

| Prioridade | Item | Impacto Estimado |
|------------|------|-----------------|
| ALTA | 2.2 + 2.3: useMemo nos context values | Elimina cascata de re-renders |
| ALTA | 4.2 + 4.3: Corrigir query keys do prefetch | Elimina fetches duplicados |
| ALTA | 1.1: Lazy-load dados de estoque no dashboard | Reduz 2 queries na carga inicial |
| ALTA | 1.2: ProductAnalytics server-side filtering | Reduz transferencia de dados ~90% |
| MEDIA | 1.4: GROUP BY para sales summary | Reduz transferencia de dados ~80% |
| MEDIA | 3.2: Lazy import do xlsx | Reduz bundle principal ~200KB |
| MEDIA | 2.1: ProfileContext dedicado | Reduz re-renders em 20+ componentes |
| BAIXA | 4.1: refetchIntervalInBackground: false | Economiza requests em background |
| BAIXA | 1.5: RPC para data range | Reduz 2 queries para 1 |
| BAIXA | 2.4: React.memo nos SlotStack | Reduz re-renders no grid |

## Plano de Implementacao

**Fase 1 (Quick wins, sem risco):**
- useMemo nos context values (AuthContext, ActiveOrgContext)
- refetchIntervalInBackground: false nas notifications
- Lazy import do xlsx

**Fase 2 (Correcao de bugs de cache):**
- Alinhar query keys do usePrefetchRoutes com os hooks reais
- Ou remover o prefetch se as keys sao dificeis de manter sincronizadas

**Fase 3 (Otimizacao de queries):**
- Mover useSlotsData/useStockHistory para dentro dos chart components lazy
- Implementar GROUP BY no sales summary do useProductStock
- Implementar pre-filtragem server-side no useProductAnalytics

