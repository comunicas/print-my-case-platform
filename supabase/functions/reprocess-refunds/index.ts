import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Field length limits based on database constraints
const FIELD_LIMITS = {
  merchant_id: 100,
  device_id: 100,
  order_number: 100,
  product_name: 255,
  transaction_number: 100,
  payment_method: 50,
  status: 50,
  print_code: 20,
  payment_flow: 100,
};

// Amount limits for validation
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 10000000;

// Column mapping for sales spreadsheet
const SALES_COLUMN_MAP: Record<string, string[]> = {
  "merchant_id": ["Comerciante", "Merchant"],
  "device_id": ["ID do dispositivo", "Device ID"],
  "order_number": ["Número do pedido", "Order ID"],
  "product_name": ["Nome do produto", "Product Name"],
  "transaction_number": ["Número da transação", "Transaction ID"],
  "payment_date": ["Hora do pagamento", "Payment Time"],
  "amount": ["Valor pago", "Payment Amount", "Order Amount"],
  "payment_method": ["Forma de pagamento", "Payment Method"],
  "status": ["Status"],
  "refund_amount": ["Valor reembolsado", "Refund Amount"],
  "order_time": ["Order Time", "Hora do pedido"],
  "print_code": ["Print Code", "Código de impressão"],
  "discount_amount": ["Discount Amount", "Valor do desconto"],
  "actual_paid_amount": ["Actual Paid Amount", "Valor pago efetivo"],
  "order_completion_time": ["Order Completion Time", "Hora de conclusão"],
  "payment_flow": ["Payment Flow", "Fluxo de pagamento"],
};

// Helper function to get column value by checking multiple aliases
function getColumnValue(row: Record<string, unknown>, aliases: string[]): unknown {
  for (const alias of aliases) {
    if (row[alias] !== undefined) {
      return row[alias];
    }
  }
  return undefined;
}

// Sanitize and truncate string value
function sanitizeString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  let str = String(value).trim();
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  return str || null;
}

function sanitizeOrderNumber(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.order_number);
  if (!str) return null;
  const sanitized = str.replace(/[^a-zA-Z0-9\-_\.]/g, "");
  return sanitized || null;
}

function sanitizeDeviceId(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.device_id);
  if (!str) return null;
  const sanitized = str.replace(/[^a-zA-Z0-9\-]/g, "");
  return sanitized || null;
}

function parsePaymentDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  
  if (typeof value === "number") {
    if (value < 1 || value > 73050) {
      return new Date().toISOString();
    }
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString();
  }
  
  const str = String(value).trim();
  if (str.length > 50) {
    return new Date().toISOString();
  }
  
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
    
    if (parsedYear < 1900 || parsedYear > 2100) return new Date().toISOString();
    if (parsedMonth < 1 || parsedMonth > 12) return new Date().toISOString();
    if (parsedDay < 1 || parsedDay > 31) return new Date().toISOString();
    
    return new Date(
      parsedYear,
      parsedMonth - 1,
      parsedDay,
      parseInt(hour),
      parseInt(minute)
    ).toISOString();
  }
  
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return parsed.toISOString();
    }
  }
  
  return new Date().toISOString();
}

function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    if (value < AMOUNT_MIN || value > AMOUNT_MAX) {
      return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, value));
    }
    return value;
  }
  
  let str = String(value).substring(0, 50).replace(/[R$\s]/g, "").trim();
  
  const hasComma = str.includes(",");
  const hasDot = str.includes(".");
  
  if (hasComma && hasDot) {
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    
    if (lastComma > lastDot) {
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      str = str.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    str = str.replace(",", ".");
  } else if (hasDot && !hasComma) {
    const parts = str.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      // It's a decimal
    } else {
      str = str.replace(/\./g, "");
    }
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  
  if (parsed < AMOUNT_MIN || parsed > AMOUNT_MAX) {
    return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, parsed));
  }
  
  return parsed;
}

// Map spreadsheet row to database record with refund inference
function mapSalesRow(row: Record<string, unknown>, pdvId: string, uploadId: string): Record<string, unknown> | null {
  const mapped: Record<string, unknown> = {
    pdv_id: pdvId,
    upload_id: uploadId,
  };
  
  const orderTimeValue = getColumnValue(row, SALES_COLUMN_MAP["order_time"]);
  const orderTime = orderTimeValue ? parsePaymentDate(orderTimeValue) : null;
  
  for (const [dbCol, aliases] of Object.entries(SALES_COLUMN_MAP)) {
    const value = getColumnValue(row, aliases);
    
    switch (dbCol) {
      case "payment_date":
        const paymentDate = value ? parsePaymentDate(value) : null;
        mapped[dbCol] = paymentDate || orderTime || new Date().toISOString();
        break;
      case "order_time":
        mapped[dbCol] = orderTime;
        break;
      case "order_completion_time":
        mapped[dbCol] = value ? parsePaymentDate(value) : null;
        break;
      case "amount":
      case "refund_amount":
      case "discount_amount":
      case "actual_paid_amount":
        mapped[dbCol] = parseAmount(value);
        break;
      case "device_id":
        mapped[dbCol] = sanitizeDeviceId(value);
        break;
      case "order_number":
        mapped[dbCol] = sanitizeOrderNumber(value);
        break;
      case "product_name":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.product_name);
        break;
      case "merchant_id":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.merchant_id);
        break;
      case "transaction_number":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.transaction_number);
        break;
      case "payment_method":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.payment_method);
        break;
      case "status":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.status);
        break;
      case "print_code":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.print_code);
        break;
      case "payment_flow":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.payment_flow);
        break;
    }
  }
  
  // Infer refund_amount from status when not explicitly set
  const REFUND_STATUS_KEYWORDS = [
    'reembolsado', 'reembolso', 'cancelado', 'devolvido', 'estornado',
    'refunded', 'refund', 'cancelled', 'canceled', 'returned', 'reversed'
  ];
  
  const status = String(mapped.status || '').toLowerCase().trim();
  const isRefundStatus = REFUND_STATUS_KEYWORDS.some(keyword => status.includes(keyword));
  
  if (isRefundStatus && (!mapped.refund_amount || mapped.refund_amount === 0)) {
    mapped.refund_amount = mapped.amount || 0;
    console.log(`Inferred refund_amount from status "${mapped.status}": ${mapped.refund_amount}`);
  }
  
  return mapped;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting reprocess-refunds...");

    // Fetch all sales uploads with status 'ready'
    const { data: uploads, error: uploadsError } = await supabase
      .from("uploads")
      .select("id, pdv_id, file_url, file_name")
      .eq("type", "sales")
      .eq("status", "ready");

    if (uploadsError) {
      console.error("Error fetching uploads:", uploadsError);
      throw new Error(`Failed to fetch uploads: ${uploadsError.message}`);
    }

    if (!uploads || uploads.length === 0) {
      console.log("No sales uploads found to reprocess");
      return new Response(
        JSON.stringify({ success: true, message: "No sales uploads to reprocess", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${uploads.length} sales uploads to reprocess`);

    const results: { uploadId: string; fileName: string; recordsUpdated: number; refundsInferred: number }[] = [];

    for (const upload of uploads) {
      console.log(`Processing upload: ${upload.file_name} (${upload.id})`);

      try {
        // Download file from storage
        const filePath = upload.file_url?.replace(/.*\/storage\/v1\/object\/public\//, "") || "";
        
        if (!filePath) {
          console.log(`Skipping upload ${upload.id}: no file_url`);
          continue;
        }

        const { data: fileData, error: downloadError } = await supabase.storage
          .from("uploads")
          .download(filePath.replace("uploads/", ""));

        if (downloadError) {
          console.error(`Error downloading file for upload ${upload.id}:`, downloadError);
          continue;
        }

        // Parse XLSX
        const arrayBuffer = await fileData.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

        console.log(`Parsed ${rows.length} rows from ${upload.file_name}`);

        // Delete existing records for this upload
        const { error: deleteError } = await supabase
          .from("sales_records")
          .delete()
          .eq("upload_id", upload.id);

        if (deleteError) {
          console.error(`Error deleting records for upload ${upload.id}:`, deleteError);
          continue;
        }

        // Map rows with new refund logic
        let refundsInferred = 0;
        const mappedRows: Record<string, unknown>[] = [];

        for (const row of rows) {
          const mapped = mapSalesRow(row, upload.pdv_id, upload.id);
          if (mapped && mapped.device_id && mapped.order_number && mapped.product_name) {
            // Track if refund was inferred
            const status = String(mapped.status || '').toLowerCase().trim();
            const REFUND_STATUS_KEYWORDS = [
              'reembolsado', 'reembolso', 'cancelado', 'devolvido', 'estornado',
              'refunded', 'refund', 'cancelled', 'canceled', 'returned', 'reversed'
            ];
            const isRefundStatus = REFUND_STATUS_KEYWORDS.some(keyword => status.includes(keyword));
            const refundAmount = mapped.refund_amount as number;
            if (isRefundStatus && refundAmount > 0) {
              refundsInferred++;
            }
            mappedRows.push(mapped);
          }
        }

        // Insert in batches
        const BATCH_SIZE = 500;
        for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
          const batch = mappedRows.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await supabase
            .from("sales_records")
            .insert(batch);

          if (insertError) {
            console.error(`Error inserting batch for upload ${upload.id}:`, insertError);
            throw insertError;
          }
        }

        console.log(`Reprocessed upload ${upload.file_name}: ${mappedRows.length} records, ${refundsInferred} refunds inferred`);

        results.push({
          uploadId: upload.id,
          fileName: upload.file_name,
          recordsUpdated: mappedRows.length,
          refundsInferred,
        });

      } catch (uploadError) {
        console.error(`Error processing upload ${upload.id}:`, uploadError);
      }
    }

    const totalRecords = results.reduce((sum, r) => sum + r.recordsUpdated, 0);
    const totalRefunds = results.reduce((sum, r) => sum + r.refundsInferred, 0);

    console.log(`Reprocess complete: ${results.length} uploads, ${totalRecords} records, ${totalRefunds} refunds inferred`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Reprocessed ${results.length} uploads`,
        totalRecords,
        totalRefundsInferred: totalRefunds,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in reprocess-refunds:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
