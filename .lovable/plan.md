
# Revisão do Code Review — Checklist Completo e Próximos Passos

## Metodologia de Mapeamento

Este documento consolida o estado atual da aplicação após 6 fases de code review já executadas, cruza com o que foi implementado no codebase, e identifica o que ainda falta para considerar a aplicação 100% revisada, refatorada e documentada.

---

## Estado Atual: O que foi Feito (Fases 1–6)

### Fase 1 — Rotas e Dados Reais
- Rota `/upload` corrigida para `/uploads` (consistência)
- `UploadDetails.tsx` refatorado para usar dados reais (sem mock)
- Redirecionamentos legados: `/reports → /estoque`, `/vitrine → /marketing?tab=midias`, `/pdvs → /settings?tab=pdvs`, `/team → /settings?tab=team`

### Fase 2 — Remoção de Código Legado
- `mock-data.ts` removido (~110 linhas)
- `formatCurrency` duplicado removido e centralizado em `src/lib/utils.ts`
- Constantes centralizadas em `src/lib/constants.ts`

### Fase 3 — TypeScript e Tipagem
- Todos os `any` removidos
- Tipos de banco criados via `Tables<"...">` do Supabase
- Hierarquia de tipos de Upload documentada em `src/lib/schemas/upload.ts`

### Fase 4 — Segurança RLS (Banco de Dados)
- Todas as 22 tabelas com RLS habilitado
- Multi-tenant isolado por `get_user_org_id()` e `is_super_admin()`

### Fase 5 — Correções de RLS (5 gaps)
- **Bug crítico corrigido:** `catalog_leads` — `cl.phone = cl.phone` → `cl.phone = catalog_leads.phone`
- **audit_logs INSERT:** `WITH CHECK: true` → `WITH CHECK: (actor_id = auth.uid())`
- **organizations UPDATE:** adicionado `WITH CHECK` explícito
- **notifications UPDATE:** adicionado `WITH CHECK` explícito
- **products ALL:** `WITH CHECK` explícito adicionado

### Fase 6 — Edge Functions (3 fixes)
- **verify-otp:** proteção contra brute-force com `attempt_count` (máx 5 tentativas por OTP)
- **create-user:** validação de comprimento (255 chars), formato de email (regex), UUID format para `organizationId`
- **update-password:** limite de 1024 chars para senha antes das regex de força

---

## Checklist Completo de Implementação

### CAMADA DE SEGURANÇA

#### Banco de Dados (RLS)
- Todas as tabelas com RLS: catalog_leads, otp_verifications, uploads, sales_records, stock_records, products, notifications, organizations, profiles, audit_logs, user_roles, pdvs, api_keys, preferences, user_pdvs, catalog_short_links, link_click_events, pdv_marketing_media, pdv_catalog_settings, stock_history, product_requests, upload_anomalies
- Bug de rate limit corrigido (catalog_leads)
- WITH CHECK em todas as UPDATE policies relevantes
- Políticas DENY-by-default (otp_verifications: `USING: false`)

#### Edge Functions
- create-user: JWT + dupla verificação + hierarquia de roles + sanitização de inputs
- process-spreadsheet: JWT + sanitização + limite 50k linhas + validação UUID
- update-password: JWT + força de senha server-side + limite 1024 chars
- reprocess-refunds: JWT manual + verificação super_admin no banco
- ingest-revenue: API Key SHA-256 + sanitização completa + clamping de valores
- ingest-stock: API Key SHA-256 + sanitização completa
- send-otp: público por design + rate limit por telefone (3/10min) + validação regex
- verify-otp: público por design + `attempt_count` anti-brute-force (5 tentativas)

#### Itens de segurança ainda ausentes
- Rate limiting por IP em todas as Edge Functions — ausente por design (aceito como gap documentado na memória do sistema; mitigado por rate limit por telefone no send-otp e attempt_count no verify-otp)

---

### CAMADA DE FRONTEND

#### Páginas
- `/` — Dashboard: KPIs, gráficos Recharts, lazy loading de charts, pull-to-refresh mobile, filtros PDV + org + data, visão consolidada super_admin
- `/estoque` — Estoque: tabela + mapa, filtros, KPIs, pull-to-refresh, keyboard navigation
- `/uploads` — Uploads: lista paginada, filtros server-side (PDV + tipo + status + busca), upload, delete, paginação
- `/uploads/:id` — Detalhes do upload: dados reais, paginação
- `/marketing` — Marketing: cupons, mídias, leads, analytics, PDV filter
- `/settings` — Configurações: perfil, preferências, organização, PDVs, equipe, integrações, pedidos de produto
- `/organizations` — Super admin: gestão de organizações
- `/catalogo/:orgSlug` — Catálogo público: estoque público, filtros de marca, busca, OTP, cupom
- `/s/:code` — Redirect de short links
- `/auth` — Login
- `*` — NotFound

#### Componentes
- Layout responsivo com sidebar colapsável (desktop) + mobile sidebar
- PDVFilter com save-as-default e badge "Auto"
- DataPagination reutilizável
- Lightbox de mídias (imagem, áudio, vídeo)
- ProductDetailModal com analytics completo
- Pull-to-refresh para mobile
- Skeleton shimmer para loading states
- NotificationsPopover com polling

#### Itens de frontend pendentes (identificados)
- Botão "Limpar filtros" na página de Uploads com badge de contagem de filtros ativos (pedido anteriormente, nunca implementado)
- Empty state da página de Uploads quando filtros ativos não retornam resultados usa texto genérico — não diferencia "sem uploads" vs "filtros não encontraram nada" com sugestão de reset

---

### CAMADA DE HOOKS E LÓGICA

#### Hooks implementados (35+)
- useUploads — query paginada com filtros server-side, reset de página ao mudar filtros
- useProductStock — agregação multi-PDV, filtros de marca/status/vendas/busca
- useDashboard — KPIs, gráficos, memoização, período comparativo
- useNotifications — polling 60s, mark-as-read
- usePreferences — default_pdv, sidebar, tema, idioma, período padrão
- useDefaultPdvPreference — auto-apply com badge de indicação
- usePaginatedQuery (usePagination) — controle de páginas com validação de limites
- useOrganizations, useOrganization, useOrganizationsCRUD
- usePDVs, useUserPDVs, useUserAllowedPDVs
- useProductAnalytics, useProductSalesHistory, useMarketingAnalytics
- usePDVMarketingMedia, usePDVCatalogSettings
- useTeamMembers, useProfile
- usePublicStock, useProductRequests, useCatalogLeads
- useApiKeys, useUploads, useUploadDetails
- useStockHistory, useSlotsData
- usePrefetchRoutes — prefetch de rotas ao hover na sidebar
- useGridKeyboardNavigation — navegação por teclado no mapa de estoque
- useSwipeGesture, useHapticFeedback — UX mobile
- useSidebarPreferences — persistência do estado da sidebar

#### Itens de lógica pendentes
- Nenhum gap crítico identificado. O hook `useUploads` ainda não expõe `hasActiveFilters` calculado para facilitar o botão "Limpar filtros"

---

### CAMADA DE TESTES

#### Testes unitários (vitest) — existentes e passando
- `src/lib/__tests__/dashboardUtils.test.ts` — 884 linhas, cobertura completa de: calculateTotalRevenue, calculatePercentageChange, calculateKPIs, getSalesByDay, getSalesByHourAndDay, getHeatmapPeak, getTopProducts, getStockByBrand, getQuickStats, getLowStockItems, getLossesByDay
- `src/lib/__tests__/productNormalization.test.ts` — extractBrandFromProductName, extractModelFromProductName, normalizeProductName, matchesProduct, getExactProductKey, filterSalesByProduct, countSalesForProduct — incluindo casos críticos de sufixos +/- e variantes Pro/Pro Max
- `src/lib/__tests__/brandAssets.test.ts` — getCanonicalBrand, getBrandChartColor, getBrandColor, getBrandLogo, aliases de marcas
- `src/lib/__tests__/constants.test.ts` — todas as constantes centralizadas
- `src/lib/__tests__/utils.test.ts` — utilitários gerais
- `src/hooks/__tests__/usePagination.test.ts` — usePagination: estado inicial, setPage com limites, setPageSize com reset, getRange, totalPages, hasNextPage/hasPrevPage, nextPage/prevPage
- `src/hooks/__tests__/useUploads.test.ts` — reset de página ao mudar filtros (pdvId, type, status, search, múltiplos simultâneos)
- `src/components/ui/__tests__/PDVFilter.test.tsx` — rendering, Auto badge, save-as-default, clear-default, loading states, onChange callback
- `src/components/dashboard/__tests__/StockAlertsTable.test.tsx` — empty state, with data, status badges, pagination interna, product click
- `src/components/dashboard/__tests__/TopProductsChart.test.tsx` — empty state, with data, interactions, truncação de nomes

#### Testes E2E (playwright) — existentes
- `e2e/pdv-filter.spec.ts` — 8 cenários: save default, persist after reload, Auto badge, clear default, revert to "Todos os PDVs", animação de saída do badge
- `e2e/stock-sales-matching.spec.ts` — 9 cenários: stock page load, product count, search filter, variant matching, sales index badges, filter by sales index, aggregate across PDVs, empty results, special characters
- `e2e/product-analytics.spec.ts` — analytics de produto

#### Testes ausentes (gaps identificados)
- `spreadsheet-validator.ts` — ZERO cobertura de testes. Função `validateSpreadsheetColumns` sem nenhum teste unitário. Esta função foi pedida em versões anteriores do code review mas nunca implementada.
- Testes para `usePublicStock`, `useCatalogLeads`, `useMarketingAnalytics` — hooks públicos sem cobertura
- Testes de integração para o fluxo OTP (send-otp + verify-otp + attempt_count)

---

### CAMADA DE BANCO DE DADOS E MIGRAÇÕES

#### Migrações aplicadas (48 migrações)
- Schema completo com 22 tabelas
- Todas as funções SQL: `get_user_org_id`, `is_admin`, `is_super_admin`, `has_role`, `can_assign_role`, `user_can_access_pdv`, `get_org_user_ids`, `target_user_is_super_admin`, `create_notification`, `notify_new_product_request`, `increment_click_count`, `cleanup_expired_otps`, `get_public_stock`, `get_public_organization`, `prevent_orphan_profile`, `audit_orphan_user`, `handle_new_user`, `update_updated_at_column`
- Trigger de limpeza automática de OTPs expirados
- Coluna `attempt_count` adicionada em `otp_verifications` (Fase 6)
- 5 correções de RLS aplicadas (Fase 5)

#### Itens de banco pendentes
- Nenhum gap crítico. Todos os índices essenciais parecem presentes (não auditados explicitamente)
- Trigger `notify_new_product_request` está definido como função mas precisa ser verificado se o trigger em si está attachado à tabela `product_requests`

---

### CAMADA DE DOCUMENTAÇÃO

#### Documentação existente
- `.lovable/plan.md` — plano da Fase 6 (Edge Functions)
- Memórias do sistema: 15+ entradas documentando arquitetura, segurança, features
- Comentários inline nos schemas (`src/lib/schemas/upload.ts` — hierarquia de tipos documentada)
- Constantes comentadas em `src/lib/constants.ts`
- JSDoc em funções críticas de `dashboardUtils.ts` e `productNormalization.ts`

#### Documentação ausente
- Nenhum `README.md` funcional — o arquivo atual tem apenas o template padrão do Lovable com `REPLACE_WITH_PROJECT_ID`
- Nenhum diagrama de arquitetura documentado no repositório
- Nenhuma documentação de API para as Edge Functions (endpoints, payloads esperados, respostas)
- Nenhum documento de onboarding para novos desenvolvedores

---

## Resumo Visual do Estado Atual

```text
ÁREA                    ESTADO      COBERTURA
────────────────────────────────────────────────────────
Páginas (10/10)         COMPLETO    100%
Componentes core        COMPLETO    ~95%
Hooks (35+)             COMPLETO    ~95%
Segurança RLS           COMPLETO    100% (22 tabelas)
Edge Functions          COMPLETO    100% (8 funções)
Testes unitários        PARCIAL     ~75% (gaps: spreadsheet-validator, hooks públicos)
Testes E2E              PARCIAL     ~60% (gaps: fluxo OTP, catalog público)
Banco de dados          COMPLETO    ~98%
Documentação            AUSENTE     ~20% (apenas README placeholder + memórias)
```

---

## Próximos Passos para 100%

Os 4 itens restantes para completar o code review estão ordenados por impacto decrescente:

---

### Próximo Passo 1 — Testes Unitários: `spreadsheet-validator.ts`

**Arquivo alvo:** `src/lib/utils/spreadsheet-validator.ts`
**Arquivo de teste a criar:** `src/lib/utils/__tests__/spreadsheetValidator.test.ts`

A função `validateSpreadsheetColumns` é crítica — ela é o guardião da qualidade dos uploads e foi pedida explicitamente em rounds anteriores do code review. Tem zero cobertura.

Cenários a cobrir:
- Planilhas de vendas válidas com colunas em português
- Planilhas de vendas válidas com colunas em inglês (aliases de `SALES_COLUMN_ALIASES`)
- Planilhas de estoque válidas com colunas em português
- Planilhas de estoque válidas com colunas em inglês (aliases de `STOCK_COLUMN_ALIASES`)
- Planilha com coluna faltando (uma obrigatória ausente)
- Planilha com todas as colunas faltando
- Planilha vazia (sem headers)
- Headers com espaços extras (trim deve funcionar)
- `totalRows` calculado corretamente

Estratégia: usar `xlsx` para criar buffers de arquivo in-memory no teste (sem File API real), ou mockar `XLSX.read` para retornar dados controlados.

---

### Próximo Passo 2 — Feature: Botão "Limpar Filtros" na página de Uploads

**Arquivo alvo:** `src/pages/Uploads.tsx`

Pedido anteriormente e nunca implementado. A página de Uploads tem 4 filtros (PDV, tipo, status, busca) e não oferece ao usuário uma forma rápida de resetar tudo. Quando filtros estão ativos e não há resultados, o empty state mostra "Tente ajustar seus filtros" mas sem botão de ação.

Implementação:
- Calcular `activeFilterCount` (quantos dos 4 filtros estão ativos, ou seja, diferentes do padrão)
- Mostrar botão "Limpar filtros" com badge de contagem (`activeFilterCount`) quando `activeFilterCount > 0`
- Função `handleClearFilters` que reseta: `setSearchQuery("")`, `handlePdvChange("all")`, `setFilterType("all")`, `setFilterStatus("all")`
- No empty state quando há filtros ativos, adicionar botão de ação direto que chama `handleClearFilters`
- Posição: ao lado dos seletores de filtro na barra de filtros

---

### Próximo Passo 3 — Verificação do Trigger de Notificação de Pedidos de Produto

**Verificação necessária:** O banco tem a função `notify_new_product_request()` definida, mas é necessário confirmar via SQL se o trigger está de fato attachado à tabela `product_requests`.

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'product_requests';
```

Se o trigger não existir, ele precisa ser criado:
```sql
CREATE TRIGGER on_new_product_request
AFTER INSERT ON public.product_requests
FOR EACH ROW EXECUTE FUNCTION notify_new_product_request();
```

---

### Próximo Passo 4 — Documentação: README Funcional e Arquitetura

**Arquivos a criar/atualizar:**
- `README.md` — substituir o template padrão com documentação real
- `docs/ARCHITECTURE.md` — diagrama de arquitetura, fluxos principais, decisões técnicas

Conteúdo do README funcional:
- Descrição do produto (SaaS multi-tenant para gestão de PDVs de vending machine)
- Stack tecnológica (React 18, Vite, TypeScript, Tailwind, Supabase/Lovable Cloud, Twilio)
- Hierarquia de roles (super_admin, org_admin, operator, viewer)
- Fluxos principais (upload de planilha, catálogo público, OTP, ingestão por API)
- Variáveis de ambiente necessárias (secrets do Twilio, Supabase)
- Como rodar localmente (npm install + npm run dev)
- Como rodar testes (vitest + playwright)
- Estrutura de pastas comentada

Conteúdo da documentação de arquitetura:
- Diagrama de tabelas do banco e relacionamentos
- Diagrama de fluxo de Edge Functions
- Política de segurança RLS (resumo das camadas)
- Glossário de termos do domínio (PDV, slot, brand, OTP, catalog_lead)

---

## Tabela Final: 100% do Code Review

```text
ITEM                                    ESTADO ATUAL   PRÓXIMA AÇÃO
─────────────────────────────────────────────────────────────────────────────
Fases 1-6 do code review                CONCLUÍDO      —
Testes: spreadsheet-validator           AUSENTE        Criar (Passo 1)
Feature: Limpar filtros em Uploads      AUSENTE        Implementar (Passo 2)
Trigger product_requests                A VERIFICAR    Verificar e corrigir se necessário (Passo 3)
README e documentação de arquitetura    AUSENTE        Criar (Passo 4)
```

Completar os 4 passos acima fecha o code review em 100%.
