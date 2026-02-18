import { z } from "zod";
import type { Tables } from "@/integrations/supabase/types";

// Tipos base do banco de dados (correspondem às tabelas do Supabase)
export type UploadRow = Tables<"uploads">;
export type SalesRecordRow = Tables<"sales_records">;
export type StockRecordRow = Tables<"stock_records">;

// Tipos de status e tipo do upload (correspondendo aos enums do banco)
export type UploadStatus = "processing" | "ready" | "error";
export type UploadType = "sales" | "stock";

// Colunas obrigatórias para planilha de Vendas (REVENUE)
// Colunas obrigatórias para planilha de Vendas (REVENUE e REVENUE-UP)
// Nota: "Comerciante" removido pois REVENUE-UP.xlsx não possui essa coluna
export const SALES_REQUIRED_COLUMNS = [
  "ID do dispositivo",
  "Número do pedido",
  "Nome do produto",
  "Número da transação",
  "Hora do pagamento",
  "Valor pago",
  "Forma de pagamento",
  "Status",
  "Valor reembolsado",
] as const;

// Mapeamento de colunas inglês → português para Vendas
// Suporta tanto REVENUE.xlsx (português) quanto REVENUE-UP.xlsx (inglês)
export const SALES_COLUMN_ALIASES: Record<string, string[]> = {
  "Comerciante": ["Merchant", "Comerciante"],
  "ID do dispositivo": ["Device ID", "ID do dispositivo"],
  "Número do pedido": ["Order ID", "Número do pedido"],
  "Nome do produto": ["Product Name", "Nome do produto"],
  "Número da transação": ["Transaction ID", "Número da transação", "Payment Flow"],
  "Hora do pagamento": ["Payment Time", "Hora do pagamento"],
  "Valor pago": ["Payment Amount", "Valor pago", "Order Amount"],
  "Forma de pagamento": ["Payment Method", "Forma de pagamento"],
  "Status": ["Status"],
  "Valor reembolsado": ["Refund Amount", "Valor reembolsado"],
};

// Colunas obrigatórias para planilha de Estoque (REPORT-SLOT)
export const STOCK_REQUIRED_COLUMNS = [
  "Número",
  "Código da máquina",
  "Número do compartimento",
  "Nome do produto",
  "Estoque",
  "Ativado",
] as const;

// Mapeamento de colunas inglês → português para Estoque
export const STOCK_COLUMN_ALIASES: Record<string, string[]> = {
  "Número": ["ID", "Número"],
  "Código da máquina": ["Machine Code", "Código da máquina"],
  "Número do compartimento": ["Slot Number", "Número do compartimento"],
  "Nome do produto": ["Product Name", "Nome do produto"],
  "Estoque": ["Stock", "Estoque"],
  "Ativado": ["Enabled", "Ativado"],
};

// Interface para resultado da validação
export interface ColumnValidationResult {
  isValid: boolean;
  missingColumns: string[];
  foundColumns: string[];
  totalRows: number;
}

// Interface de registro de vendas para uso na aplicação
export interface SalesRecord {
  id: string;
  upload_id: string;
  pdv_id: string;
  merchant_id: string | null;
  device_id: string;
  order_number: string;
  product_name: string;
  transaction_number: string | null;
  payment_date: string;
  amount: number;
  payment_method: string | null;
  status: string | null;
  refund_amount: number | null;
  // REVENUE-UP.xlsx additional fields
  order_time: string | null;
  print_code: string | null;
  discount_amount: number | null;
  actual_paid_amount: number | null;
  order_completion_time: string | null;
  payment_flow: string | null;
}

// Interface de registro de estoque para uso na aplicação
export interface StockRecord {
  id: string;
  upload_id: string;
  pdv_id: string;
  record_number: string | null;
  device_id: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active: boolean | null;
}

export const uploadTypeLabels: Record<UploadType, string> = {
  sales: "Vendas",
  stock: "Estoque",
};

export const uploadStatusLabels: Record<UploadStatus, string> = {
  processing: "Processando",
  ready: "Processado",
  error: "Erro",
};

export const uploadFormSchema = z
  .object({
    pdvId: z.string().min(1, "Selecione um PDV"),
    type: z.enum(["sales", "stock"]),
    period: z.string().min(1, "Selecione o período"),
    source: z.enum(["file", "drive"]),
    file: z.instanceof(File).optional(),
    driveUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.source === "file") return !!data.file;
      if (data.source === "drive") return !!data.driveUrl && data.driveUrl.length > 0;
      return false;
    },
    { message: "Selecione um arquivo ou insira um link do Drive", path: ["source"] }
  );

export type UploadFormData = z.infer<typeof uploadFormSchema>;
