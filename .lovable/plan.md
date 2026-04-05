

## Etapa 5 — Rotina de Limpeza de Uploads de Estoque Antigos

### Estado Atual

| PDV | Uploads de Estoque | Mais Recente | Antigos para Remover |
|-----|--------------------|--------------|---------------------|
| Boulevard Tatuapé | 6 | `api-stock-2026-04-05` | 5 (api-stock 01-04, ESTOQUE-TATUAPE.xlsx) |
| Extra Ricardo Jafet | 1 | `ESTOQUE-EXTRARICARDOJAFET.xlsx` | 0 |
| Tietê Plaza Shopping | 1 | `ESTOQUE-TIETE.xlsx` | 0 |

Uploads de vendas (1 registro) são **preservados integralmente** — a limpeza aplica-se apenas a estoque.

### Solução

**1. Limpeza imediata** — Script SQL para remover os 5 uploads antigos de estoque do Boulevard e seus `stock_records` + `stock_history` associados.

**2. Lógica automática na Edge Function `process-spreadsheet`** — Após processar um upload de estoque com sucesso, deletar automaticamente uploads de estoque anteriores do mesmo PDV (mantendo apenas o recém-processado).

### Alterações

**Arquivo: `supabase/functions/process-spreadsheet/index.ts`**

Após o bloco de processamento de estoque (após inserir `stock_records` e `stock_history`), adicionar lógica de cleanup:

```text
1. Buscar uploads de estoque do mesmo pdv_id com status 'ready', excluindo o upload atual
2. Para cada upload antigo:
   - DELETE stock_records WHERE upload_id = antigo
   - DELETE stock_history WHERE upload_id = antigo  
   - DELETE arquivo do storage (se existir)
   - DELETE upload record
3. Log quantidade de uploads removidos
```

**Limpeza imediata** — Usar insert tool para deletar os 5 uploads antigos do Boulevard agora.

### Resultado

- Apenas 1 upload de estoque por PDV (o mais recente)
- Limpeza automática a cada novo upload de estoque
- Redução de ~16.000 registros órfãos em `stock_records`

