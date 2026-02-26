

# Fase 8: Refatoracao do OrgDetailDialog

## Problema
O arquivo `OrgDetailDialog.tsx` tem 697 linhas com 5 mutations inline, 15+ estados, e toda a logica de CRUD misturada com a UI.

## Estrategia

Extrair toda a logica de mutations e estados para um hook dedicado `useOrgDetailActions`, e separar os sub-dialogs em componentes menores.

## Mudancas

### 1. Criar hook `src/hooks/useOrgDetailActions.ts`

Extrair do OrgDetailDialog:
- `updateRoleMutation` (role update)
- `deleteUserMutation` (delete user via edge function)
- `createPdvMutation` (insert PDV)
- `deletePdvMutation` (delete PDV)
- `editPdvMutation` (update PDV + transfer)
- `membersQuery` e `pdvsQuery`
- Estados de dialogs: `deleteUserId`, `deleteUserName`, `deletePdvId`, `deletePdvName`, `editPdv`, `editForm`, `editErrors`, `transferOrgId`, `showTransferConfirm`, `showCreateUser`, `showCreatePdv`, `createPdvForm`, `createPdvErrors`
- Handlers: `handleEditPdvOpen`, `handleEditPdvSave`, `handleConfirmTransfer`, `handleCreatePdvSave`, `handleCreateUserSubmit`

O hook recebe `organizationId`, `organizationName`, e `open` como parametros.

Interface de retorno:
```text
{
  // Queries
  members, membersLoading,
  pdvs, pdvsLoading,

  // Role
  updateRole(userId, newRole), isUpdatingRole,

  // Delete user
  deleteUser: { targetId, targetName, open(id, name), close(), confirm(), isPending },

  // Delete PDV
  deletePdv: { targetId, targetName, open(id, name), close(), confirm(), isPending },

  // Edit PDV
  editPdv: { isOpen, form, errors, transferOrgId, showTransferConfirm,
             open(pdv), close(), setForm, clearError, setTransferOrgId,
             save(), confirmTransfer(), isPending },

  // Create user
  createUser: { isOpen, open(), close(), submit(data), isPending },

  // Create PDV
  createPdv: { isOpen, form, errors, open(), close(), setForm, clearError, save(), isPending },
}
```

### 2. Simplificar `OrgDetailDialog.tsx`

O componente ficara apenas com:
- Chamada ao `useOrgDetailActions(organizationId, organizationName, open)`
- JSX dos Tabs (usuarios e PDVs)
- JSX dos sub-dialogs (AlertDialogs de confirmacao, Edit PDV dialog, Create PDV dialog, CreateUserDialog)
- Sem nenhuma mutation ou query direta
- Estimativa: ~400 linhas (reduzir ~40%)

### 3. Importar `roleLabels` do schema existente

O objeto `roleLabels` nas linhas 69-74 duplica o que ja existe em `src/lib/schemas/team.ts`. Substituir pelo import existente.

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/hooks/useOrgDetailActions.ts` | Criar - hook com toda a logica extraida |
| `src/components/settings/OrgDetailDialog.tsx` | Refatorar - usar o novo hook, remover logica inline |

## Beneficios
- Separacao clara entre logica e UI
- Hook testavel independentemente
- OrgDetailDialog focado apenas em renderizacao
- Reutilizacao potencial do hook em outros contextos

