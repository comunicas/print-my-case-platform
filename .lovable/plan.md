## Diagnóstico confirmado

Identifiquei 4 causas reais ainda abertas:

1. **Frontend publicado ainda está com lógica antiga de amostragem**
   - O print com **1.000 transações** e **R$ 72.530,09** bate exatamente com uma amostra limitada de 1000 linhas.
   - No banco, para o mesmo recorte, existem **1.185 vendas concluídas** e **R$ 85.572,34** líquidos.
   - Isso indica que o ambiente publicado ainda não está refletindo integralmente o código esperado do dashboard.

2. **O agente IA ainda expõe tools legadas baseadas em `order_time`**
   - `ai_get_pdv_metrics`
   - `ai_get_sales_projection`
   - `ai_get_pdv_benchmark`
   
   Essas funções continuam ativas e podem responder diferente do dashboard, que usa `payment_date`.

3. **Há divergência de fórmula entre IA e dashboard no DRE por PDV**
   - `ai_get_financial_summary_by_pdv` soma **`refund_amount + discount_amount`** em deduções.
   - O dashboard financeiro principal usa outra base e não segue exatamente essa mesma regra.
   - Resultado: margem, resultado e deduções podem divergir mesmo no mesmo período.

4. **Os cards financeiros do dashboard ainda são mensais, não do período filtrado**
   - `FinancialSummaryCard` recebe dados de `useDRE({ referenceMonth: dateRange.from })`.
   - Então, no filtro “Total” ou multi-mês, os KPIs financeiros não representam o período completo — apenas o mês inicial do filtro.

## Plano

### 1. Unificar a fonte canônica dos números do dashboard
- Centralizar os agregados do dashboard em uma camada única de backend para evitar drift entre:
  - cards KPI
  - gráficos
  - análise de perdas
  - visão consolidada
- Garantir que todos usem o mesmo critério:
  - `payment_date`
  - status canônicos
  - mesma janela de período
  - mesmas regras de receita líquida / perdas
- Remover qualquer dependência de amostra limitada como fonte de verdade dos cards.

### 2. Corrigir definitivamente a lógica de gráficos e truncamento
- Refatorar `useDashboard` para separar claramente:
  - **totais verdadeiros** do período
  - **séries para visualização**
  - **flag de truncamento real** baseada em contagem total vs limite
- Se houver limite para performance, ele deve afetar **somente a série visual**, nunca os KPIs.
- Exibir aviso de amostragem apenas quando houver truncamento de fato.

### 3. Refatorar os cards financeiros para o período filtrado
- Substituir o uso mensal de `useDRE` no dashboard por um resumo financeiro **por período selecionado**.
- Fazer com que:
  - Margem Operacional
  - Custo por Máquina
  - Taxa de Perda
  reflitam exatamente o intervalo ativo no filtro.
- Manter o DRE mensal apenas onde ele faz sentido estruturalmente.

### 4. Limpar legados do agente IA
- Reescrever ou substituir as functions do agente ainda baseadas em `order_time` para usar `payment_date`.
- Revisar e alinhar estas tools:
  - `get_pdv_metrics`
  - `get_sales_projection`
  - `get_pdv_benchmark`
- Atualizar prompts/skill do agente para não incentivar caminhos legados.
- Se alguma análise precisar mesmo de “hora real do pedido”, isso deve ficar explícito e separado da lógica financeira.

### 5. Padronizar fórmulas de dedução e perdas
- Definir uma regra única para todo o produto:
  - o que entra em **deduções**
  - o que entra em **perdas**
  - quando `discount_amount` entra ou não entra
  - quando `refund_amount` entra ou não entra
- Aplicar essa mesma regra no:
  - dashboard
  - cards financeiros
  - LossAnalysisCard
  - agente IA
  - RPCs financeiras

### 6. Excluir legados e reduzir superfícies de bug
- Remover caminhos antigos que mantêm dupla interpretação dos mesmos dados.
- Revisar referências restantes a:
  - `order_time` em análises financeiras/comparativas
  - status legados em inglês como `Completed`
  - cálculos duplicados no cliente e no backend para a mesma métrica
- Manter `order_time` apenas em casos explicitamente operacionais, como análise horária, se ainda necessário.

### 7. Revalidação ponta a ponta
- Rodar uma matriz de comparação entre:
  - banco
  - dashboard
  - agente IA
- Validar pelo menos:
  - Receita
  - Transações
  - Ticket Médio
  - Perdas
  - Margem Operacional
  - Top produtos
  - série diária
- Depois abrir o app logado e conferir visualmente preview/publicado.

## Detalhes técnicos
- Arquivos principais envolvidos:
  - `src/hooks/useDashboard.ts`
  - `src/pages/Index.tsx`
  - `src/hooks/useDRE.ts`
  - `src/components/dashboard/FinancialSummaryCard.tsx`
  - `supabase/functions/ai-agent/skill.ts`
  - `supabase/functions/ai-agent/tools.ts`
  - migrations SQL das RPCs financeiras e comparativas
- Mudanças de backend devem virar migrations.
- A validação visual final do publicado exige sessão autenticada; no momento o site publicado abre tela de login no navegador de teste.

## Resultado esperado
Após essa limpeza:
- cards e gráficos passam a bater com o banco no mesmo período;
- o agente IA passa a responder com o mesmo critério do dashboard;
- o filtro “Total” deixa de mostrar card financeiro mensal disfarçado de período;
- os caminhos legados que hoje reintroduzem inconsistência deixam de existir.