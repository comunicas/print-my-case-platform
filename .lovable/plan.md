

## Fix: Lista de Compras Vazia (Erro 400)

### Causa Raiz

A query `select("*, pdv:pdvs(id, name)")` retorna erro 400 porque a tabela `pre_stock` não tem foreign key para `pdvs`. O PostgREST não consegue inferir a relação, e a query falha silenciosamente — a lista fica vazia apesar do insert funcionar.

### Solução

Adicionar a foreign key `pre_stock.pdv_id → pdvs.id` via migration. Isso permite que o join funcione corretamente.

### Mudanças

1. **Migration SQL**: Adicionar foreign key constraint
   ```sql
   ALTER TABLE public.pre_stock
   ADD CONSTRAINT pre_stock_pdv_id_fkey
   FOREIGN KEY (pdv_id) REFERENCES public.pdvs(id) ON DELETE SET NULL;
   ```

2. **Nenhuma mudança no código** — o hook `usePreStock.ts` já tem a query correta, só precisa da FK no banco.

### Resultado

- A query deixa de retornar 400
- Os registros de compra aparecem na lista com o nome do PDV
- O registro de teste (APPLE iPhone 15 Pro, qtd 5, Extra Ricardo Jafet) ficará visível

