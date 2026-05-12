## Objetivo

Refatorar os cards de "Comparativo por PDV" na página `/financeiro` para alinhá-los ao Design System (tokens M3, escala tipográfica, semantic colors) e corrigir o problema visual atual em mobile, onde os valores ficam cortados/invisíveis (como mostra o screenshot anexo).

## Diagnóstico do problema atual

Em `src/components/financeiro/PDVComparisonCards.tsx`:

- Layout interno em `flex justify-between` por linha sem `min-w-0` no container — em telas estreitas (~390px) os valores ficam empurrados para fora da área visível do card.
- Tipografia hard-coded (`text-sm`, `font-medium`) em vez das classes `md-*` do DS.
- Cores escritas direto (`text-emerald-600`, `text-amber-600`) em vez de tokens semânticos (`text-success`, `text-warning`, `text-destructive`).
- Header da seção usa `text-sm font-semibold text-muted-foreground` — DS define `md-title-small` para esse papel.
- Sem indicador visual de "PDV ativo/inativo" e sem hierarquia clara entre receita (KPI principal) e demais métricas.

## Mudanças propostas

### 1. `src/components/financeiro/PDVComparisonCards.tsx` — reescrita

- **Header da seção**: usar `md-title-small uppercase tracking-wider text-muted-foreground` (mesmo padrão de `DSExample` em `/ds`).
- **Card**:
  - `Card` shadcn (mantido) com `CardContent` em `p-4`.
  - Topo: nome do PDV em `md-title-medium truncate` + ícone `Building2` à esquerda em `text-muted-foreground`.
  - **KPI primário** (Receita) em destaque: `md-headline-small tabular-nums` ocupando linha própria, com label `md-label-small text-muted-foreground` acima.
  - **3 sub-métricas** (Resultado, Margem, Transações) em grid `grid-cols-3 gap-2` na parte inferior, cada uma com label `md-label-small` + valor `md-title-small tabular-nums`. Isso elimina o `flex justify-between` que causa o overflow e garante encaixe em qualquer largura ≥ 320px.
  - Cores aplicadas via tokens semânticos novos (ver item 3): `text-success`, `text-warning`, `text-destructive` para resultado/margem; valor neutro fica em `text-foreground`.
  - Borda lateral colorida (4px à esquerda) refletindo a saúde da margem (success / warning / destructive) — padrão M3 de "supporting indicator".
- **Grid externo**: manter `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`, adicionar `min-w-0` no `Card` para evitar overflow do `truncate`.
- **Skeleton**: alinhar à nova estrutura (1 linha grande + 3 sub-blocos).

### 2. Garantir consistência cromática com `MonthlyBreakdownTable` e `ResumoKPICards`

As funções `getMarginColor` e `getResultColor` ficam centralizadas em um helper local do módulo `src/components/financeiro/` (novo arquivo `colorUtils.ts`) consumido pelos três componentes. Hoje a lógica está duplicada em pelo menos `MonthlyBreakdownTable.tsx` e `PDVComparisonCards.tsx`.

### 3. Tokens semânticos em `src/index.css` e `tailwind.config.ts`

Adicionar (se ainda não existirem) tokens `--success` e `--warning` em HSL no `:root` e `.dark`, e expor as classes utilitárias `text-success`, `bg-success`, `text-warning`, `bg-warning` no Tailwind config — substituindo os literais `emerald-*` / `amber-*` espalhados pelo módulo financeiro.

Verificação prévia: ler `src/index.css` para confirmar quais tokens já existem antes de criar duplicatas.

### 4. Página `/ds` — adicionar exemplo

Em `src/pages/DesignSystem.tsx`, dentro da seção de "Cards / Patterns" (ou criar nova `DSSection id="financial-cards"`), incluir um preview do novo `PDVComparisonCards` com 2 entradas mockadas (uma com margem positiva, uma negativa) — para o card virar referência viva no styleguide.

## Fora de escopo

- Não alterar `MonthlyBreakdownTable`, `ResumoKPICards` ou `DRETable` além da troca pontual das cores hard-coded pelos tokens novos (passo 3).
- Não alterar dados, hooks (`usePDVComparison`) ou layout geral da página `Financeiro.tsx`.
- Sem mudanças de backend / RLS.

## Critérios de aceite

1. Em viewport 390px todas as labels e valores dos cards ficam totalmente visíveis sem corte horizontal.
2. Tipografia usa exclusivamente classes `md-*` do DS; nenhuma cor literal (`emerald-*`, `amber-*`) permanece em `PDVComparisonCards.tsx`.
3. `/ds` exibe o novo card como referência.
4. Light e dark mode passam com contraste WCAG AA.