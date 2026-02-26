

# Criar Usuario e PDV Diretamente no Dialog de Detalhes da Organizacao

## Objetivo
Adicionar botoes "Criar Usuario" e "Criar PDV" dentro do `OrgDetailDialog`, permitindo que o super_admin crie recursos diretamente na organizacao selecionada sem precisar navegar para outras telas.

## Mudancas

### Arquivo: `src/components/settings/OrgDetailDialog.tsx`

**1. Botao "Criar Usuario" na aba Usuarios:**
- Adicionar botao `+ Criar Usuario` abaixo da lista de usuarios
- Ao clicar, abrir o `CreateUserDialog` ja existente
- Pre-configurar o dialog com `createNewOrganization: false` e `organizationId` da org atual
- Usar `useTeamMembers().createUser` para a mutation
- Ao criar com sucesso, invalidar `org-detail-members` e `team-members`

**2. Botao "Criar PDV" na aba PDVs:**
- Adicionar botao `+ Criar PDV` abaixo da lista de PDVs
- Ao clicar, abrir um Dialog com `PDVForm` (reutilizando o componente existente)
- Sem seletor de organizacao (a org ja esta definida pelo contexto do dialog)
- Ao criar, inserir diretamente na tabela `pdvs` com `organization_id` da org atual
- Invalidar `org-detail-pdvs` e `pdvs` ao criar com sucesso

### Detalhes tecnicos

**Criar Usuario:**
- Reutilizar `CreateUserDialog` component passando:
  - `isSuperAdmin={true}`
  - `adminOrganizationId={organizationId}` (da org do dialog)
  - `adminOrganizationName={organizationName}`
- Importar `useTeamMembers` para acessar `createUser` mutation
- O `CreateUserDialog` ja suporta pre-selecionar organizacao via `adminOrganizationId`
- O `onSubmit` chamara `createUser.mutateAsync(data)` e tambem invalidara `org-detail-members`

**Criar PDV:**
- Adicionar estado `showCreatePdv` para controlar o dialog
- Reutilizar `PDVForm` + `pdvFormSchema` para validacao
- Mutation inline para inserir na tabela `pdvs` com `organization_id` fixo
- Validar duplicidade de `machine_id` entre os PDVs carregados

**UI dos botoes:**
- Botoes posicionados entre o `TabsList` e o conteudo da tab, ou no inicio da lista
- Estilo: `Button variant="outline" size="sm"` com icone `Plus`

### Imports adicionais
- `Plus` do lucide-react
- `CreateUserDialog` de `@/components/team/CreateUserDialog`
- `useTeamMembers` de `@/hooks/useTeamMembers`

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/settings/OrgDetailDialog.tsx` | Adicionar botoes e dialogs de criacao de usuario e PDV |

Nenhuma mudanca de banco necessaria - as RLS policies ja permitem super_admin criar usuarios (via Edge Function) e PDVs em qualquer organizacao.

