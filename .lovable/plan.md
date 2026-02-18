
# Diagnóstico Definitivo: Dois Bugs Distintos com Causa Raiz Clara

## O Que os Dados Revelam

O usuário `rafa bruno` é **super_admin** — isso muda completamente a análise.

### Bug 1 — PDVs: Query sem filtro de status retorna PDVs de outras organizações

Sendo super_admin, a query `SELECT * FROM pdvs ORDER BY name` retorna **todos os PDVs de todas as organizações** via RLS. Isso inclui "PRINTMYCASE GERAL" (org PryntMyCase), que aparece na lista de Settings > PDVs do usuário. Quando ele exclui um PDV da sua própria org, o PRINTMYCASE GERAL continua aparecendo porque:
1. O optimistic update remove corretamente o item da cache local
2. O `refetchQueries` traz de volta a lista completa do banco — incluindo PDVs de outras orgs
3. O PDV excluído não reaparece, mas a lista mostra PDVs "estranhos" de outras orgs

**A lista de PDVs em Configurações deveria mostrar apenas os PDVs da organização selecionada/ativa, não todos os PDVs de todas as organizações.**

### Bug 2 — Team: Query sem filtro de status retorna membros inativos

Para super_admin, a query em `useTeamMembers` não filtra por status. Após "Desvincular" `flavio` e `Danilo`, eles ficam com `organization_id = null` e `status = inactive`. O `refetchQueries` sobrescreve o optimistic update com a resposta do banco, que ainda inclui esses usuários porque a query retorna TODOS os profiles sem filtrar por `status = active` ou `organization_id IS NOT NULL`.

**A query deveria filtrar usuários inativos ou sem organização da lista de membros da equipe.**

## Solução Cirúrgica

### Fix 1 — `usePDVs.ts`: Não chamar `refetchQueries` após o optimistic update

O padrão correto do React Query é: `onMutate` faz optimistic update → `onSuccess` invalida a query → React Query refaz o fetch em background quando o componente está em foco. Chamar `refetchQueries` imediatamente após `invalidateQueries` anula o optimistic update ao sobrescrever a cache antes que o usuário perceba o efeito visual.

**Remover o `refetchQueries` do `onSuccess` de `deletePDV`** — deixar o `invalidateQueries` trabalhar sozinho. Com `staleTime: 30s`, o refetch acontecerá na próxima vez que o componente ganhar foco.

### Fix 2 — `useTeamMembers.ts`: Filtrar membros inativos na query para non-super-admin e adicionar filtro para super_admin

Para **org_admin**: a query já filtra por `organization_id`, então membros desvinculados (com `organization_id = null`) não aparecem — correto.

Para **super_admin**: a query retorna todos os profiles sem filtro. Após desvincular, o membro fica com `status = inactive`. A query deve adicionar `.neq("status", "inactive")` para não mostrar membros inativos (ou ser filtrada para mostrar apenas membros com `organization_id IS NOT NULL`).

**Remover também o `refetchQueries` do `onSuccess` de `removeMember`** pelo mesmo motivo do Fix 1.

### Fix 3 — `PDVsSettings.tsx`: Para super_admin, filtrar para mostrar apenas PDVs da organização ativa

O componente `PDVsSettings` chama `usePDVs()` sem nenhum filtro. Para super_admin, isso traz PDVs de todas as organizações. A solução é passar o `organization_id` do profile como filtro — garantindo que a tela de Settings mostre apenas os PDVs da organização que o usuário está gerenciando.

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/hooks/usePDVs.ts` | Remover `refetchQueries` do `onSuccess` de `deletePDV`; o optimistic update + `invalidateQueries` é suficiente |
| `src/hooks/useTeamMembers.ts` | Adicionar filtro `.neq("status", "inactive")` na query de profiles (para super_admin também); remover `refetchQueries` do `onSuccess` de `removeMember` |
| `src/components/settings/PDVsSettings.tsx` | Passar `{ organizationId: profile?.organization_id }` para `usePDVs()` para limitar a lista ao contexto correto |

## Resultado Esperado

- Ao excluir um PDV, o card some **imediatamente** (optimistic update) e não reaparece
- A lista de PDVs em Configurações mostra apenas os PDVs da organização do usuário logado (sem PDVs de outras organizações)
- Ao desvincular um membro, o card some **imediatamente** e não reaparece após o refetch
- A lista de membros não mostra usuários com `status = inactive`
