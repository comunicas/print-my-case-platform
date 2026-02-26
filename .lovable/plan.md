

# Fase 11: Limpeza de Type Safety — remover `as any`, `catch (err: any)` e `Record<string, any>`

## Problema

Existem usos desnecessarios de `any` na codebase que enfraquecem a seguranca de tipos do TypeScript:

1. **`ProductCodeModal.tsx` linha 95**: `supabase.from("catalog_leads" as any)` — o cast `as any` e desnecessario porque `catalog_leads` ja existe nos tipos gerados do banco. Provavelmente foi adicionado quando a tabela ainda nao existia nos types.

2. **`ProductCodeModal.tsx` linha 73**: `catch (err: any)` — usa `any` no catch quando o padrao seguro da codebase e `catch (error: unknown)` com `instanceof Error` (ex: `ProfileSettings.tsx` linha 101).

3. **`exportToExcel` em `dashboardUtils.ts` linha 461**: Aceita `Record<string, any>[]` — pode ser tipado como `Record<string, string | number>[]` que reflete o uso real (colunas de texto e numeros para Excel).

4. **`SalesHeatmapChart.tsx` linhas 54-55 e `StockHistoryChart.tsx` linha 45**: Declaram `Record<string, any>` para os dados de export — serao corrigidos automaticamente ao tipar `exportToExcel`.

5. **`useUploads.test.ts` linha 33**: `eslint-disable` no teste que replica o padrao do hook — deve ser atualizado para incluir `pagination.setPage` nas deps (consistente com a correcao feita na Fase 5 no hook real).

## Mudancas

### Arquivo: `src/components/public/ProductCodeModal.tsx`

1. Remover `as any` da linha 95: `supabase.from("catalog_leads")` (sem cast)
2. Trocar `catch (err: any)` por `catch (err: unknown)` e usar `err instanceof Error ? err.message : "Erro ao enviar codigo..."` no toast

### Arquivo: `src/lib/dashboardUtils.ts`

3. Tipar `exportToExcel` como `Record<string, string | number>[]` em vez de `Record<string, any>[]`

### Arquivo: `src/components/dashboard/SalesHeatmapChart.tsx`

4. Atualizar a tipagem local de `exportData` e `row` para `Record<string, string | number>`

### Arquivo: `src/components/dashboard/StockHistoryChart.tsx`

5. Atualizar a tipagem local de `row` para `Record<string, string | number>`

### Arquivo: `src/hooks/__tests__/useUploads.test.ts`

6. Remover o `eslint-disable` e adicionar `pagination.setPage` nas dependencias do `useEffect` (alinhando com a correcao da Fase 5)

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/components/public/ProductCodeModal.tsx` | Remover `as any` e `catch (err: any)` |
| `src/lib/dashboardUtils.ts` | Tipar `exportToExcel` sem `any` |
| `src/components/dashboard/SalesHeatmapChart.tsx` | Atualizar tipo do export data |
| `src/components/dashboard/StockHistoryChart.tsx` | Atualizar tipo do export data |
| `src/hooks/__tests__/useUploads.test.ts` | Remover eslint-disable |

## Beneficios
- Elimina todos os usos de `any` no codigo de producao (exceto o `Record<string, any>` no chart.tsx que faz parte do shadcn/ui)
- Erros de tipo serao capturados em compilacao em vez de runtime
- Consistencia com o padrao `catch (error: unknown)` ja usado em outros arquivos
- Nenhuma mudanca funcional ou visual

