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
  const upper = (productName || "").toUpperCase().trim();

  const knownBrands = ["APPLE", "SAMSUNG", "XIAOMI", "MOTOROLA", "REALME"];
  for (const brand of knownBrands) {
    if (upper.startsWith(brand + " ") || upper === brand) return brand;
  }

  // Detect by product line
  if (upper.includes("IPHONE") || upper.includes("MACBOOK") || upper.includes("IPAD") || upper.includes("AIRPODS")) return "APPLE";
  if (upper.includes("GALAXY")) return "SAMSUNG";
  if (upper.includes("REDMI") || upper.includes("POCO") || upper.includes("MI ")) return "XIAOMI";
  if (upper.includes("MOTO ") || upper.includes("MOTOROLA")) return "MOTOROLA";

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
    console.log(`[ingest-stock] auth OK | org=${organizationId}`);

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

    console.log(`[ingest-stock] PDV resolved | pdv=${pdv.id} device=${deviceId}`);

    // 5. Validate single record fields
    const slotNumber = sanitizeString(body.slot_number, FIELD_LIMITS.slot_number);
    const productName = sanitizeString(body.product_name, FIELD_LIMITS.product_name);
    const quantity = parseQuantity(body.quantity);
    const isActive = body.is_active !== false;

    if (!slotNumber || !productName) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: slot_number e product_name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // 6. Upsert upload diário — 1 upload por PDV por dia (não 1 por slot)
    const dailyFileName = `api-stock-${today}`;

    const { data: existingUpload } = await supabase
      .from("uploads")
      .select("id, records_count")
      .eq("pdv_id", pdv.id)
      .eq("file_name", dailyFileName)
      .maybeSingle();

    let uploadId: string;

    if (existingUpload) {
      // Reutilizar upload do dia e incrementar o contador
      await supabase
        .from("uploads")
        .update({
          records_count: (existingUpload.records_count ?? 0) + 1,
          processed_at: new Date().toISOString(),
        })
        .eq("id", existingUpload.id);
      uploadId = existingUpload.id;
    } else {
      // Criar novo upload do dia para este PDV
      const { data: newUpload, error: uploadError } = await supabase
        .from("uploads")
        .insert({
          pdv_id: pdv.id,
          file_name: dailyFileName,
          type: "stock" as const,
          uploaded_by: apiKeyRecord.created_by,
          status: "ready" as const,
          records_count: 1,
          processed_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (uploadError || !newUpload) {
        console.error("Upload creation error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Erro ao criar registro de upload", details: uploadError?.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      uploadId = newUpload.id;
    }

    // 7. Fetch old quantity BEFORE deleting for smart pre-stock deduction
    let oldQuantity = 0;
    {
      const { data: oldRecord } = await supabase
        .from("stock_records")
        .select("quantity")
        .eq("pdv_id", pdv.id)
        .eq("device_id", deviceId)
        .eq("slot_number", slotNumber)
        .maybeSingle();
      
      if (oldRecord) {
        oldQuantity = (oldRecord.quantity as number) || 0;
      }
    }

    // 7b. Delete old stock_record for this device_id + slot_number only
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
      is_active: isActive,
      upload_id: uploadId,
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

    console.log(`[ingest-stock] OK | pdv=${pdv.id} slot=${slotNumber} product=${productName} qty=${quantity} oldQty=${oldQuantity} deleted=${deletedCount ?? 0}`);

    // 8b. Deduzir pré-estoque somente se houve AUMENTO real de quantidade
    const qtyIncrease = Math.max(0, quantity - oldQuantity);
    if (qtyIncrease > 0) {
      const { data: preStockItems } = await supabase
        .from("pre_stock")
        .select("id, remaining_quantity")
        .eq("organization_id", organizationId)
        .eq("product_name", productName)
        .eq("status", "pending")
        .gt("remaining_quantity", 0)
        .or(`pdv_id.eq.${pdv.id},pdv_id.is.null`)
        .order("created_at", { ascending: true });

      let toDeduct = qtyIncrease;
      for (const ps of preStockItems ?? []) {
        if (toDeduct <= 0) break;
        const deducted = Math.min(toDeduct, ps.remaining_quantity);
        const newRemaining = ps.remaining_quantity - deducted;
        const updateData: Record<string, unknown> = {
          remaining_quantity: newRemaining,
          status: newRemaining <= 0 ? "allocated" : "pending",
        };
        if (newRemaining <= 0) {
          updateData.allocated_pdv_id = pdv.id;
        }
        await supabase
          .from("pre_stock")
          .update(updateData)
          .eq("id", ps.id);
        toDeduct -= deducted;
      }
      if ((preStockItems ?? []).length > 0) {
        console.log(`[ingest-stock] pre_stock deducted | product=${productName} increase=${qtyIncrease} (old=${oldQuantity} new=${quantity})`);
      }
    }

    // 9. Atualizar stock_history com totais AGREGADOS do brand (não valor de um único slot)
    const brand = extractBrand(productName);

    // Corrigido: busca TODOS os registros do PDV e filtra por marca em memória
    // (antes: query ilike com string vazia para OUTROS retornava TODOS os produtos, gerando totais errados)
    const { data: allPdvRecords, error: allRecordsError } = await supabase
      .from("stock_records")
      .select("product_name, quantity, is_active")
      .eq("pdv_id", pdv.id);

    // knownBrands não é mais necessária — o filtro de brand agora usa extractBrand() em memória

    // Filtra registros do brand atual em memória — evita query ilike incorreta para OUTROS
    const brandRecords = (allPdvRecords ?? []).filter(r => {
      const recordBrand = extractBrand((r as { product_name: string }).product_name ?? "");
      return recordBrand === brand;
    });

    if (!allRecordsError && brandRecords.length > 0) {
      const totalQty = brandRecords.reduce((sum, r) => sum + ((r as { quantity: number }).quantity ?? 0), 0);
      const activeSlots = brandRecords.filter(r => (r as { is_active: boolean }).is_active).length;

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
            total_quantity: totalQty,
            active_slots: activeSlots,
            upload_id: uploadId,
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
            total_quantity: totalQty,
            active_slots: activeSlots,
            upload_id: uploadId,
          });
      }
    }

    console.log(`[ingest-stock] history | brand=${brand} totalQty=${brandRecords.reduce((s, r) => s + ((r as { quantity: number }).quantity ?? 0), 0)} activeSlots=${brandRecords.filter(r => (r as { is_active: boolean }).is_active).length}`);

    // 10. Update last_used_at
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKeyRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        pdv_id: pdv.id,
        upload_id: uploadId,
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
