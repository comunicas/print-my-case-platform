

## Checklist de Saúde da Aplicação + Plano de Refatoração

### Checklist de Saúde — Estado Atual

| Area | Item | Status | Detalhe |
|------|------|--------|---------|
| **Dados** | sales_records normalizados PT-BR | ✅ OK | 934 registros, 1 status (`Concluído`), 4 payment_methods canônicos |
| **Dados** | stock_records limpos (1 por PDV) | ✅ OK | 3 uploads, 255 registros |
| **Dados** | RPCs financeiras (allowlist PT-BR) | ✅ OK | `get_dre_sales_summary` e `get_annual_dre_summary` já simplificadas |
| **Edge Functions** | `process-spreadsheet` normaliza PT-BR | ✅ OK | |
| **Edge Functions** | `process-spreadsheet` cleanup automático | ✅ OK | |
| **Edge Functions** | `ingest-revenue` desabilitada (503) | ⚠️ Pendente | Etapa 6 do roadmap |
| **Edge Functions** | `reprocess-refunds` — legado | ❌ Morta | 447 linhas, não referenciada no frontend, usa lógica EN antiga |
| **Edge Functions** | `ingest-stock` — ativa | ✅ OK | Usada via API keys |
| **Frontend** | `useDashboard.ts` — filtros legado EN | ❌ Legado | Ainda filtra por `["Completed", "Pago", "Concluído"]` e `ilike %cancelled%` |
| **Frontend** | `useProductAnalytics.ts` — filtros legado EN | ❌ Legado | Mesmo padrão |
| **Frontend** | `useProductSalesHistory.ts` — filtros legado EN | ❌ Legado | Mesmo padrão |
| **Frontend** | `useProductStock.ts` — filtros legado EN | ❌ Legado | Mesmo padrão |
| **Frontend** | `SalesRecordsTab.tsx` — labels | ✅ OK | Já simplificado na Etapa 4 |
| **Testes** | Testes unitários existentes passam | ✅ OK | PDVFilter, TopProductsChart, usePagination, etc. |
| **Páginas** | Dashboard (`/`) | ✅ Funcional | KPIs, charts, filters funcionando |
| **Páginas** | Estoque (`/estoque`) | ✅ Funcional | Tabela + Mapa funcionando |
| **Páginas** | Uploads (`/uploads`) | ✅ Funcional | Tabs uploads + vendas |
| **Páginas** | Financeiro (`/financeiro`) | ✅ Funcional | DRE, Resumo, Despesas |
| **Páginas** | Marketing (`/marketing`) | ✅ Funcional | Cupons, Mídias, Catálogos, Leads, Analytics |
| **Páginas** | Settings (`/settings`) | ✅ Funcional | 6 tabs |
| **Páginas** | Organizations (`/organizations`) | ✅ Funcional | Super admin only |
| **Páginas** | Auth (`/auth`) | ✅ Funcional | Login + Reset password |
| **Páginas** | Catálogo Público (`/catalogo/:slug`) | ✅ Funcional | |
| **Páginas** | Short Links (`/s/:code`) | ✅ Funcional | |
| **Segurança** | RLS em todas as tabelas | ✅ OK | |
| **Segurança** | Roles via `user_roles` (não no profile) | ✅ OK | |
| **Arquitetura** | Lazy loading de páginas e charts | ✅ OK | |
| **Arquitetura** | Code splitting (vendor chunks) | ✅ OK | |

---

### Problemas Encontrados e Plano de Refatoração

#### 1. Filtros legado EN nos hooks do frontend (4 arquivos)

Os hooks `useDashboard`, `useProductAnalytics`, `useProductSalesHistory` e `useProductStock` ainda filtram por variantes inglesas que **não existem mais no banco**. Isso funciona apenas porque `Concluído` está na lista, mas o código carrega bagagem desnecessária.

**Mudança**: Em cada arquivo, substituir:
- `["Completed", "Pago", "Concluído"]` → `["Concluído"]`
- `ilike %cancelled%,ilike %canceled%,ilike %cancelado%` → `eq status Cancelado`
- Remover comentários sobre variantes EN

**Arquivos**: `src/hooks/useDashboard.ts`, `src/hooks/useProductAnalytics.ts`, `src/hooks/useProductSalesHistory.ts`, `src/hooks/useProductStock.ts`

#### 2. Edge Function `reprocess-refunds` — código morto

447 linhas de código que não são referenciadas em nenhum lugar do frontend. Usa lógica EN antiga incompatível com a normalização atual.

**Mudança**: Deletar `supabase/functions/reprocess-refunds/index.ts`

#### 3. Edge Function `ingest-revenue` — 503 placeholder

Já endereçado no roadmap (Etapa 6). Não será tratado agora conforme acordado.

#### 4. Testes com referências EN (`dashboardUtils.test.ts`)

Comentários de teste mencionam `"Cancelled" (EN)` — devem ser atualizados para refletir os valores canônicos.

**Mudança**: Atualizar labels nos testes para usar termos PT-BR.

---

### Resumo das Mudanças

| Arquivo | Ação |
|---------|------|
| `src/hooks/useDashboard.ts` | Simplificar filtros de status para canônicos PT-BR |
| `src/hooks/useProductAnalytics.ts` | Simplificar filtros de status |
| `src/hooks/useProductSalesHistory.ts` | Simplificar filtros de status |
| `src/hooks/useProductStock.ts` | Simplificar filtros de status |
| `src/lib/__tests__/dashboardUtils.test.ts` | Atualizar comentários/labels para PT-BR |
| `supabase/functions/reprocess-refunds/index.ts` | Deletar (código morto) |

### O que NÃO será alterado

- `ingest-revenue` — permanece desabilitada (Etapa 6 pendente)
- `ingest-stock` — funcional, usada via API
- Hooks utilitários (`usePrefetchRoutes`, `useDebounce`, `useHapticFeedback`, etc.) — todos em uso ativo
- Componentes e páginas — todos funcionais, sem código morto identificado

