

# Melhorar CRUD de Usuarios e PDVs por Organizacao

## Situacao Atual

Mapeamento completo de onde organizacoes sao referenciadas:

### Paginas e Componentes
| Local | O que faz | Problema |
|-------|-----------|----------|
| `pages/Organizations.tsx` | Lista orgs com contagem de usuarios/PDVs | Nao permite drill-down para ver/gerenciar usuarios e PDVs da org |
| `settings/TeamSettings.tsx` | Lista todos os usuarios (super_admin) ou da propria org | Sem filtro por organizacao para super_admin |
| `settings/PDVsSettings.tsx` | Lista PDVs da propria org apenas | Super_admin nao consegue ver/gerenciar PDVs de outras orgs |
| `team/CreateUserDialog.tsx` | Cria usuario com seletor de org | Funciona bem |
| `team/UserPDVsDialog.tsx` | Atribui PDVs a usuario | Mostra apenas PDVs da org do admin, nao da org do usuario alvo |
| `settings/OrganizationSettings.tsx` | Edita dados da propria org | OK para org_admin |
| `layout/OrgSwitcher.tsx` | Troca org ativa (multi-org access) | Somente para user_org_access, nao para super_admin |

### Hooks
| Hook | Problema |
|------|----------|
| `usePDVs.ts` | Aceita `organizationId` como filtro mas `createPDV` sempre usa a org do usuario logado |
| `useTeamMembers.ts` | Super_admin ve todos, mas sem filtro por org |
| `useOrganizationsCRUD.ts` | CRUD de orgs OK, mas sem navegacao para detalhes |

## Plano de Implementacao

### Fase 1: Filtro por organizacao no CRUD de Usuarios (TeamSettings)

**Arquivo: `src/components/settings/TeamSettings.tsx`**
- Adicionar seletor de organizacao no topo (visivel apenas para super_admin)
- Usar `useOrganizations()` para popular o dropdown
- Filtrar `filteredMembers` pela org selecionada
- Default: "Todas as organizacoes"

### Fase 2: Filtro por organizacao no CRUD de PDVs (PDVsSettings)

**Arquivo: `src/components/settings/PDVsSettings.tsx`**
- Adicionar seletor de organizacao para super_admin
- Passar `organizationId` para `usePDVs()`
- Ao criar PDV como super_admin, permitir escolher a organizacao destino

**Arquivo: `src/hooks/usePDVs.ts`**
- Atualizar `createPDV` para aceitar `organization_id` explicito (super_admin pode criar PDV em qualquer org)
- RLS ja permite via `is_super_admin` bypass (corrigido anteriormente)
- Adicionar policy de INSERT para super_admin no banco

### Fase 3: Drill-down na pagina de Organizacoes

**Arquivo: `src/pages/Organizations.tsx`**
- Ao clicar no card de uma organizacao, abrir dialog/painel com:
  - Lista de usuarios da org (com acoes de editar/remover)
  - Lista de PDVs da org (com acoes de editar/remover)
  - Botao para criar usuario naquela org
  - Botao para criar PDV naquela org

### Fase 4: Correcao do UserPDVsDialog

**Arquivo: `src/components/team/UserPDVsDialog.tsx`**
- Atualmente usa `usePDVs()` sem filtro, mostrando apenas PDVs da org do admin
- Corrigir para buscar PDVs da organizacao do usuario-alvo (nao do admin logado)
- Passar `organizationId` do membro selecionado para `usePDVs()`

### Fase 5: Migracao de banco (RLS para INSERT de PDVs por super_admin)

Atualizar policy de INSERT em `pdvs` para permitir super_admin criar PDVs em qualquer org:

```sql
DROP POLICY "Admins can create PDVs" ON pdvs;
CREATE POLICY "Admins can create PDVs" ON pdvs
FOR INSERT TO authenticated
WITH CHECK (
  ((organization_id = get_user_org_id(auth.uid())) AND is_admin(auth.uid()))
  OR is_super_admin(auth.uid())
);
```

## Arquivos Impactados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/components/settings/TeamSettings.tsx` | Adicionar filtro de org |
| `src/components/settings/PDVsSettings.tsx` | Adicionar filtro de org + criar PDV em outra org |
| `src/hooks/usePDVs.ts` | createPDV aceitar org_id explicito |
| `src/pages/Organizations.tsx` | Drill-down com usuarios e PDVs |
| `src/components/team/UserPDVsDialog.tsx` | Buscar PDVs da org do usuario-alvo |
| `supabase/migrations/...` | RLS INSERT pdvs para super_admin |

## Resultado Esperado

- Super_admin pode filtrar usuarios e PDVs por organizacao em Configuracoes
- Super_admin pode criar PDVs diretamente em qualquer organizacao
- Pagina de Organizacoes permite ver e gerenciar usuarios/PDVs de cada org
- UserPDVsDialog mostra PDVs corretos da organizacao do usuario-alvo

