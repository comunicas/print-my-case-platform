import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { UploadStatus, UploadType } from "@/lib/schemas/upload";

/** Interface para detalhes completos de um upload (com dados de PDV e uploader) */
export interface UploadDetails {
  id: string;
  pdv_id: string;
  pdv: { name: string; machine_id: string };
  type: UploadType;
  file_name: string;
  file_url: string | null;
  drive_url: string | null;
  status: UploadStatus;
  records_count: number | null;
  anomaly_count: number | null;
  period: string | null;
  uploaded_by: string;
  uploader: { name: string };
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

/** Subset de SalesRecord para exibição em tabelas de preview */
export interface SalesRecordPreview {
  id: string;
  product_name: string;
  amount: number;
  payment_method: string | null;
  status: string | null;
  payment_date: string;
  refund_amount: number | null;
  order_number: string;
  transaction_number: string | null;
  // REVENUE-UP.xlsx additional fields
  order_time: string | null;
  print_code: string | null;
  discount_amount: number | null;
  actual_paid_amount: number | null;
  order_completion_time: string | null;
}

/** Subset de StockRecord para exibição em tabelas de preview */
export interface StockRecordPreview {
  id: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active: boolean | null;
}

/** Registro de anomalia excluída */
export interface AnomalyRecord {
  id: string;
  order_number: string;
  product_name: string;
  amount: number;
  reason: string;
  created_at: string;
}

export function useUploadDetails(uploadId: string | undefined) {
  const { profile } = useProfile();

  const uploadQuery = useQuery({
    queryKey: ["upload-details", uploadId],
    queryFn: async () => {
      if (!uploadId) return null;

      const { data: uploadData, error } = await supabase
        .from("uploads")
        .select(`
          *,
          pdv:pdvs(name, machine_id)
        `)
        .eq("id", uploadId)
        .maybeSingle();

      if (error) throw error;
      if (!uploadData) return null;

      // Fetch uploader profile
      const { data: uploaderProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", uploadData.uploaded_by)
        .maybeSingle();

      return {
        ...uploadData,
        uploader: uploaderProfile || { name: "Usuário" },
      } as UploadDetails;
    },
    enabled: !!uploadId && !!profile?.organization_id,
  });

  const salesRecordsQuery = useQuery({
    queryKey: ["upload-sales-records", uploadId],
    queryFn: async () => {
      if (!uploadId) return [];

      const { data, error } = await supabase
        .from("sales_records")
        .select("id, product_name, amount, payment_method, status, payment_date, refund_amount, order_number, transaction_number, order_time, print_code, discount_amount, actual_paid_amount, order_completion_time")
        .eq("upload_id", uploadId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as SalesRecordPreview[];
    },
    enabled: !!uploadId && uploadQuery.data?.type === "sales",
  });

  const stockRecordsQuery = useQuery({
    queryKey: ["upload-stock-records", uploadId],
    queryFn: async () => {
      if (!uploadId) return [];

      const { data, error } = await supabase
        .from("stock_records")
        .select("id, slot_number, product_name, quantity, is_active")
        .eq("upload_id", uploadId)
        .order("slot_number", { ascending: true });

      if (error) throw error;
      return data as StockRecordPreview[];
    },
    enabled: !!uploadId && uploadQuery.data?.type === "stock",
  });

  const anomaliesQuery = useQuery({
    queryKey: ["upload-anomalies", uploadId],
    queryFn: async () => {
      if (!uploadId) return [];

      const { data, error } = await supabase
        .from("upload_anomalies")
        .select("*")
        .eq("upload_id", uploadId)
        .order("amount", { ascending: false });

      if (error) throw error;
      return data as AnomalyRecord[];
    },
    enabled: !!uploadId && !!profile?.organization_id,
  });

  return {
    upload: uploadQuery.data,
    isLoading: uploadQuery.isLoading,
    error: uploadQuery.error,
    salesRecords: salesRecordsQuery.data || [],
    salesRecordsLoading: salesRecordsQuery.isLoading,
    stockRecords: stockRecordsQuery.data || [],
    stockRecordsLoading: stockRecordsQuery.isLoading,
    anomalies: anomaliesQuery.data || [],
    anomaliesLoading: anomaliesQuery.isLoading,
  };
}
