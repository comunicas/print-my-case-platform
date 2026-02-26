
# Analise Completa: Falhas no DELETE de Organizacoes, PDVs e Usuarios

## Status: ✅ IMPLEMENTADO

### Correções aplicadas:

#### 1. Foreign Keys (migração)
- `profiles.organization_id` → `ON DELETE SET NULL` ✅
- `pdvs.organization_id` → `ON DELETE CASCADE` ✅
- `products.organization_id` → `ON DELETE CASCADE` ✅

#### 2. RLS Policies (migração)
- PDVs DELETE: adicionado `OR is_super_admin(auth.uid())` ✅
- PDVs UPDATE: adicionado `OR is_super_admin(auth.uid())` ✅
- Profiles DELETE: nova policy para super_admin ✅

#### 3. Edge Function `delete-user` ✅
- Valida super_admin
- Remove usuário do auth via `auth.admin.deleteUser()`
- Audit log da exclusão

#### 4. Hooks e UI ✅
- `useTeamMembers.ts`: adicionado `deleteMember` mutation
- `TeamSettings.tsx`: super_admin vê "Excluir Permanentemente", org_admin vê "Remover"
- `useOrganizationsCRUD.ts`: DELETE já funciona com FKs CASCADE
- `usePDVs.ts`: DELETE já funciona com RLS corrigida
