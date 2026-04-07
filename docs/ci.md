# CI e Branch Protection

## Regra de proteção da `main`

No GitHub, em **Settings → Branches → Branch protection rule** da branch `main`, manter como obrigatórios apenas os checks de gate:

- `check:lockfiles`
- `npm ci + build`

## Status do `lint-legacy`

O check `lint-legacy` deve permanecer **temporariamente informativo (non-blocking)** e, portanto, **não deve** constar na lista de **required status checks** da `main`.

> Atualizado em 2026-04-07 para refletir a política atual de gates mínimos obrigatórios.
