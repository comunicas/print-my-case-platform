## Diagnóstico confirmado

O problema **não é falta de dados na base** e **não é bloqueio de acesso**.

O que encontrei:

1. **No snapshot atual, o dashboard não estava consultando “Todos os PDVs” de fato**
   - A requisição capturada para `sales_records` saiu com `pdv_id=in.(b2c3d4e5-f6a7-8901-bcde-f23456789012)`.
   - Esse PDV é **Tietê Plaza Shopping**.
   - Seu usuário está como **super_admin** e **não tem restrição por PDV**, então esse recorte não veio de permissão; veio de **estado de filtro/preferência aplicada na UI**.
   - O hook `useDefaultPdvPreference` autoaplica `preferences.default_pdv` logo no carregamento. Isso pode fazer a tela parecer “consolidada”, mas a query sair filtrada em um único PDV.

2. **Os gráficos ainda usam um caminho legado diferente dos cards/KPIs**
   - Os **KPIs** usam a RPC `get_dashboard_kpis`, que calcula o total no backend.
   - Os **gráficos** ainda fazem leitura bruta de `sales_records` no cliente e depois agregam em memória.
   - Esse caminho ainda aplica `limit(DASHBOARD_SALES_LIMIT)` antes de montar:
     - Vendas por Dia/Mês
     - Heatmap por horário
     - Top Produtos
     - Quick Stats
     - Perdas por dia
   - Resultado: em períodos maiores ou no consolidado multi-PDV, os gráficos podem continuar **subamostrando** mesmo quando os cards estão corretos.

3. **A base tem dados completos para os 3 PDVs**
   - `Concluído`: **1191 vendas** no total
   - Distribuição:
     - **Tietê Plaza Shopping**: 827
     - **BOULEVARD TATUAPE**: 292
     - **Extra Ricardo Jafet**: 72
   - Ou seja: quando o consolidado não mostra tudo, o problema está na **consulta e agregação do dashboard**, não no banco.

## Motivo principal da sua pergunta

Quando você diz que “ao visualizar todos os PDVs juntos” os gráficos ainda faltam dados, hoje existem **duas causas possíveis**:

- **Causa ativa agora no snapshot**: a tela **não estava realmente em todos os PDVs**, porque a query saiu filtrada para um PDV específico.
- **Causa estrutural remanescente**: mesmo quando estiver em “Todos os PDVs” de verdade, os gráficos ainda dependem da query legada limitada e agregada no cliente.

## Plano de correção

1. **Eliminar o filtro silencioso de PDV no dashboard**
   - Revisar a autoaplicação de `default_pdv` para não mascarar o modo consolidado.
   - Garantir que “Todos os PDVs” seja estado explícito e persistente.
   - Deixar a UI indicar sem ambiguidade quando há filtro automático.

2. **Mover os gráficos para fonte canônica no backend**
   - Criar RPCs agregadas para séries de vendas por dia/mês, heatmap, top produtos e quick stats.
   - Remover a dependência de `sales_records` bruto + agregação client-side.
   - Fazer cards e gráficos usarem a mesma base lógica e o mesmo recorte temporal.

3. **Remover o legado de truncamento dos gráficos**
   - Tirar o `limit(...)` do caminho analítico principal.
   - Se necessário, manter limite apenas para exports/listagens auxiliares, nunca para os dados dos gráficos principais.

4. **Validar consolidado multi-PDV ponta a ponta**
   - Comparar banco vs cards vs gráficos para:
     - PDV individual
     - Todos os PDVs
     - período curto
     - período total
   - Confirmar que os totais mensais/diários batem com a soma dos 3 PDVs.

## Resultado esperado

Depois dessa correção:
- “Todos os PDVs” vai realmente consultar o consolidado completo.
- Cards e gráficos vão bater entre si.
- Não haverá mais perda de dados visual por limite legado no dashboard.
- A origem dos números ficará unificada e auditável.

## Detalhe técnico

Hoje o código está dividido assim:
- **Correto/canônico**: `get_dashboard_kpis` para KPIs
- **Ainda legado**: `useDashboard.ts` lendo `sales_records` com `limit(DASHBOARD_SALES_LIMIT)` e montando gráficos via `dashboardUtils`
- **Possível causador do falso consolidado**: `useDefaultPdvPreference.ts`

Se você aprovar, eu sigo exatamente nessa limpeza: **remover filtro silencioso + unificar gráficos no backend + excluir o caminho legado de agregação client-side**.