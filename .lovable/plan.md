

## Limpeza de Uploads Duplicados e Teste de Upload

### Problemas Encontrados

| Problema | Detalhes |
|----------|---------|
| ESTOQUE classificado como vendas | 5 uploads de ESTOQUE-TIETE.xlsx + 1 ESTOQUE-TATUAPE.xlsx foram salvos como `type=sales`, gerando 969 registros falsos em `sales_records` |
| Uploads com 0 registros | 10 uploads de REVENUE que processaram 0 registros (deduplicação removeu tudo) — são lixo histórico |
| Uploads de estoque duplicados | ESTOQUE-TATUAPE e ESTOQUE-TIETE têm 2 uploads cada (stock) — o mais antigo é redundante |
| Uploads de vendas duplicados | REVENUE-TATUAPE tem 12 uploads, REVENUE-TIETE tem 11 — os com 0 registros são redundantes |
| REVENUE-EXTRARICARDOJAFET duplicado | 2 uploads (8 + 2 registros) — o mais antigo pode ser redundante |
| Erro Stock.tsx | Erro transiente de import dinâmico — não requer correção de código |

### Plano de Limpeza (via insert tool)

**1. Deletar sales_records dos uploads ESTOQUE classificados como vendas**

Remover os 969 registros falsos criados por uploads ESTOQUE processados como vendas:
```sql
DELETE FROM sales_records WHERE upload_id IN (
  'ae30073c...', '38095325...', '7582e837...', 
  '89d6b982...', '92bff7ff...', '69ff2424...'
);
```

**2. Deletar os uploads ESTOQUE com type=sales**

```sql
DELETE FROM uploads WHERE file_name LIKE 'ESTOQUE%' AND type = 'sales';
```

**3. Deletar uploads de vendas com 0 registros**

10 uploads que não importaram nada — são tentativas falhadas/deduplicadas:
```sql
DELETE FROM uploads WHERE records_count = 0 AND type = 'sales';
```

**4. Deletar uploads de estoque antigos duplicados**

Para ESTOQUE-TATUAPE e ESTOQUE-TIETE, manter apenas o mais recente:
```sql
DELETE FROM stock_records WHERE upload_id IN ('0da369ed...', 'b2f1de95...');
DELETE FROM stock_history WHERE upload_id IN ('0da369ed...', 'b2f1de95...');
DELETE FROM uploads WHERE id IN ('0da369ed...', 'b2f1de95...');
```

**5. Testar upload ponta a ponta**

Usar a Edge Function `process-spreadsheet` via curl para testar o reprocessamento do upload mais recente do Extra Ricardo Jafet, confirmando que o machine_id `1000838` está correto.

### Resultado Esperado

- ~969 registros falsos de vendas removidos (ESTOQUE processado como sales)
- ~12 uploads vazios/duplicados removidos
- Dados de estoque sem duplicação
- Upload do Extra Ricardo Jafet confirmado funcional

