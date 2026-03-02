

# Corrigir dre_config: duplicatas e upsert com NULL

## Problema encontrado no teste

O teste revelou dois bugs:

1. **Duplicatas no banco**: Ha 5 registros duplicados para a mesma organizacao com `pdv_id = NULL`. Isso acontece porque o PostgreSQL trata cada `NULL` como valor unico em constraints `UNIQUE`, entao o `UNIQUE(organization_id, pdv_id)` nao impede insercoes duplicadas quando `pdv_id` e NULL.

2. **Query retorna erro**: O `maybeSingle()` no hook falha silenciosamente quando ha multiplas linhas, retornando `null`. Com `unitCost = 0`, CMV e Taxas ficam R$ 0,00 no DRE mesmo apos salvar.

## Solucao

### 1. Migration SQL

- Limpar registros duplicados (manter apenas o mais recente por org)
- Remover o constraint UNIQUE antigo
- Criar dois partial unique indexes:
  - `dre_config_org_null_pdv ON (organization_id) WHERE pdv_id IS NULL` -- garante 1 config por org sem PDV
  - `dre_config_org_pdv ON (organization_id, pdv_id) WHERE pdv_id IS NOT NULL` -- garante 1 config por org+pdv

### 2. Hook useDREConfig.ts

Substituir o `upsert` (que falha com NULLs no onConflict) por logica de check-then-insert/update:

```text
1. Busca config existente com SELECT ... maybeSingle()
2. Se existe -> UPDATE pelo id
3. Se nao existe -> INSERT novo registro
```

## Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Limpar duplicatas + criar partial unique indexes |
| `src/hooks/useDREConfig.ts` | Trocar upsert por select+update/insert |

- **1 migration + 1 arquivo modificado**
- **Risco**: Baixo -- correcao pontual

