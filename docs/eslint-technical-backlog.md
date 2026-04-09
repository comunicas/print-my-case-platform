# Backlog Técnico ESLint

## Épico 1 — Hooks e fluxo de controle
- Corrigir `react-hooks/rules-of-hooks` em `e2e/fixtures/auth.ts`.
- Corrigir `no-case-declarations` em:
  - `src/components/stock/ProductStockTable.tsx`
  - `supabase/functions/process-spreadsheet/index.ts`

## Épico 2 — Tipagem TypeScript
- Substituir `any` por tipos explícitos em:
  - `src/hooks/useDRE.ts`
  - `src/hooks/useMonthlyDRESummary.ts`
  - `src/hooks/usePDVComparison.ts`
  - `src/hooks/useSalesRecords.ts`
  - `supabase/functions/create-user/index.ts`
- Remover interfaces vazias em:
  - `src/components/ui/command.tsx`
  - `src/components/ui/skeleton-shimmer.tsx`
  - `src/components/ui/textarea.tsx`

## Épico 3 — Regex e escapes
- Ajustar padrões para evitar escapes desnecessários em:
  - `src/hooks/useOrgCrossAccess.ts`
  - `supabase/functions/ingest-stock/index.ts`
  - `supabase/functions/process-spreadsheet/index.ts`
  - `src/components/ui/password-strength.tsx`
  - `src/lib/productNormalization.ts`

## Épico 4 — Lint obrigatório no CI
- ✅ `.github/workflows/ci.yml` criado e funcional.
- ✅ Jobs `lint` e `lint-changed` são blocking (sem `continue-on-error`).
- Garantir `npm run lint` sem erros antes de promover como gate obrigatório no branch protection.
