

# Editar Role de Usuario no Dialog de Detalhes da Organizacao

## Objetivo
Permitir que o super_admin altere o role (funcao) de um usuario diretamente no card de usuario dentro do `OrgDetailDialog`, sem precisar navegar para a aba Equipe.

## Mudancas

### Arquivo: `src/components/settings/OrgDetailDialog.tsx`

**1. Substituir o Badge de role por um Select inline:**
- No card de cada usuario, trocar o `<Badge>` estático do role por um `<Select>` compacto
- O Select mostrará as opcoes: Admin, Operador, Visualizador (e Super Admin se o usuario logado for super_admin)
- Ao alterar o valor, executar a mutation imediatamente (sem botao de salvar)
- Impedir edicao do proprio usuario logado (manter Badge estatico nesse caso)

**2. Mutation para atualizar role:**
- Deletar o registro existente em `user_roles` para o usuario
- Inserir novo registro com o role selecionado
- Invalidar queries `org-detail-members` e `team-members`
- Toast de sucesso/erro

**3. UI do card de usuario atualizado:**
```
[Avatar] [Nome + Email] [Select role ▾] [Trash button]
```
Para o usuario logado:
```
[Avatar] [Nome + Email] [Badge role] (sem acoes)
```

### Detalhes tecnicos

- A mutation faz DELETE + INSERT em `user_roles` (mesmo padrao do `useTeamMembers.updateMember`)
- As RLS policies ja permitem: admins podem deletar/inserir roles com hierarquia (`can_assign_role`)
- O Select tera `size="sm"` e sera compacto para caber no card
- Loading state: desabilitar o Select durante a mutation com `disabled={updateRoleMutation.isPending}`
- Nao permitir atribuir `super_admin` via este Select (manter restrito)

### Validacao de hierarquia
- Super admin pode atribuir: org_admin, operator, viewer
- A funcao `can_assign_role` no banco ja valida isso
- No frontend, filtrar opcoes conforme o role do usuario logado

## Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/settings/OrgDetailDialog.tsx` | Adicionar Select de role inline + mutation de update |

Nenhuma mudanca de banco necessaria.

