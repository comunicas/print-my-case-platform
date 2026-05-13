// Sincronização de estoque via API Kexiaozhan
// Acionada pela UI (/uploads → "Atualizar Estoque via API"). Requer JWT do usuário.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function serializeError(e: unknown): {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  raw?: string;
} {
  if (e === null || e === undefined) return { message: "Erro desconhecido" };
  if (e instanceof Error) {
    return {
      message: e.message || e.name || "Error",
      code: e.name,
      details: e.stack?.slice(0, 500),
    };
  }
  if (typeof e === "string") return { message: e };
  if (typeof e === "number" || typeof e === "boolean") return { message: String(e) };
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    const message =
      (typeof o.message === "string" && o.message) ||
      (typeof o.error_description === "string" && o.error_description) ||
      (typeof o.error === "string" && o.error) ||
      JSON.stringify(o).slice(0, 1000);
    const out: { message: string; code?: string; details?: string; hint?: string; raw?: string } = {
      message,
    };
    if (typeof o.code === "string") out.code = o.code;
    if (typeof o.details === "string") out.details = o.details;
    if (typeof o.hint === "string") out.hint = o.hint;
    if (!o.message) out.raw = JSON.stringify(o).slice(0, 1000);
    return out;
  }
  return { message: String(e) };
}

const FIELD_LIMITS = {
  device_id: 100,
  slot_number: 20,
  product_name: 255,
};

function sanitize(value: unknown, max: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  let s = String(value).trim();
  s = [...s]
    .filter((c) => {
      const code = c.charCodeAt(0);
      return !(code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127);
    })
    .join("");
  if (s.length > max) s = s.slice(0, max);
  return s || null;
}

function parseQty(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Math.max(0, Math.min(100000, Math.floor(v)));
  const n = parseInt(String(v), 10);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(100000, n));
}

function extractBrand(productName: string): string {
  const upper = (productName || "").toUpperCase().trim();
  const known = ["APPLE", "SAMSUNG", "XIAOMI", "MOTOROLA", "REALME"];
  for (const b of known) {
    if (upper.startsWith(b + " ") || upper === b) return b;
  }
  if (upper.includes("IPHONE") || upper.includes("MACBOOK") || upper.includes("IPAD") || upper.includes("AIRPODS")) return "APPLE";
  if (upper.includes("GALAXY")) return "SAMSUNG";
  if (upper.includes("REDMI") || upper.includes("POCO") || upper.includes("MI ")) return "XIAOMI";
  if (upper.includes("MOTO ") || upper.includes("MOTOROLA")) return "MOTOROLA";
  return "OUTROS";
}

// --- Cliente Kexiaozhan ---
const KXZ_BASE = (Deno.env.get("KXZ_API_BASE") ?? "").replace(/\/+$/, "");
const KXZ_USER = Deno.env.get("KXZ_USER") ?? "";
const KXZ_PASS = Deno.env.get("KXZ_PASS") ?? "";

async function kxzLogin(): Promise<string> {
  const url = `${KXZ_BASE}/user/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: KXZ_USER, password: KXZ_PASS, account: KXZ_USER }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Login Kexiaozhan falhou: ${res.status} ${text.slice(0, 200)}`);
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Resposta de login inválida: ${text.slice(0, 200)}`);
  }
  const token =
    json?.data?.token ?? json?.token ?? json?.access_token ?? json?.data?.access_token;
  if (!token) throw new Error(`Token ausente na resposta de login: ${text.slice(0, 200)}`);
  return token;
}

interface KxzChannel {
  // Identificação do slot/canal
  channelCode?: string | number;
  channelNo?: string | number;
  channel?: string | number;
  slotNumber?: string | number;
  slot?: string | number;
  number?: string | number;
  code?: string | number;
  // Quantidade atual
  stock?: number | string;
  quantity?: number | string;
  num?: number | string;
  count?: number | string;
  remaining?: number | string;
  remainingStock?: number | string;
  inventory?: number | string;
  // Produto
  goodsName?: string;
  productName?: string;
  product_name?: string;
  name?: string;
  goodsId?: string | number;
  productId?: string | number;
  goodId?: string | number;
  // Status
  status?: number | string;
  state?: number | string;
  enable?: number | string;
  enabled?: number | boolean;
  isEnable?: number | boolean;
  isActive?: number | boolean;
  active?: number | boolean;
}

async function kxzListChannels(
  token: string,
  machineId: string,
  onPage?: (page: number, count: number) => void,
): Promise<KxzChannel[]> {
  const all: KxzChannel[] = [];
  const pageSize = 20;
  let page = 1;
  while (page < 200) {
    const params = new URLSearchParams({
      machineId,
      page: String(page),
      size: String(pageSize),
    });
    const url = `${KXZ_BASE}/v1/machine-channels?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, token, "Content-Type": "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Listagem de canais falhou (page ${page}): ${res.status} ${text.slice(0, 200)}`);
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Resposta inválida ao listar canais: ${text.slice(0, 200)}`);
    }
    const list: KxzChannel[] =
      json?.data?.records ?? json?.data?.list ?? json?.data ?? json?.records ?? [];
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    onPage?.(page, all.length);
    if (list.length < pageSize) break;
    page += 1;
  }
  return all;
}

interface KxzGoodsBrief {
  goodsId?: string | number;
  productId?: string | number;
  id?: string | number;
  goodsName?: string;
  productName?: string;
  name?: string;
  channelCode?: string | number;
  slotNumber?: string | number;
}

async function kxzListGoodsBriefs(token: string, machineId: string): Promise<KxzGoodsBrief[]> {
  const params = new URLSearchParams({ machineId });
  const url = `${KXZ_BASE}/v1/machine-goods-briefs?${params}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, token, "Content-Type": "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Lookup de produtos falhou: ${res.status} ${text.slice(0, 200)}`);
  }
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida em goods-briefs: ${text.slice(0, 200)}`);
  }
  const list: KxzGoodsBrief[] =
    json?.data?.records ?? json?.data?.list ?? json?.data ?? json?.records ?? [];
  return Array.isArray(list) ? list : [];
}

function pickSlot(c: KxzChannel): string | null {
  const raw =
    c.channelCode ?? c.channelNo ?? c.channel ?? c.slotNumber ?? c.slot ?? c.number ?? c.code;
  const s = sanitize(raw, FIELD_LIMITS.slot_number);
  if (!s) return null;
  // Padroniza para 2 dígitos quando puramente numérico (mesma lógica do grid)
  if (/^\d+$/.test(s)) return s.padStart(2, "0");
  return s;
}

function pickQty(c: KxzChannel): number {
  return parseQty(
    c.stock ?? c.quantity ?? c.num ?? c.count ?? c.remaining ?? c.remainingStock ?? c.inventory,
  );
}

function pickActive(c: KxzChannel): boolean {
  // Kexiaozhan: status numérico (1 ativo, 0/-1 inativo). enable/active também aparecem.
  const raw =
    c.isActive ?? c.active ?? c.isEnable ?? c.enabled ?? c.enable ?? c.status ?? c.state;
  if (raw === undefined || raw === null) return true;
  if (typeof raw === "boolean") return raw;
  const s = String(raw).trim().toLowerCase();
  if (s === "" || s === "0" || s === "-1" || s === "false" || s === "off" || s === "disabled" || s === "inactive") {
    return false;
  }
  return true;
}

function pickGoodsId(c: KxzChannel): string | null {
  const raw = c.goodsId ?? c.productId ?? c.goodId;
  return raw === undefined || raw === null ? null : String(raw);
}

function pickProductName(c: KxzChannel): string | null {
  return sanitize(
    c.goodsName ?? c.productName ?? c.product_name ?? c.name,
    FIELD_LIMITS.product_name,
  );
}

interface StockRecordRow {
  pdv_id: string;
  upload_id: string;
  device_id: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active: boolean;
}

interface VerificationReport {
  total_slots_gateway: number;
  total_slots_db: number;
  total_quantity_gateway: number;
  total_quantity_db: number;
  active_slots_gateway: number;
  active_slots_db: number;
  by_brand: Array<{
    brand: string;
    qty_gateway: number;
    qty_db: number;
    slots_gateway: number;
    slots_db: number;
    diff: number;
  }>;
  duplicates: Array<{ slot_number: string; occurrences: number }>;
  missing_product_names: number;
  ok: boolean;
  warnings: string[];
}

async function buildVerification(
  admin: ReturnType<typeof createClient>,
  pdvId: string,
  deviceId: string,
  gatewayRows: StockRecordRow[],
  duplicates: Array<{ slot_number: string; occurrences: number }>,
  missingNames: number,
): Promise<VerificationReport> {
  const dbRows: Array<{ product_name: string; quantity: number; is_active: boolean }> = [];
  const pageSize = 1000;
  let from = 0;
  for (;;) {
    const { data, error } = await admin
      .from("stock_records")
      .select("product_name, quantity, is_active")
      .eq("pdv_id", pdvId)
      .eq("device_id", deviceId)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const rows = (data ?? []) as Array<{ product_name: string; quantity: number; is_active: boolean }>;
    dbRows.push(...rows);
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  const sumQty = (rs: { quantity: number }[]) =>
    rs.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const countActive = (rs: { is_active: boolean }[]) => rs.filter((r) => r.is_active).length;

  const groupBrand = <T extends { product_name: string; quantity: number }>(rs: T[]) => {
    const m = new Map<string, { qty: number; slots: number }>();
    for (const r of rs) {
      const b = extractBrand(r.product_name);
      const cur = m.get(b) ?? { qty: 0, slots: 0 };
      cur.qty += Number(r.quantity) || 0;
      cur.slots += 1;
      m.set(b, cur);
    }
    return m;
  };

  const gBrands = groupBrand(gatewayRows);
  const dBrands = groupBrand(dbRows);
  const allBrands = new Set<string>([...gBrands.keys(), ...dBrands.keys()]);
  const by_brand = Array.from(allBrands)
    .map((brand) => {
      const g = gBrands.get(brand) ?? { qty: 0, slots: 0 };
      const d = dBrands.get(brand) ?? { qty: 0, slots: 0 };
      return {
        brand,
        qty_gateway: g.qty,
        qty_db: d.qty,
        slots_gateway: g.slots,
        slots_db: d.slots,
        diff: d.qty - g.qty,
      };
    })
    .sort((a, b) => b.qty_db - a.qty_db);

  const warnings: string[] = [];
  if (duplicates.length > 0)
    warnings.push(`${duplicates.length} slot(s) duplicado(s) no gateway`);
  if (missingNames > 0)
    warnings.push(`${missingNames} canal(is) sem produto resolvido`);
  for (const b of by_brand) {
    if (b.diff !== 0)
      warnings.push(
        `${b.brand}: gateway=${b.qty_gateway} vs banco=${b.qty_db} (Δ ${b.diff > 0 ? "+" : ""}${b.diff})`,
      );
  }

  return {
    total_slots_gateway: gatewayRows.length,
    total_slots_db: dbRows.length,
    total_quantity_gateway: sumQty(gatewayRows),
    total_quantity_db: sumQty(dbRows),
    active_slots_gateway: countActive(gatewayRows),
    active_slots_db: countActive(dbRows),
    by_brand,
    duplicates,
    missing_product_names: missingNames,
    ok: duplicates.length === 0 && missingNames === 0 && by_brand.every((b) => b.diff === 0),
    warnings,
  };
}

interface PdvResult {
  pdv_id: string;
  pdv_name: string;
  status: "ready" | "error";
  inserted?: number;
  total?: number;
  error?: string;
  code?: string;
  details?: string;
  hint?: string;
  verification?: VerificationReport;
}

function todayDateStr(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  if (!KXZ_BASE || !KXZ_USER || !KXZ_PASS) {
    return new Response(
      JSON.stringify({ error: "Credenciais Kexiaozhan não configuradas." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const requestedPdvIds: string[] | undefined = Array.isArray(body?.pdv_ids)
      ? body.pdv_ids.map((x: unknown) => String(x))
      : undefined;
    const wantStream = body?.stream === true;

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    const orgId = (profile as any)?.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "Usuário sem organização" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isViewer =
      Array.isArray(roles) &&
      roles.length > 0 &&
      roles.every((r: any) => r.role === "viewer");
    if (isViewer) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let pdvQuery = admin
      .from("pdvs")
      .select("id, name, machine_id")
      .eq("organization_id", orgId)
      .eq("status", "active");
    if (requestedPdvIds && requestedPdvIds.length > 0) {
      pdvQuery = pdvQuery.in("id", requestedPdvIds);
    }
    const { data: pdvs, error: pdvErr } = await pdvQuery;
    if (pdvErr) throw pdvErr;
    if (!pdvs || pdvs.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum PDV ativo encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = todayDateStr();
    console.info(
      `[sync-stock] start req=${requestId} org=${orgId} day=${today} pdvs=${pdvs.length}`,
    );

    type EmitFn = (event: string, data: unknown) => void;
    let sseController: ReadableStreamDefaultController<Uint8Array> | null = null;
    const encoder = new TextEncoder();
    const emit: EmitFn = (event, data) => {
      if (!sseController) return;
      try {
        sseController.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      } catch {
        // controller already closed
      }
    };

    const runWork = async (): Promise<PdvResult[]> => {
      let kxzToken: string | null = null;
      const results: PdvResult[] = [];
      for (const pdv of pdvs) {
      const pdvName = (pdv as any).name as string;
      const pdvId = (pdv as any).id as string;
      const machineId = (pdv as any).machine_id as string;
      const startedAt = new Date().toISOString();

      if (!machineId) {
        results.push({
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "error",
          error: "PDV sem machine_id configurado",
        });
        emit("stage", { pdv_id: pdvId, stage: "login", status: "error", message: "PDV sem machine_id" });
        emit("pdv", {
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "error",
          error: "PDV sem machine_id configurado",
        });
        continue;
      }

      // Card de upload (1 por PDV/dia, type=stock, source=api). Reaproveita o
      // índice parcial UNIQUE(pdv_id,type,period) WHERE source='api'.
      const fileName = `API Kexiaozhan - Estoque - ${pdvName} - ${today}`;
      const { data: existingCard } = await admin
        .from("uploads")
        .select("id")
        .eq("pdv_id", pdvId)
        .eq("type", "stock")
        .eq("period", today)
        .eq("source", "api")
        .maybeSingle();

      let uploadId: string;
      if (existingCard) {
        uploadId = (existingCard as any).id as string;
        await admin
          .from("uploads")
          .update({
            file_name: fileName,
            status: "processing",
            error_message: null,
            sync_started_at: startedAt,
            sync_finished_at: null,
            sync_summary: null,
            uploaded_by: userId,
          })
          .eq("id", uploadId);
      } else {
        const { data: created, error: createErr } = await admin
          .from("uploads")
          .insert({
            pdv_id: pdvId,
            type: "stock",
            period: today,
            file_name: fileName,
            status: "processing",
            source: "api",
            uploaded_by: userId,
            sync_started_at: startedAt,
          })
          .select("id")
          .single();
        if (createErr || !created) {
          const cInfo = serializeError(createErr);
          results.push({
            pdv_id: pdvId,
            pdv_name: pdvName,
            status: "error",
            error: `Falha ao criar card: ${cInfo.message}`,
            code: cInfo.code,
            details: cInfo.details,
            hint: cInfo.hint,
          });
          console.error(
            `[sync-stock] pdv=${pdvName} falha ao criar card:`,
            JSON.stringify(cInfo),
          );
          continue;
        }
        uploadId = (created as any).id as string;
      }

      try {
        if (!kxzToken) {
          emit("stage", { pdv_id: pdvId, stage: "login", status: "start" });
          kxzToken = await kxzLogin();
          emit("stage", { pdv_id: pdvId, stage: "login", status: "done" });
        } else {
          emit("stage", { pdv_id: pdvId, stage: "login", status: "cached" });
        }

        emit("stage", { pdv_id: pdvId, stage: "channels", status: "start" });
        const channels = await kxzListChannels(kxzToken, machineId, (page, count) => {
          emit("stage", {
            pdv_id: pdvId,
            stage: "channels",
            status: "progress",
            page,
            count,
          });
        });
        emit("stage", {
          pdv_id: pdvId,
          stage: "channels",
          status: "done",
          total: channels.length,
        });

        // Snapshot anterior para deduzir pre_stock só nos aumentos reais.
        const { data: prevRecords } = await admin
          .from("stock_records")
          .select("product_name, quantity")
          .eq("pdv_id", pdvId)
          .eq("device_id", machineId);
        const prevByProduct = new Map<string, number>();
        for (const r of (prevRecords ?? []) as any[]) {
          const k = String(r.product_name ?? "");
          if (!k) continue;
          prevByProduct.set(k, (prevByProduct.get(k) ?? 0) + Number(r.quantity ?? 0));
        }

        // Mapeia canais → linhas. Resolve product_name via goods-briefs sob demanda.
        const sampleKeys = channels.length > 0 ? Object.keys(channels[0] as object).sort() : [];
        const sampleChannel = channels.length > 0 ? JSON.stringify(channels[0]).slice(0, 600) : null;

        let goodsCache: Map<string, string> | null = null; // goodsId → name
        let bySlotCache: Map<string, string> | null = null; // slot → name
        let productsStageEmitted = false;
        const ensureGoodsCache = async () => {
          if (goodsCache) return;
          if (!productsStageEmitted) {
            emit("stage", { pdv_id: pdvId, stage: "products", status: "start" });
            productsStageEmitted = true;
          }
          const briefs = await kxzListGoodsBriefs(kxzToken!, machineId);
          goodsCache = new Map();
          bySlotCache = new Map();
          for (const b of briefs) {
            const id = b.goodsId ?? b.productId ?? b.id;
            const name = sanitize(b.goodsName ?? b.productName ?? b.name, FIELD_LIMITS.product_name);
            if (id !== undefined && id !== null && name) goodsCache.set(String(id), name);
            const slot = b.channelCode ?? b.slotNumber;
            if (slot !== undefined && slot !== null && name) {
              const k = String(slot);
              const norm = /^\d+$/.test(k) ? k.padStart(2, "0") : k;
              bySlotCache!.set(norm, name);
            }
          }
          emit("stage", {
            pdv_id: pdvId,
            stage: "products",
            status: "done",
            total: briefs.length,
          });
        };

        const rows: StockRecordRow[] = [];
        const seenSlots = new Map<string, number>();
        let missingNames = 0;

        for (const c of channels) {
          const slot = pickSlot(c);
          if (!slot) continue;
          seenSlots.set(slot, (seenSlots.get(slot) ?? 0) + 1);

          let name = pickProductName(c);
          if (!name) {
            try {
              await ensureGoodsCache();
              const gid = pickGoodsId(c);
              if (gid && goodsCache?.has(gid)) name = goodsCache.get(gid) ?? null;
              if (!name && bySlotCache?.has(slot)) name = bySlotCache.get(slot) ?? null;
            } catch (err) {
              console.warn(
                `[sync-stock] pdv=${pdvName} goods-briefs falhou:`,
                JSON.stringify(serializeError(err)),
              );
            }
          }

          if (!name) {
            // Slot sem produto: ignora (não há como gravar product_name NOT NULL).
            missingNames += 1;
            continue;
          }

          rows.push({
            pdv_id: pdvId,
            upload_id: uploadId,
            device_id: machineId,
            slot_number: slot,
            product_name: name,
            quantity: pickQty(c),
            is_active: pickActive(c),
          });
        }

        const duplicates: Array<{ slot_number: string; occurrences: number }> = [];
        for (const [slot, occ] of seenSlots) {
          if (occ > 1) duplicates.push({ slot_number: slot, occurrences: occ });
        }
        duplicates.sort((a, b) => b.occurrences - a.occurrences);
        if (!productsStageEmitted) {
          emit("stage", { pdv_id: pdvId, stage: "products", status: "skip" });
        }
        // Em caso de duplicidade no gateway, mantém o último (sobrescreve).
        if (duplicates.length > 0) {
          const m = new Map<string, StockRecordRow>();
          for (const r of rows) m.set(r.slot_number, r);
          rows.length = 0;
          rows.push(...m.values());
        }

        // === Snapshot total: limpa e reinsere
        emit("stage", { pdv_id: pdvId, stage: "writing", status: "start", total: rows.length });
        const { error: delErr } = await admin
          .from("stock_records")
          .delete()
          .eq("pdv_id", pdvId)
          .eq("device_id", machineId);
        if (delErr) throw delErr;

        let inserted = 0;
        if (rows.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            const { error: insErr } = await admin.from("stock_records").insert(chunk);
            if (insErr) throw insErr;
            inserted += chunk.length;
          }
        }

        // === stock_history do dia, agregado por brand (1 upsert por brand)
        const byBrand = new Map<string, { qty: number; activeSlots: number }>();
        for (const r of rows) {
          const b = extractBrand(r.product_name);
          const cur = byBrand.get(b) ?? { qty: 0, activeSlots: 0 };
          cur.qty += r.quantity;
          if (r.is_active) cur.activeSlots += 1;
          byBrand.set(b, cur);
        }
        if (byBrand.size > 0) {
          const historyRows = Array.from(byBrand.entries()).map(([brand, agg]) => ({
            pdv_id: pdvId,
            organization_id: orgId,
            snapshot_date: today,
            brand,
            total_quantity: agg.qty,
            active_slots: agg.activeSlots,
            upload_id: uploadId,
          }));
          const { error: histErr } = await admin
            .from("stock_history")
            .upsert(historyRows, { onConflict: "pdv_id,snapshot_date,brand" });
          if (histErr) {
            console.warn(
              `[sync-stock] pdv=${pdvName} stock_history upsert falhou:`,
              JSON.stringify(serializeError(histErr)),
            );
          }
        }

        // === Pre-stock: cria SUGESTÕES de alocação para aumentos reais.
        // Não debita o pre_stock automaticamente — o admin precisa confirmar
        // cada sugestão em pending_allocations (mesmo fluxo do upload de planilha).
        try {
          const newByProduct = new Map<string, number>();
          for (const r of rows) {
            newByProduct.set(r.product_name, (newByProduct.get(r.product_name) ?? 0) + r.quantity);
          }

          // Busca pre_stock pendente da org com saldo
          const { data: pendingPreStock } = await admin
            .from("pre_stock")
            .select("id, product_name, remaining_quantity")
            .eq("organization_id", orgId)
            .eq("status", "pending")
            .gt("remaining_quantity", 0);

          if (pendingPreStock && pendingPreStock.length > 0) {
            // Dedup: evita duplicar sugestões já pendentes para o mesmo (product, pdv)
            const { data: existingAllocations } = await admin
              .from("pending_allocations")
              .select("product_name")
              .eq("pdv_id", pdvId)
              .eq("status", "pending");

            const existingKeys = new Set(
              (existingAllocations ?? []).map((a: any) =>
                String(a.product_name ?? "").toLowerCase().trim(),
              ),
            );

            const allocationsToCreate: Array<Record<string, unknown>> = [];
            const createdKeys = new Set<string>();

            for (const [productName, newQty] of newByProduct) {
              const oldQty = prevByProduct.get(productName) ?? 0;
              const increase = newQty - oldQty;
              if (increase <= 0) continue;

              const normalized = productName.toLowerCase().trim();
              if (existingKeys.has(normalized) || createdKeys.has(normalized)) continue;

              const match = (pendingPreStock as any[]).find(
                (ps) => String(ps.product_name ?? "").toLowerCase().trim() === normalized,
              );
              if (!match || match.remaining_quantity <= 0) continue;

              const suggestedQty = Math.min(increase, match.remaining_quantity);
              if (suggestedQty <= 0) continue;

              allocationsToCreate.push({
                organization_id: orgId,
                upload_id: uploadId,
                pdv_id: pdvId,
                product_name: productName,
                suggested_quantity: suggestedQty,
                pre_stock_id: match.id,
                status: "pending",
              });
              createdKeys.add(normalized);
            }

            if (allocationsToCreate.length > 0) {
              const { error: allocError } = await admin
                .from("pending_allocations")
                .insert(allocationsToCreate);

              if (allocError) {
                console.warn(
                  `[sync-stock] pdv=${pdvName} pending_allocations insert falhou:`,
                  JSON.stringify(serializeError(allocError)),
                );
              } else {
                await admin.from("notifications").insert({
                  organization_id: orgId,
                  user_id: null,
                  type: "pending_allocation",
                  title: "Sugestões de alocação",
                  message: `${allocationsToCreate.length} sugestão(ões) de alocação para ${pdvName} aguardam confirmação.`,
                  metadata: { upload_id: uploadId, pdv_id: pdvId, count: allocationsToCreate.length },
                });
              }
            }
          }
        } catch (allocErr) {
          console.warn(
            `[sync-stock] pdv=${pdvName} sugestão de alocação falhou (não-fatal):`,
            JSON.stringify(serializeError(allocErr)),
          );
        }

        let verification: VerificationReport | undefined;
        try {
          verification = await buildVerification(
            admin,
            pdvId,
            machineId,
            rows,
            duplicates,
            missingNames,
          );
        } catch (vErr) {
          console.warn(
            `[sync-stock] pdv=${pdvName} verificação falhou:`,
            JSON.stringify(serializeError(vErr)),
          );
        }

        const warnings: string[] = [];
        if (verification?.warnings.length) warnings.push(...verification.warnings);

        const finishedAt = new Date().toISOString();
        const summary = {
          inserted,
          total_channels: channels.length,
          mapped: rows.length,
          missing_product_names: missingNames,
          duplicates: duplicates.length,
          warnings,
          sample_keys: sampleKeys,
          sample_channel: sampleChannel,
          verification,
        };
        await admin
          .from("uploads")
          .update({
            status: "ready",
            records_count: rows.length,
            processed_at: finishedAt,
            sync_finished_at: finishedAt,
            sync_summary: summary,
            error_message:
              warnings.length > 0
                ? `Sincronizado com avisos: ${warnings.join("; ")}`
                : null,
          })
          .eq("id", uploadId);

        results.push({
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "ready",
          inserted,
          total: rows.length,
          verification,
        });
        emit("stage", { pdv_id: pdvId, stage: "writing", status: "done", inserted });
        emit("pdv", {
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "ready",
          inserted,
          total: rows.length,
          verification,
        });
        console.info(
          `[sync-stock] pdv=${pdvName} ok channels=${channels.length} mapped=${rows.length} inserted=${inserted} duplicates=${duplicates.length} missing=${missingNames}`,
        );
      } catch (err) {
        const info = serializeError(err);
        const finishedAt = new Date().toISOString();
        console.error(
          `[sync-stock] pdv=${pdvName} erro detalhado:`,
          JSON.stringify(info),
        );
        await admin
          .from("uploads")
          .update({
            status: "error",
            error_message: info.message.slice(0, 500),
            sync_finished_at: finishedAt,
            sync_summary: {
              error: info.message,
              code: info.code,
              details: info.details,
              hint: info.hint,
              raw: info.raw,
            },
          })
          .eq("id", uploadId);
        results.push({
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "error",
          error: info.message,
          code: info.code,
          details: info.details,
          hint: info.hint,
        });
        emit("stage", {
          pdv_id: pdvId,
          stage: "error",
          status: "error",
          message: info.message,
        });
        emit("pdv", {
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "error",
          error: info.message,
          code: info.code,
          details: info.details,
          hint: info.hint,
        });
      }
      }
      return results;
    };

    if (wantStream) {
      const stream = new ReadableStream<Uint8Array>({
        start(c) {
          sseController = c;
          const heartbeat = setInterval(() => {
            try {
              c.enqueue(encoder.encode(`: ping\n\n`));
            } catch {
              // ignore
            }
          }, 15000);
          emit("start", { request_id: requestId, total_pdvs: pdvs.length });
          runWork()
            .then((results) => {
              emit("end", { request_id: requestId, results });
            })
            .catch((err) => {
              const info = serializeError(err);
              console.error(
                `[sync-stock] erro fatal stream req=${requestId}:`,
                JSON.stringify(info),
              );
              emit("error", { request_id: requestId, ...info });
            })
            .finally(() => {
              clearInterval(heartbeat);
              try {
                c.close();
              } catch {
                // ignore
              }
            });
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    const results = await runWork();
    return new Response(
      JSON.stringify({ ok: true, request_id: requestId, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const info = serializeError(err);
    console.error(
      `[sync-stock] erro fatal req=${requestId}:`,
      JSON.stringify(info),
    );
    return new Response(
      JSON.stringify({
        error: info.message,
        code: info.code,
        details: info.details,
        hint: info.hint,
        request_id: requestId,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});