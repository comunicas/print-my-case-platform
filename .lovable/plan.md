
# Adicionar Acoes de Editar/Excluir no Drill-down de Organizacao

## Objetivo
Adicionar botoes de editar e excluir nos cards de usuarios e PDVs dentro do `OrgDetailDialog`, permitindo que o super_admin gerencie diretamente a partir do painel de organizacoes.

## Mudancas

### Arquivo: `src/components/settings/OrgDetailDialog.tsx`

**Usuarios - Acoes:**
- Adicionar botao de excluir (lixeira) em cada card de usuario
- Ao clicar, abrir AlertDialog de confirmacao
- Chamar `supabase.functions.invoke("delete-user")` para exclusao permanente (super_admin)
- Invalidar queries `org-detail-members` e `team-members` apos sucesso
- Impedir exclusao do proprio usuario logado

**PDVs - Acoes:**
- Adicionar botoes de editar (lapis) e excluir (lixeira) em cada card de PDV
- Editar: abrir Dialog com PDVForm preenchido, salvar via `supabase.from("pdvs").update()`
- Excluir: abrir AlertDialog de confirmacao, deletar via `supabase.from("pdvs").delete()`
- Invalidar queries `org-detail-pdvs` e `pdvs` apos sucesso

**Imports adicionais:**
- `Button` do ui/button
- `AlertDialog` e seus subcomponentes
- `Dialog` para edicao de PDV
- `PDVForm` para o formulario
- `Pencil`, `Trash2`, `Loader2` do lucide-react
- `useMutation`, `useQueryClient` do tanstack
- `toast` do sonner
- `useProfile` para obter o usuario logado (prevenir auto-exclusao)

### Estrutura da UI

Cada card de usuario tera:
```
[Avatar] [Nome + Email] [Badge role] [Trash button]
```

Cada card de PDV tera:
```
[Nome + Location] [machine_id] [Badge status] [Edit] [Trash]
```

### Detalhes tecnicos

- Os botoes de acao usam `e.stopPropagation()` para nao fechar o dialog
- As mutations sao definidas inline com `useMutation` no componente
- O PDVForm reutiliza o componente existente `src/components/pdv/PDVForm.tsx`
- Toast de sucesso/erro em todas as operacoes
- Loading states nos botoes durante as mutations
- Nenhuma mudanca de banco necessaria (RLS ja permite super_admin)
