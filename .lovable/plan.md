

## Limpeza de Dados para Teste Limpo

### Escopo

Limpar todos os dados de estoque e uploads da organização para recomeçar com uma planilha correta.

### Dados a Limpar (em ordem de dependências)

1. **`upload_anomalies`** — anomalias vinculadas aos uploads
2. **`sales_records`** — registros de vendas (vinculados a uploads)
3. **`stock_records`** — registros de estoque atuais
4. **`stock_history`** — histórico/snapshots de estoque
5. **`uploads`** — registros de upload
6. **Storage bucket `uploads`** — arquivos físicos das planilhas

Os registros de **`pre_stock`** (compras) serão **mantidos** — são os dados que queremos testar a dedução.

### Implementação

Executar DELETEs via ferramenta de inserção na ordem correta (dependências primeiro). Confirmar contagem antes e depois.

### Resultado

- Banco limpo, sem estoque anterior
- Pré-estoque pendente mantido (iPhone 16 Pro: 14, iPhone 16 Pro Max: 7, iPhone 14 Pro: 7)
- Ao enviar a planilha correta, o estoque será o "primeiro" — old_qty = 0, portanto increase = new_qty
- A dedução automática será acionada com base no estoque total (já que não há estoque anterior)

