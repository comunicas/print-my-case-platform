
# Refinamento da area Financeiro: Abas + Visao Anual com Graficos

## Visao Geral

Reorganizar a pagina Financeiro em **3 abas** para separar contextos e adicionar uma visao anual com graficos de evolucao e indicadores acumulados.

```text
+-----------------------------------------------+
| Financeiro          [PDV Filter] [+ Despesa]  |
|-----------------------------------------------|
| [ Resumo ]  [ DRE ]  [ Despesas ]            |
+-----------------------------------------------+
```

---

## Aba 1: Resumo (nova - visao anual)

A aba principal com visao de alto nivel do desempenho financeiro no ano.

**Seletor de ano** (ex: 2025, 2026) no lugar do seletor mensal.

**KPI Cards** (4 cards no topo):
- Receita Bruta acumulada no ano
- Resultado Operacional acumulado
- Margem Bruta media do ano (%)
- Margem Operacional media do ano (%)

**Grafico 1: Evolucao Mensal (AreaChart com Recharts)**
- Eixo X: meses do ano (Jan-Dez)
- Series: Receita Bruta, Receita Liquida, Lucro Bruto, Resultado Operacional
- Tooltip com valores formatados em BRL

**Grafico 2: Margens Mensais (LineChart)**
- Eixo X: meses do ano
- Linhas: Margem Bruta (%), Margem Operacional (%)
- Eixo Y em percentual

**Grafico 3: Composicao de Custos (BarChart empilhado)**
- Barras mensais empilhadas: CMV, Taxas Stone, Impostos, Despesas Fixas, Deducoes
- Mostra visualmente onde o dinheiro esta indo

---

## Aba 2: DRE (conteudo atual)

Move a DRETable atual + DREConfigCard + seletor de mes para esta aba dedicada. Conteudo identico ao que existe hoje, sem alteracoes funcionais.

- Seletor de mes (navegacao esquerda/direita)
- DREConfigCard (admin)
- DRETable com indicadores de margem
- Banner "copiar despesas do mes anterior"

---

## Aba 3: Despesas (conteudo atual)

Move a FinancialEntriesList + botao "Nova Despesa" para esta aba.

- Seletor de mes
- Lista de despesas com edicao/exclusao
- Formulario de nova despesa (dialog)

---

## Detalhes Tecnicos

### Novos arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useAnnualDRE.ts` | Hook que busca dados de DRE para os 12 meses do ano selecionado. Reutiliza a mesma RPC `get_dre_sales_summary` em loop (1 call por mes) e agrega os totais de `financial_entries` por mes. Retorna array de 12 objetos DREData + KPIs acumulados. |
| `src/components/financeiro/AnnualSummary.tsx` | Componente com KPI cards + 3 graficos Recharts. Recebe dados do hook. |
| `src/components/financeiro/AnnualKPICards.tsx` | 4 KPI cards com receita acumulada, resultado, margens medias. |
| `src/components/financeiro/RevenueEvolutionChart.tsx` | AreaChart de evolucao mensal. |
| `src/components/financeiro/MarginsChart.tsx` | LineChart de margens %. |
| `src/components/financeiro/CostCompositionChart.tsx` | BarChart empilhado de custos. |

### Arquivos modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/Financeiro.tsx` | Refatorar para usar Tabs (Resumo / DRE / Despesas). O header, PDVFilter e botao ficam acima das abas. O seletor de mes fica dentro das abas DRE e Despesas. Aba Resumo tem seletor de ano. |
| `src/components/financeiro/index.ts` | Exportar novos componentes. |

### Estrategia de dados (useAnnualDRE)

Para evitar 12 chamadas RPC separadas, o hook fara:
1. Uma unica query em `sales_records` com filtro de `payment_date` no ano inteiro, agrupando por mes via `date_trunc('month', payment_date)` -- isso requer uma **nova RPC** `get_annual_dre_summary` que retorna os totais mensais.
2. Uma query em `financial_entries` filtrando `reference_month` entre Jan e Dez do ano, agrupando por mes e categoria no client.
3. Uma query em `dre_config` para buscar os parametros de custo (ja existe via `useDREConfig`).

### Nova RPC (migration)

```sql
CREATE OR REPLACE FUNCTION public.get_annual_dre_summary(
  p_pdv_ids uuid[],
  p_year integer
)
RETURNS TABLE(
  month_start date,
  faturamento numeric,
  deducoes numeric,
  sales_count bigint,
  card_revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    date_trunc('month', payment_date)::date as month_start,
    COALESCE(SUM(amount), 0) as faturamento,
    COALESCE(SUM(COALESCE(refund_amount, 0)), 0) as deducoes,
    COUNT(*) as sales_count,
    COALESCE(SUM(CASE WHEN payment_method = 'creditCard' THEN amount ELSE 0 END), 0) as card_revenue
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= make_date(p_year, 1, 1)::timestamp
    AND payment_date < make_date(p_year + 1, 1, 1)::timestamp
    AND status != 'Cancelled'
  GROUP BY date_trunc('month', payment_date)
  ORDER BY month_start
$$;
```

Isso consolida 12 chamadas em 1, retornando no maximo 12 linhas.

### Graficos (Recharts)

Todos os graficos seguem o padrao existente do projeto (ver `src/components/dashboard/SalesByDayChart.tsx`), usando `ChartContainer` do Shadcn com `ChartConfig` para cores e legendas. Tooltips customizados com formatacao BRL.

### Nenhuma alteracao de RLS necessaria

A nova RPC usa `SECURITY DEFINER` com a mesma logica de `pdv_ids` filtrados pelo hook (que ja respeita permissoes via query de PDVs).

---

## Resultado esperado

- Pagina Financeiro com 3 abas claras
- Aba Resumo: visao executiva anual com graficos de tendencia
- Aba DRE: demonstrativo mensal detalhado (funcionalidade atual preservada)
- Aba Despesas: gestao de lancamentos (funcionalidade atual preservada)
- Performance otimizada com RPC anual (1 query vs 12)
