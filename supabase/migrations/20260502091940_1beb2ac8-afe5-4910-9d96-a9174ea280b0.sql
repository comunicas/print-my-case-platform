UPDATE public.ai_agent_tools
SET
  parameters_schema = '{
    "type": "object",
    "properties": {
      "limit": {"type": "integer", "default": 100, "maximum": 200},
      "pdv_ids": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Filtrar por PDVs específicos (UUIDs). Omitir = todos."
      }
    }
  }'::jsonb,
  description = 'Retorna visão geral do estoque agregada por produto e PDV (com pdv_name em cada linha). Use para perguntas tipo "como está o estoque" ou "quanto tenho em cada PDV". Para focar em um produto específico, prefira get_zero_stock_items (mostra ruptura por PDV com available_in).',
  updated_at = now()
WHERE name = 'get_stock_overview';