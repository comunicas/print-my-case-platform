

## Análise de Duplicatas: 284 transações NÃO estão corretas

### Diagnóstico

O número real de transações únicas no período 01/03 - 29/03 é **203**, não 284.

Existem **81 order_numbers duplicados** que aparecem em dois PDVs diferentes:

| PDV | device_id | source | registros |
|-----|-----------|--------|-----------|
| BOULEVARD TATUAPE | 1001013 | api | 63 |
| BOULEVARD TATUAPE | 1001013 | spreadsheet | 19 |
| Tietê Plaza Shopping | 1001543 | spreadsheet | 120 |
| **Tietê Plaza Shopping** | **1001013** ← errado | spreadsheet | **82** |

**Causa raiz**: Uma planilha contendo vendas da máquina `1001013` (Boulevard) foi enviada selecionando "Tietê Plaza Shopping" como PDV. O sistema salvou os 82 registros como se fossem do Tietê. A deduplicação não detectou porque verifica `order_number` apenas dentro do mesmo `pdv_id`.

### Correção proposta

**1. Limpeza dos dados duplicados (migration SQL)**
- Deletar os 82 registros em Tietê que têm `device_id = '1001013'` (máquina do Boulevard)
- Isso corrige a contagem para 203 transações

**2. Prevenir futuras duplicatas cross-PDV (`process-spreadsheet/index.ts`)**
- Na deduplicação, verificar `order_number` em TODOS os PDVs da organização, não apenas no PDV selecionado
- Se um order_number já existe em outro PDV da mesma org, ignorar o registro (é duplicata cross-PDV)
- Adicionar log/warning quando isso acontece para alertar o operador

### Detalhamento técnico

**Migration**:
```sql
DELETE FROM sales_records
WHERE pdv_id = 'b2c3d4e5-f6a7-8901-bcde-f23456789012'  -- Tietê
  AND device_id = '1001013'                              -- máquina do Boulevard
  AND source = 'spreadsheet';
```

**Edge function** — expandir deduplicação (linhas 710-728):
- Buscar todos os PDVs da mesma organização
- Verificar order_numbers existentes em qualquer PDV da org (não só no pdvId do upload)
- Filtrar registros duplicados antes da inserção

