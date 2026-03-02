

# Auditoria do DRE e Financeiro: Problemas Criticos Encontrados

## Problemas Identificados

### 1. CRITICO: Vendas canceladas inflam o faturamento

O DRE soma `amount` de TODAS as vendas sem filtrar por status. Os dados reais mostram:

| Status | Qtd | Valor Total | Refund |
|--------|-----|-------------|--------|
| Completed | 674 | R$ 48.142 | R$ 69 |
| Cancelled | 330 | R$ 23.547 | R$ 0 |
| Refunded | 8 | R$ 609 | R$ 609 |

As 330 vendas canceladas (R$ 23.547) estao sendo contadas como faturamento sem nenhuma deducao correspondente, pois `refund_amount` delas e zero. Isso infla o faturamento bruto em ~33%.

**Correcao:** Filtrar vendas canceladas (`status != 'Cancelled'`) na query do DRE. Vendas com status "Refunded" ja possuem o `refund_amount` preenchido corretamente e devem continuar sendo contabilizadas normalmente (faturamento + deducao).

### 2. CRITICO: Limite de 1000 linhas do banco de dados

Ja existem 1012 vendas no total. A query do DRE busca todas as vendas do mes sem paginacao, e o banco retorna no maximo 1000 linhas por padrao. Conforme o volume cresce, os totais ficarao incorretos silenciosamente.

**Correcao:** Usar uma funcao SQL (RPC) que faz a agregacao diretamente no banco, retornando apenas os totais sem limite de linhas.

### 3. MENOR: Desconto ignorado no calculo

Os campos `discount_amount` e `actual_paid_amount` existem nas vendas mas nao sao usados no DRE. Embora a contabilidade do faturamento bruto normalmente use o valor cheio (`amount`), os descontos poderiam ser apresentados como uma linha de deducao separada para maior transparencia.

### 4. MENOR: Formulario com bug no Select de categoria

O Select de categoria no formulario de edicao usa `defaultValue` em vez de `value`, fazendo com que ao editar uma despesa existente, o dropdown pode nao refletir a categoria salva.

### 5. MENOR: Cache do DRE nao invalida apos CRUD de entries

As mutations de create/update/delete invalidam `["financial-entries"]`, mas o DRE usa `useFinancialEntries` internamente, entao os totais recalculam corretamente. Porem, a `queryKey` `["dre-sales"]` esta correta pois so depende de sales_records.

## Solucao

### Passo 1: Criar funcao SQL para agregar vendas

Nova funcao RPC que calcula faturamento e deducoes diretamente no banco, eliminando o limite de 1000 linhas e filtrando vendas canceladas:

```sql
CREATE OR REPLACE FUNCTION get_dre_sales_summary(
  p_pdv_ids uuid[],
  p_start_date timestamptz,
  p_end_date timestamptz
) RETURNS TABLE(faturamento numeric, deducoes numeric) AS $$
  SELECT
    COALESCE(SUM(amount), 0) as faturamento,
    COALESCE(SUM(refund_amount), 0) as deducoes
  FROM sales_records
  WHERE pdv_id = ANY(p_pdv_ids)
    AND payment_date >= p_start_date
    AND payment_date <= p_end_date
    AND status != 'Cancelled'
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public';
```

### Passo 2: Atualizar useDRE para usar a funcao RPC

Substituir a query atual (que busca todas as vendas e soma no JS) por uma chamada `supabase.rpc('get_dre_sales_summary', ...)` que retorna apenas os dois totais.

### Passo 3: Corrigir Select do formulario

Trocar `defaultValue` por `value` no Select de categoria do `FinancialEntryForm`.

## Resumo tecnico

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL | Criar funcao `get_dre_sales_summary` |
| `src/hooks/useDRE.ts` | Usar RPC em vez de query direta; remover loop JS |
| `src/components/financeiro/FinancialEntryForm.tsx` | Corrigir Select para usar `value` |

- **Arquivos modificados:** 2 + 1 migration
- **Risco:** Baixo -- corrige calculos incorretos sem alterar estrutura
- **Impacto:** Faturamento bruto correto (sem vendas canceladas), sem limite de linhas, formulario de edicao funcional

