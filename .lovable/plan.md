## Objetivo

Apagar todos os registros de vendas que vieram da sincronização via API, mantendo intactos os dados de planilha e manuais, para você re-sincronizar mês a mês com a lógica corrigida.

## O que será feito

1. **Deletar registros `source='api'`** de `sales_records` (100 linhas atualmente).
2. **Deletar uploads do tipo API** (`uploads` onde `kind = 'api_revenue'` ou equivalente) para limpar o histórico de sincronizações na tela de Uploads e evitar referências órfãs.
3. **Não tocar** em `source='spreadsheet'` (1.822 linhas) nem `source='manual'` (2 linhas).

## O que NÃO será afetado

- Vendas vindas de planilha e manuais.
- Estoque, financeiro, organizações, PDVs, usuários.
- Configuração da chave de API (continua salva, pronta para re-sync).

## Validação pós-execução

- `SELECT source, COUNT(*) FROM sales_records GROUP BY source` → deve mostrar apenas `spreadsheet` e `manual`.
- Tela de Uploads não lista mais sincronizações de API antigas.

## Próximo passo (você executa)

Acessar a tela de sincronização e rodar mês a mês por PDV. A nova versão do `ingest-revenue` já garante:
- Filtro estrito por mês local (São Paulo).
- Pular pedidos que já existem via planilha/manual.
- Não marcar como Concluído pedidos sem pagamento.
