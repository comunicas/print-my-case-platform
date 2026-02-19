
# Corrigir Grid da Visão Consolidada no Breakpoint Tablet

## Problema Identificado

O grid atual `grid-cols-2 sm:grid-cols-3 md:grid-cols-5` ativa 5 colunas a partir de 768px (breakpoint `md` do Tailwind). Com a sidebar colapsada ocupando ~56px, o conteúdo disponível em 834px é ~762px — resultando em ~140px por card. Isso causa dois problemas visuais:

- "338" e "Transações Global" colam visualmente em "R$ 23.556,30" (overflow/colapso)
- O label "Ticket Médio Global" quebra em 2 linhas

O breakpoint `md` do app é na verdade o início do range "tablet" (768-1024px), onde a sidebar já está colapsada. O 5-colunas só comporta bem a partir de `lg` (≥1024px), alinhado com o `TABLET_BREAKPOINT = 1024` definido em `use-mobile.tsx`.

## Estado Atual vs. Desejado

```text
ATUAL:
grid-cols-2  sm:grid-cols-3  md:grid-cols-5
  <640px       640-767px      768px+          ← 5 colunas muito cedo

DESEJADO:
grid-cols-2  sm:grid-cols-3  md:grid-cols-3  lg:grid-cols-5
  <640px       640-767px      768-1023px      1024px+       ← alinhado com o layout do app
```

## Mudança

### `src/pages/Index.tsx` — linha 252

Uma única mudança de classe CSS no `div` do grid interno da Visão Consolidada:

```tsx
// Atual
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

// Corrigido
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
```

Isso remove o `md:grid-cols-5` e substitui por `lg:grid-cols-5`, fazendo o salto para 5 colunas só acontecer em ≥1024px (onde há espaço suficiente mesmo com a sidebar expandida).

## Layout Resultante por Breakpoint

```text
MOBILE (<640px) — 2 colunas, 3 linhas:
[ Organizações      ] [ PDVs Total          ]
[ Receita Global    ] [ Transações Global   ]
[ Ticket Médio Global ]

TABLET (640-1023px) — 3 colunas, 2 linhas:
[ Organizações   ] [ PDVs Total      ] [ Receita Global    ]
[ Transações Global ] [ Ticket Médio Global ]

DESKTOP (≥1024px) — 5 colunas, 1 linha:
[ Organizações ] [ PDVs Total ] [ Receita Global ] [ Transações Global ] [ Ticket Médio Global ]
```

Este layout é idêntico ao que o plano original pretendia — a linha `sm:grid-cols-3` já cobre 640-1023px adequadamente para os 5 cards.

## Alinhamento com o Sistema de Breakpoints do App

O hook `use-mobile.tsx` define:
- `mobile` = < 768px
- `tablet` = 768–1023px  
- `desktop` = ≥ 1024px

O `lg` do Tailwind (≥1024px) mapeia exatamente para "desktop" — a sidebar fica expandida ou colapsada por escolha do usuário, mas há espaço suficiente para 5 colunas.

## Arquivo a Modificar

| Arquivo | Linha | Mudança |
|---|---|---|
| `src/pages/Index.tsx` | 252 | `md:grid-cols-5` → `lg:grid-cols-5` (remover `md:`, adicionar `lg:`) |

Mudança cirúrgica de 1 linha, zero impacto em outros componentes, sem alteração de lógica.
