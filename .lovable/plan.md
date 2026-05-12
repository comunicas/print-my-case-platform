# Plano: /ds mobile-first + cobertura 100% de componentes

## Objetivos

1. Página `/ds` totalmente responsiva (mobile-first, ≥44px touch, sem scroll horizontal).
2. Cobrir **100%** dos componentes em `src/components/ui/` (61 arquivos), não só 14.
3. Navegação utilizável em mobile (drawer/sheet em vez de sidebar fixa).

## Lacunas atuais

- Sidebar de navegação some no mobile (`hidden lg:block`) e não há substituto → no mobile o usuário fica sem TOC.
- Faltam exemplos para: `alert-dialog`, `aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`, `collapsible`, `command`, `context-menu`, `data-pagination`, `drawer`, `dropdown-menu`, `empty-state`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `password-strength`, `phone-input`, `popover`, `pull-to-refresh`, `radio-group` (parcial), `resizable`, `scroll-area`, `sheet`, `sidebar`, `skeleton-shimmer`, `sonner`, `toggle`, `toggle-group`, `visually-hidden`, e wrappers `BrandLogo`, `FilterBar`, `PDVFilter`, `ProductDisplay`, `SearchFilter`, `SelectFilter`.
- Algumas seções estouram em telas pequenas: ramps de cor (12 swatches lado a lado), grid de 7 cols em Shape, grid 6 cols em Elevation, tabela de tipografia.
- Top bar com título + 2 badges + botão de tema pode quebrar em <360px.

## Mudanças

### A. Layout responsivo

- **Top app bar**: empilha em <640px; oculta o badge "Material 3" em xs; botão de voltar vira ícone-only em xs (com `aria-label`).
- **Navegação**:
  - Desktop (≥`lg`): sidebar fixa (atual).
  - Mobile/Tablet (<`lg`): botão "menu" no top bar abre `Sheet` lateral com a mesma navegação. Fechar ao clicar item.
  - Adicionar `<select>` mobile rápido como atalho secundário (opcional — simples) **ou** apenas o Sheet (decidi: só Sheet, mais limpo).
- **Conteúdo principal**: `px-3 sm:px-4 md:px-8 py-6 md:py-8`, `max-w-6xl` mantido.
- Todas as grids passam a ser mobile-first:
  - System color chips: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
  - Tonal palettes: scroll horizontal em mobile (`overflow-x-auto` com `min-w` por chip) — não compactar para não perder leitura de tons.
  - Shape: `grid-cols-3 sm:grid-cols-4 md:grid-cols-7`.
  - Elevation: `grid-cols-2 sm:grid-cols-3 md:grid-cols-6`.
  - Motion durations: `grid-cols-2 sm:grid-cols-4`.
  - Tabela tipografia: cada linha vira coluna em <640px (label embaixo do exemplo) e a label fica `truncate`.
- Cards de exemplo (`DSExample`): `p-4 md:p-6`, code/links com `break-all`.
- Top app bar `sticky` mantida; conteúdo com `scroll-mt-24` para compensar header maior em mobile.
- Auditar nenhum elemento >100% width: usar `min-w-0` em flex children, `overflow-x-auto` quando necessário (table, code blocks).

### B. Cobertura completa de componentes

Adicionar / completar seções (uma por grupo, exemplos compactos):

**Foundations** (já existente — só ajustar responsividade): Color, Typography, Shape, Elevation, Spacing, Motion.

**Actions**:
- Buttons (existente — manter).
- Toggle / ToggleGroup (novo).
- DropdownMenu, ContextMenu (novo).

**Inputs & Forms**:
- Input, Textarea, Select, Label (existente — manter).
- Form (react-hook-form wrapper) — exemplo mínimo com 1 campo + erro.
- InputOTP (novo).
- PhoneInput, PasswordStrength (novo, wrappers do projeto).
- Calendar + Popover (date picker pattern, novo).

**Selection**:
- Checkbox, Radio, Switch, Slider (existente).

**Containers**:
- Card (existente).
- Tabs, Accordion (existente).
- Collapsible (novo).
- AspectRatio (novo).
- ScrollArea (novo).
- Resizable (novo, exemplo simples 2 painéis).
- Separator (novo).

**Navigation**:
- Breadcrumb (novo).
- Pagination + DataPagination (novo).
- NavigationMenu (novo).
- Menubar (novo).
- Sidebar — mostrar mini-preview do componente real em `<aside>` embutido.

**Feedback**:
- Alert, Progress, Skeleton (existente).
- SkeletonShimmer (novo).
- Sonner (botão que dispara toast — novo).
- EmptyState (novo).
- PullToRefresh — apenas referência/anatomia (não simular gesto).

**Overlays**:
- Dialog, Tooltip (existente).
- AlertDialog (novo).
- Sheet (novo — top/right/bottom/left triggers).
- Drawer (novo — vaul mobile sheet).
- Popover (novo).
- HoverCard (novo).
- Command (novo — palette inline).

**Data Display**:
- Avatar, Table (existente).
- Badge (mover para cá ou manter em Navigation — manter em Navigation).
- Carousel (novo, 3 slides).
- Chart (Recharts wrapper — bar chart mínimo com 5 pontos).
- ProductDisplay, BrandLogo (wrappers — novo).
- FilterBar, PDVFilter, SearchFilter, SelectFilter (wrappers — novo, em Patterns).

**Utilities** (nova seção pequena):
- VisuallyHidden (novo, exemplo de acessibilidade).
- ErrorBoundary (referência textual + uso recomendado).

**Patterns** (existente — manter KPI cards e Form; adicionar):
- FilterBar mobile-first (collapsible em mobile).
- PageHeader (breadcrumb + título + actions).
- DataTable + Pagination.
- EmptyState.

### C. Atualizações estruturais

- Manter `src/pages/DesignSystem.tsx` em arquivo único, mas extrair sub-seções em pequenas funções no mesmo arquivo (DRY, sem explodir em N componentes — mantém 1 arquivo navegável).
- Atualizar `NAV_SECTIONS` para refletir novos grupos: Foundations, Actions, Inputs, Selection, Containers, Navigation, Feedback, Overlays, Data, Utilities, Patterns.
- Documentar no rodapé: link para `docs/design-system/audit.md` e contagem "61/61 componentes documentados".

### D. Acessibilidade mobile

- Toda área clicável ≥44×44px (botões `size="default"`/`size="icon"` já entregam isso; itens de menu mobile com `py-3`).
- Foco visível em todos os elementos (já vem do Tailwind `focus-visible:ring`).
- Labels associadas (`htmlFor`/`id`) — já feito; replicar nos novos exemplos.

## Não inclui

- Restilizar primitivos para "ficar M3" (fica para fase de migração; este passo é só documentação completa).
- Criar rota guardada por role (segue `ProtectedRoute` simples — pode ser hardened depois).
- Editar `src/components/ui/*` (nenhuma alteração de comportamento).

## Critério de aceite

- Em viewport 360×800 não há scroll horizontal em nenhuma seção (exceto ramps de cor, que rolam só dentro do próprio container).
- Menu de navegação acessível em mobile via Sheet.
- Cada um dos 61 arquivos em `src/components/ui/` aparece em ao menos um exemplo OU nota explícita na seção Utilities/Patterns (ex.: `ErrorBoundary`, `PullToRefresh`).
- Build sem erros TypeScript.
