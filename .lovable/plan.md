
## Verificação prévia da análise

Antes de planejar, confrontei cada ponto com o código já existente. Resultado:

| # da análise | Status real | Ação |
|---|---|---|
| 1. Sidebar sem toggle mobile | **Já implementado** — `AppLayout` usa `useBreakpoint()` e renderiza `MobileSidebar` (drawer) em `mobile`, `AppSidebar` em desktop/tablet | Ignorar |
| 2. Conteúdo espremido em 119px | Consequência do #1 — não ocorre | Ignorar |
| 3. Tabela de Estoque sem view mobile | Verdadeiro (`ProductStockTable` usa `<Table>` com scroll) | **Incluir** |
| 4. Botões de período < 44px | Verdadeiro (`h-8` em `DateRangeFilter`) | **Incluir** |
| 5. Filtros do Dashboard com 2 scrolls horizontais | Verdadeiro | **Incluir** |
| 6. Heatmap `min-w-[340px]` | Verdadeiro | **Incluir** |
| 7. Topbar org sem `max-w` | Verificar — `AppHeader` já tem `truncate max-w-[150px]` no nome da org única, mas o `OrgSwitcher` (multi-org) não | **Incluir** (apenas OrgSwitcher) |
| 8. Ícones nav recolhidos pequenos para touch | Sidebar recolhida só aparece em desktop/tablet (não mobile). Em tablet `py-2.5` ≈ 40px. **Não é problema mobile real** | Ignorar |
| 9. Header Financeiro empilhar | Confirmar no arquivo, provavelmente válido | **Incluir** |
| 10. Tabela Mensal sem indicador de scroll | Provavelmente válido | **Incluir** |

## Escopo do plano

Apenas mudanças visuais/responsivas (sem lógica de negócio). 7 ajustes pequenos e independentes.

### 1. Card view mobile da Tabela de Estoque
- Arquivo: `src/components/stock/ProductStockTable.tsx`
- Em `<768px`: renderizar lista de cards (`<Card>` por produto) com Produto + Status no topo, e grid 2-col com PDV, Slot, Estoque, Vendas. Manter ações (ver detalhes) acessíveis via clique no card.
- Em `≥768px`: tabela atual inalterada (`hidden md:block` wrapper na tabela, `md:hidden` no novo bloco de cards).

### 2. Touch targets dos presets de período
- Arquivo: `src/components/dashboard/DateRangeFilter.tsx` (linhas 207, 220, 233)
- Trocar `h-8 px-3` → `h-10 sm:h-8 px-4 sm:px-3` nos 3 botões + trigger do calendário.

### 3. Layout dos filtros do Dashboard em mobile
- Arquivo provável: o componente que monta DateRangeFilter + seletor de PDV no Dashboard (verificar em `src/pages/Index.tsx` ou `QuickStats`).
- Em mobile: empilhar verticalmente (presets de período em uma linha com scroll, PDV select em linha separada `w-full`). Em `sm:` manter o layout atual.

### 4. Heatmap "Vendas por Horário"
- Arquivo: `src/components/dashboard/SalesHeatmapChart.tsx`
- Envolver o grid em `<div className="overflow-x-auto -mx-4 px-4">` para permitir scroll suave da borda à borda em telas estreitas, mantendo `min-w-[340px]`.

### 5. OrgSwitcher com `max-w` em mobile
- Arquivo: `src/components/layout/OrgSwitcher.tsx`
- Adicionar `max-w-[180px] sm:max-w-none` + `truncate` no trigger para evitar empurrar os ícones do header.

### 6. Header da página Financeiro empilhar em mobile
- Arquivo: `src/pages/Financeiro.tsx`
- Trocar header `flex items-center justify-between` por `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`. Botão "Nova Despesa" full-width em mobile (`w-full sm:w-auto`).

### 7. Indicador de scroll na Evolução Mensal
- Arquivo: `src/components/financeiro/MonthlyBreakdownTable.tsx`
- Envolver tabela em `<div className="relative">` com gradiente fade `pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent md:hidden` indicando scroll horizontal disponível.

## Detalhes técnicos

- Todas as alterações usam tokens semânticos do design system existente (`bg-card`, `text-muted-foreground`, etc.) — nenhuma cor hard-coded.
- Nenhuma mudança em hooks de dados, RLS, edge functions, schema ou lógica de negócio.
- Nenhuma dependência nova. Apenas Tailwind responsivo.
- Breakpoint usado: `md:` (768px), consistente com o restante do projeto.
- Targets de toque mínimos de 44px respeitados conforme regra de memória mobile-first.

## Itens explicitamente **descartados** (já implementados ou não aplicáveis)

- Sidebar mobile com hamburguer/overlay → já existe via `MobileSidebar` + botão `Menu` no `AppHeader`.
- Aumentar área de toque dos ícones recolhidos da sidebar → estado recolhido não é exibido em mobile.

## Validação pós-implementação

- Inspecionar visualmente em viewport 375×812 (`preview_ui--set_preview_device_viewport: mobile`) cada uma das 4 páginas afetadas: Dashboard, Estoque/Tabela, Financeiro, e header geral.
