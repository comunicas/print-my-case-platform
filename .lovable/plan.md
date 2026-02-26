

# Bloquear INSERT de Viewers na tabela uploads via RLS

## Objetivo
Adicionar defesa em profundidade no backend para que viewers nao consigam inserir uploads mesmo que a guarda de UI seja burlada (ex: chamada direta a API).

## Alteracao

Atualizar a policy RLS existente "Users can create uploads" na tabela `uploads` para incluir a verificacao de que o usuario NAO possui o role `viewer`.

### SQL da migration

```sql
DROP POLICY IF EXISTS "Users can create uploads" ON uploads;

CREATE POLICY "Users can create uploads"
ON uploads FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND pdv_id IN (
    SELECT id FROM pdvs WHERE organization_id = get_user_org_id(auth.uid())
  )
  AND NOT has_role(auth.uid(), 'viewer')
);
```

### Por que atualizar a policy existente em vez de criar uma nova

Todas as policies neste projeto sao `RESTRICTIVE`. Criar uma nova policy RESTRICTIVE funcionaria (todas precisam passar), mas adicionar a condicao diretamente na policy existente e mais limpo e evita proliferacao de policies na mesma tabela/operacao.

## Arquivos alterados

| Recurso | Alteracao |
|---------|-----------|
| Migration SQL | Atualizar policy INSERT em `uploads` para bloquear viewers |

Nenhum arquivo de codigo precisa ser alterado - apenas a policy no banco de dados.

