# Design System

Sistema baseado em **Material 3** (https://m3.material.io) sobre a stack atual
(React + Tailwind + Radix + shadcn).

## Estrutura

- `src/design-system/tokens/` — tokens TS (color, typography, shape, elevation, motion, spacing).
- `src/design-system/theme/m3-theme.css` — CSS vars `--md-sys-*` + utilitários `.md-*`.
- `src/pages/DesignSystem.tsx` — página `/ds` (living styleguide).
- `src/components/ui/` — primitivos shadcn restilizados gradualmente.

## Decisão arquitetural

Adotamos **M3 como sistema de tokens e diretrizes**, mantendo shadcn/Radix como
camada de implementação. Não usamos `@material/web` (Web Components) por
incompatibilidade com nosso stack React + react-hook-form. Ver
`docs/adr/0002-design-system-material-3.md`.

## Como contribuir

1. Sempre referenciar tokens (`hsl(var(--md-sys-color-primary))` ou semânticos
   atuais) — nunca hardcode de cores.
2. Antes de criar um componente novo, conferir se já existe em `src/components/ui/`.
3. Toda mudança em primitivo deve refletir em `/ds` (a página importa o componente real).
4. Documentar variantes novas em `audit.md` e atualizar a página `/ds`.

## Tokens M3 disponíveis

### Color (CSS vars)
`--md-sys-color-{primary,secondary,tertiary,error}`,
`--md-sys-color-{primary,secondary,tertiary,error}-container`,
`--md-sys-color-on-{primary,secondary,tertiary,error,background,surface,surface-variant}`,
`--md-sys-color-{background,surface,surface-variant}`,
`--md-sys-color-surface-container-{lowest,low,base,high,highest}`,
`--md-sys-color-{outline,outline-variant,inverse-surface,inverse-on-surface,inverse-primary}`.

### Type scale (utility classes)
`.md-display-{large,medium,small}`, `.md-headline-*`, `.md-title-*`, `.md-body-*`, `.md-label-*`.

### Elevation
`.md-elev-{0..5}` ou `var(--md-sys-elevation-{0..5})`.

### Shape / Motion / Spacing
Ver `src/design-system/tokens/index.ts`.