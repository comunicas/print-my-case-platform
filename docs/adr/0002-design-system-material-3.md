# ADR 0002 — Design System baseado em Material 3

- Status: Aceito
- Data: 2026-05-12

## Contexto

O frontend cresceu com ~60 componentes shadcn/Radix customizados, sem escala
tipográfica formal nem sistema de elevation/motion. Surge a necessidade de
padronizar o frontend e reduzir débito visual.

Avaliamos três caminhos:

1. **Trocar tudo por `@material/web`** (Web Components M3 oficiais).
2. **Adotar Material UI (MUI) React**.
3. **Adotar M3 como sistema de tokens e diretrizes, mantendo shadcn/Radix.**

## Decisão

Escolhemos a **opção 3**.

## Razões

- Web Components (`@material/web`) integram mal com React controlado e
  `react-hook-form` (refs, eventos custom, SSR, theming duplicado).
- MUI exige reescrita ampla de telas, formulários e tabelas, com baixo retorno.
- shadcn/Radix já cobre 100% das primitivas necessárias e é totalmente
  customizável via Tailwind + cva — basta restilizar para refletir M3.
- Tokens M3 (`--md-sys-*`) coexistem com tokens semânticos atuais sem
  quebrar telas.

## Consequências

- Criada página `/ds` como living styleguide (fonte de verdade).
- Tokens M3 expostos em `src/design-system/`.
- Restilização dos primitivos em `src/components/ui/` é incremental.
- Telas de produção não mudam até que cada primitivo seja restilizado.
- Não introduzimos novas dependências runtime.