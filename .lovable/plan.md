

# ProfileContext Dedicado + RPC para Data Range

## Parte 1: ProfileContext

### Problema
O hook `useProfile()` e chamado em 24 arquivos. Cada chamada cria subscricoes React Query independentes. Quando o profile ou role muda, todos os 24 consumidores re-renderizam -- mesmo os que so precisam do `role` (que quase nunca muda).

### Solucao
Criar um `ProfileProvider` que centraliza as queries de profile e role em um unico ponto da arvore React, expondo os dados via contexto. Componentes que so precisam de `role` usarao `useRole()`, que retorna valores primitivos (string) e nao causa re-render quando o profile muda.

### Arquitetura

```text
AuthProvider
  └── ProfileProvider  (NOVO - faz as 2 queries aqui)
        └── ActiveOrgProvider (ja consome useProfile, agora via contexto)
              └── ProductModalProvider
                    └── Routes
```

### Novo arquivo: `src/contexts/ProfileContext.tsx`

- Cria um contexto com `profile`, `role`, `isAdmin`, `isLoading`, `error`, `updateProfile`
- Internamente faz as 2 queries (profile + user_roles) usando React Query
- Expoe `useMemo` no value para estabilizar
- Exporta 3 hooks:
  - `useProfileContext()` — retorna tudo (substitui `useProfile()`)
  - `useRole()` — retorna apenas `{ role, isAdmin, isSuperAdmin }` via contexto separado para minimizar re-renders
  - Para manter compatibilidade, o `useProfile()` existente sera reescrito para ser um wrapper fino sobre `useProfileContext()`

### Migracao dos 24 consumidores

Nenhum arquivo consumidor precisa mudar de imediato. O `useProfile()` continuara funcionando exatamente como antes, mas internamente lera do contexto em vez de criar queries proprias. Isso elimina 23 subscricoes duplicadas de uma vez.

### Separacao role vs profile

Para evitar re-renders em componentes que so usam `role` (sidebars, guards, etc.), o ProfileProvider tera 2 contextos internos:
- `ProfileDataContext` — contem `profile`, `updateProfile`, `isLoading`, `error`
- `ProfileRoleContext` — contem `role`, `isAdmin`, `isSuperAdmin` (valores primitivos, mudam rarissimamente)

Componentes como `AppSidebar`, `MobileSidebar`, `NotificationsPopover` que so usam `role` nao re-renderizam quando o profile (nome, avatar, etc.) muda.

---

## Parte 2: RPC para Data Range

### Problema
O `useDashboardDataRange` faz 2 queries separadas (ORDER BY ASC LIMIT 1 + ORDER BY DESC LIMIT 1) para obter min/max de `payment_date`. Isso poderia ser 1 unica query.

### Solucao
Criar uma database function (RPC) `get_sales_date_range` que retorna `min_date` e `max_date` em uma unica chamada, filtrando por PDV IDs.

### SQL da RPC

```sql
CREATE OR REPLACE FUNCTION public.get_sales_date_range(p_pdv_ids uuid[] DEFAULT NULL)
RETURNS TABLE(min_date timestamptz, max_date timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    MIN(payment_date) as min_date,
    MAX(payment_date) as max_date
  FROM sales_records
  WHERE payment_date IS NOT NULL
    AND (p_pdv_ids IS NULL OR pdv_id = ANY(p_pdv_ids))
$$;
```

### Atualizacao do hook `useDashboardDataRange.ts`

Substituir as 2 queries por uma unica chamada RPC:
```typescript
const { data, error } = await supabase.rpc("get_sales_date_range", {
  p_pdv_ids: pdvIds,
});
```

---

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/contexts/ProfileContext.tsx` | **NOVO** — ProfileProvider com 2 contextos internos |
| `src/hooks/useProfile.ts` | Reescrever como wrapper do ProfileContext |
| `src/App.tsx` | Adicionar `<ProfileProvider>` entre AuthProvider e ActiveOrgProvider |
| `src/hooks/useDashboardDataRange.ts` | Usar RPC em vez de 2 queries |
| Migration SQL | Criar funcao `get_sales_date_range` |

## Beneficios
- Elimina 23 subscricoes React Query duplicadas (profile + role)
- Componentes que so usam `role` nao re-renderizam quando profile muda
- Dashboard data range reduz de 2 queries para 1
- Zero mudanca na API publica — `useProfile()` continua funcionando igual

