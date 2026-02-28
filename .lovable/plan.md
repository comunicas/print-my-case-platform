

# Adicionar Usuarios Existentes via Acesso Cross-Org (user_org_access)

## Situacao Atual

O `OrgDetailDialog` mostra apenas usuarios cujo `profiles.organization_id` e igual a organizacao visualizada. Nao existe nenhuma funcionalidade para:
- Visualizar usuarios com acesso cross-org (via `user_org_access`)
- Conceder acesso a usuarios de outras organizacoes
- Remover acesso cross-org
- Escolher nivel de acesso (viewer/editor)

A tabela `user_org_access` ja existe com constraint unico em `(user_id, organization_id)` e RLS configurado para super_admins e org_admins.

## Mudancas Planejadas

### 1. Hook `useOrgDetailActions.ts` — Adicionar logica de acesso cross-org

- **Nova query**: buscar registros de `user_org_access` para a organizacao, com JOIN em `profiles` para obter nome/email
- **Mutation para adicionar acesso**: inserir em `user_org_access` com `access_level` escolhido
- **Mutation para remover acesso**: deletar de `user_org_access`
- **Mutation para alterar nivel**: atualizar `access_level` em `user_org_access`
- **Estado do dialog de adicionar**: controlar abertura, busca de usuarios por email, e nivel de acesso selecionado
- **Busca de usuarios**: query que busca profiles por email/nome que NAO pertencem a esta org (para evitar duplicatas)

### 2. `OrgDetailDialog.tsx` — UI para gerenciar acesso cross-org

- Na aba "Usuarios", apos a lista de membros diretos, adicionar secao "Usuarios com acesso compartilhado"
- Cada usuario cross-org mostra: avatar, nome, email, badge da org de origem, select de nivel (viewer/editor), botao remover
- Botao "Adicionar Acesso" abre um dialog onde o super_admin:
  1. Busca um usuario por email
  2. Seleciona o nivel de acesso (viewer ou editor)
  3. Confirma a adicao

### 3. Novo componente `AddOrgAccessDialog`

Dialog simples com:
- Campo de busca por email (com debounce)
- Lista de resultados mostrando nome e email (excluindo quem ja tem acesso)
- Select de nivel de acesso (viewer/editor)
- Botao confirmar

## Arquivos a Editar

| Arquivo | Acao |
|---------|------|
| `src/hooks/useOrgDetailActions.ts` | Adicionar queries e mutations para user_org_access |
| `src/components/settings/OrgDetailDialog.tsx` | Adicionar secao de acesso cross-org e dialog de adicionar |

## Detalhes Tecnicos

### Query de usuarios com acesso cross-org
```text
SELECT uoa.id, uoa.access_level, uoa.user_id, p.name, p.email, o.name as org_name
FROM user_org_access uoa
JOIN profiles p ON p.id = uoa.user_id
JOIN organizations o ON o.id = p.organization_id
WHERE uoa.organization_id = <orgId>
```

### Busca de usuarios para adicionar
```text
SELECT p.id, p.name, p.email
FROM profiles p
WHERE p.organization_id != <orgId>
  AND (p.email ILIKE '%search%' OR p.name ILIKE '%search%')
  AND p.id NOT IN (SELECT user_id FROM user_org_access WHERE organization_id = <orgId>)
LIMIT 10
```

### Insert de acesso
```text
INSERT INTO user_org_access (user_id, organization_id, access_level)
VALUES (<userId>, <orgId>, <'viewer' | 'editor'>)
```

## Impacto

- **Zero mudanca no banco de dados** — a tabela `user_org_access` e RLS ja existem
- **Zero mudanca em outros componentes** — `useUserOrganizations` e `OrgSwitcher` ja consomem `user_org_access`
- Usuarios adicionados via este fluxo verao a organizacao no `OrgSwitcher` automaticamente

