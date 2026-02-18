
# Correção Urgente: FKs ON DELETE CASCADE para sales_records e stock_records

## Diagnóstico Confirmado

Os testes ao vivo revelaram que a exclusão de PDV ainda falha com **HTTP 409** porque a migration das foreign keys CASCADE nunca foi efetivamente aplicada ao banco.

Verificação direta no banco confirma:

| Tabela | FK | delete_rule atual |
|---|---|---|
| `sales_records` | `sales_records_pdv_id_fkey` | `a` = **NO ACTION** (bloqueia) |
| `stock_records` | `stock_records_pdv_id_fkey` | `a` = **NO ACTION** (bloqueia) |
| `uploads` | `uploads_pdv_id_fkey` | `c` = CASCADE (OK) |
| `stock_history` | `stock_history_pdv_id_fkey` | `c` = CASCADE (OK) |

A migration anterior (`20260218075355`) só executou o DROP do trigger de orphan profile, mas **não incluiu o ALTER TABLE das FKs**.

## O que a RLS de profiles já está correta

O `WITH CHECK` da política `"Admins can update profiles in their org"` já permite `organization_id IS NULL`:
```sql
WITH CHECK (
  (organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
  OR (organization_id IS NULL AND is_admin(auth.uid()))  -- ← já existe
)
```
Ou seja, a remoção de membros da equipe provavelmente já funciona — o problema era exclusivamente as FKs dos PDVs.

## Solução: Nova Migration

Criar uma migration SQL que recria as duas FKs com `ON DELETE CASCADE`:

```sql
-- Corrigir FK de sales_records: NO ACTION → CASCADE
ALTER TABLE public.sales_records
  DROP CONSTRAINT sales_records_pdv_id_fkey;
ALTER TABLE public.sales_records
  ADD CONSTRAINT sales_records_pdv_id_fkey
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;

-- Corrigir FK de stock_records: NO ACTION → CASCADE
ALTER TABLE public.stock_records
  DROP CONSTRAINT stock_records_pdv_id_fkey;
ALTER TABLE public.stock_records
  ADD CONSTRAINT stock_records_pdv_id_fkey
  FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE CASCADE;
```

## Resultado Esperado

Após a migration:
- DELETE no PDV "Shopping Metrô Boulevard Tatuapé" vai cascadear e remover automaticamente as 103 vendas e 85 registros de estoque
- O toast "PDV excluído com sucesso" vai aparecer
- A lista de PDVs vai atualizar mostrando apenas 2 PDVs

## Arquivos a Criar

| Arquivo | Operação |
|---|---|
| `supabase/migrations/[timestamp]_fix_pdv_cascade_fks.sql` | CRIAR — as 2 constraints CASCADE |

Nenhum arquivo de código React precisa ser alterado — a correção é 100% no banco de dados.
