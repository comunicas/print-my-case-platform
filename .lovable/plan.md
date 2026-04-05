

## Correção: RPCs do DRE Não Excluem Status "Cancelado"

### Problema Raiz

As duas RPCs financeiras (`get_dre_sales_summary` e `get_annual_dre_summary`) filtram apenas `status != 'Cancelled'` (inglês), mas o banco tem **61 registros com status `'Cancelado'`** (português) que estão sendo **contados como receita**.

| Status no banco | Registros | Tratamento atual | Correto |
|-----------------|-----------|-----------------|---------|
| Cancelled | 69 | Excluído ✅ | Excluído |
| Cancelado | 61 | **Incluído ❌** | Excluído |
| Completed | 189 | Incluído ✅ | Incluído |
| Concluído | 78 | Incluído ✅ | Incluído |
| Pendente | 4 | Incluído ⚠️ | Excluído |
| Refunded | 3 | Incluído ⚠️ | Excluído |

Exemplo em Abril/26: a receita mostra R$ 2.856,20 (38 transações) quando deveria ser R$ 2.177,10 (29 transações) — os 9 registros "Cancelado" estão inflando R$ 679,10.

### Correção

**Migration SQL** — alterar as duas RPCs para usar allowlist em vez de blocklist:

```sql
-- Substituir: AND status != 'Cancelled'
-- Por: AND status IN ('Completed', 'Pago', 'Concluído')
```

Ambas as funções (`get_dre_sales_summary` e `get_annual_dre_summary`) receberão a mesma correção, garantindo que apenas vendas efetivamente pagas sejam contabilizadas.

### Impacto

- Receitas e margens corrigidas em todos os meses e PDVs
- Registros "Cancelado", "Pendente" e "Refunded" deixam de inflar o faturamento
- Sem alteração no frontend — a correção é 100% nas RPCs do banco

