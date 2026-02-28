
# Indicador Visual no OrgSwitcher + Logs de Auditoria Cross-Org

## 1. Indicador visual no OrgSwitcher

No dropdown do `OrgSwitcher`, distinguir visualmente a organizacao principal ("owner") das organizacoes com acesso compartilhado ("viewer"/"editor").

**Arquivo: `src/components/layout/OrgSwitcher.tsx`**

- Para orgs com `accessLevel === "owner"`: mostrar icone `Building2` ao lado do nome (organizacao principal)
- Para orgs com `accessLevel === "viewer"`: manter icone `Eye` existente + texto "Leitura"
- Para orgs com `accessLevel === "editor"`: mostrar icone `Link` (indicando acesso compartilhado)
- Apos o select, quando a org ativa nao for a propria, exibir um Badge indicando "Compartilhada" (alem do Badge "Somente leitura" ja existente para viewers)

Resultado visual: o usuario ve rapidamente quais orgs sao dele vs compartilhadas.

## 2. Logs de auditoria para acesso cross-org

A tabela `audit_logs` ja existe com campos adequados (`event_type`, `actor_id`, `actor_email`, `target_email`, `organization_id`, `organization_name`, `metadata`). Porem o enum `audit_event_type` precisa de novos valores.

### 2a. Migracao de banco

Adicionar 3 novos valores ao enum `audit_event_type`:
- `cross_org_access_granted` — quando acesso compartilhado e concedido
- `cross_org_access_revoked` — quando acesso compartilhado e removido
- `cross_org_access_updated` — quando o nivel de acesso e alterado

```text
ALTER TYPE audit_event_type ADD VALUE 'cross_org_access_granted';
ALTER TYPE audit_event_type ADD VALUE 'cross_org_access_revoked';
ALTER TYPE audit_event_type ADD VALUE 'cross_org_access_updated';
```

### 2b. Hook `useOrgCrossAccess.ts`

Nas mutations `addAccessMutation`, `removeAccessMutation` e `updateAccessMutation`, apos o sucesso da operacao principal, inserir um registro na tabela `audit_logs` com:

- `event_type`: o valor correspondente do enum
- `actor_id` / `actor_email`: dados do usuario logado (obtidos via `useProfile`)
- `target_email`: email do usuario que recebeu/perdeu acesso
- `organization_id` / `organization_name`: org alvo
- `metadata`: JSON com `{ access_level, user_id, user_name }`
- `success`: true

## Arquivos a editar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar 3 valores ao enum `audit_event_type` |
| `src/components/layout/OrgSwitcher.tsx` | Adicionar icones e badges para distinguir orgs proprias vs compartilhadas |
| `src/hooks/useOrgCrossAccess.ts` | Inserir logs de auditoria nas 3 mutations (grant, revoke, update) |
