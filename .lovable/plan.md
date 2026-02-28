

# Filtro "Todas as Organizacoes" no OrgSwitcher para Super Admin

## Problema

Atualmente o `OrgSwitcher` obriga o super_admin a selecionar uma unica organizacao por vez. Embora o card "Visao Consolidada" mostre metricas globais no topo, os KPIs principais, graficos e tabelas abaixo mostram dados de apenas uma organizacao. O super_admin quer ver os dados somados de TODAS as organizacoes nos KPIs e charts.

## Solucao

Adicionar uma opcao "Todas as organizacoes" no `OrgSwitcher` exclusiva para super_admins. Quando selecionada, o dashboard (e outras paginas) mostra dados agregados de todas as orgs.

## Mudancas

### 1. `ActiveOrgContext.tsx` — Permitir valor "all"

- Alterar o tipo de `activeOrgId` para aceitar `"all"` alem de UUIDs
- Para super_admins, inicializar com `"all"` em vez da org propria
- Ajustar `isOwnOrg` e `isReadOnly` para tratar `"all"` corretamente
- Expor flag `isAllOrgs` no contexto para facilitar uso em componentes

### 2. `OrgSwitcher.tsx` — Adicionar opcao "Todas"

- Renderizar item "Todas as organizacoes" no topo do `SelectContent` quando o usuario for super_admin
- Icone `Building2` com texto diferenciado
- Quando selecionado, setar `activeOrgId` para `"all"`
- Ocultar badge "Compartilhada"/"Somente leitura" quando "all" estiver ativo

### 3. `Index.tsx` (Dashboard) — Tratar org "all"

- Quando `activeOrgId === "all"`, passar `selectedOrganizationId` como `"all"` para `useDashboard`
- O hook `useDashboard` ja suporta `"all"`: nao filtra por PDV nem por org, trazendo dados globais
- Os KPIs, graficos e tabelas passam a mostrar a soma de todas as organizacoes
- Manter o card "Visao Consolidada" visivel normalmente

### 4. `usePDVs.ts` — Tratar org "all"

- Quando `organizationId === "all"`, nao aplicar filtro de org (trazer todos os PDVs)
- Isso permite que o filtro de PDV no dashboard liste PDVs de todas as orgs

## Fluxo do usuario

1. Super admin abre o dashboard
2. No OrgSwitcher do cabecalho, ve "Todas as organizacoes" como primeira opcao
3. Ao selecionar, KPIs mostram receita total, transacoes totais, etc. de todas as orgs somadas
4. Graficos (vendas por dia, heatmap, top produtos) mostram dados agregados
5. Pode voltar a filtrar por uma org especifica a qualquer momento

## Arquivos a editar

| Arquivo | Acao |
|---------|------|
| `src/contexts/ActiveOrgContext.tsx` | Aceitar "all", expor `isAllOrgs` |
| `src/components/layout/OrgSwitcher.tsx` | Adicionar opcao "Todas as organizacoes" para super_admins |
| `src/pages/Index.tsx` | Passar "all" para useDashboard quando aplicavel |
| `src/hooks/usePDVs.ts` | Nao filtrar por org quando "all" |

## Impacto

- Nenhuma mudanca no banco de dados
- O hook `useDashboard` ja trata `selectedOrganizationId === "all"` corretamente — nao aplica filtro de org/pdv, resultando em dados globais
- Outras paginas (Estoque, Uploads) tambem podem se beneficiar do `isAllOrgs` no futuro

