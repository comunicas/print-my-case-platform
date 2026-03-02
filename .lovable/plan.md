

# DRE Completo com Custos Variaveis Dinamicos

## Dados necessarios para um DRE funcional

Para montar o DRE corretamente, precisamos de 3 parametros configuraveis pelo usuario, alem dos dados que ja temos automaticamente:

### Parametros configuraveis (por organizacao, opcionalmente por PDV)

| Parametro | Exemplo | Onde e usado |
|-----------|---------|-------------|
| Custo unitario medio (CMV) | R$ 17,00 | Multiplicado pela qtd de vendas do mes |
| Taxa Stone (MDR %) | 2,00% | Aplicado apenas sobre vendas no cartao |
| Aliquota de impostos (%) | 0,00% | Aplicado sobre receita bruta (ISS/ICMS) |

### Dados automaticos (ja existentes)

| Dado | Fonte |
|------|-------|
| Receita Bruta | `sales_records` (vendas nao canceladas) |
| Reembolsos | `sales_records.refund_amount` |
| Qtd vendas no mes | `COUNT(*)` de sales_records |
| Receita em cartao | `SUM(amount)` onde `payment_method = 'creditCard'` |
| Despesas Fixas | `financial_entries` categoria "fixas" |
| Implantacao | `financial_entries` categoria "implantacao" |

### Precisa de mais algum dado?

Para o modelo atual (vending machine), esses dados sao suficientes. Futuramente pode-se adicionar:
- **Custo por produto** (em vez de custo medio unico) -- adicionando coluna `cost` na tabela `products`
- **Taxa de antecipacao Stone** -- se usar antecipacao de recebiveis
- **Tarifa bancaria fixa** -- mensalidade de conta, etc.
- **Depreciacao** -- rateio mensal de equipamentos

Mas para um DRE simples e funcional, os 3 parametros acima cobrem tudo.

## Estrutura final do DRE

```text
 Receita Bruta                              R$ 18.605
 (-) Impostos sobre vendas (0%)             R$      0   [automatico: receita * tax_rate]
 (-) Reembolsos / Deducoes                  R$    xxx   [automatico + manuais]
 = Receita Liquida                          R$ 18.605
 ------------------------------------------------
 (-) CMV (277 un x R$ 17,00)               R$  4.709   [automatico: qtd_vendas * unit_cost]
 (-) Taxas Stone (2% cartao)               R$    372   [automatico: receita_cartao * stone_rate]
 = Lucro Bruto                             R$ 13.524
 ------------------------------------------------
 (-) Despesas Fixas (OPEX)                  R$  4.000   [manual: financial_entries]
 = Resultado Operacional (EBITDA)           R$  9.524
 ------------------------------------------------
 (-) Implantacao (one-off)                  R$  7.950   [manual: financial_entries, condicional]
 = Resultado do Mes                         R$  1.574
```

## Implementacao tecnica

### 1. Nova tabela `dre_config`

Armazena as configuracoes de custo variavel por organizacao/PDV:

```sql
CREATE TABLE dre_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  pdv_id uuid REFERENCES pdvs(id),       -- NULL = vale pra toda org
  unit_cost numeric NOT NULL DEFAULT 0,   -- custo medio por unidade vendida
  stone_rate numeric NOT NULL DEFAULT 0,  -- ex: 0.02 = 2%
  tax_rate numeric NOT NULL DEFAULT 0,    -- ex: 0.06 = 6%
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, pdv_id)         -- uma config por org/pdv
);
```

Com RLS para admins da organizacao.

### 2. Atualizar RPC `get_dre_sales_summary`

Adicionar retorno de `sales_count` e `card_revenue` para calcular CMV e taxa Stone:

```sql
RETURNS TABLE(
  faturamento numeric,
  deducoes numeric,
  sales_count bigint,       -- NOVO: qtd de vendas
  card_revenue numeric      -- NOVO: receita apenas cartao
)
```

```sql
SELECT
  COALESCE(SUM(amount), 0) as faturamento,
  COALESCE(SUM(COALESCE(refund_amount, 0)), 0) as deducoes,
  COUNT(*) as sales_count,
  COALESCE(SUM(CASE WHEN payment_method = 'creditCard' THEN amount ELSE 0 END), 0) as card_revenue
FROM sales_records
WHERE pdv_id = ANY(p_pdv_ids)
  AND status != 'Cancelled'
  AND payment_date BETWEEN p_start_date AND p_end_date
```

### 3. Novo hook `useDREConfig`

Busca e gerencia a configuracao da tabela `dre_config`. CRUD simples com upsert (insere ou atualiza).

### 4. Atualizar `useDRE.ts`

Novo `DREData`:

```text
DREData {
  receitaBruta          // faturamento
  impostos              // receitaBruta * tax_rate
  reembolsos            // refunds auto + entries manuais "deducoes"
  receitaLiquida        // receitaBruta - impostos - reembolsos
  cmv                   // sales_count * unit_cost
  taxasStone            // card_revenue * stone_rate
  lucroBruto            // receitaLiquida - cmv - taxasStone
  despesasFixas         // entries "fixas"
  resultadoOperacional  // lucroBruto - despesasFixas
  implantacao           // entries "implantacao"
  resultadoMes          // resultadoOperacional - implantacao
}
```

### 5. Atualizar `DRETable.tsx`

Nova ordem com secoes visuais e labels descritivos (ex: "CMV (277 un x R$ 17,00)").

### 6. UI para configurar os parametros

Secao de configuracao inline na pagina Financeiro (ou modal), com 3 campos:

- **Custo unitario medio** (R$) -- input numerico
- **Taxa Stone MDR** (%) -- input numerico
- **Aliquota de impostos** (%) -- input numerico

Aparece como um card de configuracao no topo ou como botao de engrenagem ao lado do titulo.

### Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar tabela `dre_config` + RLS; atualizar RPC |
| `src/hooks/useDREConfig.ts` | Novo hook CRUD para config |
| `src/hooks/useDRE.ts` | Novo DREData com custos variaveis |
| `src/components/financeiro/DRETable.tsx` | Nova estrutura de linhas |
| `src/components/financeiro/DREConfigCard.tsx` | Novo componente de config |
| `src/components/financeiro/index.ts` | Exportar novos componentes |
| `src/pages/Financeiro.tsx` | Integrar config e nova estrutura |

- **Arquivos novos:** 2
- **Arquivos modificados:** 5
- **1 migration SQL**
- **Risco:** Baixo -- componentes novos, dados existentes nao mudam

