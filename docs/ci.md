# CI e Branch Protection

Atualizado em: **2026-04-30**

## Regra de proteção da `main`

No GitHub, em **Settings > Branches > Branch protection rule** da branch `main`,
manter como obrigatórios os checks que representam qualidade mínima antes do merge:

- `Lint`
- `Lint changed files`
- `Unit tests`
- `Build`

## Política atual

- `Lint` roda `npm run lint` no repositório inteiro.
- `Lint changed files` roda `npm run lint:changed` para adoção incremental.
- `Unit tests` roda `npm run test` com Vitest.
- `Build` roda `npm run build` para validar o bundle de produção.

## Package manager

- npm e `package-lock.json` são a fonte oficial de dependências.
- Lockfiles de Bun, Yarn ou pnpm não devem ser versionados neste repositório.
- PRs que alterem dependências devem atualizar `package.json` e `package-lock.json` juntos.

## Observabilidade de falhas

- Falhas de lint devem ser corrigidas no PR antes do merge.
- Falhas de teste ou build devem ser tratadas como bloqueantes.
- Quando uma falha vier de log sensível ou legado, abrir correção dedicada e registrar a decisão em `docs/operations/log-review-report.md`.

## PRs antigas

Antes de editar `.github/workflows/ci.yml`, `scripts/lint-changed.sh` ou scripts
de package manager, verificar PRs abertas que já mexem nesse fluxo para evitar
rebase manual desnecessário.
