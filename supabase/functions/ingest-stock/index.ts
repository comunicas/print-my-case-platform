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

const MAX_RECORDS_PER_REQUEST = 1000;
const BATCH_SIZE = 500;

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

    // 3. Parse body
    const body = await req.json();

    if (!body.device_id) {
      return new Response(
        JSON.stringify({ error: "Campo obrigatório faltando: device_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(body.records) || body.records.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campo 'records' deve ser um array não vazio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (body.records.length > MAX_RECORDS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: `Máximo de ${MAX_RECORDS_PER_REQUEST} registros por request` }),
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

    // 5. Validate and sanitize records
    const sanitizedRecords: Array<{
      pdv_id: string;
      device_id: string;
      slot_number: string;
      product_name: string;
      quantity: number;
      is_active: boolean;
      upload_id: string;
      record_number: string | null;
    }> = [];

    // We need an upload_id for stock_records — create a synthetic upload entry
    const { data: upload, error: uploadError } = await supabase
      .from("uploads")
      .insert({
        pdv_id: pdv.id,
        file_name: `api-stock-${new Date().toISOString()}`,
        type: "stock" as const,
        uploaded_by: apiKeyRecord.created_by,
        status: "ready" as const,
        records_count: body.records.length,
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

    for (let i = 0; i < body.records.length; i++) {
      const rec = body.records[i];

      const slotNumber = sanitizeString(rec.slot_number, FIELD_LIMITS.slot_number);
      const productName = sanitizeString(rec.product_name, FIELD_LIMITS.product_name);
      const quantity = parseQuantity(rec.quantity);

      if (!slotNumber || !productName) {
        return new Response(
          JSON.stringify({ error: `Registro ${i}: slot_number e product_name são obrigatórios` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      sanitizedRecords.push({
        pdv_id: pdv.id,
        device_id: deviceId,
        slot_number: slotNumber,
        product_name: productName,
        quantity,
        is_active: rec.is_active !== false,
        upload_id: upload.id,
        record_number: sanitizeString(rec.record_number, FIELD_LIMITS.record_number),
      });
    }

    // 6. Delete old stock_records for this PDV
    const { count: deletedCount, error: deleteError } = await supabase
      .from("stock_records")
      .delete({ count: "exact" })
      .eq("pdv_id", pdv.id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao deletar registros antigos", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Insert new records one by one
    let insertedCount = 0;
    for (let i = 0; i < sanitizedRecords.length; i++) {
      const record = sanitizedRecords[i];
      const { error: insertError } = await supabase
        .from("stock_records")
        .insert(record);

      if (insertError) {
        console.error("Insert error at record", i, insertError);
        return new Response(
          JSON.stringify({ error: `Erro ao inserir registro ${i}`, details: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      insertedCount += 1;
    }

    // 8. Generate stock_history snapshot
    const today = new Date().toISOString().split("T")[0];
    const brandMap = new Map<string, { quantity: number; activeSlots: number }>();

    for (const rec of sanitizedRecords) {
      const brand = extractBrand(rec.product_name);
      const existing = brandMap.get(brand) || { quantity: 0, activeSlots: 0 };
      existing.quantity += rec.quantity;
      if (rec.is_active) existing.activeSlots += 1;
      brandMap.set(brand, existing);
    }

    for (const [brand, stats] of brandMap) {
      // Try update first, then insert (upsert by pdv_id + snapshot_date + brand)
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
            total_quantity: stats.quantity,
            active_slots: stats.activeSlots,
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
            total_quantity: stats.quantity,
            active_slots: stats.activeSlots,
            upload_id: upload.id,
          });
      }
    }

    // 9. Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        pdv_id: pdv.id,
        upload_id: upload.id,
        records_inserted: insertedCount,
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
