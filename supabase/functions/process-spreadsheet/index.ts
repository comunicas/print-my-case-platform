// Cross-PDV dedup v3 - PT-BR normalization
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
  record_number: 50,
  slot_number: 50,
  print_code: 20,
  payment_flow: 100,
};

// Amount limits for validation
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 10000000; // 10 million (reasonable max for a single transaction)
const QUANTITY_MIN = 0;
const QUANTITY_MAX = 100000; // reasonable max for stock quantity

// Anomaly detection thresholds
// R$ 10.000 para cobrir produtos legítimos de alto valor (ex: iPhone Pro R$ 6.990)
const ANOMALY_THRESHOLDS = {
  maxSingleAmount: 10000, // Limite máximo por transação (capas de celular raramente passam de R$ 500; iPhones até ~R$ 9.000)
};

// Interface for detected anomalies
interface AnomalyRecord {
  orderNumber: string;
  productName: string;
  amount: number;
  reason: string;
}

// Detect amount anomalies in sales records
function detectAmountAnomalies(records: Record<string, unknown>[]): AnomalyRecord[] {
  const anomalies: AnomalyRecord[] = [];
  
  for (const record of records) {
    const amount = record.amount as number;
    const productName = record.product_name as string || "N/A";
    const orderNumber = record.order_number as string || "N/A";
    
    if (amount > ANOMALY_THRESHOLDS.maxSingleAmount) {
      anomalies.push({
        orderNumber,
        productName,
        amount,
        reason: `Valor R$ ${amount.toFixed(2)} excede o máximo esperado de R$ ${ANOMALY_THRESHOLDS.maxSingleAmount}`,
      });
    }
  }
  
  return anomalies;
}

// Column mapping for sales spreadsheet (REVENUE.xlsx and REVENUE-UP.xlsx) - PT and EN aliases
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
  // REVENUE-UP.xlsx additional columns
  "order_time": ["Order Time", "Hora do pedido"],
  "print_code": ["Print Code", "Código de impressão"],
  "discount_amount": ["Discount Amount", "Valor do desconto"],
  "actual_paid_amount": ["Actual Paid Amount", "Valor pago efetivo"],
  "order_completion_time": ["Order Completion Time", "Hora de conclusão"],
  "payment_flow": ["Payment Flow", "Fluxo de pagamento"],
};

// Column mapping for stock spreadsheet (REPORT-SLOT.xlsx) - PT and EN aliases
const STOCK_COLUMN_MAP: Record<string, string[]> = {
  "record_number": ["Número", "ID"],
  "device_id": ["Código da máquina", "Machine Code"],
  "slot_number": ["Número do compartimento", "Slot Number"],
  "product_name": ["Nome do produto", "Product Name"],
  "quantity": ["Estoque", "Stock"],
  "is_active": ["Ativado", "Enabled"],
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

// Detect columns without verbose logging
function detectColumns(
  headers: string[], 
  columnMap: Record<string, string[]>,
): { detected: number; missing: string[] } {
  const detected: string[] = [];
  const missing: string[] = [];
  
  for (const [dbCol, aliases] of Object.entries(columnMap)) {
    const [ptAlias, enAlias] = aliases;
    
    if ((enAlias && headers.includes(enAlias)) || headers.includes(ptAlias)) {
      detected.push(dbCol);
    } else {
      missing.push(dbCol);
    }
  }
  
  return { detected: detected.length, missing };
}

// Extract brand from product name (inline - cannot import from src)
function extractBrandFromProduct(productName: string): string {
  const upper = (productName || "").toUpperCase().trim();
  
  const knownBrands = ["APPLE", "SAMSUNG", "XIAOMI", "MOTOROLA", "REALME"];
  for (const brand of knownBrands) {
    if (upper.startsWith(brand + " ") || upper === brand) {
      return brand;
    }
  }
  
  // Detect by product line
  if (upper.includes("IPHONE") || upper.includes("MACBOOK") || upper.includes("IPAD") || upper.includes("AIRPODS")) {
    return "APPLE";
  }
  if (upper.includes("GALAXY")) return "SAMSUNG";
  if (upper.includes("REDMI") || upper.includes("POCO") || upper.includes("MI ")) {
    return "XIAOMI";
  }
  if (upper.includes("MOTO ") || upper.includes("MOTOROLA")) return "MOTOROLA";
  
  return "OUTROS";
}

// --- PT-BR Canonical Normalization ---
const PAYMENT_METHOD_MAP: Record<string, string> = {
  "creditcard": "Cartão de Crédito",
  "credit_card": "Cartão de Crédito",
  "cartão de crédito": "Cartão de Crédito",
  "cartao de credito": "Cartão de Crédito",
  "crédito": "Cartão de Crédito",
  "credito": "Cartão de Crédito",
  "debitcard": "Cartão de Débito",
  "debit_card": "Cartão de Débito",
  "cartão de débito": "Cartão de Débito",
  "cartao de debito": "Cartão de Débito",
  "débito": "Cartão de Débito",
  "debito": "Cartão de Débito",
  "pix": "PIX",
  "machinefree": "Cortesia",
  "cortesia": "Cortesia",
  "couponfree": "Cupom",
  "cupom": "Cupom",
  "coupon": "Cupom",
};

function normalizePaymentMethod(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "Não informado";
  const key = String(value).trim().toLowerCase();
  return PAYMENT_METHOD_MAP[key] ?? sanitizeString(value, FIELD_LIMITS.payment_method) ?? "Não informado";
}

const STATUS_MAP: Record<string, string> = {
  "completed": "Concluído",
  "concluído": "Concluído",
  "concluido": "Concluído",
  "pago": "Concluído",
  "cancelled": "Cancelado",
  "canceled": "Cancelado",
  "cancelado": "Cancelado",
  "pending": "Pendente",
  "pendente": "Pendente",
  "refunded": "Reembolsado",
  "reembolsado": "Reembolsado",
};

function normalizeStatus(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "Concluído";
  const key = String(value).trim().toLowerCase();
  return STATUS_MAP[key] ?? sanitizeString(value, FIELD_LIMITS.status) ?? "Concluído";
}

/**
 * Sanitize and truncate string value to max length
 * Removes potentially dangerous characters and ensures length limits
 */
function sanitizeString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  
  let str = String(value).trim();
  
  // Remove null bytes and other control characters (except common whitespace)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  
  // Truncate to max length
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }
  
  return str || null;
}

/**
 * Validate and sanitize order number format
 * Allows alphanumeric characters, hyphens, underscores, and dots
 */
function sanitizeOrderNumber(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.order_number);
  if (!str) return null;
  
  // Remove characters that aren't alphanumeric, hyphens, underscores, or dots
  const sanitized = str.replace(/[^a-zA-Z0-9\-_\.]/g, "");
  
  return sanitized || null;
}

/**
 * Validate and sanitize device ID
 * Allows alphanumeric characters and hyphens
 */
function sanitizeDeviceId(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.device_id);
  if (!str) return null;
  
  // Remove characters that aren't alphanumeric or hyphens
  const sanitized = str.replace(/[^a-zA-Z0-9\-]/g, "");
  
  return sanitized || null;
}

// Parse Brazilian date format "DD/MM/YYYY HH:MM" or Excel serial date
function parsePaymentDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  
  // If it's a number (Excel serial date)
  if (typeof value === "number") {
    // Validate reasonable date range (1900-2100)
    if (value < 1 || value > 73050) { // 73050 is roughly year 2100
      return new Date().toISOString();
    }
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return date.toISOString();
  }
  
  const str = String(value).trim();
  
  // Limit string length for date parsing
  if (str.length > 50) {
    return new Date().toISOString();
  }
  
  // Try DD/MM/YYYY HH:MM format
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    const parsedDay = parseInt(day);
    
    // Validate date components
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
  
  // Try parsing as ISO date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    // Validate reasonable date range
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) {
      return parsed.toISOString();
    }
  }
  
  return new Date().toISOString();
}

// Parse monetary value with auto-detection of format
// Supports: "R$ 1.234,56" (BR), "1,234.56" (EN), "69.90", "69,90"
function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    // Validate range
    if (value < AMOUNT_MIN || value > AMOUNT_MAX) {
      return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, value));
    }
    return value;
  }
  
  let str = String(value).substring(0, 50).replace(/[R$\s]/g, "").trim();
  
  const hasComma = str.includes(",");
  const hasDot = str.includes(".");
  
  if (hasComma && hasDot) {
    // Both present - check which comes last (that's the decimal separator)
    const lastComma = str.lastIndexOf(",");
    const lastDot = str.lastIndexOf(".");
    
    if (lastComma > lastDot) {
      // Brazilian format: "1.234,56"
      str = str.replace(/\./g, "").replace(",", ".");
    } else {
      // English format: "1,234.56"
      str = str.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    // Only comma - likely Brazilian decimal: "69,90"
    str = str.replace(",", ".");
  } else if (hasDot && !hasComma) {
    // Only dot - check if it's decimal or thousands
    // If exactly 1-2 digits after dot, it's decimal: "69.90", "69.9"
    // If 3+ digits after dot, it's thousands: "1.234"
    const parts = str.split(".");
    if (parts.length === 2 && parts[1].length <= 2) {
      // It's a decimal - keep as is: "69.90"
    } else {
      // It's thousands separator - remove: "1.234" → "1234"
      str = str.replace(/\./g, "");
    }
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  
  // Validate range
  if (parsed < AMOUNT_MIN || parsed > AMOUNT_MAX) {
    return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, parsed));
  }
  
  return parsed;
}

// Parse quantity value with validation
function parseQuantity(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    const qty = Math.floor(value);
    // Validate range
    if (qty < QUANTITY_MIN || qty > QUANTITY_MAX) {
      return Math.max(QUANTITY_MIN, Math.min(QUANTITY_MAX, qty));
    }
    return qty;
  }
  
  const parsed = parseInt(String(value).substring(0, 20), 10);
  if (isNaN(parsed)) return 0;
  
  // Validate range
  if (parsed < QUANTITY_MIN || parsed > QUANTITY_MAX) {
    return Math.max(QUANTITY_MIN, Math.min(QUANTITY_MAX, parsed));
  }
  
  return parsed;
}

// Parse boolean value "Sim"/"Não" or "1"/"0" or boolean
function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  
  const str = String(value).toLowerCase().trim().substring(0, 20);
  return str === "sim" || str === "yes" || str === "1" || str === "true" || str === "ativado";
}

// Map spreadsheet row to database record with validation
function mapSalesRow(row: Record<string, unknown>, pdvId: string, uploadId: string): Record<string, unknown> | null {
  const mapped: Record<string, unknown> = {
    pdv_id: pdvId,
    upload_id: uploadId,
  };
  
  // Extract order_time first to use as fallback for payment_date
  const orderTimeValue = getColumnValue(row, SALES_COLUMN_MAP["order_time"]);
  const orderTime = orderTimeValue ? parsePaymentDate(orderTimeValue) : null;
  
  for (const [dbCol, aliases] of Object.entries(SALES_COLUMN_MAP)) {
    const value = getColumnValue(row, aliases);
    
    switch (dbCol) {
      case "payment_date":
        // Use order_time as fallback when payment_date is empty (e.g., cancelled orders)
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
        mapped[dbCol] = normalizePaymentMethod(value);
        break;
      case "status":
        mapped[dbCol] = normalizeStatus(value);
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
    'reembolsado', 'reembolso', 'devolvido', 'estornado',
    'refunded', 'refund', 'returned', 'reversed'
  ];
  
  const status = String(mapped.status || '').toLowerCase().trim();
  const isRefundStatus = REFUND_STATUS_KEYWORDS.some(keyword => status.includes(keyword));
  
  // If status indicates refund and refund_amount is empty/zero, use amount as refund value
  if (isRefundStatus && (!mapped.refund_amount || mapped.refund_amount === 0)) {
    mapped.refund_amount = mapped.amount || 0;
    console.log(`Inferred refund_amount from status "${mapped.status}": ${mapped.refund_amount}`);
  }
  
  return mapped;
}

function mapStockRow(row: Record<string, unknown>, pdvId: string, uploadId: string): Record<string, unknown> | null {
  const mapped: Record<string, unknown> = {
    pdv_id: pdvId,
    upload_id: uploadId,
  };
  
  for (const [dbCol, aliases] of Object.entries(STOCK_COLUMN_MAP)) {
    const value = getColumnValue(row, aliases);
    
    switch (dbCol) {
      case "quantity":
        mapped[dbCol] = parseQuantity(value);
        break;
      case "is_active":
        mapped[dbCol] = parseBoolean(value);
        break;
      case "device_id":
        mapped[dbCol] = sanitizeDeviceId(value);
        break;
      case "slot_number":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.slot_number);
        break;
      case "product_name":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.product_name);
        break;
      case "record_number":
        mapped[dbCol] = sanitizeString(value, FIELD_LIMITS.record_number);
        break;
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

    // Validate uploadId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uploadId)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid uploadId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === AUTHORIZATION CHECK ===
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's auth to check permissions via RLS
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user can access this upload (RLS will enforce organization check)
    const { data: uploadCheck, error: accessError } = await supabaseUser
      .from("uploads")
      .select("id")
      .eq("id", uploadId)
      .single();

    if (accessError || !uploadCheck) {
      return new Response(
        JSON.stringify({ success: false, error: "Upload not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // === END AUTHORIZATION CHECK ===

    // Create Supabase client with service role for data processing (RLS bypass)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch upload record with full details
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .select("*, pdv:pdvs(id, machine_id)")
      .eq("id", uploadId)
      .single();

    if (uploadError || !upload) {
      return new Response(
        JSON.stringify({ success: false, error: "Upload not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Download file from storage
    if (!upload.file_url) {
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

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(filePath);

    if (downloadError || !fileData) {
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
    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: "array" });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

    // Detect columns (for validation, no verbose logging)
    if (rows.length > 0) {
      const headers = Object.keys(rows[0]);
      const columnMap = upload.type === "sales" ? SALES_COLUMN_MAP : STOCK_COLUMN_MAP;
      const { missing } = detectColumns(headers, columnMap);
      
      // Log warning only if critical columns are missing
      if (missing.length > 0 && missing.some(col => ['device_id', 'product_name', 'order_number', 'slot_number'].includes(col))) {
        console.warn(`Upload ${uploadId}: Missing critical columns: ${missing.join(', ')}`);
      }
    }

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

    // Limit max rows to prevent DoS
    const MAX_ROWS = 50000;
    if (rows.length > MAX_ROWS) {
      await supabase
        .from("uploads")
        .update({ 
          status: "error", 
          error_message: `Planilha excede o limite de ${MAX_ROWS} linhas`, 
          processed_at: new Date().toISOString() 
        })
        .eq("id", uploadId);
      
      return new Response(
        JSON.stringify({ success: false, error: `Spreadsheet exceeds maximum of ${MAX_ROWS} rows` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Transform and insert records based on type
    const pdvId = upload.pdv_id;
    let recordsInserted = 0;
    let skippedRecords = 0;
    let deletedPreviousRecords = 0;
    // Anomalias detectadas (apenas para tipo sales) — reutilizadas depois para evitar recalcular
    let detectedAnomalies: AnomalyRecord[] = [];
    let anomalySkipped = 0;

    if (upload.type === "sales") {
      // Map rows to sales records with validation
      const salesRecords = rows.map(row => mapSalesRow(row, pdvId, uploadId)).filter(Boolean);
      
      // Filter out records without required fields
      const validRecords = salesRecords.filter(r => 
        r && r.device_id && r.order_number && r.product_name && r.amount !== null && r.amount !== undefined
      );
      
      skippedRecords = rows.length - validRecords.length;

      // === DEVICE ID vs MACHINE ID VALIDATION ===
      // Prevent uploading a spreadsheet to the wrong PDV by checking device_id matches machine_id
      {
        const { data: pdvInfo } = await supabase
          .from("pdvs")
          .select("machine_id, name")
          .eq("id", pdvId)
          .single();

        if (pdvInfo?.machine_id) {
          const uniqueDeviceIds = [...new Set(
            validRecords.map(r => r?.device_id as string).filter(Boolean)
          )];

          const matchingRecords = validRecords.filter(r => r?.device_id === pdvInfo.machine_id);
          const mismatchedRecords = validRecords.filter(r => r?.device_id && r.device_id !== pdvInfo.machine_id);

          if (matchingRecords.length === 0 && mismatchedRecords.length > 0) {
            // ALL records have wrong device_id — reject entirely
            const wrongIds = uniqueDeviceIds.filter(id => id !== pdvInfo.machine_id).join(', ');
            const errorMsg = `O ID do dispositivo na planilha (${wrongIds}) não corresponde ao PDV selecionado "${pdvInfo.name}" (${pdvInfo.machine_id}). Selecione o PDV correto.`;
            console.error(`[process-spreadsheet] Upload ${uploadId}: REJECTED — device_id mismatch. Sheet: [${wrongIds}], PDV machine_id: ${pdvInfo.machine_id}`);

            await supabase
              .from("uploads")
              .update({ status: "error", error_message: errorMsg, processed_at: new Date().toISOString() })
              .eq("id", uploadId);

            return new Response(
              JSON.stringify({ success: false, error: errorMsg }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else if (mismatchedRecords.length > 0) {
            // Some records match, some don't — filter out mismatched and warn
            const wrongIds = [...new Set(mismatchedRecords.map(r => r?.device_id as string))].join(', ');
            console.warn(`[process-spreadsheet] Upload ${uploadId}: Filtered out ${mismatchedRecords.length} records with wrong device_id [${wrongIds}], keeping ${matchingRecords.length} with correct device_id ${pdvInfo.machine_id}`);
            // Replace validRecords with only matching ones
            validRecords.length = 0;
            validRecords.push(...matchingRecords);
            skippedRecords = rows.length - validRecords.length;
          }
        }
      }

      // Detect amount anomalies before insertion — atribui à variável do escopo externo para reutilização
      detectedAnomalies = detectAmountAnomalies(validRecords as Record<string, unknown>[]);
      if (detectedAnomalies.length > 0) {
        console.warn(`[process-spreadsheet] Upload ${uploadId}: Detected ${detectedAnomalies.length} amount anomalies:`, 
          JSON.stringify(detectedAnomalies.slice(0, 10)));
      }

      // Create set of anomalous order numbers for quick lookup
      const anomalousOrderNumbers = new Set(detectedAnomalies.map(a => a.orderNumber));

      // FILTER OUT ANOMALOUS RECORDS BEFORE INSERTION
      const cleanRecords = validRecords.filter(r => 
        !anomalousOrderNumbers.has(r?.order_number as string)
      );

      // Update skipped count to include anomalies — atribui à variável do escopo externo
      anomalySkipped = validRecords.length - cleanRecords.length;
      skippedRecords = rows.length - cleanRecords.length;

      if (anomalySkipped > 0) {
        console.log(`[process-spreadsheet] Upload ${uploadId}: EXCLUDED ${anomalySkipped} records with anomalous amounts (> R$ ${ANOMALY_THRESHOLDS.maxSingleAmount})`);
        
        // Persist anomalies to database for history/reporting
        const anomalyRecords = detectedAnomalies.map(a => ({
          upload_id: uploadId,
          order_number: a.orderNumber,
          product_name: a.productName,
          amount: a.amount,
          reason: a.reason,
        }));
        
        const { error: anomalyError } = await supabase
          .from("upload_anomalies")
          .insert(anomalyRecords);
        
        if (anomalyError) {
          console.error(`Upload ${uploadId}: Failed to save anomalies`, anomalyError.message);
        } else {
          console.log(`[process-spreadsheet] Upload ${uploadId}: Saved ${detectedAnomalies.length} anomalies to database`);
        }
      }

      // === DEDUPLICATION: remove records that already exist in ANY PDV of the org ===
      // This prevents cross-PDV duplicates (e.g. uploading Boulevard's spreadsheet to Tietê)
      const uniqueOrderNumbers = [...new Set(
        cleanRecords
          .map(r => r?.order_number as string)
          .filter(Boolean)
      )];

      const existingOrderNumbers = new Set<string>();

      // Get all PDV IDs in the same organization for cross-PDV dedup
      let orgPdvIds: string[] = [pdvId];
      {
        const { data: pdvData } = await supabase
          .from("pdvs")
          .select("id, organization_id")
          .eq("id", pdvId)
          .single();
        
        if (pdvData?.organization_id) {
          const { data: allPdvs } = await supabase
            .from("pdvs")
            .select("id")
            .eq("organization_id", pdvData.organization_id);
          
          if (allPdvs && allPdvs.length > 0) {
            orgPdvIds = allPdvs.map(p => p.id);
          }
        }
      }

      if (uniqueOrderNumbers.length > 0) {
        const dedupChunkSize = 500;
        for (let i = 0; i < uniqueOrderNumbers.length; i += dedupChunkSize) {
          const chunk = uniqueOrderNumbers.slice(i, i + dedupChunkSize);
          const { data: existingRecords, error: dedupError } = await supabase
            .from("sales_records")
            .select("order_number")
            .in("pdv_id", orgPdvIds)
            .in("order_number", chunk);

          if (dedupError) {
            console.warn(`[process-spreadsheet] Upload ${uploadId}: Dedup query error (non-fatal):`, dedupError.message);
          } else if (existingRecords) {
            for (const rec of existingRecords) {
              existingOrderNumbers.add(rec.order_number);
            }
          }
        }
      }

      if (existingOrderNumbers.size > 0 && orgPdvIds.length > 1) {
        console.warn(`[process-spreadsheet] Upload ${uploadId}: Cross-PDV dedup active across ${orgPdvIds.length} PDVs - found ${existingOrderNumbers.size} existing order_numbers`);
      }

      let dedupSkipped = 0;
      let finalRecords = cleanRecords;

      if (existingOrderNumbers.size > 0) {
        finalRecords = cleanRecords.filter(r => 
          !existingOrderNumbers.has(r?.order_number as string)
        );
        dedupSkipped = cleanRecords.length - finalRecords.length;
        skippedRecords += dedupSkipped;
        console.log(`[process-spreadsheet] Upload ${uploadId}: DEDUP - Ignored ${dedupSkipped} records already existing`);
      }

      // Add explicit source field to each record
      const recordsToInsert = finalRecords.map(r => ({ ...r, source: "spreadsheet" }));
      // === END DEDUPLICATION ===

      // Batch insert ONLY DEDUPLICATED CLEAN RECORDS (chunks of 500)
      const chunkSize = 500;
      for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
        const chunk = recordsToInsert.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
          .from("sales_records")
          .insert(chunk);
        
        if (insertError) {
          console.error(`Upload ${uploadId}: Insert error`, insertError.message);
          throw new Error(`Erro ao inserir registros: ${insertError.message}`);
        }
        
        recordsInserted += chunk.length;
      }
    } else if (upload.type === "stock") {
      // === CAPTURE OLD STOCK BEFORE REPLACING ===
      // Fetch old stock totals by product_name for smart pre-stock deduction
      const oldStockByProduct: Record<string, number> = {};
      {
        const { data: oldRecords } = await supabase
          .from("stock_records")
          .select("product_name, quantity")
          .eq("pdv_id", pdvId);
        
        for (const r of oldRecords ?? []) {
          const name = r.product_name as string;
          oldStockByProduct[name] = (oldStockByProduct[name] || 0) + ((r.quantity as number) || 0);
        }
      }

      // === REPLACE STOCK RECORDS FOR THIS PDV (snapshot) ===
      const { count: deletedCount, error: deleteRecordsError } = await supabase
        .from("stock_records")
        .delete({ count: 'exact' })
        .eq("pdv_id", pdvId);
      
      if (deleteRecordsError) {
        console.error(`Upload ${uploadId}: Error deleting previous stock records`, deleteRecordsError.message);
      } else {
        deletedPreviousRecords = deletedCount || 0;
        console.log(`Upload ${uploadId}: Replaced ${deletedPreviousRecords} previous stock records for PDV ${pdvId}`);
      }
      // === END REPLACE STOCK RECORDS ===
      
      // Map rows to stock records with validation
      const stockRecords = rows.map(row => mapStockRow(row, pdvId, uploadId)).filter(Boolean);
      
      // Filter out records without required fields
      const validRecords = stockRecords.filter(r => 
        r && r.device_id && r.slot_number && r.product_name
      );
      
      skippedRecords = rows.length - validRecords.length;

      // Batch insert (chunks of 500)
      const chunkSize = 500;
      for (let i = 0; i < validRecords.length; i += chunkSize) {
        const chunk = validRecords.slice(i, i + chunkSize);
        const { error: insertError } = await supabase
          .from("stock_records")
          .insert(chunk);
        
        if (insertError) {
          console.error(`Upload ${uploadId}: Insert error`, insertError.message);
          throw new Error(`Erro ao inserir registros: ${insertError.message}`);
        }
        
        recordsInserted += chunk.length;
      }
      
      // Generate stock history snapshot
      if (recordsInserted > 0) {
        // Get organization_id from PDV
        const { data: pdvData } = await supabase
          .from("pdvs")
          .select("organization_id")
          .eq("id", pdvId)
          .single();
        
        if (pdvData?.organization_id) {
          // Group by brand
          const brandTotals: Record<string, { quantity: number; activeSlots: number }> = {};
          
          for (const record of validRecords) {
            if (!record) continue;
            const brand = extractBrandFromProduct(record.product_name as string);
            if (!brandTotals[brand]) {
              brandTotals[brand] = { quantity: 0, activeSlots: 0 };
            }
            brandTotals[brand].quantity += (record.quantity as number) || 0;
            if (record.is_active) {
              brandTotals[brand].activeSlots += 1;
            }
          }
          
          // Insert snapshots (UPSERT to avoid duplicates on same day)
          const today = new Date().toISOString().split('T')[0];
          const snapshots = Object.entries(brandTotals).map(([brand, data]) => ({
            pdv_id: pdvId,
            organization_id: pdvData.organization_id,
            snapshot_date: today,
            brand: brand,
            total_quantity: data.quantity,
            active_slots: data.activeSlots,
            upload_id: uploadId,
          }));
          
          // UPSERT: update if snapshot for same day/brand already exists
          const { error: historyError } = await supabase
            .from("stock_history")
            .upsert(snapshots, { 
              onConflict: 'pdv_id,snapshot_date,brand',
              ignoreDuplicates: false 
            });
          
          if (historyError) {
            console.error(`Upload ${uploadId}: Stock history error`, historyError.message);
            // Don't fail the upload because of this
          }
        }
      }

      // === DEDUZIR PRÉ-ESTOQUE ===
      if (recordsInserted > 0 && pdvData?.organization_id) {
        try {
          const orgId = pdvData.organization_id;
            // Group quantities by product_name
            const productQtys: Record<string, number> = {};
            for (const record of validRecords) {
              if (!record) continue;
              const name = record.product_name as string;
              productQtys[name] = (productQtys[name] || 0) + ((record.quantity as number) || 0);
            }

            for (const [productName, newQty] of Object.entries(productQtys)) {
              const oldQty = oldStockByProduct[productName] || 0;
              const increase = Math.max(0, newQty - oldQty);
              if (increase <= 0) continue;

              const { data: preStockItems } = await supabase
                .from("pre_stock")
                .select("id, remaining_quantity")
                .eq("organization_id", orgId)
                .eq("product_name", productName)
                .eq("status", "pending")
                .gt("remaining_quantity", 0)
                .or(`pdv_id.eq.${pdvId},pdv_id.is.null`)
                .order("created_at", { ascending: true });

              let toDeduct = increase;
              for (const ps of preStockItems ?? []) {
                if (toDeduct <= 0) break;
                const deducted = Math.min(toDeduct, ps.remaining_quantity);
                const newRemaining = ps.remaining_quantity - deducted;
                const updateData: Record<string, unknown> = {
                  remaining_quantity: newRemaining,
                  status: newRemaining <= 0 ? "allocated" : "pending",
                };
                if (newRemaining <= 0) {
                  updateData.allocated_pdv_id = pdvId;
                }
                await supabase
                  .from("pre_stock")
                  .update(updateData)
                  .eq("id", ps.id);
                toDeduct -= deducted;
              }
              if ((preStockItems ?? []).length > 0) {
                console.log(`[process-spreadsheet] Upload ${uploadId}: Pre-stock deducted for ${productName}: increase=${increase}, old=${oldQty}, new=${newQty}`);
              }
            }
            console.log(`[process-spreadsheet] Upload ${uploadId}: Pre-stock deduction completed`);
          }
        } catch (preStockErr) {
          console.error(`Upload ${uploadId}: Pre-stock deduction error`, preStockErr);
          // Don't fail the upload
        }
      }

      // Keep only the current upload; delete all previous stock uploads
      try {
        const { data: oldUploads } = await supabase
          .from("uploads")
          .select("id, file_url")
          .eq("pdv_id", pdvId)
          .eq("type", "stock")
          .neq("id", uploadId);

        if (oldUploads && oldUploads.length > 0) {
          const oldIds = oldUploads.map(u => u.id);
          
          // Delete associated stock_records (should already be gone from snapshot replace, but ensure)
          await supabase
            .from("stock_records")
            .delete()
            .in("upload_id", oldIds);

          // stock_history snapshots are preserved (independent daily records)

          // Delete files from storage
          for (const old of oldUploads) {
            if (old.file_url) {
              const parts = old.file_url.split("/uploads/");
              if (parts.length >= 2) {
                await supabase.storage.from("uploads").remove([parts[1]]);
              }
            }
          }

          // Delete upload records
          await supabase
            .from("uploads")
            .delete()
            .in("id", oldIds);

          console.log(`[process-spreadsheet] Upload ${uploadId}: Cleaned up ${oldUploads.length} old stock uploads for PDV ${pdvId}`);
        }
      } catch (cleanupError) {
        console.error(`[process-spreadsheet] Upload ${uploadId}: Cleanup error (non-fatal)`, cleanupError);
        // Don't fail the upload because of cleanup issues
      }
      // === END CLEANUP ===
    }

    // Reutiliza anomalias e contagem já calculadas no bloco de vendas acima
    // (evita recalcular rows.map(mapSalesRow) 3x extras — bug original)
    const uploadAnomalyCount = anomalySkipped;

    // 5. Update upload status to ready
    await supabase
      .from("uploads")
      .update({
        status: "ready",
        records_count: recordsInserted,
        anomaly_count: uploadAnomalyCount,
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", uploadId);

    // 6. Create notification for the user who uploaded
    try {
      const { data: pdvInfo } = await supabase
        .from("pdvs")
        .select("organization_id")
        .eq("id", pdvId)
        .single();

      if (pdvInfo?.organization_id) {
        const typeLabel = upload.type === "sales" ? "vendas" : "estoque";
        const anomalyWarning = uploadAnomalyCount > 0 
          ? ` ATENÇÃO: ${uploadAnomalyCount} registro(s) com valor acima de R$ ${ANOMALY_THRESHOLDS.maxSingleAmount} foram EXCLUÍDOS.` 
          : "";
        
        await supabase
          .from("notifications")
          .insert({
            organization_id: pdvInfo.organization_id,
            user_id: upload.uploaded_by,
            type: "upload_processed",
            title: uploadAnomalyCount > 0 ? "Upload processado com alertas" : "Upload processado",
            message: `Seu arquivo de ${typeLabel} foi processado com ${recordsInserted} registros.${anomalyWarning}`,
            metadata: { 
              upload_id: uploadId, 
              records_count: recordsInserted,
              type: upload.type,
              anomaly_count: uploadAnomalyCount,
            },
          });
      }
    } catch (notifError) {
      console.error(`Upload ${uploadId}: Failed to create notification`, notifError);
    }

    // Reutiliza anomalias já detectadas no bloco de sales — sem recálculo extra
    const responseAnomalies: AnomalyRecord[] = detectedAnomalies;

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsCount: recordsInserted,
        skippedCount: skippedRecords,
        anomalies: responseAnomalies.slice(0, 20),
        hasAnomalies: responseAnomalies.length > 0,
        anomalyCount: responseAnomalies.length,
        message: `Processado com sucesso: ${recordsInserted} registros` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Processing error:", error instanceof Error ? error.message : "Unknown error");
    
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
