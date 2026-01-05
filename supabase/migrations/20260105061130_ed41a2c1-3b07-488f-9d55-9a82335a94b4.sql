-- Add new columns for REVENUE-UP.xlsx support
ALTER TABLE public.sales_records 
ADD COLUMN IF NOT EXISTS order_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS print_code text,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_paid_amount numeric,
ADD COLUMN IF NOT EXISTS order_completion_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_flow text;