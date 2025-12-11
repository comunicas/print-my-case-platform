import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export interface UploadDetails {
  id: string;
  pdv_id: string;
  pdv: { name: string; machine_id: string };
  type: "sales" | "stock";
  file_name: string;
  file_url: string | null;
  drive_url: string | null;
  status: "processing" | "ready" | "error";
  records_count: number | null;
  period: string | null;
  uploaded_by: string;
  uploader: { name: string };
  uploaded_at: string;
  processed_at: string | null;
  error_message: string | null;
}

export interface SalesRecordData {
  id: string;
  product_name: string;
  amount: number;
  payment_method: string | null;
  status: string | null;
  payment_date: string;
  refund_amount: number | null;
  order_number: string;
  transaction_number: string | null;
}

export interface StockRecordData {
  id: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active: boolean | null;
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
        .select("id, product_name, amount, payment_method, status, payment_date, refund_amount, order_number, transaction_number")
        .eq("upload_id", uploadId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      return data as SalesRecordData[];
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
      return data as StockRecordData[];
    },
    enabled: !!uploadId && uploadQuery.data?.type === "stock",
  });

  return {
    upload: uploadQuery.data,
    isLoading: uploadQuery.isLoading,
    error: uploadQuery.error,
    salesRecords: salesRecordsQuery.data || [],
    salesRecordsLoading: salesRecordsQuery.isLoading,
    stockRecords: stockRecordsQuery.data || [],
    stockRecordsLoading: stockRecordsQuery.isLoading,
  };
}
