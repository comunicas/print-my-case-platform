

## Limpar Dados Residuais de Estoque

### O que resta

- **1 upload** automático da API (Boulevard, hoje) — será substituído ao subir a planilha
- **31 stock_records** do Boulevard (API de hoje) — serão substituídos pela planilha
- **198 stock_history** — histórico acumulado que precisa ser limpo se você quer começar do zero

### Plano

**Opção A — Limpar tudo (recomendado para normalização completa):**

1. Deletar todos os `stock_history` existentes (dados históricos antigos podem estar inflados/incorretos)
2. Deletar os `stock_records` restantes (31 do Boulevard)
3. Deletar o upload automático da API de hoje
4. Após isso, subir as planilhas novas dos dois PDVs

Execução via queries de limpeza (não migration — são dados, não schema):
```sql
DELETE FROM stock_history;
DELETE FROM stock_records;
DELETE FROM uploads WHERE type = 'stock';
```

**Opção B — Manter histórico, só limpar records:**

Deletar apenas `stock_records` e o upload de hoje, mantendo o `stock_history` para ter histórico nos gráficos. Subir as planilhas novas depois.

### Resultado esperado (Opção A)

Todas as 3 tabelas zeradas → subir planilhas gera dados limpos e consistentes desde o dia 1.

