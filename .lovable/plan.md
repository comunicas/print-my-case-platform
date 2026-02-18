
# Diagnóstico: PDV e Usuário Ainda Aparecem Após Exclusão

## O Que o Banco Confirma

- O PDV "Shopping Metrô Boulevard Tatuapé" (id: `4cad2572...`) **ainda existe** no banco com 103 vendas e 85 registros de estoque — ou seja, ele não foi excluído. As FKs CASCADE estão corretas e aplicadas.
- Os usuários "flavio" e "Danilo" foram corretamente desvinculados: `organization_id = null`, `status = inactive`. A RLS da query de team já os filtra. Eles não devem aparecer na lista quando a query for refrescada.

## Causas Identificadas

### Causa 1 — Cache stale agressivo em `usePDVs`

```typescript
// src/hooks/usePDVs.ts
staleTime: 5 * 60 * 1000, // 5 minutos!
gcTime: 30 * 60 * 1000,   // 30 minutos!
```

Com `staleTime` de 5 minutos, o React Query **não refaz a requisição ao banco** mesmo após o `invalidateQueries`. O `invalidateQueries` marca a query como stale, mas o refetch só acontece quando o componente é remontado ou a janela ganha foco. Se o usuário está na mesma tela sem sair, pode ver o dado antigo por até 5 minutos.

### Causa 2 — A exclusão do PDV pode estar sendo bloqueada silenciosamente

O usuário logado é `rafabruno` com `email: rafael@comunicas.com.br`. A query de rede mostra que os 3 PDVs **ainda retornam** — incluindo o "Shopping Metrô", confirmando que ele **não foi excluído**. O botão de exclusão usa a condição `isAdmin` que é verdadeira para `org_admin`, mas há uma verificação no hook que pode estar falhando silenciosamente sem exibir erro na UI em certos casos.

### Causa 3 — Query de usuários com `staleTime` padrão não refrescando

O `useTeamMembers` não define `staleTime` explícito (usa o padrão de 0), mas o React Query pode estar servindo cache quando a query key não muda. Após o `invalidateQueries({ queryKey: ["team-members"] })`, se o componente não forçar o refetch imediatamente, o dado antigo permanece.

### Causa 4 — Otimistic update ausente / feedback visual enganoso

O `deletePDV.mutate` chama `onSuccess` → `invalidateQueries` → mas o React Query não remove imediatamente o item da lista. O item some apenas quando o refetch completa. Se o refetch não acontece (por staleTime ou falha silenciosa), o item permanece.

## Solução

### Fix 1 — Reduzir drasticamente o `staleTime` de `usePDVs`

Reduzir de 5 minutos para 30 segundos, e `gcTime` para 5 minutos. Após exclusão/criação/edição, a lista vai refrescar rapidamente.

### Fix 2 — Adicionar Optimistic Update na exclusão de PDV

Ao confirmar a exclusão, remover imediatamente o item da lista local enquanto a requisição está em andamento — e restaurar se falhar. Isso elimina o delay visual.

### Fix 3 — Adicionar Optimistic Update na remoção de membro da equipe

Mesma abordagem: remover imediatamente o membro da lista local, restaurar em caso de erro.

### Fix 4 — Forçar refetch explícito após mutações críticas

Após `invalidateQueries`, chamar `refetchQueries` para garantir que os dados sejam atualizados imediatamente, sem depender do comportamento de stale/background refetch.

### Fix 5 — Melhorar feedback de erro na exclusão de PDV

Adicionar captura de erro mais visível no `deletePDV.mutate` para o caso em que a exclusão realmente falha, tornando o comportamento claro para o usuário.

## Arquivos a Modificar

| Arquivo | Mudança |
|---|---|
| `src/hooks/usePDVs.ts` | Reduzir `staleTime` para 30s, `gcTime` para 5min; adicionar optimistic update no `deletePDV` |
| `src/hooks/useTeamMembers.ts` | Adicionar optimistic update no `removeMember`; forçar `refetchQueries` após mutações |

## Resultado Esperado

- Ao clicar "Excluir" em um PDV, o card desaparece **imediatamente** da lista (optimistic update), e se houver erro real, retorna com mensagem clara
- Ao clicar "Desvincular" em um membro, o card some **imediatamente** da lista
- A lista sempre reflete o estado real do banco sem delay de cache
