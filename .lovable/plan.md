

## Reorganização do Estoque em 3 Páginas — Plano Faseado

### Fase 1: Infraestrutura de Rotas e Navegação

**Objetivo**: Trocar de `?tab=` para rotas reais sem alterar conteúdo das páginas.

**Arquivos**:
- `src/App.tsx` — Adicionar rotas `/estoque` (overview), `/estoque/tabela`, `/estoque/compras`. Componente `StockRedirect` para compatibilidade com URLs legadas
- `src/components/layout/AppSidebar.tsx` — Atualizar `stockSubItems` para rotas reais: Resumo, Tabela, Compras
- `src/components/layout/MobileSidebar.tsx` — Mesma atualização
- `src/components/layout/CollapsibleNavMenu.tsx` — Lógica híbrida de `isSubActive`: path-based para Estoque, query-based para Marketing (detecta pela presença de `?` no href)

---

### Fase 2: Página Resumo (`/estoque`)

**Objetivo**: Home do Estoque com KPIs clicáveis e alertas de estoque crítico.

**Arquivos**:
- `src/pages/StockOverview.tsx` — **Novo**. KPIs clicáveis + top 5 produtos para repor + links "Ver todos"
- `src/components/stock/StockKPICards.tsx` — Nova prop `onCardClick` para navegação com filtro pré-aplicado

---

### Fase 3: Página Tabela + Mapa Inline (`/estoque/tabela`)

**Objetivo**: Consolidar tabela e mapa numa única página com toggle visual.

**Arquivos**:
- `src/pages/StockTable.tsx` — **Novo**. Toggle `table/map` no header, lê `?status=` e `?view=` da URL, StockFilters + PullToRefresh
- `src/pages/Stock.tsx` — **Remover** (substituído)

---

### Fase 4: Página Compras + Testes E2E

**Objetivo**: Isolar compras e atualizar testes.

**Arquivos**:
- `src/pages/StockPurchases.tsx` — **Novo**. Wrapper: AppLayout + PreStockTab (sem StockFilters duplicado)
- `e2e/pdv-filter.spec.ts` — Rota `/estoque` → `/estoque/tabela`
- `e2e/stock-sales-matching.spec.ts` — Mesma atualização
- `e2e/product-analytics.spec.ts` — Mesma atualização

---

### Detalhe: CollapsibleNavMenu Híbrido

O componente suportará ambos os padrões simultaneamente:
- Se `subItem.href` contém `?` → lógica atual (query params, para Marketing)
- Se não contém `?` → comparação direta de pathname (para Estoque)

Isso garante zero impacto no módulo Marketing.

---

### Alternativa Considerada

Manter tabs com lazy loading por tab. Descartada porque não permite deep-linking, KPIs como página de entrada, nem URLs semânticas.

---

### Resumo

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
| Modificar | 3 arquivos E2E |
| Remover | `src/pages/Stock.tsx` |

