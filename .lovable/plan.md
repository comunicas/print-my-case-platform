

# Remover Filtro de Organização Redundante do Dashboard

## Problema

Super admins veem dois seletores de organização:
1. **OrgSwitcher no header** (via ActiveOrgContext) - controla a org ativa globalmente
2. **Filtro "Todas as organizações" na barra de filtros do Dashboard** - controla apenas o dashboard com estado local proprio

Eles operam independentemente, causando confusao. Alem disso, o dashboard ignora o OrgSwitcher do header para super_admins.

## Solucao

Unificar para usar apenas o OrgSwitcher do header. O dashboard passara a ler `activeOrgId` do contexto para todos os usuarios, incluindo super_admins.

## Alteracoes

### 1. `src/pages/Index.tsx`

- Remover o import e uso de `useOrganizations` (era usado apenas para o filtro local de org)
- Remover os estados `selectedOrgId` e o handler `handleOrgChange`
- Remover todo o bloco JSX do filtro de organizacao (Select + botao RefreshCw)
- Remover imports nao utilizados: `Building2`, `RefreshCw`, `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- Simplificar `effectiveOrgId`: usar `activeOrgId` do contexto para todos os usuarios (remover a condicao `isSuperAdmin ? selectedOrgId : ...`)
- Remover `isSuperAdmin` do hook `useOrganizations` (nao sera mais necessario no dashboard)

### Resultado

- Super admins usam **apenas o OrgSwitcher do header** para trocar de organizacao
- A troca de org no header automaticamente atualiza o Dashboard, Financeiro e todas as outras paginas
- Zero impacto para usuarios nao-admin (ja usavam o header switcher)

