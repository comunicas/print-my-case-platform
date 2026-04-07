# Taxonomia de eventos de auditoria

Atualizado em: **2026-04-07**

## Enum SQL de referência

A taxonomia é definida no enum PostgreSQL `public.audit_event_type`.

- Eventos base (migração `20251228082601_da85a64f-0f65-488f-8a8f-522a9cf88ac5.sql`):
  - `user_creation_attempt`
  - `user_creation_success`
  - `user_creation_failed`
  - `permission_violation`
  - `organization_creation`
  - `role_assignment`
- Eventos de acesso cross-org (migração `20260228023714_72e09f27-fb86-4c12-8ccc-d2ba89eebe88.sql`):
  - `cross_org_access_granted`
  - `cross_org_access_revoked`
  - `cross_org_access_updated`
- Eventos de exclusão de usuário (migração `20260407113000_add_user_deletion_audit_events.sql`):
  - `user_deletion_success`
  - `user_deletion_failed`
- **Novo evento** (migração `20260407124500_add_user_creation_rollback_audit_event.sql`):
  - `user_creation_rollback`

## Semântica do novo evento

`user_creation_rollback` registra quando a criação de usuário precisou ser revertida depois de `createUser` já ter retornado sucesso, por exemplo:

- falha ao criar organização vinculada;
- timeout aguardando criação de `profiles`/`user_roles`;
- falha ao atualizar `profiles`;
- falha ao atualizar `user_roles`.

## Compatibilidade entre ambientes

A migração do novo evento usa `ADD VALUE IF NOT EXISTS`, então:

- em ambientes antigos, o valor é adicionado;
- em ambientes novos (ou já corrigidos), a migração é idempotente e não falha por duplicidade.
