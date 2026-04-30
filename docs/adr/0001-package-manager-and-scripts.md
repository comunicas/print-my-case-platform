# ADR 0001 - Package manager oficial e padrão de scripts

- **Data**: 2026-04-07
- **Status**: Aceito
- **Atualizado em**: 2026-04-30

## Contexto

O repositório possuía lockfiles de múltiplos gerenciadores, gerando risco de
drift de dependências e inconsistência entre ambientes de desenvolvimento, CI e
deploy.

## Decisão

1. Definir **npm** como package manager oficial do projeto.
2. Manter apenas `package-lock.json` como lockfile versionado.
3. Padronizar execução de scripts via `npm run <script>`.
4. Remover lockfiles paralelos, incluindo `bun.lock` e `bun.lockb`, quando encontrados.

## Consequências

Positivas:

- Dependências reproduzíveis via `npm ci`.
- Menor ambiguidade operacional na equipe.
- Documentação e troubleshooting simplificados.

Negativas:

- Quem usa Bun localmente deve operar em modo compatível, sem lockfile paralelo.

## Padrão de scripts

- Desenvolvimento: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`
- Lint: `npm run lint`
- Testes: `npm run test`

## Alternativas consideradas

- **Bun como oficial**: não adotado para reduzir risco de incompatibilidade e preservar fluxo baseado em `npm ci`.
- **Múltiplos lockfiles**: rejeitado por aumentar drift e dificultar CI/deploy.
