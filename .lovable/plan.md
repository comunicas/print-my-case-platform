

# Deduplicacao process-spreadsheet: ignorar registros que ja existem via API

## Contexto

A Edge Function `process-spreadsheet` atualmente insere todos os registros validos da planilha sem verificar se ja existe um registro com o mesmo `order_number` e `pdv_id` vindo da API (`source = 'api'`). Isso causou os 71 duplicados que corrigimos manualmente.

## Mudanca

Adicionar uma etapa de deduplicacao no fluxo de vendas (entre a filtragem de anomalias e a insercao em batch), que:

1. Coleta todos os `order_number` dos registros limpos (pos-anomalia)
2. Consulta `sales_records` para encontrar quais desses `order_number` ja existem com `source = 'api'` para o mesmo `pdv_id`
3. Filtra os registros da planilha, removendo os que ja possuem correspondente via API
4. Loga quantos registros foram ignorados por duplicidade
5. Adiciona o campo `source: 'spreadsheet'` explicitamente nos registros inseridos (ja e o default da coluna, mas torna explicito)

## Detalhes tecnicos

### Arquivo: `supabase/functions/process-spreadsheet/index.ts`

Apos a filtragem de anomalias (linha ~715) e antes do batch insert (linha ~742), inserir:

```text
cleanRecords (pos-anomalia)
    |
    v
[NOVO] Coletar order_numbers unicos
    |
    v
[NOVO] SELECT order_number FROM sales_records 
       WHERE pdv_id = ? AND source = 'api' 
       AND order_number IN (...)
    |
    v
[NOVO] Filtrar cleanRecords removendo os que tem match
    |
    v
Batch insert (registros sem duplicata)
```

A consulta sera feita em chunks de 500 order_numbers para respeitar limites do Supabase. O campo `source: 'spreadsheet'` sera adicionado a cada registro antes da insercao.

### Impacto

- Zero alteracao no frontend
- Uploads futuros ignoram automaticamente pedidos ja ingeridos via API
- Log claro de quantos registros foram ignorados por duplicidade
- Contagem de `records_count` reflete apenas registros efetivamente inseridos

