# Frontend Audit — base para o Design System (Material 3)

Data: 2026-05-12 · Escopo: 100% do frontend em `src/`.

## 1. Tokens atuais

Definidos em `src/index.css` (HSL) e `tailwind.config.ts`:

| Token | Valor (light) | Valor (dark) | Mapeamento M3 |
|---|---|---|---|
| `--background` | `0 0% 99%` | `270 20% 8%`  | `md.sys.color.background` |
| `--foreground` | `270 10% 15%` | `270 10% 95%` | `md.sys.color.on-background` |
| `--card` | `0 0% 100%` | `270 20% 10%` | `md.sys.color.surface` |
| `--primary` | `271 81% 56%` (#9333EA) | `271 81% 60%` | `md.sys.color.primary` |
| `--secondary` | `270 30% 96%` | `270 20% 18%` | `md.sys.color.secondary-container` |
| `--muted` | `270 20% 96%` | `270 15% 18%` | `md.sys.color.surface-variant` |
| `--accent` | `271 60% 94%` | `271 40% 25%` | `md.sys.color.primary-container` (light) |
| `--destructive` | `0 84% 60%` | `0 62% 50%` | `md.sys.color.error` |
| `--border` / `--input` | `270 20% 90%` | `270 15% 14%` | `md.sys.color.outline-variant` |
| `--ring` | `271 81% 56%` | `271 81% 60%` | `md.sys.color.primary` |
| `--success` | `142 76% 36%` | — | (extensão; sem equivalente direto M3) |
| `--warning` | `38 92% 50%` | — | (extensão) |
| `--chart-1..10` | tons variados | — | tonal palettes (manter) |

Tipografia: **sem escala definida** — usa defaults Tailwind. → introduzir M3 type scale (`md-display-*` ... `md-label-*`).

Animations: `accordion-*`, `badge-fade-*`, `shimmer`, `fade-in-up`, `scale-resize`, `content-swap`, `pulse-subtle`, `slide-in-*`. Mapear para tokens M3 motion (`standard`, `emphasized`, durations `short2/medium2/long2`).

## 2. Inventário de componentes

### `src/components/ui/` — base shadcn + wrappers próprios (~60 arquivos)

| Componente atual | Equivalente M3 | Ação |
|---|---|---|
| `button.tsx` (default/secondary/outline/ghost/link/destructive/hero) | Filled / Tonal / Outlined / Text / Link / Error / Brand | Restilizar (manter API, ajustar shape e state layers) |
| `card.tsx` | Elevated / Filled / Outlined Card | Restilizar — adicionar variantes via cva |
| `input.tsx` | Text field (filled/outlined) | Restilizar |
| `textarea.tsx` | Text field multiline | Restilizar |
| `select.tsx` | Menu | Manter Radix, restilizar |
| `checkbox.tsx`, `radio-group.tsx`, `switch.tsx` | Selection controls | Restilizar |
| `slider.tsx` | Slider | Restilizar |
| `dialog.tsx`, `alert-dialog.tsx`, `sheet.tsx`, `drawer.tsx` | Dialog / Bottom sheet / Side sheet | Restilizar |
| `popover.tsx`, `hover-card.tsx`, `tooltip.tsx` | Tooltip / Rich tooltip | Restilizar |
| `tabs.tsx` | Tabs (primary/secondary) | Restilizar |
| `accordion.tsx` | Expansion panel | Restilizar |
| `badge.tsx` | Badge / Chip | Restilizar — adicionar `assist`/`filter`/`input`/`suggestion` chip variants |
| `progress.tsx` | Linear progress | Restilizar |
| `skeleton.tsx`, `skeleton-shimmer.tsx` | Loading | Manter |
| `alert.tsx` | Banner | Restilizar |
| `avatar.tsx` | Avatar | Manter |
| `breadcrumb.tsx`, `pagination.tsx`, `data-pagination.tsx` | Navigation utilities | Manter |
| `sidebar.tsx`, `navigation-menu.tsx`, `menubar.tsx` | Navigation drawer / rail | Restilizar |
| `sonner.tsx` | Snackbar | Manter |
| `command.tsx` | Search / Command palette | Manter |
| `calendar.tsx` | Date picker | Manter |
| `chart.tsx` | Recharts wrapper | Manter (estilizar via tokens) |
| `carousel.tsx`, `aspect-ratio.tsx`, `resizable.tsx`, `scroll-area.tsx`, `separator.tsx`, `toggle.tsx`, `toggle-group.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `form.tsx`, `label.tsx`, `input-otp.tsx`, `phone-input.tsx`, `password-strength.tsx`, `pull-to-refresh.tsx`, `empty-state.tsx`, `table.tsx` | — | Manter / restilizar gradualmente |
| **Wrappers de domínio** `BrandLogo`, `FilterBar`, `PDVFilter`, `ProductDisplay`, `SearchFilter`, `SelectFilter`, `ErrorBoundary` | — | Manter (composição sobre primitivos) |

### Componentes por domínio (não migrar agora — consomem o DS)

- `dashboard/` (KPICard, ChartCard, SalesByDayChart, …) → padrão **KPI card** + **Chart card** documentados em /ds.
- `stock/`, `financeiro/`, `marketing/`, `settings/`, `team/`, `pdv/`, `upload/`, `ai-agent/`, `public/`, `layout/` → consumir tokens e primitivos via `src/components/ui/*`.

## 3. Padrões repetidos (candidatos a primitivos do DS)

- **KPICard** — ícone + título + valor + trend badge.
- **ChartCard** — título + período + gráfico responsivo.
- **FilterBar** — selects/datepickers colapsáveis em mobile.
- **EmptyState** — ilustração + título + ação.
- **PageHeader** — breadcrumb + título + actions.
- **DataTable** — table + pagination + filters.

## 4. Gaps em relação a M3

1. Falta type scale formal → resolvido via `m3-theme.css` (.md-* utilities).
2. Falta sistema de elevation explícito → `--md-sys-elevation-1..5`.
3. Faltam variantes M3 (Tonal Button, Filled Card, Filter Chip).
4. Faltam state layers (hover/focus/pressed) padronizados.
5. Sem motion tokens → introduzidos via `--md-sys-motion-*`.

## 5. Próximos passos

Ver `migration-guide.md` (a redigir) e ADR `0002-design-system-material-3.md`.