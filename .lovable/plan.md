# Plano para corrigir a atualização via API

## O que encontrei
- O upload **2026-05** está trazendo registros que caem em **abril no horário de São Paulo**. Confirmei linhas do tipo `upload_period = 2026-05` com `dia_local` entre **2026-04-13 e 2026-04-30**.
- A causa principal é o fluxo atual da função `ingest-revenue`: ela busca por mês na API, mas **não faz uma segunda validação local após o parse da data**. Como os timestamps vêm em UTC, parte dos pedidos vira “dia anterior” no Brasil.
- Também há divergência entre o fluxo da API e o fluxo manual:
  - o manual faz **deduplicação contra registros já existentes** na organização;
  - a API hoje só faz **upsert entre registros `source='api'`**, então ela **não evita colisão com dados manuais/spreadsheet** já inseridos.
- No banco, **não achei duplicatas internas de API** por `(order_number, pdv_id)` no dia analisado; o problema parece ser mais de **mês/timezone + coexistência com base manual** do que de repetição do mesmo pedido dentro da própria API.
- Para **08/05**, no agrupamento por dia local, a base API atual mostra **11 vendas concluídas** entre os 3 PDVs (2 + 5 + 4). Então o “7 vendas” não está batendo com o que foi sincronizado hoje.

## O que vou implementar

### 1) Fechar o filtro pelo mês escolhido de forma robusta
- Reescrever o parse de datas na `ingest-revenue` para usar parsing explícito e consistente.
- Converter todas as datas relevantes para a referência local correta antes de decidir o mês.
- Após mapear cada pedido, **descartar qualquer registro cuja data efetiva local não pertença ao mês selecionado**.
- Definir uma regra única para qual campo de data manda no enquadramento do mês:
  - priorizar `payment_date` para vendas pagas/concluídas;
  - usar fallback controlado apenas quando isso já for compatível com a regra manual.

### 2) Fazer a API seguir exatamente as regras do upload manual
- Alinhar a normalização da API com a mesma lógica do `process-spreadsheet` para:
  - status canônicos;
  - formas de pagamento canônicas;
  - datas válidas;
  - campos monetários.
- Garantir que os agregados continuem contando apenas os status válidos de venda concluída, como já ocorre nas regras atuais.

### 3) Impedir duplicação com dados já existentes na aplicação
- Adicionar uma etapa de deduplicação da API contra `sales_records` já gravados, reutilizando a lógica conceitual do upload manual.
- A regra base será por `order_number`, respeitando o escopo organizacional/PDV já adotado no sistema.
- Onde fizer sentido, a sincronização por API deve **atualizar o registro existente** em vez de criar um paralelo só porque a origem é diferente.
- Se for necessário para manter consistência, vou ajustar a função RPC do banco para suportar essa estratégia sem quebrar o índice parcial atual.

### 4) Normalizar e higienizar os dados já sincronizados
- Criar um passo de saneamento para os uploads via API já gerados do período afetado:
  - remover ou desvincular registros fora do mês local correto;
  - reprocessar com a nova regra;
  - garantir que o card do upload mostre somente o recorte correto do mês.
- Revisar especialmente os registros de **08/05** para reconciliar o total pago com a regra manual.

### 5) Melhorar diagnóstico para próximas sincronizações
- Registrar no `sync_summary`:
  - quantos registros foram descartados por estarem fora do mês;
  - quantos foram pulados por deduplicação com base existente;
  - quantos foram atualizados vs inseridos;
  - distribuição por status/pagamento após normalização.
- Isso vai deixar claro, no próximo teste, se a API retornou mais coisa do que deveria ou se o filtro local excluiu corretamente.

## Arquivos / áreas que devem ser ajustados
- `supabase/functions/ingest-revenue/index.ts`
- `supabase/migrations/...` para evoluir a RPC/estratégia de upsert e saneamento, se necessário
- possivelmente a visualização do card/consulta do upload, **se** o resumo estiver confiando em contagem antiga em vez do recorte saneado

## Resultado esperado
- Ao escolher **2026-05**, o upload API mostrará **somente vendas pertencentes a maio na referência local correta**.
- A sincronização deixará de criar sobreposição com dados já inseridos manualmente.
- Os números de “pagos” e total diário passarão a seguir a **mesma regra do fluxo manual**, sem inflar por timezone ou por coexistência de origem.
- Depois da limpeza, a atualização via API vira apenas um atalho operacional, sem mudar a regra de negócio.

## Detalhes técnicos
- O ponto crítico é que o banco e a API estão lidando com timestamps UTC, mas a leitura operacional do negócio é em **America/Sao_Paulo**.
- A correção precisa acontecer em **duas camadas**:
  1. **parse + filtro local** na função de ingestão;
  2. **deduplicação/upsert compatível com a base manual existente**.
- Hoje a RPC `upsert_api_sales_records` só resolve conflito para `source='api'`, então ela **não protege contra duplicação entre API e manual/spreadsheet**.
- Também vou manter a auditoria no `sync_summary` para facilitar a validação com o teu caso de 08/05.
