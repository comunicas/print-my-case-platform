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
];

// Mapeamento tool_name → RPC do banco
export const TOOL_TO_RPC: Record<string, { rpc: string; mapParams: (p: Record<string, unknown>) => Record<string, unknown> }> = {
  get_stock_overview: {
    rpc: "ai_get_stock_overview",
    mapParams: (p) => ({ _pdv_ids: p.pdv_ids ?? null, _limit: p.limit ?? 100 }),
  },
  get_stock_redistribution_suggestions: {
    rpc: "ai_get_stock_redistribution_suggestions",
    mapParams: (p) => ({ _min_coverage_days: p.min_coverage_days ?? 7, _limit: p.limit ?? 20 }),
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
    mapParams: (p) => ({ _threshold: p.threshold ?? 2, _limit: p.limit ?? 50 }),
  },
  get_pdv_comparison: {
    rpc: "ai_get_pdv_comparison",
    mapParams: (p) => ({ _start: p.start, _end: p.end }),
  },
  get_purchases_summary: {
    rpc: "ai_get_purchases_summary",
    mapParams: (p) => ({ _start: p.start ?? null, _end: p.end ?? null, _limit: p.limit ?? 50 }),
  },
  get_financial_summary: {
    rpc: "ai_get_financial_summary",
    mapParams: (p) => ({ _start: p.start, _end: p.end }),
  },
};
