
# Correção: Exclusão de PDVs e Remoção de Usuários em Configurações

## Diagnóstico — Causas Raiz Identificadas no Banco

### Problema 1 — Não consegue excluir PDVs

A tabela `pdvs` tem **duas foreign keys com `NO ACTION`** (comportamento padrão que bloqueia o DELETE quando existem registros filhos):

| Tabela filha | FK | Comportamento atual |
|---|---|---|
| `sales_records` | `sales_records_pdv_id_fkey` | **NO ACTION** — bloqueia delete se houver vendas |
| `stock_records` | `stock_records_pdv_id_fkey` | **NO ACTION** — bloqueia delete se houver estoque |

As demais tabelas (`uploads`, `user_pdvs`, `pdv_marketing_media`, `pdv_catalog_settings`, `catalog_short_links`, `stock_history`) já têm `CASCADE` configurado corretamente.

Resultado: tentar deletar um PDV que já teve uploads/planilhas processadas (que geraram `sales_records` ou `stock_records`) falha silenciosamente no banco, e o toast de erro exibe a mensagem técnica do PostgreSQL.

### Problema 2 — Não consegue remover usuários da equipe

O hook `removeMember` em `useTeamMembers.ts` **não deleta o usuário** — ele apenas seta `organization_id = null` e `status = inactive` no profile. Isso é intencional (preserva o usuário no sistema), porém:

A função `removeMember` tenta atualizar o perfil, mas a política RLS de UPDATE em `profiles` exige que o admin esteja na mesma organização do usuário. Quando o `organization_id` do usuário já é `null` (usuário sem org), ou quando o admin tenta remover alguém fora do escopo, o UPDATE falha.

Além disso, a mensagem de confirmação diz "remover da organização", mas o botão de lixeira na UI sugere "excluir" — gerando confusão sobre o que a ação faz.

## Solução

### Fix 1 — PDVs: migração das FKs para `ON DELETE CASCADE`

As `sales_records` e `stock_records` devem ser deletadas em cascata quando o PDV pai é deletado. Esses dados históricos perdem utilidade sem o PDV e não devem bloquear a remoção.

Migration SQL:
```sql
-- Corrigir FK de sales_records
ALTER TABLE public.sales_records 
  DROP CONSTRAINT sales_records_pdv_id_fkey;
ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_records_pdv_id_fkey 
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;

-- Corrigir FK de stock_records
ALTER TABLE public.stock_records 
  DROP CONSTRAINT stock_records_pdv_id_fkey;
ALTER TABLE public.stock_records
  ADD CONSTRAINT stock_records_pdv_id_fkey 
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;
```

### Fix 2 — Remoção de Usuários: melhorar mensagem de confirmação + clareza da ação

O comportamento atual de `removeMember` (setar `organization_id = null`) é correto e seguro — não deleta o usuário do sistema, apenas desvincula da organização. O problema é:

1. A política RLS de UPDATE em `profiles` usa:
   ```sql
   (organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid())
   ```
   Isso pode bloquear a atualização se o usuário sendo removido já tiver `organization_id = null`.

2. A policy de `WITH CHECK` permite `organization_id IS NULL` quando o editor é admin — mas o `USING` precisa que o target ainda pertença à org.

**Solução:** Adicionar uma condição na política RLS de UPDATE em `profiles` para permitir que admins atualizem perfis da sua própria organização (mesmo quando o campo final será `null`).

Migration SQL:
```sql
-- Ajustar política RLS para permitir remoção de membros
DROP POLICY IF EXISTS "Admins can update profiles in their org" ON public.profiles;
CREATE POLICY "Admins can update profiles in their org"
ON public.profiles
FOR UPDATE
USING (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (
    (organization_id = get_user_org_id(auth.uid()) OR organization_id IS NULL)
    AND is_admin(auth.uid())
  )
  OR is_super_admin(auth.uid())
);
```

### Fix 3 — UX: diálogo de confirmação de remoção mais claro

No `TeamSettings.tsx`, atualizar o texto do `AlertDialog` de exclusão para deixar explícito que é uma **desvinculação** (não exclusão permanente), e o botão passar a chamar "Desvincular" em vez de sugerir exclusão.

## Arquivos a Modificar

| Arquivo | Operação | Motivo |
|---|---|---|
| Migration SQL | CRIAR | Corrigir FKs `NO ACTION` → `CASCADE` em `sales_records` e `stock_records` + ajustar RLS de profiles |
| `src/components/settings/TeamSettings.tsx` | EDITAR | Melhorar texto do diálogo de confirmação de remoção de membro |

## Resultado Esperado

Após as correções:
- Clicar em "Excluir" em qualquer PDV (mesmo com histórico de vendas/estoque) vai funcionar, removendo em cascata todos os dados associados
- O botão de remover membro na Equipe vai funcionar corretamente, desvinculando o usuário da organização
- A mensagem de confirmação vai deixar claro que o usuário não é deletado, apenas desvinculado

## Aviso Importante sobre Deleção em Cascata

Ao excluir um PDV, os seguintes dados serão **permanentemente removidos**:
- Todos os registros de vendas (`sales_records`) do PDV
- Todos os registros de estoque (`stock_records`) do PDV
- Todos os uploads associados
- Mídias de marketing, catálogos, links curtos

Isso é o comportamento correto para manter integridade referencial, mas é uma operação destrutiva. O diálogo de confirmação existente já avisa que "esta ação não pode ser desfeita".
