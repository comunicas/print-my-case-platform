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
};

// Amount limits for validation
const AMOUNT_MIN = 0;
const AMOUNT_MAX = 10000000; // 10 million (reasonable max for a single transaction)
const QUANTITY_MIN = 0;
const QUANTITY_MAX = 100000; // reasonable max for stock quantity

// Column mapping for sales spreadsheet (REVENUE.xlsx) - PT and EN aliases
const SALES_COLUMN_MAP: Record<string, string[]> = {
  "merchant_id": ["Comerciante", "Merchant"],
  "device_id": ["ID do dispositivo", "Device ID"],
  "order_number": ["Número do pedido", "Order ID"],
  "product_name": ["Nome do produto", "Product Name"],
  "transaction_number": ["Número da transação", "Transaction ID"],
  "payment_date": ["Hora do pagamento", "Payment Time"],
  "amount": ["Valor pago", "Payment Amount"],
  "payment_method": ["Forma de pagamento", "Payment Method"],
  "status": ["Status"],
  "refund_amount": ["Valor reembolsado", "Refund Amount"],
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

// Parse monetary value "R$ 1.234,56" or number with validation
function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    // Validate range
    if (value < AMOUNT_MIN || value > AMOUNT_MAX) {
      console.warn(`Amount out of range: ${value}, clamping to limits`);
      return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, value));
    }
    return value;
  }
  
  const str = String(value).substring(0, 50) // Limit input length
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  
  // Validate range
  if (parsed < AMOUNT_MIN || parsed > AMOUNT_MAX) {
    console.warn(`Amount out of range: ${parsed}, clamping to limits`);
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
      console.warn(`Quantity out of range: ${qty}, clamping to limits`);
      return Math.max(QUANTITY_MIN, Math.min(QUANTITY_MAX, qty));
    }
    return qty;
  }
  
  const parsed = parseInt(String(value).substring(0, 20), 10);
  if (isNaN(parsed)) return 0;
  
  // Validate range
  if (parsed < QUANTITY_MIN || parsed > QUANTITY_MAX) {
    console.warn(`Quantity out of range: ${parsed}, clamping to limits`);
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
  
  for (const [dbCol, aliases] of Object.entries(SALES_COLUMN_MAP)) {
    const value = getColumnValue(row, aliases);
    
    switch (dbCol) {
      case "payment_date":
        mapped[dbCol] = parsePaymentDate(value);
        break;
      case "amount":
      case "refund_amount":
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
    }
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

    console.log(`Processing upload: ${uploadId}`);

    // === AUTHORIZATION CHECK ===
    // Verify the calling user is authorized to process this upload
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No authorization header provided");
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
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User authenticated: ${user.id}`);

    // Verify user can access this upload (RLS will enforce organization check)
    const { data: uploadCheck, error: accessError } = await supabaseUser
      .from("uploads")
      .select("id")
      .eq("id", uploadId)
      .single();

    if (accessError || !uploadCheck) {
      console.error("Access denied or upload not found:", accessError);
      return new Response(
        JSON.stringify({ success: false, error: "Upload not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authorization verified for upload: ${uploadId}`);
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

    if (upload.type === "sales") {
      // Map rows to sales records with validation
      const salesRecords = rows.map(row => mapSalesRow(row, pdvId, uploadId)).filter(Boolean);
      
      // Filter out records without required fields
      const validRecords = salesRecords.filter(r => 
        r && r.device_id && r.order_number && r.product_name && r.amount !== null && r.amount !== undefined
      );
      
      skippedRecords = rows.length - validRecords.length;
      console.log(`Inserting ${validRecords.length} valid sales records (skipped ${skippedRecords})...`);

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
      // Map rows to stock records with validation
      const stockRecords = rows.map(row => mapStockRow(row, pdvId, uploadId)).filter(Boolean);
      
      // Filter out records without required fields
      const validRecords = stockRecords.filter(r => 
        r && r.device_id && r.slot_number && r.product_name
      );
      
      skippedRecords = rows.length - validRecords.length;
      console.log(`Inserting ${validRecords.length} valid stock records (skipped ${skippedRecords})...`);

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
      
      // Generate stock history snapshot
      if (recordsInserted > 0) {
        console.log("Generating stock history snapshot...");
        
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
            console.error("Error saving stock history:", historyError);
            // Don't fail the upload because of this
          } else {
            console.log(`Saved ${snapshots.length} stock history snapshots`);
          }
        }
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

    console.log(`Successfully processed ${recordsInserted} records (skipped ${skippedRecords})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        recordsCount: recordsInserted,
        skippedCount: skippedRecords,
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
