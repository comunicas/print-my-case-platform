# Plano: Design System /ds baseado em Material 3

## Minha opinião antes do plano

Resposta curta: **parcialmente sim, com ressalvas**.

Vantagens de adotar Material 3:
- Linguagem visual madura, acessível (WCAG), tokens bem definidos (cor, tipografia, elevação, shape, motion).
- Documentação e referência sólidas para a equipe.

Riscos / pontos de atenção:
1. **Não recomendo trocar shadcn/Radix por `@material/web` (Web Components).** O projeto é React + Tailwind + Radix com ~60 componentes shadcn já customizados, formulários com `react-hook-form`, `cva`, e um design system próprio em HSL. Misturar Web Components do MWC com React gera fricção (refs, eventos custom, SSR, theming duplicado, formulários quebrados).
2. **Caminho recomendado:** adotar **Material 3 como sistema de tokens e diretrizes** (cor, tipografia, shape, elevation, state layers, motion) e **manter shadcn/Radix como camada de componentes**, reestilizados para refletir M3. Isso entrega 90% do valor visual sem reescrever a aplicação.
3. Antes de qualquer migração, **a página /ds (living styleguide) é o passo certo** — ela vira a fonte de verdade e permite trocar a implementação por baixo sem quebrar telas.

Se mesmo assim quiser ir 100% Material Web Components, posso planejar — só sinalizo que será reescrita ampla de formulários e telas.

---

## Fase 1 — Auditoria do frontend atual

Gerar `docs/design-system/audit.md` cobrindo:

- **Tokens atuais** (`src/index.css`, `tailwind.config.ts`): paleta HSL (primary roxo #9333EA, chart-1..10, sidebar, success/warning), radius, animations, keyframes.
- **Inventário de componentes UI** (`src/components/ui/` — ~60 arquivos shadcn + wrappers próprios: `BrandLogo`, `FilterBar`, `PDVFilter`, `ProductDisplay`, `SearchFilter`, `SelectFilter`, `phone-input`, `password-strength`, `pull-to-refresh`, `empty-state`, `data-pagination`, `skeleton-shimmer`).
- **Componentes de domínio** por área: `dashboard/`, `stock/`, `financeiro/`, `marketing/`, `settings/`, `team/`, `pdv/`, `upload/`, `ai-agent/`, `public/`, `layout/`.
- **Padrões repetidos**: KPICard, ChartCard, FilterBar, EmptyState, Skeleton — candidatos a virar componentes de DS.
- **Tipografia** (sem escala definida hoje — usa defaults Tailwind).
- **Mapa de uso**: contagem de imports por componente para priorizar migração.

Entregáveis: tabela "componente atual → equivalente M3 → ação (manter / restilizar / criar / depreciar)".

## Fase 2 — Mapeamento de tokens M3

Criar `src/design-system/tokens/` com:

- `color.ts` — paleta M3 derivada do seed roxo `#9333EA` (primary, secondary, tertiary, error, neutral, neutral-variant + tons 0..100), surface levels, state layers. Geradas via `@material/material-color-utilities` (apenas em build/script, não runtime).
- `typography.ts` — escala M3 (display, headline, title, body, label × L/M/S) mapeada para classes Tailwind.
- `shape.ts` — corner radius (none, xs, sm, md, lg, xl, full).
- `elevation.ts` — 6 níveis com box-shadow + tint de surface.
- `motion.ts` — durations (short1..long4) e easings (standard, emphasized).
- `spacing.ts` — escala 4dp.

Refletir tudo em `src/index.css` (CSS vars `--md-sys-color-*`, `--md-sys-typescale-*`) e `tailwind.config.ts` (extensões consumindo as vars). Manter compatibilidade com tokens semânticos atuais (`--primary`, `--background`, etc.) via aliases para não quebrar telas existentes.

## Fase 3 — Página /ds (living styleguide)

Nova rota `/ds` (protegida por `ProtectedRoute`, visível só a `super_admin`) com layout próprio (sem AppLayout), navegação lateral por seções:

1. **Foundations**: Color (paleta M3 + tons + state layers), Typography (todos os estilos com exemplo), Shape, Elevation, Spacing, Motion (demos animadas), Iconography (lucide-react já usado).
2. **Components** — uma sub-rota por componente, cada uma mostra: anatomia, variantes, estados (hover/focus/disabled/error), exemplos de código, props table, do/don't:
   - Buttons (filled, tonal, outlined, text, elevated, FAB, icon)
   - Inputs (filled/outlined text field, textarea, select, checkbox, radio, switch, slider, date picker, OTP, phone)
   - Containers (card elevated/filled/outlined, dialog, sheet, drawer, popover, tooltip, accordion, tabs)
   - Navigation (top app bar, navigation rail, navigation drawer, breadcrumb, pagination, sidebar)
   - Communication (badge, snackbar/sonner, alert, progress linear/circular, skeleton, empty state)
   - Data display (table, data-pagination, chart wrappers, KPI card, chart card)
   - Domain wrappers reutilizáveis (BrandLogo, FilterBar, PDVFilter, etc.)
3. **Patterns**: formulários, filtros, layouts de dashboard, mobile-first (min 44px touch), dark mode toggle, loading & empty states, responsividade.
4. **Playground**: sandbox para testar combinação de tokens em tempo real.

Cada componente do styleguide importa o componente real do projeto — assim /ds é "espelho vivo": refatorou o componente, /ds atualiza.

## Fase 4 — Restilização gradual (não bloqueia /ds)

Após /ds publicada:
- Restilizar `button.tsx`, `card.tsx`, `input.tsx`, `dialog.tsx` etc. para refletir M3 (shape, elevation, state layers, typescale) mantendo a mesma API.
- Adicionar variantes M3 ausentes (ex.: `variant="tonal"` em Button).
- Migrar telas pontualmente conforme aparecem regressões visuais detectadas no /ds.

## Fase 5 — Documentação

- `docs/design-system/README.md` — princípios, como contribuir, mapping M3.
- `docs/design-system/migration-guide.md` — passo a passo para devs trocarem componentes legados.
- ADR `docs/adr/0002-design-system-material-3.md` registrando a decisão.

---

## Detalhes técnicos

```text
src/
  design-system/
    tokens/        color.ts, typography.ts, shape.ts, elevation.ts, motion.ts, spacing.ts
    theme/         m3-theme.css (gera CSS vars), theme-provider.tsx
  pages/
    DesignSystem.tsx                 (layout /ds)
  components/design-system/
    DSLayout.tsx, DSNav.tsx, DSSection.tsx, DSPropsTable.tsx,
    DSColorSwatch.tsx, DSTypeSpecimen.tsx, DSElevationDemo.tsx,
    DSMotionDemo.tsx, DSCodeBlock.tsx, DSPlayground.tsx
docs/design-system/
  audit.md, README.md, migration-guide.md, component-matrix.md
docs/adr/
  0002-design-system-material-3.md
```

Dependências novas (mínimas):
- `@material/material-color-utilities` (apenas dev/script para gerar paleta a partir do seed).
- Nenhuma dependência runtime de `@material/web` nesta fase.

Rota `/ds` adicionada em `src/App.tsx` dentro de `ProtectedRoute` com guarda `super_admin`.

## Critérios de aceite

- `/ds` lista 100% dos componentes em `src/components/ui/` + wrappers de domínio reutilizáveis.
- Todos os tokens M3 disponíveis como CSS vars + classes Tailwind.
- Tokens semânticos atuais continuam funcionando (zero regressão).
- `audit.md` mapeia cada componente legado a uma ação (manter/restilizar/depreciar).
- Dark mode funciona em todas as seções de /ds.

## O que NÃO está no escopo desta fase

- Trocar componentes nas telas de produção (fica para Fase 4, gradual).
- Adotar `@material/web` Web Components.
- Mudar bibliotecas de form, chart ou date picker.

---

**Pergunta antes de implementar:** confirma que o caminho recomendado (M3 como tokens + shadcn restilizado) está OK, ou prefere mesmo a troca radical por `@material/web`?
