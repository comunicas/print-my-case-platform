

## Corrigir Edge Function: Parar de Apagar Histórico ao Subir Planilha

### Problema

A edge function `process-spreadsheet` apaga **todos** os uploads e registros anteriores do mesmo PDV/tipo antes de inserir os novos dados (linhas 649-686 para vendas, 802-838 para estoque). Isso destrói o histórico ao invés de apenas adicionar os dados faltantes.

### Causa Raiz

Blocos `DELETE PREVIOUS RECORDS` nas linhas 649-686 (sales) e 802-838 (stock):
- Busca todos os uploads anteriores do mesmo PDV/tipo
- Deleta todos os `sales_records` / `stock_records` vinculados
- Deleta os uploads anteriores

A deduplicação existente (linhas 740-784) só verifica `source = 'api'`, ignorando registros já importados via planilha.

### Correção

**`supabase/functions/process-spreadsheet/index.ts`**

1. **Remover os blocos de DELETE de uploads e records anteriores** (tanto para sales quanto stock)

2. **Expandir deduplicação para incluir `source = 'spreadsheet'`**: Ao invés de filtrar apenas `source = 'api'`, verificar TODOS os `order_number` existentes para o PDV (sem filtro de source). Isso garante que registros já importados por planilhas anteriores não sejam duplicados.

3. **Para estoque**: Estoque é snapshot (estado atual), então o comportamento correto é **substituir os records do mesmo upload_id** (que não existe pois é novo) — na prática, só inserir. Mas como pode haver uploads anteriores com os mesmos slots, usar upsert ou deduplicar por `device_id + slot_number` para o PDV.

### Lógica Revisada

**Sales**:
```
// Antes: deletava tudo e inseria
// Depois: busca order_numbers existentes (qualquer source) e só insere os novos
```

**Stock**:
```
// Antes: deletava records e uploads anteriores
// Depois: deleta apenas stock_records anteriores do mesmo PDV (para refletir snapshot atual)
// Mantém uploads anteriores intactos para histórico
```

O estoque é diferente de vendas — estoque é um snapshot do estado atual da máquina, então faz sentido substituir os records antigos. Mas os **uploads** anteriores devem ser mantidos como histórico. Apenas os `stock_records` são substituídos (não os uploads).

### Resumo das mudanças

- Remover deleção de uploads anteriores (ambos os tipos)
- Sales: expandir dedup para checar todos os order_numbers existentes (não só API)
- Stock: manter deleção apenas de stock_records anteriores do PDV (snapshot), mas preservar uploads

