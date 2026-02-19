import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

const AMOUNT_MIN = 0;
const AMOUNT_MAX = 10000000;

function sanitizeString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  let str = String(value).trim();
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (str.length > maxLength) str = str.substring(0, maxLength);
  return str || null;
}

function sanitizeOrderNumber(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.order_number);
  if (!str) return null;
  return str.replace(/[^a-zA-Z0-9\-_\.]/g, "") || null;
}

function sanitizeDeviceId(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.device_id);
  if (!str) return null;
  return str.replace(/[^a-zA-Z0-9\-]/g, "") || null;
}

function parsePaymentDate(value: unknown): string {
  if (!value) return new Date().toISOString();

  const str = String(value).trim();
  if (str.length > 50) return new Date().toISOString();

  // Try DD/MM/YYYY HH:MM format
  const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
  }

  // Try ISO date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    if (year >= 1900 && year <= 2100) return parsed.toISOString();
  }

  return new Date().toISOString();
}

function parseAmount(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") {
    return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, value));
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
      // decimal
    } else {
      str = str.replace(/\./g, "");
    }
  }

  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  return Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, parsed));
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Extract API key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "API key ausente. Use Authorization: Bearer <key>" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (!apiKey || apiKey.length < 16) {
      return new Response(
        JSON.stringify({ error: "API key inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Hash the key and look it up
    const keyHash = await hashApiKey(apiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: apiKeyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, organization_id")
      .eq("key_hash", keyHash)
      .eq("is_active", true)
      .maybeSingle();

    if (keyError || !apiKeyRecord) {
      return new Response(
        JSON.stringify({ error: "API key inválida ou desativada" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const organizationId = apiKeyRecord.organization_id;

    // 3. Parse body
    const body = await req.json();

    // 4. Validate required fields
    const requiredFields = ["device_id", "order_number", "product_name", "amount"];
    const missingFields = requiredFields.filter(f => !body[f] && body[f] !== 0);
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ error: `Campos obrigatórios faltando: ${missingFields.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Resolve PDV from device_id + organization_id
    const deviceId = sanitizeDeviceId(body.device_id);
    if (!deviceId) {
      return new Response(
        JSON.stringify({ error: "device_id inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: pdv, error: pdvError } = await supabase
      .from("pdvs")
      .select("id")
      .eq("machine_id", deviceId)
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .maybeSingle();

    if (pdvError || !pdv) {
      return new Response(
        JSON.stringify({ error: `PDV não encontrado para device_id "${deviceId}" nesta organização` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Sanitize and build record
    const record = {
      pdv_id: pdv.id,
      upload_id: null,
      source: "api",
      device_id: deviceId,
      order_number: sanitizeOrderNumber(body.order_number),
      product_name: sanitizeString(body.product_name, FIELD_LIMITS.product_name),
      payment_date: body.payment_date ? parsePaymentDate(body.payment_date) : null,
      amount: parseAmount(body.amount),
      payment_method: sanitizeString(body.payment_method, FIELD_LIMITS.payment_method),
      status: sanitizeString(body.status, FIELD_LIMITS.status),
      refund_amount: body.refund_amount != null ? parseAmount(body.refund_amount) : 0,
      transaction_number: sanitizeString(body.transaction_number, FIELD_LIMITS.transaction_number),
      merchant_id: sanitizeString(body.merchant_id, FIELD_LIMITS.merchant_id),
      print_code: sanitizeString(body.print_code, FIELD_LIMITS.print_code),
      discount_amount: body.discount_amount != null ? parseAmount(body.discount_amount) : 0,
      actual_paid_amount: body.actual_paid_amount != null ? parseAmount(body.actual_paid_amount) : null,
      payment_flow: sanitizeString(body.payment_flow, FIELD_LIMITS.payment_flow),
      order_time: body.order_time ? parsePaymentDate(body.order_time) : null,
      order_completion_time: body.order_completion_time ? parsePaymentDate(body.order_completion_time) : null,
    };

    if (!record.order_number || !record.product_name) {
      return new Response(
        JSON.stringify({ error: "order_number ou product_name inválido após sanitização" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Check for duplicate before inserting (idempotency)
    const { data: existing } = await supabase
      .from("sales_records")
      .select("id")
      .eq("order_number", record.order_number!)
      .eq("pdv_id", record.pdv_id)
      .eq("source", "api")
      .maybeSingle();

    if (existing) {
      // Registro já existe — retorna 200 idempotente sem inserir novamente
      await supabase
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyRecord.id);

      return new Response(
        JSON.stringify({ success: true, record_id: existing.id, pdv_id: pdv.id, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert into sales_records
    const { data: inserted, error: insertError } = await supabase
      .from("sales_records")
      .insert(record)
      .select("id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao inserir registro", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    return new Response(
      JSON.stringify({ success: true, record_id: inserted.id, pdv_id: pdv.id }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ingest revenue error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
