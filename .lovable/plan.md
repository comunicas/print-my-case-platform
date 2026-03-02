

# Corrigir leitura de dre_config no modo "Todas as organizacoes"

## Problema

O teste revelou que a configuracao de custos (unit_cost=17, stone_rate=0.02) foi salva corretamente no banco, mas o DRE continua mostrando CMV e Taxas Stone como R$ 0,00.

A causa: quando o usuario seleciona "Todas as organizacoes", o `activeOrgId` e "all", e o hook `useDREConfig` define `orgId = null`, desabilitando a query de leitura (`enabled: !!orgId`). Resultado: `unitCost` e `stoneRate` ficam com valor padrao 0.

O **save** funciona porque usa `writeOrgId` (que faz fallback para `profile.organization_id`), mas o **read** nao busca dados.

## Solucao

Alterar o `useDREConfig` para que, no modo "all orgs", a query de leitura tambem use `profile?.organization_id` como fallback (mesmo comportamento do write).

### Alteracao em `src/hooks/useDREConfig.ts`

Linha 24 - mudar de:
```
const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);
```

Para:
```
const orgId = isAllOrgs ? profile?.organization_id : (activeOrgId ?? profile?.organization_id);
```

Isso faz com que, no modo "all orgs", a config seja buscada da organizacao propria do usuario (a mesma onde ele salvou). O `writeOrgId` ja usa esse mesmo valor, entao leitura e escrita ficam consistentes.

## Impacto

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useDREConfig.ts` | 1 linha: fallback de orgId no modo "all" |

Nenhuma migration necessaria. Apos essa correcao, o DRE deve recalcular CMV e Taxas Stone mesmo no modo "Todas as organizacoes".

