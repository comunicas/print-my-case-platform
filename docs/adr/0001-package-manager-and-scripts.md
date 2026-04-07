# ADR 0001 — Package manager oficial e padrão de scripts

- **Data**: 2026-04-07
- **Status**: Aceito

## Contexto
O repositório possuía lockfiles de múltiplos gerenciadores (`package-lock.json` e `bun.lockb`), gerando risco de drift de dependências e inconsistência entre ambientes de desenvolvimento/CI/deploy.

## Decisão
1. Definir **npm** como package manager oficial do projeto.
2. Manter apenas `package-lock.json` como lockfile versionado.
3. Padronizar execução de scripts via `npm run <script>`.

## Consequências
- **Positivas**:
  - Dependências reproduzíveis via `npm ci`.
  - Menor ambiguidade operacional na equipe.
  - Documentação e troubleshooting simplificados.
- **Negativas**:
  - Quem usa Bun localmente deve operar em modo compatível, sem lockfile paralelo.

## Padrão de scripts
- Desenvolvimento: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`

## Alternativas consideradas
- **Bun como oficial**: não adotado neste momento para reduzir risco de incompatibilidade e preservar fluxo já baseado em `npm ci`.
