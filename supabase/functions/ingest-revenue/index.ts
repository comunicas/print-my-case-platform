// Sincronização de vendas via API Kexiaozhan
// Acionada pela UI (/uploads → "Atualizar via API"). Requer JWT do usuário.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Serializa qualquer erro (Error, PostgrestError, objeto, string) preservando
// mensagem real, code, details e hint quando disponíveis.
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
  merchant_id: 100,
  device_id: 100,
  order_number: 100,
  product_name: 255,
  transaction_number: 100,
  payment_method: 50,
  status: 50,
};

// --- Normalizadores canônicos (cópia de process-spreadsheet) ---
const PAYMENT_METHOD_MAP: Record<string, string> = {
  creditcard: "Cartão de Crédito",
  credit_card: "Cartão de Crédito",
  "cartão de crédito": "Cartão de Crédito",
  crédito: "Cartão de Crédito",
  credito: "Cartão de Crédito",
  credit: "Cartão de Crédito",
  "1": "Cartão de Crédito",
  debitcard: "Cartão de Débito",
  debit_card: "Cartão de Débito",
  "cartão de débito": "Cartão de Débito",
  débito: "Cartão de Débito",
  debito: "Cartão de Débito",
  debit: "Cartão de Débito",
  "2": "Cartão de Débito",
  pix: "PIX",
  "3": "PIX",
  "4": "PIX",
  machinefree: "Cortesia",
  cortesia: "Cortesia",
  free: "Cortesia",
  gift: "Cortesia",
  couponfree: "Cupom",
  cupom: "Cupom",
  coupon: "Cupom",
};

const STATUS_MAP: Record<string, string> = {
  completed: "Concluído",
  paid: "Concluído",
  pago: "Concluído",
  concluído: "Concluído",
  concluido: "Concluído",
  success: "Concluído",
  finish: "Concluído",
  finished: "Concluído",
  delivered: "Concluído",
  // Códigos numéricos da API Kexiaozhan
  "3": "Concluído",
  "4": "Concluído",
  cancelled: "Cancelado",
  canceled: "Cancelado",
  cancelado: "Cancelado",
  fail: "Cancelado",
  failed: "Cancelado",
  "6": "Cancelado",
  "7": "Cancelado",
  pending: "Pendente",
  pendente: "Pendente",
  "1": "Pendente",
  "2": "Pendente",
  refunded: "Reembolsado",
  reembolsado: "Reembolsado",
  refund: "Reembolsado",
  "5": "Reembolsado",
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

function normalizePaymentMethod(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === "") return "Não informado";
  const k = String(v).trim().toLowerCase();
  return PAYMENT_METHOD_MAP[k] ?? sanitize(v, FIELD_LIMITS.payment_method) ?? "Não informado";
}

function normalizeStatus(v: unknown): string {
  if (v === null || v === undefined || String(v).trim() === "") return "Concluído";
  const k = String(v).trim().toLowerCase();
  return STATUS_MAP[k] ?? sanitize(v, FIELD_LIMITS.status) ?? "Concluído";
}

function parseAmount(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Math.max(0, Math.min(10_000_000, v));
  let s = String(v).replace(/[R$\s]/g, "").trim();
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return Math.max(0, Math.min(10_000_000, n));
}

function parseDate(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "number") {
    // assume epoch seconds or ms
    const ms = v > 1e12 ? v : v * 1000;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const s = String(v).trim();
  // "YYYY-MM-DD HH:mm:ss"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(se ?? "0"))).toISOString();
  }
  // "DD/MM/YYYY HH:mm"
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (br) {
    const [, d, mo, y, h, mi] = br;
    return new Date(+y, +mo - 1, +d, +h, +mi).toISOString();
  }
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
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

interface KxzOrder {
  orderNo?: string;
  orderNumber?: string;
  order_id?: string;
  productName?: string;
  product_name?: string;
  goodsName?: string;
  payAmount?: number | string;
  amount?: number | string;
  paymentAmount?: number | string;
  payTime?: string | number;
  paymentTime?: string | number;
  payment_time?: string | number;
  orderTime?: string | number;
  payType?: string;
  payMethod?: string;
  payment_method?: string;
  status?: string;
  state?: string;
  machineId?: string;
  machine_id?: string;
  deviceId?: string;
  transactionId?: string;
  transactionNumber?: string;
  refundAmount?: number | string;
  merchantId?: string;
  merchant_id?: string;
  // Aliases adicionais comuns no payload Kexiaozhan
  rmbAmount?: number | string;
  money?: number | string;
  totalPrice?: number | string;
  total_price?: number | string;
  pay_money?: number | string;
  payMoney?: number | string;
  realAmount?: number | string;
  realPayAmount?: number | string;
  actualPayAmount?: number | string;
  actual_paid_amount?: number | string;
  discountAmount?: number | string;
  discount_amount?: number | string;
  payWay?: string | number;
  payChannel?: string | number;
  paymentType?: string | number;
  pay_type?: string | number;
  payment_type?: string | number;
  orderStatus?: string | number;
  order_status?: string | number;
  paySuccessTime?: string | number;
  successTime?: string | number;
  completeTime?: string | number;
  completionTime?: string | number;
  finishTime?: string | number;
  createTime?: string | number;
  create_time?: string | number;
  created_at?: string | number;
  printCode?: string;
  print_code?: string;
  goodsCode?: string;
  cargoCode?: string;
}

async function kxzListOrders(
  token: string,
  machineId: string,
  yearMonth: string,
): Promise<KxzOrder[]> {
  const all: KxzOrder[] = [];
  const pageSize = 100;
  let page = 1;
  // Construir início/fim do mês para query
  const [y, m] = yearMonth.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const startStr = start.toISOString().slice(0, 10) + " 00:00:00";
  const endStr = new Date(end.getTime() - 1000).toISOString().slice(0, 10) + " 23:59:59";

  while (page < 1000) {
    const params = new URLSearchParams({
      machineId,
      type: "1",
      page: String(page),
      pageSize: String(pageSize),
      startTime: startStr,
      endTime: endStr,
    });
    const url = `${KXZ_BASE}/v1/orders?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, token, "Content-Type": "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Listagem de pedidos falhou (page ${page}): ${res.status} ${text.slice(0, 200)}`);
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Resposta inválida ao listar pedidos: ${text.slice(0, 200)}`);
    }
    const list: KxzOrder[] =
      json?.data?.records ?? json?.data?.list ?? json?.data ?? json?.records ?? [];
    if (!Array.isArray(list) || list.length === 0) break;
    all.push(...list);
    if (list.length < pageSize) break;
    page += 1;
  }
  return all;
}

function mapOrderToRecord(
  o: KxzOrder,
  pdvId: string,
  uploadId: string,
): Record<string, unknown> | null {
  const orderNumber =
    sanitize(o.orderNo ?? o.orderNumber ?? o.order_id, FIELD_LIMITS.order_number);
  const productName =
    sanitize(o.productName ?? o.product_name ?? o.goodsName, FIELD_LIMITS.product_name);
  const deviceId =
    sanitize(o.machineId ?? o.machine_id ?? o.deviceId, FIELD_LIMITS.device_id);
  if (!orderNumber || !productName || !deviceId) return null;

  const amount = parseAmount(
    o.payAmount ?? o.amount ?? o.paymentAmount ??
    o.rmbAmount ?? o.money ?? o.totalPrice ?? o.total_price ??
    o.pay_money ?? o.payMoney ?? o.realAmount ?? o.realPayAmount,
  );
  const actualPaid = parseAmount(
    o.actualPayAmount ?? o.actual_paid_amount ?? o.realPayAmount ?? o.realAmount,
  );
  const discount = parseAmount(o.discountAmount ?? o.discount_amount);
  const completionTime =
    parseDate(o.completeTime ?? o.completionTime ?? o.finishTime ?? o.paySuccessTime ?? o.successTime);
  const paymentDate =
    parseDate(o.payTime ?? o.paymentTime ?? o.payment_time ?? o.paySuccessTime ?? o.successTime) ??
    completionTime ??
    parseDate(o.orderTime ?? o.createTime ?? o.create_time ?? o.created_at) ??
    new Date().toISOString();
  const orderTime = parseDate(o.orderTime ?? o.createTime ?? o.create_time ?? o.created_at);
  const printCode = sanitize(o.printCode ?? o.print_code ?? o.goodsCode ?? o.cargoCode, 50);

  return {
    pdv_id: pdvId,
    upload_id: uploadId,
    source: "api",
    order_number: orderNumber,
    product_name: productName,
    device_id: deviceId,
    merchant_id: sanitize(o.merchantId ?? o.merchant_id, FIELD_LIMITS.merchant_id),
    transaction_number: sanitize(
      o.transactionNumber ?? o.transactionId,
      FIELD_LIMITS.transaction_number,
    ),
    amount,
    actual_paid_amount: actualPaid > 0 ? actualPaid : null,
    discount_amount: discount,
    payment_method: normalizePaymentMethod(
      o.payType ?? o.payMethod ?? o.payment_method ??
      o.payWay ?? o.payChannel ?? o.paymentType ?? o.pay_type ?? o.payment_type,
    ),
    status: normalizeStatus(o.status ?? o.state ?? o.orderStatus ?? o.order_status),
    payment_date: paymentDate,
    order_time: orderTime,
    order_completion_time: completionTime,
    print_code: printCode,
    refund_amount: parseAmount(o.refundAmount),
  };
}

interface PdvResult {
  pdv_id: string;
  pdv_name: string;
  status: "ready" | "error";
  inserted?: number;
  updated?: number;
  total?: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  if (Deno.env.get("INGEST_REVENUE_ENABLED") === "false") {
    return new Response(
      JSON.stringify({ error: "Endpoint desativado por feature flag.", request_id: requestId }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

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

    // Parse body
    const body = await req.json().catch(() => ({}));
    const period: string = String(body?.period ?? "");
    const requestedPdvIds: string[] | undefined = Array.isArray(body?.pdv_ids)
      ? body.pdv_ids.map((x: unknown) => String(x))
      : undefined;
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return new Response(JSON.stringify({ error: "period inválido (YYYY-MM)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolver organização do usuário (perfil pode estar em qualquer org; viewer barrado)
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .maybeSingle();
    const orgId = profile?.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: "Usuário sem organização" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bloquear viewers
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

    // PDVs ativos da org, filtrados se vier lista
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

    console.info(`[ingest-revenue] start req=${requestId} org=${orgId} period=${period} pdvs=${pdvs.length}`);

    let kxzToken: string | null = null;
    const results: PdvResult[] = [];

    for (const pdv of pdvs) {
      const pdvName = (pdv as any).name as string;
      const pdvId = (pdv as any).id as string;
      const machineId = (pdv as any).machine_id as string;
      const startedAt = new Date().toISOString();

      // Upsert do card de upload
      const fileName = `API Kexiaozhan - ${pdvName} - ${period}`;
      const { data: existingCard } = await admin
        .from("uploads")
        .select("id")
        .eq("pdv_id", pdvId)
        .eq("type", "sales")
        .eq("period", period)
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
            type: "sales",
            period,
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
            `[ingest-revenue] pdv=${pdvName} falha ao criar card:`,
            JSON.stringify(cInfo),
          );
          continue;
        }
        uploadId = (created as any).id as string;
      }

      try {
        if (!kxzToken) kxzToken = await kxzLogin();
        const orders = await kxzListOrders(kxzToken, machineId, period);

        const records = orders
          .map((o) => mapOrderToRecord(o, pdvId, uploadId))
          .filter((r): r is Record<string, unknown> => r !== null);

        let inserted = 0;
        if (records.length > 0) {
          // Upsert em chunks via RPC (índice parcial WHERE source='api' exige predicado em ON CONFLICT)
          const chunkSize = 500;
          for (let i = 0; i < records.length; i += chunkSize) {
            const chunk = records.slice(i, i + chunkSize);
            const { error: upErr } = await admin.rpc("upsert_api_sales_records", {
              _records: chunk,
            });
            if (upErr) throw upErr;
            inserted += chunk.length;
          }
        }

        const finishedAt = new Date().toISOString();
        const summary = { inserted, total_orders: orders.length, mapped: records.length };
        await admin
          .from("uploads")
          .update({
            status: "ready",
            records_count: records.length,
            processed_at: finishedAt,
            sync_finished_at: finishedAt,
            sync_summary: summary,
            error_message: null,
          })
          .eq("id", uploadId);

        results.push({
          pdv_id: pdvId,
          pdv_name: pdvName,
          status: "ready",
          inserted,
          total: records.length,
        });
        console.info(
          `[ingest-revenue] pdv=${pdvName} ok orders=${orders.length} mapped=${records.length}`,
        );
      } catch (err) {
        const info = serializeError(err);
        const finishedAt = new Date().toISOString();
        console.error(
          `[ingest-revenue] pdv=${pdvName} erro detalhado:`,
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
      }
    }

    return new Response(
      JSON.stringify({ ok: true, request_id: requestId, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const info = serializeError(err);
    console.error(
      `[ingest-revenue] erro fatal req=${requestId}:`,
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
