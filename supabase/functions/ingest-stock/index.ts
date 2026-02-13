import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIELD_LIMITS = {
  device_id: 100,
  slot_number: 20,
  product_name: 255,
  record_number: 100,
};

function sanitizeString(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  let str = String(value).trim();
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (str.length > maxLength) str = str.substring(0, maxLength);
  return str || null;
}

function sanitizeDeviceId(value: unknown): string | null {
  const str = sanitizeString(value, FIELD_LIMITS.device_id);
  if (!str) return null;
  return str.replace(/[^a-zA-Z0-9\-]/g, "") || null;
}

function parseQuantity(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Math.max(0, Math.min(100000, Math.floor(value)));
  const parsed = parseInt(String(value), 10);
  if (isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100000, parsed));
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function extractBrand(productName: string): string {
  const name = productName.toUpperCase();
  const brands = ["APPLE", "SAMSUNG", "MOTOROLA", "XIAOMI", "LG", "HUAWEI", "SONY", "NOKIA", "REALME", "POCO"];
  for (const brand of brands) {
    if (name.startsWith(brand + " ") || name.includes(" " + brand + " ")) return brand;
  }
  return "OUTROS";
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
    // 1. Extract & validate API key
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

    const keyHash = await hashApiKey(apiKey);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Lookup API key
    const { data: apiKeyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("id, organization_id, created_by")
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

    // 3. Parse body — single record
    const body = await req.json();

    if (!body.device_id) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório faltando: device_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Resolve PDV
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

    // 5. Validate single record fields
    const slotNumber = sanitizeString(body.slot_number, FIELD_LIMITS.slot_number);
    const productName = sanitizeString(body.product_name, FIELD_LIMITS.product_name);
    const quantity = parseQuantity(body.quantity);

    if (!slotNumber || !productName) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: slot_number e product_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create upload record for traceability
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .insert({
        pdv_id: pdv.id,
        file_name: `api-stock-${new Date().toISOString()}`,
        type: "stock" as const,
        uploaded_by: apiKeyRecord.created_by,
        status: "ready" as const,
        records_count: 1,
        processed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (uploadError || !upload) {
      console.error("Upload creation error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar registro de upload", details: uploadError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Delete old stock_record for this device_id + slot_number only
    const { count: deletedCount, error: deleteError } = await supabase
      .from("stock_records")
      .delete({ count: "exact" })
      .eq("pdv_id", pdv.id)
      .eq("device_id", deviceId)
      .eq("slot_number", slotNumber);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao deletar registros antigos", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Insert single record
    const record = {
      pdv_id: pdv.id,
      device_id: deviceId,
      slot_number: slotNumber,
      product_name: productName,
      quantity,
      is_active: body.is_active !== false,
      upload_id: upload.id,
      record_number: sanitizeString(body.record_number, FIELD_LIMITS.record_number),
    };

    const { error: insertError } = await supabase
      .from("stock_records")
      .insert(record);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erro ao inserir registro", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Generate stock_history snapshot
    const today = new Date().toISOString().split("T")[0];
    const brand = extractBrand(productName);

    const { data: existingHistory } = await supabase
      .from("stock_history")
      .select("id")
      .eq("pdv_id", pdv.id)
      .eq("snapshot_date", today)
      .eq("brand", brand)
      .maybeSingle();

    if (existingHistory) {
      await supabase
        .from("stock_history")
        .update({
          total_quantity: quantity,
          active_slots: record.is_active ? 1 : 0,
          upload_id: upload.id,
        })
        .eq("id", existingHistory.id);
    } else {
      await supabase
        .from("stock_history")
        .insert({
          pdv_id: pdv.id,
          organization_id: organizationId,
          snapshot_date: today,
          brand,
          total_quantity: quantity,
          active_slots: record.is_active ? 1 : 0,
          upload_id: upload.id,
        });
    }

    // 10. Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        pdv_id: pdv.id,
        upload_id: upload.id,
        records_inserted: 1,
        records_deleted: deletedCount ?? 0,
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ingest stock error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
