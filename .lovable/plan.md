
# Republicar e Revalidar Correções de Consistência

## Contexto

As 6 etapas de correção já estão implementadas no código (verificado em mensagens anteriores):
- Etapas 1 e 2: RPCs `ai_get_payment_breakdown` e `ai_get_financial_summary_by_pdv` usando `payment_date`
- Etapa 3: `useDRE` recebe `dateRange.from` em `Index.tsx`
- Etapa 4: Label "Visão Consolidada" clarificada para super_admin
- Etapa 5: `DASHBOARD_SALES_LIMIT = 15000` + aviso de truncamento
- Etapa 6: Tooltip de período no `FinancialSummaryCard`

Backend (RPCs/migrations) já foi deployado automaticamente. Falta publicar o frontend para produção (`printmycase.comunicas.com.br`).

## Importante: Limitação Técnica

Não tenho permissão para clicar no botão **Publish** automaticamente — essa ação precisa ser feita por você. O que posso fazer é validar o estado atual e, após você publicar, rodar a revalidação completa.

## Plano de Execução

### Passo 1 — Você publica o frontend
- **Desktop**: botão **Publish** no canto superior direito → **Update**
- **Mobile**: botão `...` no canto inferior direito (modo Preview) → **Publish** → **Update**

### Passo 2 — Validação do backend (eu executo)
Confirmar via SQL no banco de produção:
- `ai_get_payment_breakdown` filtrando por `payment_date` (não `order_time`)
- `ai_get_financial_summary_by_pdv` filtrando por `payment_date`
- Comparar totais retornados pelos RPCs do agente vs. queries diretas do dashboard para o mesmo período

### Passo 3 — Validação do frontend em produção (eu executo)
Abrir `https://printmycase.comunicas.com.br` em browser headless e checar:
1. **Etapa 3**: filtrar período "últimos 30 dias" → verificar que Margem Operacional não exibe valores absurdos (-309%, -512%) para períodos amplos
2. **Etapa 4**: logar como super_admin → confirmar que o card "Visão Consolidada" mostra o subtítulo "Todas as organizações · Os KPIs abaixo mostram apenas a organização selecionada"
3. **Etapa 5**: filtrar período longo → confirmar `DASHBOARD_SALES_LIMIT=15000` ativo e aviso amarelo aparece se truncar
4. **Etapa 6**: hover nos KPIs Margem Operacional / Custo por Máquina → tooltip mostra mês de referência correto

### Passo 4 — Validação do agente IA (eu executo)
Fazer 2 perguntas-teste ao agente e comparar com KPIs do dashboard no mesmo período:
- "Qual o faturamento por método de pagamento nos últimos 30 dias?" → deve bater com o dashboard
- "Mostre o DRE por PDV deste mês" → faturamento por PDV deve bater com o card de Receita do dashboard

### Passo 5 — Relatório final
Tabela comparativa Dashboard vs Agente IA, marcando ✅/❌ por etapa. Se algo divergir, abro um diagnóstico imediato.

## Próxima ação esperada

Confirme nesta conversa assim que clicar em **Publish → Update**, e eu inicio os passos 2 a 5.
