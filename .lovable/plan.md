
# Analise Completa: Falhas no DELETE de Organizacoes, PDVs e Usuarios

## Problemas Encontrados

### 1. Organizacoes: Foreign Keys bloqueiam exclusao
A tabela `organizations` tem 3 foreign keys com `NO ACTION` (que bloqueia DELETE):
- `profiles.organization_id` -- se houver usuarios na org, nao deleta
- `pdvs.organization_id` -- se houver PDVs na org, nao deleta
- `products.organization_id` -- se houver produtos, nao deleta

Mesmo com a RLS permitindo (`is_super_admin`), o banco rejeita a operacao por violacao de integridade referencial.

**Solucao**: Alterar as 3 FKs para `ON DELETE CASCADE` (pdvs e products) e `ON DELETE SET NULL` (profiles, para nao perder o usuario auth). Adicionalmente, o `notifications.organization_id` precisa ser verificado tambem.

### 2. PDVs: RLS bloqueia super_admin em outras organizacoes
A policy de DELETE em `pdvs` exige:
```
organization_id = get_user_org_id(auth.uid()) AND is_admin(auth.uid())
```
Isso significa que o super_admin so consegue deletar PDVs da **propria** organizacao. Para PDVs de outras orgs, a policy falha silenciosamente (retorna 0 rows).

**Solucao**: Adicionar `OR is_super_admin(auth.uid())` na policy de DELETE (e UPDATE) de PDVs, seguindo o mesmo padrao da policy de SELECT que ja tem esse bypass.

### 3. Usuarios: Sem policy de DELETE e sem funcionalidade real de exclusao
- A tabela `profiles` nao tem nenhuma policy de DELETE
- O `removeMember` no hook apenas seta `organization_id = null` e `status = inactive`, mas nao remove o usuario de fato
- Nao existe funcionalidade para deletar o usuario do auth (requer `service_role` via Edge Function)

**Solucao**: Criar uma Edge Function `delete-user` que use `auth.admin.deleteUser()` com `service_role`, e adicionar policy de DELETE na tabela profiles.

### 4. Notificacoes: FK para organizations tambem precisa de CASCADE
A tabela `notifications.organization_id` referencia organizations e pode bloquear a exclusao.

## Plano de Implementacao

### Fase 1: Migracao de banco (FKs e RLS)

**Migracao SQL:**
- Alterar FK de `profiles.organization_id` para `ON DELETE SET NULL`
- Alterar FK de `pdvs.organization_id` para `ON DELETE CASCADE`
- Alterar FK de `products.organization_id` para `ON DELETE CASCADE`
- Alterar FK de `notifications.organization_id` para `ON DELETE CASCADE`
- Atualizar policy de DELETE em `pdvs` para incluir bypass de super_admin
- Atualizar policy de UPDATE em `pdvs` para incluir bypass de super_admin
- Adicionar policy de DELETE em `profiles` para super_admin

### Fase 2: Edge Function `delete-user`

Criar `supabase/functions/delete-user/index.ts` que:
1. Valida que o chamador e super_admin
2. Recebe `userId` no body
3. Remove o usuario do auth via `auth.admin.deleteUser(userId)`
4. O CASCADE cuida de limpar profiles, user_roles, preferences, user_pdvs

### Fase 3: Atualizar hooks e UI

**`useTeamMembers.ts`:**
- Substituir `removeMember` por `deleteMember` que chama a Edge Function `delete-user`
- Manter opcao de "desativar" (soft remove) separada de "excluir" (hard delete)

**`useOrganizationsCRUD.ts`:**
- Adicionar tratamento de erro mais descritivo para falhas de FK
- O DELETE ja vai funcionar apos a migracao de FKs

**`usePDVs.ts`:**
- O DELETE ja vai funcionar apos a correcao da RLS policy

**UI (`TeamSettings.tsx`):**
- Atualizar o dialog de confirmacao de exclusao para chamar a nova funcao de delete real

### Fase 4: Logica de seguranca na exclusao de organizacao

No `useOrganizationsCRUD.ts`, antes de deletar uma org:
- Mostrar aviso sobre dados que serao perdidos (PDVs, uploads, vendas, estoque)
- Impedir exclusao da propria organizacao do super_admin

## Resumo das mudancas por arquivo

| Arquivo | Mudanca |
|---------|---------|
| `supabase/migrations/...` | FKs CASCADE + RLS policies |
| `supabase/functions/delete-user/index.ts` | Nova Edge Function |
| `src/hooks/useTeamMembers.ts` | Adicionar `deleteMember` via Edge Function |
| `src/hooks/usePDVs.ts` | Sem mudanca de codigo (correcao e no RLS) |
| `src/hooks/useOrganizationsCRUD.ts` | Protecao contra auto-exclusao |
| `src/components/settings/TeamSettings.tsx` | Atualizar UI de exclusao |
