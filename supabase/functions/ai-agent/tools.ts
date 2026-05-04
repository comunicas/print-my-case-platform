// Definições de tools (functions) que o modelo pode chamar.
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_pdv_list",
      description: "Lista todos os PDVs do usuário com nome e status ativo/inativo. Use quando precisar conhecer os PDVs disponíveis, resolver ambiguidade de nome, ou verificar quais PDVs estão ativos antes de filtrar outra tool por pdv_ids.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_stock_overview",
      description: "Retorna visão geral do estoque agregada por produto e PDV. Use quando o usuário pergunta 'como está o estoque'. Para focar em um produto específico, prefira `get_zero_stock_items` (mostra ruptura por PDV) e filtre o nome no texto da resposta.",
      parameters: {
        type: "object",
        properties: {
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos os PDVs do usuário." },
          limit: { type: "integer", default: 100, maximum: 200 },
        },
      },
    },
  },

  {
    type: "function",
    function: {
      name: "get_stock_redistribution_suggestions",
      description: "Sugere transferências de estoque entre PDVs, priorizando destinos com baixa cobertura e origens com excedente. Use SEMPRE para 'otimizar estoque', 'balancear', 'onde mover'.",
      parameters: {
        type: "object",
        properties: {
          min_coverage_days: { type: "integer", default: 7, description: "Cobertura mínima em dias para origem manter após transferir." },
          limit: { type: "integer", default: 20, maximum: 50 },
          product_name: { type: "string", description: "Filtro opcional por produto (ILIKE %x%) quando o usuário se refere a um SKU específico." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_summary",
      description: "Resumo de vendas (faturamento, deduções, ticket médio, vendas no cartão). Apenas vendas Concluído.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time", description: "ISO timestamp de início" },
          end: { type: "string", format: "date-time", description: "ISO timestamp de fim" },
          pdv_ids: { type: "array", items: { type: "string" } },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_products",
      description: "Lista os produtos mais vendidos. Retorna product_name, sales_count e revenue — onde revenue é a receita INDIVIDUAL gerada por aquele produto, não uma soma acumulada. Use para ranking de produtos por faturamento.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          pdv_ids: { type: "array", items: { type: "string" } },
          limit: { type: "integer", default: 10, maximum: 30 },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_low_stock_alerts",
      description: "Lista produtos com estoque ≤ threshold E demanda > 0 (exclui estagnados). Retorna product_name, pdv_name, total_quantity e vendas_30d. Use para 'estoque baixo', 'risco de zerar', 'próximo de acabar' — NÃO para produtos zerados (use get_zero_stock_items para zerados). Aceita filtro por PDV via pdv_ids.",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "integer", default: 2, description: "Alerta para estoque ≤ threshold. Default: 2." },
          limit: { type: "integer", default: 50, maximum: 100 },
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pdv_comparison",
      description: "Compara faturamento, contagem de vendas e ticket médio por PDV em um período. Use para ranking de PDVs, identificar o melhor e pior desempenho, ou analisar um subset de PDVs. Combine com get_stock_overview para diagnóstico completo.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos." },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_purchases_summary",
      description: "Resumo de compras abertas (pré-estoque não totalmente alocado). Use para 'há compra pendente para X?', 'quanto está em pré-estoque no total?'. DIFERENTE de get_pre_stock_detail (que mostra detalhe do que chegou) e get_pending_allocations (que mostra tarefas de distribuição física). Use product_names para verificar compras de SKUs específicos.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
          limit: { type: "integer", default: 50, maximum: 100 },
          product_names: { type: "array", items: { type: "string" }, description: "Lista de nomes de produto EXATOS para filtrar (match exato). Use para verificar reposição de SKUs específicos sem trazer compras irrelevantes." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary",
      description: "DRE CONSOLIDADO da organização inteira: faturamento - deduções - despesas = resultado. NÃO retorna por PDV individual — para DRE por PDV use get_financial_summary_by_pdv. Combine as duas para o DRE completo.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end: { type: "string", format: "date-time" },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_zero_stock_items",
      description: "Lista produtos com estoque ZERADO em algum PDV. Diferencia 'zerado neste PDV mas com saldo em outro' (zero_in_pdv_only) de 'zerado em toda a rede' (zero_in_network), incluindo em `available_in` os nomes dos PDVs com saldo disponível para transferência. Use quando o usuário perguntar sobre produtos zerados, em ruptura ou faltantes.",
      parameters: {
        type: "object",
        properties: {
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos. Omitir = todos os PDVs do usuário." },
          limit: { type: "integer", default: 100, maximum: 200 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_restock_targets",
      description: "Para uma LISTA EXATA de produtos faltantes, retorna a melhor decisão por item: transferir (de outro PDV), aguardar_compra (já há pré-estoque), comprar (sem origem nem compra), sem_acao_segura ou sem_dados_suficientes. Use SEMPRE no follow-up de 'analise os faltantes acima' — passe os product_names exatos da resposta anterior.",
      parameters: {
        type: "object",
        properties: {
          product_names: { type: "array", items: { type: "string" }, description: "Nomes EXATOS dos produtos a analisar (mesmo formato retornado pelas outras tools)." },
          min_coverage_days: { type: "integer", default: 7 },
          target_coverage_days: { type: "integer", default: 14 },
        },
        required: ["product_names"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pre_stock_detail",
      description: "Detalha o pré-estoque (compras recebidas ainda não distribuídas nos PDVs). Retorna por produto e status: total comprado, quantidade disponível para distribuir, custo unitário, custo total investido e PDV alocado. Use quando o usuário perguntar sobre pré-estoque, compras disponíveis, o que tem para distribuir, ou quais produtos aguardam alocação. Status comuns: 'available' (disponível), 'allocated' (alocado a PDV), 'partial' (parcialmente distribuído), 'depleted' (esgotado).",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filtrar por status. Omitir = todos. Valores: 'available', 'allocated', 'partial', 'depleted'.",
          },
          limit: { type: "integer", default: 100, maximum: 200 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_entries",
      description: "Lista as despesas operacionais lançadas por PDV e categoria. Use para detalhar o DRE (quais categorias de despesa existem, qual PDV tem mais despesas), responder 'quais são as despesas do mês', 'quanto gastamos em X categoria', ou montar DRE individualizado por PDV combinando com get_financial_summary.",
      parameters: {
        type: "object",
        properties: {
          reference_month: {
            type: "string",
            description: "Mês no formato YYYY-MM (ex: '2026-05'). Omitir = todos os meses disponíveis.",
          },
          pdv_ids: {
            type: "array",
            items: { type: "string" },
            description: "Lista de UUIDs de PDV para filtrar. Omitir = todos os PDVs.",
          },
          limit: { type: "integer", default: 100, maximum: 200 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payment_breakdown",
      description: "Breakdown de vendas por forma de pagamento (PIX, Cartão de Crédito, Cartão de Débito, etc.) por PDV em um período. Retorna contagem, faturamento e % do total do PDV por método. Use quando o usuário perguntar sobre formas de pagamento, 'quanto veio de PIX', 'percentual de cartão', ou quiser entender o perfil de pagamento.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end:   { type: "string", format: "date-time" },
          pdv_ids: {
            type: "array",
            items: { type: "string" },
            description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos.",
          },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_timeline",
      description: "Agrega vendas por período (dia, semana ou mês) para análise de tendência. Retorna faturamento e contagem por período e PDV. Use para responder 'a venda está crescendo?', 'qual semana foi melhor?', 'quais os dias que mais vendemos?', ou comparar períodos dentro de um range.",
      parameters: {
        type: "object",
        properties: {
          start:       { type: "string", format: "date-time" },
          end:         { type: "string", format: "date-time" },
          granularity: {
            type: "string",
            enum: ["day", "week", "month"],
            default: "day",
            description: "'day' para diário, 'week' para semanal, 'month' para mensal.",
          },
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs. Omitir = todos." },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_catalog",
      description: "Catálogo de produtos com preço, categoria, estoque mínimo configurado, quantidade atual em PDVs, quantidade em pré-estoque e status (ok / no_limite / abaixo_do_minimo / zerado). Use para responder 'qual o preço de X', 'quais produtos estão abaixo do mínimo', 'me mostre o catálogo', ou para cruzar com análises de venda e reposição.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filtrar por categoria de produto. Omitir = todas.",
          },
          limit: { type: "integer", default: 150, maximum: 300 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_allocations",
      description: "Lista alocações de pré-estoque pendentes — produtos que precisam ser fisicamente movidos do pré-estoque para um PDV específico. Use quando o usuário perguntar 'o que precisa ser alocado?', 'o que está pendente de distribuição?', ou no planejamento semanal de distribuição.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Status das alocações. Default: 'pending'. Outros: 'resolved', null para todas.",
            default: "pending",
          },
          limit: { type: "integer", default: 50, maximum: 100 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_upload_status",
      description: "Mostra quando cada PDV teve seus dados (estoque e vendas) atualizados pela última vez, quantos registros foram importados e quantas anomalias foram detectadas. Use quando o usuário questionar a atualidade dos dados, quando dados parecerem inconsistentes, ou como verificação de saúde dos dados antes de análises críticas.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_financial_summary_by_pdv",
      description: "DRE simplificado por PDV: faturamento, deduções (devoluções + descontos), despesas lançadas e resultado líquido com margem %. Use para responder 'qual PDV é mais lucrativo?', 'DRE por PDV', 'qual a margem de cada ponto?'. Combine com get_financial_entries para detalhar as categorias de despesa.",
      parameters: {
        type: "object",
        properties: {
          start: { type: "string", format: "date-time" },
          end:   { type: "string", format: "date-time" },
        },
        required: ["start", "end"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pdv_metrics",
      description: "Métricas consolidadas por PDV baseadas nos últimos N dias: ticket médio, vendas por dia, faturamento por dia, taxa de dedução histórica (devoluções + descontos) e despesas mensais médias. Use como base para projeções, cálculo de metas e análises de ritmo de vendas. Chamar este tool antes de get_sales_projection para ter o contexto completo.",
      parameters: {
        type: "object",
        properties: {
          days: {
            type: "integer",
            default: 90,
            description: "Janela histórica em dias para calcular as médias (padrão: 90 dias).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_sales_projection",
      description: "Projeção de vendas e faturamento para o mês corrente e cálculo de meta reversa. Se target_net_per_pdv for informado, calcula quanto cada PDV precisa faturar (bruto) para atingir aquele lucro líquido, quantas vendas são necessárias e qual o ritmo diário restante. Use para: 'quanto preciso vender para lucrar R$X?', 'vou bater a meta?', 'qual a projeção do mês?', 'estamos no ritmo?', 'quantas vendas por dia preciso fazer?'.",
      parameters: {
        type: "object",
        properties: {
          target_net_per_pdv: {
            type: "number",
            description: "Meta de lucro líquido desejado por PDV em R$ (ex: 5000 para R$5.000). Omitir = só projeção, sem meta reversa.",
          },
          days_baseline: {
            type: "integer",
            default: 90,
            description: "Janela histórica para calcular médias (padrão: 90 dias).",
          },
        },
      },
    },
  },
];


// Mapeamento tool_name → RPC do banco
export const TOOL_TO_RPC: Record<string, { rpc: string; mapParams: (p: Record<string, unknown>) => Record<string, unknown> }> = {
  get_pdv_list: {
    rpc: "ai_get_pdv_list",
    mapParams: (_p) => ({}),
  },
  get_stock_overview: {
    rpc: "ai_get_stock_overview",
    // RPC real só aceita (_pdv_ids, _limit). Ignoramos product_name silenciosamente.
    mapParams: (p) => ({ _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 100 }),
  },

  get_stock_redistribution_suggestions: {
    rpc: "ai_get_stock_redistribution_suggestions",
    mapParams: (p) => ({ _min_coverage_days: p.min_coverage_days ?? 7, _limit: p.limit ?? 20, _product_name: p.product_name ?? null }),
  },
  get_sales_summary: {
    rpc: "ai_get_sales_summary",
    mapParams: (p) => ({ _start: p.start, _end: p.end, _pdv_ids: p.pdv_ids ?? null }),
  },
  get_top_products: {
    rpc: "ai_get_top_products",
    mapParams: (p) => ({ _start: p.start, _end: p.end, _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 10 }),
  },
  get_low_stock_alerts: {
    rpc: "ai_get_low_stock_alerts",
    mapParams: (p) => ({ _threshold: p.threshold ?? 2, _limit: p.limit ?? 50, _pdv_ids: p.pdv_ids ?? null }),
  },
  get_pdv_comparison: {
    rpc: "ai_get_pdv_comparison",
    mapParams: (p) => ({ _start: p.start, _end: p.end, _pdv_ids: p.pdv_ids ?? null }),
  },
  get_purchases_summary: {
    rpc: "ai_get_purchases_summary",
    mapParams: (p) => ({ _start: p.start ?? null, _end: p.end ?? null, _limit: p.limit ?? 50, _product_names: p.product_names ?? null }),
  },
  get_financial_summary: {
    rpc: "ai_get_financial_summary",
    mapParams: (p) => ({ _start: p.start, _end: p.end }),
  },
  get_zero_stock_items: {
    rpc: "ai_get_zero_stock_items",
    mapParams: (p) => ({ _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 100 }),
  },
  analyze_restock_targets: {
    rpc: "ai_analyze_restock_targets",
    mapParams: (p) => ({
      _product_names: p.product_names ?? [],
      _min_coverage_days: p.min_coverage_days ?? 7,
      _target_coverage_days: p.target_coverage_days ?? 14,
    }),
  },
  get_pre_stock_detail: {
    rpc: "ai_get_pre_stock_detail",
    mapParams: (p) => ({
      _status: p.status ?? null,
      _limit: p.limit ?? 100,
    }),
  },
  get_financial_entries: {
    rpc: "ai_get_financial_entries",
    mapParams: (p) => ({
      _reference_month: p.reference_month ?? null,
      _pdv_ids: p.pdv_ids ?? null,
      _limit: p.limit ?? 100,
    }),
  },
  get_payment_breakdown: {
    rpc: "ai_get_payment_breakdown",
    mapParams: (p) => ({
      _start: p.start,
      _end: p.end,
      _pdv_ids: p.pdv_ids ?? null,
    }),
  },
  get_sales_timeline: {
    rpc: "ai_get_sales_timeline",
    mapParams: (p) => ({
      _start:       p.start,
      _end:         p.end,
      _granularity: p.granularity ?? "day",
      _pdv_ids:     p.pdv_ids ?? null,
    }),
  },
  get_product_catalog: {
    rpc: "ai_get_product_catalog",
    mapParams: (p) => ({
      _category: p.category ?? null,
      _limit:    p.limit ?? 150,
    }),
  },
  get_pending_allocations: {
    rpc: "ai_get_pending_allocations",
    mapParams: (p) => ({
      _status: p.status ?? "pending",
      _limit:  p.limit ?? 50,
    }),
  },
  get_upload_status: {
    rpc: "ai_get_upload_status",
    mapParams: (_p) => ({}),
  },
  get_financial_summary_by_pdv: {
    rpc: "ai_get_financial_summary_by_pdv",
    mapParams: (p) => ({
      _start: p.start,
      _end:   p.end,
    }),
  },
  get_pdv_metrics: {
    rpc: "ai_get_pdv_metrics",
    mapParams: (p) => ({ _days: p.days ?? 90 }),
  },
  get_sales_projection: {
    rpc: "ai_get_sales_projection",
    mapParams: (p) => ({
      _target_net_per_pdv: p.target_net_per_pdv ?? null,
      _days_baseline: p.days_baseline ?? 90,
    }),
  },
};
