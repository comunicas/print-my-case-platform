
# Zerar Dados e Corrigir a Edge Function ingest-stock

## Diagnostico Atual

Estado do banco confirmado por queries:

| Tabela | Registros | Problema |
|---|---|---|
| uploads | 99.143 | 99.141 criados pela API (1 por slot por chamada) |
| sales_records | 1.032 | 873 planilha Out/2025 (PRINTMYCASE GERAL) + 159 via API/planilha Feb/2026 |
| stock_records | 259 | 85 planilha (PRINTMYCASE GERAL) + 174 via API fragmentados |
| stock_history | 149 | Snapshots gerados por cada chamada de API |

Origem dos dados de vendas por PDV:
- PRINTMYCASE GERAL: 873 registros de planilha (Out 2025) - fonte: spreadsheet
- Boulevard Tatuape: 56 registros de planilha (Feb 2026) + 46 via API
- Tiete Plaza: 57 via API

Problema raiz na `ingest-stock`: cada chamada de slot individual cria 1 upload separado, resultando em 99.141 uploads fantasma.

---

## Plano de Execucao

### Parte 1 - Zerar todos os dados

Remover em ordem correta (dependencias de chave estrangeira):

1. Deletar `stock_history` (todos os snapshots)
2. Deletar `stock_records` (todos os registros de estoque)
3. Deletar `sales_records` (todos os registros de vendas)
4. Deletar `upload_anomalies` (ja esta vazio, mas garantir)
5. Deletar todos os `uploads` (as 99.143 entradas)

Isso libera a plataforma para receber planilhas novas e limpas.

### Parte 2 - Corrigir a Edge Function ingest-stock

O problema esta no passo 6 da funcao atual: ela cria um `upload` para CADA slot individual enviado. Com 85 slots por PDV, isso gera 85 uploads por ciclo de sync.

**Solucao: reutilizar ou consolidar o upload do dia**

Logica nova:
- Ao receber um slot, verificar se ja existe um upload de API para aquele PDV na data de hoje com `file_name` no padrao `api-stock-YYYY-MM-DD`
- Se existir, reutilizar o `upload_id` e apenas incrementar `records_count`
- Se nao existir, criar um novo

Isso reduz de N uploads por dia para 1 upload por PDV por dia.

### Parte 3 - Corrigir a logica do stock_history

Atualmente, o history grava `total_quantity: quantity` (valor de um unico slot). O correto e somar todas as quantidades do brand naquele PDV naquele dia.

**Logica nova para o history:**
- Apos inserir o slot, fazer uma query `SUM(quantity)` e `COUNT(slots ativos)` para aquele brand+pdv no dia
- Usar esse valor agregado no upsert do `stock_history`

---

## Detalhes Tecnicos

### SQL de limpeza (executado via migracao)

```sql
-- Ordem importa por causa das referencias
DELETE FROM stock_history;
DELETE FROM stock_records;
DELETE FROM sales_records;
DELETE FROM upload_anomalies;
DELETE FROM uploads;
```

### Mudanca na Edge Function ingest-stock

```typescript
// ANTES: cria 1 upload por slot
const { data: upload } = await supabase
  .from("uploads")
  .insert({ file_name: `api-stock-${new Date().toISOString()}`, ... })

// DEPOIS: reutiliza ou cria 1 upload por PDV por dia
const today = new Date().toISOString().split("T")[0];
const dailyFileName = `api-stock-${today}`;

const { data: existingUpload } = await supabase
  .from("uploads")
  .select("id, records_count")
  .eq("pdv_id", pdv.id)
  .eq("file_name", dailyFileName)
  .maybeSingle();

let uploadId: string;
if (existingUpload) {
  // Incrementar contador
  await supabase.from("uploads").update({
    records_count: (existingUpload.records_count ?? 0) + 1
  }).eq("id", existingUpload.id);
  uploadId = existingUpload.id;
} else {
  // Criar novo upload do dia
  const { data: newUpload } = await supabase.from("uploads").insert({
    file_name: dailyFileName,
    records_count: 1,
    ...
  }).select("id").single();
  uploadId = newUpload.id;
}
```

### Correcao do stock_history

```typescript
// Somar total do brand apos inserir o slot
const { data: brandTotals } = await supabase
  .from("stock_records")
  .select("quantity, is_active")
  .eq("pdv_id", pdv.id)
  .ilike("product_name", `${brand}%`); // ou filtrar pelo brand

const totalQty = brandTotals.reduce((sum, r) => sum + r.quantity, 0);
const activeSlots = brandTotals.filter(r => r.is_active).length;

// Upsert com valores corretos
```

---

## Arquivos que serao alterados

- `supabase/functions/ingest-stock/index.ts` - correcao da logica de upload e history
- Migracao SQL para zerar os dados
