

## Reverter Última Rodada de Uploads de Estoque e Restaurar Compras

### Contexto

4 uploads de estoque foram processados em 2026-04-11:
- `35381038` — ESTOQUE-TATUAPE.xlsx (Tatuapé, 02:56)
- `8ddd9146` — ESTOQUE-EXTRARICARDOJAFET.xlsx (Extra, 02:56)
- `81885bde` — ESTOQUE-TIETE.xlsx (Tietê, 02:56)
- `750e1c2a` — api-stock-2026-04-11 (Tatuapé API, 03:01)

Esses uploads geraram deduções incorretas em 12 itens de pré-estoque (compras). O fix anterior (`deletedPreviousRecords > 0`) está correto no código, mas a rodada inteira precisa ser desfeita nos dados.

### Mudanças (apenas dados — sem alteração de código)

**1. Restaurar saldo das compras (pre_stock)**
- UPDATE nos 12 itens que tiveram `remaining_quantity` reduzida durante o período 02:56–02:58:
  - `remaining_quantity` volta para `quantity`
  - `status` volta para `'pending'`
  - `allocated_pdv_id` volta para `NULL`
- Filtro: `WHERE remaining_quantity < quantity AND updated_at >= '2026-04-11 02:56:00' AND updated_at <= '2026-04-11 02:58:00'`
- **Não toca** nos 2 itens Motorola alocados legitimamente em 2026-04-07

**2. Deletar stock_records dos 4 uploads**
- DELETE de `stock_records` onde `upload_id` IN dos 4 IDs acima
- Também os 4 registros órfãos do upload antigo do Tatuapé

**3. Deletar stock_history de 2026-04-11**
- DELETE de `stock_history` onde `snapshot_date = '2026-04-11'` (3 PDVs × 4 marcas = 12 registros)
- Snapshots anteriores (04-10, 04-07) preservados

**4. Deletar os 4 uploads**
- DELETE de `uploads` com os 4 IDs

**5. Limpar arquivos de storage** (se possível)
- Remover os arquivos das planilhas do bucket `uploads`

### Resultado
- Estoque dos 3 PDVs volta ao estado anterior (sem stock_records — próximo upload recria)
- stock_history mantém snapshots até 2026-04-10
- 12 itens de compras restaurados com saldo original
- Lógica de código já corrigida previne reincidência

### Detalhes Técnicos
Todas as operações serão feitas via ferramenta de inserção/update do banco (não migration, pois são operações de dados). As queries serão executadas na seguinte ordem para respeitar integridade referencial:
1. UPDATE pre_stock
2. DELETE stock_records
3. DELETE stock_history
4. DELETE uploads

