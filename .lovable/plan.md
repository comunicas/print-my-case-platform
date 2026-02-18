
# Verificação de 100% da Plataforma — Impacto de Exclusão de PDVs

## Situação Atual

A correção anterior resolveu os fluxos de Settings > PDVs e Settings > Equipe. Porém, a varredura completa da plataforma revelou 3 pontos adicionais que precisam de atenção:

## Pontos Identificados

### Ponto 1 — `Uploads.tsx`: `usePDVs()` sem `organizationId`

```typescript
// src/pages/Uploads.tsx, linha 64
const { pdvs, isLoading: pdvsLoading } = usePDVs();
```

Para super_admin, este hook sem filtro retorna PDVs de **todas as organizações**. O filtro de PDV na página de Uploads exibe essas opções misturadas, podendo mostrar PDVs de outras organizações.

**Fix:** Passar `{ organizationId: profile?.organization_id ?? undefined }` — o mesmo padrão já aplicado em `PDVsSettings.tsx`.

### Ponto 2 — `Settings.tsx`: bloco "PDVs Ativos" sem `organizationId`

```typescript
// src/pages/Settings.tsx, linha 36
const { pdvs, isLoading: pdvsLoading } = usePDVs();
```

A aba Organização exibe um bloco "PDVs Ativos" com até 5 PDVs. Para super_admin, pode mostrar PDVs de orgs diferentes misturadas.

**Fix:** Passar `{ organizationId: profile?.organization_id ?? undefined }` no `usePDVs()` do `Settings.tsx`.

### Ponto 3 — `default_pdv` em Preferências não é limpo após exclusão

Quando um PDV é excluído, o campo `default_pdv` na tabela `preferences` do usuário permanece com o ID morto. O hook `useDefaultPdvPreference` já tem uma guarda que verifica se o PDV existe antes de aplicá-lo (`pdvExists`), então não há bug visual — mas o banco fica com um dado inválido.

**Fix:** No `onSuccess` do `deletePDV` em `usePDVs.ts`, verificar se algum usuário tem esse PDV como padrão e limpar o campo. Isso pode ser feito via `queryClient` + chamada ao Supabase para `UPDATE preferences SET default_pdv = null WHERE default_pdv = deletedId`.

Como alternativa mais simples e eficiente: adicionar um banco de dados trigger (migration SQL) que limpa `preferences.default_pdv` automaticamente quando um PDV é deletado — assim a limpeza acontece em cascata sem depender do frontend.

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/pages/Uploads.tsx` | Adicionar `{ organizationId: profile?.organization_id ?? undefined }` no `usePDVs()` e importar `useProfile` |
| `src/pages/Settings.tsx` | Adicionar `{ organizationId: profile?.organization_id ?? undefined }` no `usePDVs()` |
| `supabase/migrations/` | Trigger SQL: após DELETE em `pdvs`, limpar `preferences.default_pdv` onde `default_pdv = OLD.id` |

## O que NÃO precisa de mudança

- `src/pages/Index.tsx` — já usa `usePDVs({ organizationId: isSuperAdmin ? selectedOrgId : undefined })` corretamente
- `src/hooks/useDashboard.ts` — já filtra por `organization_id` corretamente
- `src/hooks/useSlotsData.ts` — usa RLS do banco, não lista PDVs
- `src/hooks/useUserAllowedPDVs.ts` — correto
- `src/components/settings/PDVsSettings.tsx` — já corrigido

## Resultado Esperado

Após os fixes:
- A lista de PDVs em **qualquer tela** da plataforma mostrará apenas os PDVs da organização do usuário logado, sem misturar PDVs de outras organizações
- Ao excluir um PDV, o campo `default_pdv` de todas as `preferences` que referenciam esse PDV será automaticamente limpo pelo trigger do banco
- O comportamento é consistente para todos os roles (org_admin, super_admin, operator)
