
# Criar tabela dre_config (faltou na migration anterior)

## Problema encontrado

A migration anterior atualizou apenas a RPC `get_dre_sales_summary` (adicionando `sales_count` e `card_revenue`), mas **nao criou a tabela `dre_config`** que armazena os parametros de custos variaveis (custo unitario, taxa Stone, aliquota de impostos).

Por isso:
- O botao "Configurar custos" abre o formulario, mas os campos mostram apenas placeholders (17.00, 2.00)
- Clicar em "Salvar" causa erro silencioso (tabela inexistente)
- CMV e Taxas Stone ficam sempre R$ 0,00 no DRE

## Solucao

Criar a migration SQL que faltou com:

### Tabela `dre_config`

```text
dre_config
  id               uuid (PK)
  organization_id  uuid (FK -> organizations)
  pdv_id           uuid (FK -> pdvs, nullable)
  unit_cost        numeric (default 0)
  stone_rate       numeric (default 0)
  tax_rate         numeric (default 0)
  created_at       timestamptz
  updated_at       timestamptz
  UNIQUE(organization_id, pdv_id)
```

### RLS Policies

- **SELECT**: admins da org + super_admins
- **INSERT**: admins da org + super_admins
- **UPDATE**: admins da org + super_admins
- **DELETE**: admins da org + super_admins

Usando as funcoes auxiliares ja existentes: `is_admin()`, `is_super_admin()`, `get_user_org_id()`.

### Trigger de updated_at

Reutilizar o pattern existente de `updated_at = now()` via trigger.

## Arquivos

| Arquivo | Acao |
|---------|------|
| Nova migration SQL | Criar tabela `dre_config` + RLS + trigger |

Nenhuma alteracao de codigo necessaria -- os hooks `useDREConfig` e o componente `DREConfigCard` ja estao implementados corretamente e referenciando esta tabela.

## Resultado esperado

Apos a migration:
1. Abrir "Configurar custos", preencher custo unitario R$ 17, taxa Stone 2%, salvar
2. O DRE recalcula automaticamente:
   - CMV = 8 vendas x R$ 17 = R$ 136,00
   - Taxas Stone = 2% x R$ 559,20 = R$ 11,18
   - Lucro Bruto = R$ 559,20 - R$ 136,00 - R$ 11,18 = R$ 412,02
