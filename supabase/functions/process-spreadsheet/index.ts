import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Column mapping for sales spreadsheet (REVENUE.xlsx)
const SALES_COLUMN_MAP: Record<string, string> = {
  "Comerciante": "merchant_id",
  "ID do dispositivo": "device_id",
  "Número do pedido": "order_number",
  "Nome do produto": "product_name",
  "Número da transação": "transaction_number",
  "Hora do pagamento": "payment_date",
  "Valor pago": "amount",
  "Forma de pagamento": "payment_method",
  "Status": "status",
  "Valor reembolsado": "refund_amount",
};

// Column mapping for stock spreadsheet (REPORT-SLOT.xlsx)
const STOCK_COLUMN_MAP: Record<string, string> = {
  "Número": "record_number",
  "Código da máquina": "device_id",
  "Número do compartimento": "slot_number",
  "Nome do produto": "product_name",
  "Estoque": "quantity",
  "Ativado": "is_active",
};

// Parse Brazilian date format "DD/MM/YYYY HH:MM" or Excel serial date
function parsePaymentDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  
  // If it's a number (Excel serial date)
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString();
  }
  
  const str = String(value).trim();
  
  // Try DD/MM/YYYY HH:MM format
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    ).toISOString();
  }
  
  // Try parsing as ISO date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  
  return new Date().toISOString();
}

// Parse monetary value "R$ 1.234,56" or number
function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  
  const str = String(value)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

// Parse quantity value
function parseQuantity(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return Math.floor(value);
  
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Parse boolean value "Sim"/"Não" or "1"/"0" or boolean
function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  
  const str = String(value).toLowerCase().trim();
  return str === "sim" || str === "yes" || str === "1" || str === "true" || str === "ativado";
}

// Map spreadsheet row to database record
function mapSalesRow(row: Record<string, unknown>, pdvId: string, uploadId: string): Record<string, unknown> {
  const mapped: Record<string, unknown> = {
    pdv_id: pdvId,
    upload_id: uploadId,
  };
  
  for (const [xlsCol, dbCol] of Object.entries(SALES_COLUMN_MAP)) {
    const value = row[xlsCol];
    
    switch (dbCol) {
      case "payment_date":
        mapped[dbCol] = parsePaymentDate(value);
        break;
      case "amount":
      case "refund_amount":
        mapped[dbCol] = parseAmount(value);
        break;
      default:
        mapped[dbCol] = value ? String(value).trim() : null;
    }
  }
  
  return mapped;
}

function mapStockRow(row: Record<string, unknown>, pdvId: string, uploadId: string): Record<string, unknown> {
  const mapped: Record<string, unknown> = {
    pdv_id: pdvId,
    upload_id: uploadId,
  };
  
  for (const [xlsCol, dbCol] of Object.entries(STOCK_COLUMN_MAP)) {
    const value = row[xlsCol];
    
    switch (dbCol) {
      case "quantity":
        mapped[dbCol] = parseQuantity(value);
        break;
      case "is_active":
        mapped[dbCol] = parseBoolean(value);
        break;
      default:
        mapped[dbCol] = value ? String(value).trim() : null;
    }
  }
  
  return mapped;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uploadId } = await req.json();
    
    if (!uploadId) {
      return new Response(
        JSON.stringify({ success: false, error: "uploadId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing upload: ${uploadId}`);

    // Create Supabase client with service role for RLS bypass
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch upload record
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*, pdv:pdvs(id, machine_id)")
      .eq("id", uploadId)
      .single();

    if (uploadError || !upload) {
      console.error("Upload not found:", uploadError);
      return new Response(
        JSON.stringify({ success: false, error: "Upload not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Upload found: type=${upload.type}, file_url=${upload.file_url}`);

    // 2. Download file from storage
    if (!upload.file_url) {
      // Update status to error if no file URL
      await supabase
        .from("uploads")
        .update({ status: "error", error_message: "Arquivo não encontrado", processed_at: new Date().toISOString() })
        .eq("id", uploadId);
      
      return new Response(
        JSON.stringify({ success: false, error: "File URL not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract file path from URL
    const urlParts = upload.file_url.split("/uploads/");
    if (urlParts.length < 2) {
      await supabase
        .from("uploads")
        .update({ status: "error", error_message: "URL do arquivo inválida", processed_at: new Date().toISOString() })
        .eq("id", uploadId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Invalid file URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const filePath = urlParts[1];
    console.log(`Downloading file: ${filePath}`);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      await supabase
        .from("uploads")
        .update({ status: "error", error_message: "Erro ao baixar arquivo", processed_at: new Date().toISOString() })
        .eq("id", uploadId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse XLSX file
    console.log("Parsing XLSX file...");
    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    console.log(`Parsed ${rows.length} rows from sheet "${sheetName}"`);

    if (rows.length === 0) {
      await supabase
        .from("uploads")
        .update({ status: "error", error_message: "Planilha vazia", processed_at: new Date().toISOString() })
        .eq("id", uploadId);
      
      return new Response(
        JSON.stringify({ success: false, error: "Empty spreadsheet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Transform and insert records based on type
    const pdvId = upload.pdv_id;
    let recordsInserted = 0;

    if (upload.type === "sales") {
      // Map rows to sales records
      const salesRecords = rows.map(row => mapSalesRow(row, pdvId, uploadId));
      
      // Filter out records without required fields
      const validRecords = salesRecords.filter(r => 
        r.device_id && r.order_number && r.product_name && r.amount
      );

      console.log(`Inserting ${validRecords.length} valid sales records...`);

      // Batch insert (chunks of 500)
      const chunkSize = 500;
      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
          .from("sales_records")
          .insert(chunk);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(`Erro ao inserir registros: ${insertError.message}`);
        }
        
        recordsInserted += chunk.length;
      }
    } else if (upload.type === "stock") {
      // Map rows to stock records
      const stockRecords = rows.map(row => mapStockRow(row, pdvId, uploadId));
      
      // Filter out records without required fields
      const validRecords = stockRecords.filter(r => 
        r.device_id && r.slot_number && r.product_name
      );

      console.log(`Inserting ${validRecords.length} valid stock records...`);

      // Batch insert (chunks of 500)
      const chunkSize = 500;
      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
          .from("stock_records")
          .insert(chunk);
        
        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(`Erro ao inserir registros: ${insertError.message}`);
        }
        
        recordsInserted += chunk.length;
      }
    }

    // 5. Update upload status to ready
    await supabase
      .from("uploads")
      .update({
        status: "ready",
        records_count: recordsInserted,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", uploadId);

    console.log(`Successfully processed ${recordsInserted} records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsCount: recordsInserted,
        message: `Processado com sucesso: ${recordsInserted} registros` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Processing error:", error);
    
    // Try to update upload status to error
    try {
      const { uploadId } = await req.clone().json();
      if (uploadId) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from("uploads")
          .update({ 
            status: "error", 
            error_message: error instanceof Error ? error.message : "Erro desconhecido",
            processed_at: new Date().toISOString() 
          })
          .eq("id", uploadId);
      }
    } catch {
      // Ignore error update failures
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
