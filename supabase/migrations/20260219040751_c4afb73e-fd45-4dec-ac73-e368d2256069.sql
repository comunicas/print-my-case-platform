
-- Passo 1: Deletar registros duplicados mantendo o mais antigo de cada par (order_number, pdv_id)
DELETE FROM sales_records
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY order_number, pdv_id
        ORDER BY id  -- mantém o mais antigo (UUID v4 gerado em sequência = menor = mais antigo)
      ) as rn
    FROM sales_records
    WHERE source = 'api'
  ) ranked
  WHERE rn > 1
);

-- Passo 2: Criar índice único condicional para prevenir duplicatas futuras via API
CREATE UNIQUE INDEX IF NOT EXISTS sales_records_api_order_pdv_unique
ON sales_records (order_number, pdv_id)
WHERE source = 'api';
