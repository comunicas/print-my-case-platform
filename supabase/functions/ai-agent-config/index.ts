import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.2",
] as const;
const ALLOWED_REASONING = ["minimal", "low", "medium", "high"] as const;
const ADMIN_RATE_LIMIT_PER_10MIN = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  if (key.length <= 10) return key.slice(0, 3) + "…";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

function validateSchema(schema: unknown): { ok: boolean; error?: string } {
  if (!schema || typeof schema !== "object") return { ok: false, error: "schema must be an object" };
  const s = schema as Record<string, unknown>;
  if (s.type !== "object") return { ok: false, error: "root type must be 'object'" };
  if (s.properties && typeof s.properties !== "object") return { ok: false, error: "properties must be an object" };
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (claimsErr || !claimsData?.claims) return json({ error: "Sessão inválida." }, 401);
    const userId = claimsData.claims.sub as string;
    const userEmail = (claimsData.claims.email as string | undefined) ?? null;

    const { data: roleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (roleRows ?? []).map((r) => r.role);
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = isSuperAdmin || roles.includes("org_admin");

    if (!isAdmin) return json({ error: "Acesso restrito a administradores." }, 403);

    let body: { action?: string; payload?: Record<string, unknown> };
    try {
      body = await req.json();
    } catch {
      return json({ error: "JSON inválido." }, 400);
    }
    const action = body.action ?? "";
    const payload = (body.payload ?? {}) as Record<string, unknown>;

    // Admin rate-limit for mutating actions
    const MUTATING = new Set([
      "update-config",
      "update-tool",
      "toggle-tool",
      "rollback",
      "test-key",
      "smoke-test",
    ]);
    if (MUTATING.has(action)) {
      if (!isSuperAdmin) return json({ error: "Apenas super admin." }, 403);
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("audit_logs")
        .select("id", { count: "exact", head: true })
        .eq("actor_id", userId)
        .like("event_type", "ai_agent_%")
        .gte("created_at", tenMinAgo);
      if ((count ?? 0) >= ADMIN_RATE_LIMIT_PER_10MIN) {
        return json({ error: "Muitas ações no painel. Aguarde alguns minutos." }, 429);
      }
    }

    const audit = async (
      eventType: string,
      success: boolean,
      metadata: Record<string, unknown> = {},
      errorMessage?: string,
    ) => {
      await supabaseAdmin.from("audit_logs").insert({
        event_type: eventType,
        actor_id: userId,
        actor_email: userEmail,
        actor_role: isSuperAdmin ? "super_admin" : "org_admin",
        success,
        error_message: errorMessage ?? null,
        metadata,
      });
    };

    // ─────────── get-status ───────────
    if (action === "get-status") {
      const [{ data: cfg }, { data: tools }, { data: keyStatus }] = await Promise.all([
        supabaseAdmin.from("ai_agent_config").select("*").eq("singleton", true).maybeSingle(),
        supabaseAdmin.from("ai_agent_tools").select("*").order("display_order"),
        supabaseAdmin.from("ai_agent_key_status").select("*").eq("singleton", true).maybeSingle(),
      ]);

      return json({
        config: cfg,
        tools: tools ?? [],
        key_status: isSuperAdmin
          ? keyStatus
          : keyStatus
            ? { last_test_status: keyStatus.last_test_status, last_tested_at: keyStatus.last_tested_at }
            : null,
        available_models: ALLOWED_MODELS,
        available_reasoning: ALLOWED_REASONING,
        is_super_admin: isSuperAdmin,
        openai_key_present: !!Deno.env.get("OPENAI_API_KEY"),
      });
    }

    // ─────────── update-config ───────────
    if (action === "update-config") {
      const updates: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() };
      if (typeof payload.model === "string") {
        if (!ALLOWED_MODELS.includes(payload.model as never)) return json({ error: "Modelo inválido." }, 400);
        updates.model = payload.model;
      }
      if (typeof payload.reasoning_effort === "string") {
        if (!ALLOWED_REASONING.includes(payload.reasoning_effort as never)) return json({ error: "Reasoning inválido." }, 400);
        updates.reasoning_effort = payload.reasoning_effort;
      }
      if (typeof payload.system_prompt === "string") {
        const sp = payload.system_prompt.trim();
        if (sp.length < 50) return json({ error: "Prompt muito curto (mín. 50 chars)." }, 400);
        if (sp.length > 20000) return json({ error: "Prompt muito longo (máx. 20000 chars)." }, 400);
        updates.system_prompt = sp;
      }
      for (const k of ["max_tool_iterations", "history_limit", "rate_limit_per_10min", "max_message_chars"] as const) {
        if (payload[k] !== undefined) {
          const n = Number(payload[k]);
          if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
            return json({ error: `${k} inválido.` }, 400);
          }
          updates[k] = n;
        }
      }

      const { data, error } = await supabaseAdmin
        .from("ai_agent_config")
        .update(updates)
        .eq("singleton", true)
        .select()
        .single();

      if (error) {
        await audit("ai_agent_config_updated", false, { fields: Object.keys(updates) }, error.message);
        return json({ error: error.message }, 400);
      }
      await audit("ai_agent_config_updated", true, { fields: Object.keys(updates) });
      return json({ config: data });
    }

    // ─────────── update-tool ───────────
    if (action === "update-tool") {
      const name = String(payload.name ?? "");
      if (!name) return json({ error: "Nome da tool obrigatório." }, 400);

      const updates: Record<string, unknown> = { updated_by: userId, updated_at: new Date().toISOString() };
      if (typeof payload.description === "string") {
        const d = payload.description.trim();
        if (d.length < 10) return json({ error: "Descrição muito curta." }, 400);
        if (d.length > 1000) return json({ error: "Descrição muito longa." }, 400);
        updates.description = d;
      }
      if (payload.parameters_schema !== undefined) {
        const v = validateSchema(payload.parameters_schema);
        if (!v.ok) return json({ error: `Schema inválido: ${v.error}` }, 400);
        updates.parameters_schema = payload.parameters_schema;
      }
      if (typeof payload.category === "string") updates.category = payload.category;

      const { data, error } = await supabaseAdmin
        .from("ai_agent_tools")
        .update(updates)
        .eq("name", name)
        .select()
        .single();

      if (error) {
        await audit("ai_agent_tool_updated", false, { tool: name }, error.message);
        return json({ error: error.message }, 400);
      }
      await audit("ai_agent_tool_updated", true, { tool: name, fields: Object.keys(updates) });
      return json({ tool: data });
    }

    // ─────────── toggle-tool ───────────
    if (action === "toggle-tool") {
      const name = String(payload.name ?? "");
      const enabled = !!payload.enabled;
      if (!name) return json({ error: "Nome obrigatório." }, 400);

      const { data, error } = await supabaseAdmin
        .from("ai_agent_tools")
        .update({ enabled, updated_by: userId, updated_at: new Date().toISOString() })
        .eq("name", name)
        .select()
        .single();

      if (error) {
        await audit("ai_agent_tool_toggled", false, { tool: name, enabled }, error.message);
        return json({ error: error.message }, 400);
      }
      await audit("ai_agent_tool_toggled", true, { tool: name, enabled });
      return json({ tool: data });
    }

    // ─────────── rollback ───────────
    if (action === "rollback") {
      const historyId = String(payload.history_id ?? "");
      if (!historyId) return json({ error: "history_id obrigatório." }, 400);

      const { data: hist, error: histErr } = await supabaseAdmin
        .from("ai_agent_config_history")
        .select("*")
        .eq("id", historyId)
        .single();
      if (histErr || !hist) return json({ error: "Snapshot não encontrado." }, 404);

      const old = hist.payload as Record<string, unknown>;
      let result;
      if (hist.entity === "config") {
        const { data, error } = await supabaseAdmin
          .from("ai_agent_config")
          .update({
            model: old.model,
            system_prompt: old.system_prompt,
            reasoning_effort: old.reasoning_effort,
            max_tool_iterations: old.max_tool_iterations,
            history_limit: old.history_limit,
            rate_limit_per_10min: old.rate_limit_per_10min,
            max_message_chars: old.max_message_chars,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq("singleton", true)
          .select()
          .single();
        if (error) {
          await audit("ai_agent_config_rollback", false, { history_id: historyId }, error.message);
          return json({ error: error.message }, 400);
        }
        result = data;
      } else if (hist.entity === "tool") {
        const { data, error } = await supabaseAdmin
          .from("ai_agent_tools")
          .update({
            enabled: old.enabled,
            description: old.description,
            parameters_schema: old.parameters_schema,
            category: old.category,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq("name", hist.entity_key)
          .select()
          .single();
        if (error) {
          await audit("ai_agent_config_rollback", false, { history_id: historyId, tool: hist.entity_key }, error.message);
          return json({ error: error.message }, 400);
        }
        result = data;
      } else {
        return json({ error: "Entidade desconhecida." }, 400);
      }

      await audit("ai_agent_config_rollback", true, {
        history_id: historyId,
        entity: hist.entity,
        entity_key: hist.entity_key,
      });
      return json({ restored: result });
    }

    // ─────────── test-key ───────────
    if (action === "test-key") {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (!apiKey) {
        await supabaseAdmin
          .from("ai_agent_key_status")
          .update({
            key_prefix: null,
            last_test_status: "error",
            last_test_message: "OPENAI_API_KEY não configurada.",
            last_tested_at: new Date().toISOString(),
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq("singleton", true);
        await audit("ai_agent_key_tested", false, { status: "missing" });
        return json({ status: "error", message: "OPENAI_API_KEY não configurada." });
      }

      let status: string = "ok";
      let message: string | null = null;
      try {
        const resp = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (resp.status === 401) {
          status = "invalid";
          message = "Chave inválida ou revogada.";
        } else if (resp.status === 429) {
          const t = await resp.text();
          status = /quota|insufficient/i.test(t) ? "quota" : "error";
          message = status === "quota" ? "Cota/saldo esgotado." : "Rate limit do provedor.";
        } else if (!resp.ok) {
          status = "error";
          message = `HTTP ${resp.status}`;
          await resp.text();
        } else {
          await resp.text();
        }
      } catch (e) {
        status = "error";
        message = e instanceof Error ? e.message.slice(0, 200) : "Falha de rede.";
      }

      const { data } = await supabaseAdmin
        .from("ai_agent_key_status")
        .update({
          key_prefix: maskKey(apiKey),
          last_test_status: status,
          last_test_message: message,
          last_tested_at: new Date().toISOString(),
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("singleton", true)
        .select()
        .single();

      await audit("ai_agent_key_tested", status === "ok", { status });
      return json({ status, message, key_status: data });
    }

    // ─────────── smoke-test ───────────
    if (action === "smoke-test") {
      const startedAt = Date.now();
      const message = (typeof payload.message === "string" && payload.message.trim()) ||
        "ping: responda apenas 'ok' para confirmar que está online.";

      const resp = await supabaseAdmin.functions.invoke("ai-agent", {
        body: { message },
        headers: { Authorization: authHeader },
      });

      const duration_ms = Date.now() - startedAt;
      const ok = !resp.error && !!resp.data;
      await audit("ai_agent_smoke_tested", ok, { duration_ms, error: resp.error?.message ?? null });

      if (resp.error) {
        return json({ ok: false, error: resp.error.message ?? "Falha ao chamar agente.", duration_ms }, 200);
      }
      return json({ ok: true, duration_ms, response: resp.data });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    console.error("ai-agent-config error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});