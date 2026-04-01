

## Plano: Limpeza + Refatoração do Estoque

### Passo 1 — Você sobe as planilhas (ação manual)

Suba as planilhas atualizadas de estoque (REPORT-SLOT.xlsx) para cada PDV:
1. Boulevard Tatuapé
2. Tietê Plaza

O sistema atual já substitui todos os `stock_records` do PDV ao subir planilha de estoque.

### Passo 2 — Limpeza de dados residuais

Após os uploads, executar queries para garantir consistência:

1. **Limpar `stock_history` duplicado/incorreto** — remover snapshots históricos com dados inflados pelas duplicatas anteriores
2. **Regenerar `stock_history` do dia atual** a partir dos `stock_records` recém-importados
3. **Limpar `uploads` órfãos** de estoque que não têm `stock_records` correspondentes

### Passo 3 — Unificar lógica de extração de marca

Hoje existem **3 implementações separadas** de `extractBrand`:
- `src/lib/productNormalization.ts` → `extractBrandFromProductName()` (frontend)
- `supabase/functions/ingest-stock/index.ts` → `extractBrand()` (API)
- `supabase/functions/process-spreadsheet/index.ts` → `extractBrandFromProduct()` (planilha)

Cada uma tem listas de marcas ligeiramente diferentes (ex: `ingest-stock` inclui LG, HUAWEI, SONY, NOKIA; `process-spreadsheet` inclui REALME mas não os outros).

**Ação**: Padronizar as 3 funções para usar a mesma lista de marcas e mesma lógica:
- Marcas: APPLE, SAMSUNG, XIAOMI, MOTOROLA, REALME + fallback "OUTROS"
- Detecção por linha de produto: IPHONE/MACBOOK/IPAD/AIRPODS→APPLE, GALAXY→SAMSUNG, REDMI/POCO/MI→XIAOMI, MOTO→MOTOROLA

### Passo 4 — Adicionar unique constraint no `stock_history`

O upsert em `process-spreadsheet` usa `onConflict: 'pdv_id,snapshot_date,brand'` mas não existe constraint unique correspondente no banco. Isso significa que o upsert **não funciona** e cria duplicatas.

**Ação**: Criar migration com unique constraint:
```sql
ALTER TABLE stock_history 
ADD CONSTRAINT stock_history_pdv_date_brand_unique 
UNIQUE (pdv_id, snapshot_date, brand);
```

### Passo 5 — Garantir que `process-spreadsheet` atualiza `stock_history` corretamente

Após a constraint, o upsert passará a funcionar. Validar que o fluxo é:
1. Deleta `stock_records` do PDV
2. Insere novos `stock_records`
3. Upsert `stock_history` com totais por marca (agora funciona com a constraint)

### Passo 6 — Limpar `stock_history` duplicado historicamente

Após criar a constraint, executar query para manter apenas o registro mais recente por `(pdv_id, snapshot_date, brand)`:

```sql
DELETE FROM stock_history a
USING stock_history b
WHERE a.pdv_id = b.pdv_id 
  AND a.snapshot_date = b.snapshot_date 
  AND a.brand = b.brand
  AND a.created_at < b.created_at;
```

Depois aplicar a constraint.

### Resumo de alterações

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/ingest-stock/index.ts` | Padronizar `extractBrand` (adicionar REALME, remover marcas irrelevantes) |
| `supabase/functions/process-spreadsheet/index.ts` | Já tem REALME — apenas confirmar consistência |
| Migration SQL | Limpar duplicatas + adicionar UNIQUE constraint em `stock_history` |
| Queries de limpeza | Remover `stock_history` e `uploads` órfãos |

