## Reorganização do Estoque em 3 Páginas — Plano Faseado

### Fase 1: Infraestrutura de Rotas e Navegação

**Objetivo**: Trocar de `?tab=` para rotas reais sem alterar conteúdo das páginas.

**Arquivos**:
- `src/App.tsx` — Adicionar rotas `/estoque` (overview), `/estoque/tabela`, `/estoque/compras`. Adicionar componente `StockRedirect` para redirecionar URLs legadas (`/estoque?tab=tabela` → `/estoque/tabela`, `?tab=mapa` → `/estoque/tabela?view=map`, `?tab=compras` → `/estoque/compras`)
- `src/components/layout/AppSidebar.tsx` — Atualizar `stockSubItems` para `[{label:"Resumo", href:"/estoque"}, {label:"Tabela", href:"/estoque/tabela"}, {label:"Compras", href:"/estoque/compras"}]`
- `src/components/layout/MobileSidebar.tsx` — Mesma atualização do `stockSubItems`
- `src/components/layout/CollapsibleNavMenu.tsx` — Reescrever lógica `isSubActive` (linhas 98-103): trocar parsing de `?tab=` por comparação direta de pathname (`activeItem === subItem.href` ou `startsWith` para rotas com query params)

**Risco controlado**: Marketing continua usando `?tab=` — a nova lógica do `CollapsibleNavMenu` precisa suportar ambos os padrões (path-based para Estoque, query-based para Marketing).

---

### Fase 2: Página Resumo (`/estoque`)

**Objetivo**: Criar a home do Estoque com KPIs clicáveis e alertas.

**Arquivos**:
- `src/pages/StockOverview.tsx` — **Novo**. Usa `AppLayout` + `StockFiltersProvider` + `useProductStock`. Renderiza:
  - KPIs clicáveis (reutiliza `StockKPICards` com nova prop `onCardClick`)
  - Top 5 produtos para repor (lista simples extraída de `products` filtrados por `units === 0`)
  - Links "Ver todos →" para `/estoque/tabela`
- `src/components/stock/StockKPICards.tsx` — Adicionar prop opcional `onCardClick?: (filter: string) => void`. Cards "Repor" e "Atenção" navegam para `/estoque/tabela?status=critical` e `?status=warning`

---

### Fase 3: Página Tabela + Mapa Inline (`/estoque/tabela`)

**Objetivo**: Consolidar tabela e mapa numa única página com toggle.

**Arquivos**:
- `src/pages/StockTable.tsx` — **Novo**. Usa `AppLayout` + `StockFiltersProvider` + `useProductStock`. Contém:
  - Header com título + toggle `viewMode: 'table' | 'map'` (ícones `TableIcon` / `LayoutGrid`)
  - Lê `?status=` da URL para pré-aplicar filtro vindo do Resumo via `useEffect` no `StockFiltersContext`
  - Lê `?view=map` para iniciar no modo mapa (compatibilidade com redirect)
  - `StockFilters` + renderização condicional de `ProductStockTable` ou `StockGridView`
  - `PullToRefresh` no mobile
- `src/pages/Stock.tsx` — **Remover** (substituído pelas 3 páginas)

---

### Fase 4: Página Compras + Testes E2E

**Objetivo**: Isolar compras e atualizar testes.

**Arquivos**:
- `src/pages/StockPurchases.tsx` — **Novo**. Wrapper simples: `AppLayout` + `StockFiltersProvider` + `PreStockTab`. Sem filtros de estoque (PreStockTab tem os seus próprios)
- `e2e/pdv-filter.spec.ts` — Atualizar `goto('/estoque')` para `goto('/estoque/tabela')` (onde os filtros existem)
- `e2e/stock-sales-matching.spec.ts` — Mesma atualização
- `e2e/product-analytics.spec.ts` — Mesma atualização

---

### Detalhe Técnico: CollapsibleNavMenu Híbrido

O componente precisa suportar 2 padrões simultaneamente:
- **Estoque** (path-based): `subItem.href = "/estoque/tabela"` → `isSubActive = activeItem === "/estoque/tabela"` ou match exato para `/estoque`
- **Marketing** (query-based): `subItem.href = "/marketing?tab=cupons"` → lógica atual com `URLSearchParams`

Solução: detectar se `subItem.href` contém `?` — se sim, usa lógica de query params; se não, usa comparação de pathname.

---

### Alternativa Considerada: Manter Tabs mas com Lazy Loading

Em vez de 3 rotas, manter a página única com tabs mas carregar cada tab sob demanda (`React.lazy` por tab). Isso evitaria mudanças na navegação e nos testes E2E, mas **não** resolveria o problema de UX de ter uma URL única para 3 contextos distintos, e não permitiria KPIs clicáveis como página de entrada.

**Recomendação**: A abordagem de 3 rotas é superior porque permite deep-linking, favorece a organização mental do usuário, e cada página carrega apenas os dados que precisa.

---

### Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/StockOverview.tsx` |
| Criar | `src/pages/StockTable.tsx` |
| Criar | `src/pages/StockPurchases.tsx` |
| Modificar | `src/App.tsx` |
| Modificar | `src/components/layout/AppSidebar.tsx` |
| Modificar | `src/components/layout/MobileSidebar.tsx` |
| Modificar | `src/components/layout/CollapsibleNavMenu.tsx` |
| Modificar | `src/components/stock/StockKPICards.tsx` |
| Modificar | `e2e/pdv-filter.spec.ts` |
| Modificar | `e2e/stock-sales-matching.spec.ts` |
| Modificar | `e2e/product-analytics.spec.ts` |
| Remover | `src/pages/Stock.tsx` |
