

## Limpar Uploads Duplicados de Estoque

### Dados

| PDV | Dia | Registros | Deveria ter |
|-----|-----|-----------|-------------|
| Boulevard | 2026-02-22 | 8,910 | 1 |
| Tietê | 2026-02-21 | 3,424 | 1 |
| Boulevard | 2026-03-06 | 1,698 | 1 |
| Boulevard | 2026-03-20 | 704 | 1 |
| (outros) | ... | ~48 | 1 cada |

**Total**: 14,784 → manter 52, deletar 14,732

### Ação

Executar uma query DELETE que mantém apenas o upload mais recente (por `uploaded_at`) de cada par PDV/dia:

```sql
DELETE FROM uploads
WHERE type = 'stock'
  AND id NOT IN (
    SELECT DISTINCT ON (pdv_id, uploaded_at::date) id
    FROM uploads
    WHERE type = 'stock'
    ORDER BY pdv_id, uploaded_at::date, uploaded_at DESC
  );
```

Isso usa `DISTINCT ON` para selecionar o registro mais recente de cada PDV/dia e deleta todos os outros.

### Sem risco

- Os `stock_records` referenciam `upload_id` mas não têm foreign key com CASCADE, então a deleção dos uploads duplicados **não** apaga stock_records
- Os uploads mantidos são os mais recentes de cada dia (que correspondem aos stock_records atuais)

### Resultado esperado

- Tabela `uploads` (tipo stock): de 14,784 → 52 registros
- Nenhum impacto nos dados de estoque ou vendas

