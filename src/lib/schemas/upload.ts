import { z } from "zod";

export type UploadStatus = "processing" | "ready" | "error";
export type UploadType = "sales" | "stock";

export interface Upload {
  id: string;
  pdvId: string;
  pdvName: string;
  deviceId: string;
  type: UploadType;
  fileName: string;
  fileUrl?: string;
  driveUrl?: string;
  status: UploadStatus;
  recordsCount?: number;
  period?: string;
  uploadedBy: string;
  uploadedAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

export interface SalesRecord {
  merchantId: string;
  deviceId: string;
  orderNumber: string;
  productName: string;
  transactionNumber: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: string;
  status: string;
  refundAmount: number;
}

export interface StockRecord {
  recordNumber: string;
  deviceId: string;
  slotNumber: string;
  productName: string;
  quantity: number;
  isActive: boolean;
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
