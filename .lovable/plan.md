

# Limpeza completa dos dados de vendas

## O que sera apagado

| Tabela | Registros | Detalhes |
|--------|-----------|----------|
| sales_records | 239 | 65 API (Tatuape) + 103 planilha (Tatuape) + 71 API (Tiete) |
| upload_anomalies | 0 | Nenhuma anomalia registrada |
| uploads (tipo sales) | 1 | REVENUE-TATUAPE.xlsx |

Os dados de **estoque** (stock_records, stock_history, uploads tipo stock) serao **mantidos**.

## Detalhes tecnicos

### Passo 1: Apagar registros de vendas
```sql
DELETE FROM sales_records;
```

### Passo 2: Apagar anomalias do upload de vendas
```sql
DELETE FROM upload_anomalies 
WHERE upload_id = '92865b0c-01f9-47bc-b83e-2d4d5be8c854';
```

### Passo 3: Apagar upload de vendas
```sql
DELETE FROM uploads WHERE type = 'sales';
```

### Passo 4: Verificacao
Confirmar que as tabelas estao zeradas e o dashboard reflete os dados limpos.

Apos a limpeza, voce podera subir a nova planilha com os dados corretos. A deduplicacao implementada anteriormente garantira que uploads futuros nao criem duplicatas com dados da API.

