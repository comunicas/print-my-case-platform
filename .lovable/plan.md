

## Dedução Inteligente de Pré-Estoque + Rastreio de PDV

### Problemas Atuais

1. **Dedução sem comparação**: Ambas as edge functions deduzem com base na quantidade total do novo estoque, não na diferença (aumento). Se o estoque é reenviado com os mesmos valores, deduz novamente.
2. **Sem rastreio de PDV**: Quando o pré-estoque é alocado, não registra para qual PDV foi enviado.

### Solução

#### 1. Migration: Adicionar coluna `allocated_pdv_id` na tabela `pre_stock`

```sql
ALTER TABLE public.pre_stock
ADD COLUMN allocated_pdv_id uuid REFERENCES public.pdvs(id) ON DELETE SET NULL;
```

Armazena o PDV que recebeu o produto quando o status muda para "allocated".

#### 2. Corrigir `process-spreadsheet` — dedução por diferença

Antes de deletar os stock_records antigos, buscar os totais por produto do estoque anterior. Após inserir os novos registros, calcular a diferença (novo - antigo) por produto. Só deduzir pré-estoque se houve aumento real.

**Lógica**:
```text
1. Antes do delete: buscar stock_records antigos do PDV, agrupar qty por product_name
2. Inserir novos registros normalmente
3. Para cada produto: increase = new_qty - old_qty
4. Só deduzir do pre_stock se increase > 0
5. Ao atualizar pre_stock, setar allocated_pdv_id = pdvId
```

#### 3. Corrigir `ingest-stock` — dedução por diferença no slot

A API já deleta o registro antigo do slot antes de inserir. Buscar a quantidade anterior do slot deletado e só deduzir a diferença.

**Lógica**:
```text
1. Antes do delete: buscar qty atual do slot (device_id + slot_number)
2. Deletar e inserir normalmente
3. increase = new_qty - old_qty
4. Só deduzir se increase > 0
5. Ao atualizar pre_stock, setar allocated_pdv_id = pdv.id
```

#### 4. Atualizar UI — mostrar PDV de alocação

Na tabela da aba Compras, quando o status é "Alocado", mostrar o nome do PDV de destino.

**Mudanças**:
- `usePreStock.ts`: incluir `allocated_pdv:pdvs(id, name)` no select
- `PreStockTab.tsx`: exibir "→ PDV Nome" na coluna de PDV quando alocado
- `PreStockItem` interface: adicionar `allocated_pdv_id` e `allocated_pdv`

### Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Adicionar `allocated_pdv_id` à tabela `pre_stock` |
| `supabase/functions/process-spreadsheet/index.ts` | Buscar estoque anterior antes do delete; deduzir só o aumento; setar `allocated_pdv_id` |
| `supabase/functions/ingest-stock/index.ts` | Buscar qty anterior do slot; deduzir só o aumento; setar `allocated_pdv_id` |
| `src/hooks/usePreStock.ts` | Incluir `allocated_pdv` no select |
| `src/components/upload/PreStockTab.tsx` | Mostrar PDV de alocação na coluna |

