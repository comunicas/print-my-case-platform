// Definições de tools (functions) que o modelo pode chamar.
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_stock_overview",
      description: "Retorna visão geral do estoque agregada por produto e PDV. Use quando o usuário pergunta 'como está o estoque', 'quanto tenho de X'.",
      parameters: {
        type: "object",
        properties: {
          pdv_ids: { type: "array", items: { type: "string" }, description: "Filtrar por PDVs específicos (UUIDs). Omitir = todos os PDVs do usuário." },
          limit: { type: "integer", default: 100, maximum: 200 },
          product_name: { type: "string", description: "Filtro opcional por nome de produto (ILIKE %x%). Use para focar em SKUs específicos." },
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
      description: "Top produtos mais vendidos por contagem em um período. Apenas vendas Concluído.",
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
      description: "Lista produtos com estoque ≤ threshold E demanda > 0 (exclui produtos estagnados).",
      parameters: {
        type: "object",
        properties: {
          threshold: { type: "integer", default: 2 },
          limit: { type: "integer", default: 50, maximum: 100 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pdv_comparison",
      description: "Compara faturamento, vendas e ticket médio por PDV em um período.",
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
      name: "get_purchases_summary",
      description: "Resumo de compras pendentes (pré-estoque ainda não alocado). Útil para planejar reposição.",
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
      description: "DRE simplificado: faturamento - deduções - despesas = resultado.",
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
      description: "Lista produtos com estoque ZERADO em algum PDV. Diferencia 'zerado neste PDV mas com saldo em outro' (zero_in_pdv_only) de 'zerado em toda a rede' (zero_in_network). Use quando o usuário perguntar sobre produtos zerados, em ruptura ou faltantes.",
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
      name: "get_pdv_list",
      description: "Retorna a lista de todos os PDVs da organização com seus IDs e nomes. Use antes de qualquer tool que aceite pdv_ids quando o usuário especificar PDVs por nome.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

// Mapeamento tool_name → RPC do banco
export const TOOL_TO_RPC: Record<string, { rpc: string; mapParams: (p: Record<string, unknown>) => Record<string, unknown> }> = {
  get_stock_overview: {
    rpc: "ai_get_stock_overview",
    mapParams: (p) => ({ _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 100, _product_name: p.product_name ?? null }),
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
    mapParams: (p) => ({ _threshold: p.threshold ?? 5, _limit: p.limit ?? 50 }),
  },
  get_pdv_comparison: {
    rpc: "ai_get_pdv_comparison",
    mapParams: (p) => ({ _start: p.start, _end: p.end }),
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
  get_pdv_list: {
    rpc: "ai_get_pdv_list",
    mapParams: (_p) => ({}),
  },
};
