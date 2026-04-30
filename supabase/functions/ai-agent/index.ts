import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SKILL_CORE } from "./skill.ts";
import { TOOLS, TOOL_TO_RPC } from "./tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "x-request-id",
};

const MODEL = "openai/gpt-5-mini";
const MAX_TOOL_ITERATIONS = 5;
const RATE_LIMIT_PER_10_MIN = 20;
const HISTORY_LIMIT = 12;

function logEvent(event: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify({ event, ts: new Date().toISOString(), ...fields }));
}

function jsonResponse(body: unknown, status = 200, requestId = "") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": requestId },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  // 1. Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Não autenticado." }, 401, requestId);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Cliente com JWT do usuário (RLS aplicada)
  const supabaseUser = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  // Cliente service-role (para ler role/org de forma confiável e gravar logs)
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await supabaseUser.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return jsonResponse({ error: "Sessão inválida." }, 401, requestId);
  }
  const userId = claimsData.claims.sub as string;

  // 2. Resolver role + org
  const [{ data: roleRows }, { data: profile }] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
    supabaseAdmin.from("profiles").select("organization_id").eq("id", userId).maybeSingle(),
  ]);

  const roles = (roleRows ?? []).map((r) => r.role);
  const isAdmin = roles.includes("super_admin") || roles.includes("org_admin");
  const organizationId = profile?.organization_id ?? null;

  if (!isAdmin) {
    logEvent("ai_agent_forbidden", { request_id: requestId, user_id: userId, roles });
    return jsonResponse({ error: "Acesso restrito a administradores." }, 403, requestId);
  }
  if (!organizationId && !roles.includes("super_admin")) {
    return jsonResponse({ error: "Usuário sem organização." }, 403, requestId);
  }

  // 3. Body
  let body: { conversationId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "JSON inválido." }, 400, requestId);
  }
  const userMessage = (body.message ?? "").trim();
  if (!userMessage) {
    return jsonResponse({ error: "Mensagem vazia." }, 400, requestId);
  }
  if (userMessage.length > 4000) {
    return jsonResponse({ error: "Mensagem muito longa (máx. 4000 caracteres)." }, 400, requestId);
  }

  // 4. Rate limit (por usuário, últimos 10 min)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from("ai_messages")
    .select("id, ai_conversations!inner(user_id)", { count: "exact", head: true })
    .eq("role", "user")
    .eq("ai_conversations.user_id", userId)
    .gte("created_at", tenMinAgo);

  if ((recentCount ?? 0) >= RATE_LIMIT_PER_10_MIN) {
    logEvent("ai_agent_rate_limited", { request_id: requestId, user_id: userId, count: recentCount });
    return jsonResponse(
      { error: "Você atingiu o limite de mensagens. Tente novamente em alguns minutos." },
      429,
      requestId,
    );
  }

  // 5. Conversa (cria se não existir)
  let conversationId = body.conversationId;
  if (!conversationId) {
    const { data: newConv, error: convErr } = await supabaseAdmin
      .from("ai_conversations")
      .insert({
        user_id: userId,
        organization_id: organizationId ?? userId, // super_admin sem org: usa userId como placeholder
        title: userMessage.slice(0, 60),
      })
      .select("id")
      .single();
    if (convErr || !newConv) {
      logEvent("ai_agent_create_conv_failed", { request_id: requestId, error: convErr?.message });
      return jsonResponse({ error: "Falha ao criar conversa." }, 500, requestId);
    }
    conversationId = newConv.id;
  } else {
    // valida ownership
    const { data: conv } = await supabaseAdmin
      .from("ai_conversations")
      .select("user_id")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv || conv.user_id !== userId) {
      return jsonResponse({ error: "Conversa não encontrada." }, 404, requestId);
    }
  }

  // 6. Histórico
  const { data: historyRows } = await supabaseAdmin
    .from("ai_messages")
    .select("role, content, tool_calls, tool_results")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  const history = (historyRows ?? []).reverse();

  // 7. Persiste mensagem do usuário
  const { data: userMsgRow } = await supabaseAdmin
    .from("ai_messages")
    .insert({ conversation_id: conversationId, role: "user", content: userMessage })
    .select("id")
    .single();

  await supabaseAdmin
    .from("ai_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  // 8. Monta mensagens (estático → dinâmico, otimizando prompt caching)
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SKILL_CORE },
  ];
  for (const h of history) {
    if (h.role === "user" || h.role === "assistant") {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: "user", content: userMessage });

  // 9. Tool-calling loop + stream
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return jsonResponse({ error: "AI Gateway não configurado." }, 500, requestId);
  }

  // Helpers para registrar run/tool_calls
  const toolCallLogs: Array<Record<string, unknown>> = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let cachedTokens = 0;

  // Executa as tools até o modelo dar resposta final OU atingir limite
  // Para a parte FINAL (sem tools restantes), fazemos streaming SSE para o cliente.
  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        stream: false,
      }),
    });

    if (aiResp.status === 429) {
      await logRun("rate_limited", "rate_limited", "Provider rate limit");
      return jsonResponse({ error: "Limite do provedor de IA atingido. Tente novamente em instantes." }, 429, requestId);
    }
    if (aiResp.status === 402) {
      await logRun("error", "payment_required", "Créditos esgotados");
      return jsonResponse({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }, 402, requestId);
    }
    if (!aiResp.ok) {
      const errText = await aiResp.text();
      await logRun("error", "provider_error", errText.slice(0, 500));
      logEvent("ai_agent_provider_error", { request_id: requestId, status: aiResp.status, body: errText.slice(0, 200) });
      return jsonResponse({ error: "Falha no provedor de IA." }, 500, requestId);
    }

    const aiData = await aiResp.json();
    const usage = aiData.usage ?? {};
    totalInputTokens += usage.prompt_tokens ?? 0;
    totalOutputTokens += usage.completion_tokens ?? 0;
    cachedTokens += usage.prompt_tokens_details?.cached_tokens ?? 0;

    const choice = aiData.choices?.[0];
    const msg = choice?.message;
    if (!msg) {
      await logRun("error", "empty_response", "Sem resposta do modelo");
      return jsonResponse({ error: "Resposta vazia do modelo." }, 500, requestId);
    }

    // Há tool calls?
    const toolCalls = msg.tool_calls;
    if (toolCalls && toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: toolCalls,
      });

      for (const tc of toolCalls) {
        const toolName = tc.function?.name;
        const argsRaw = tc.function?.arguments ?? "{}";
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(argsRaw);
        } catch {
          args = {};
        }

        const mapping = TOOL_TO_RPC[toolName];
        const tStart = Date.now();
        let resultStr = "";
        let rowsReturned = 0;
        let toolStatus: "ok" | "error" = "ok";
        let toolErr: string | null = null;

        if (!mapping) {
          toolStatus = "error";
          toolErr = `Tool desconhecida: ${toolName}`;
          resultStr = JSON.stringify({ error: toolErr });
        } else {
          const rpcParams = mapping.mapParams(args);
          const { data, error } = await supabaseUser.rpc(mapping.rpc, rpcParams as never);
          if (error) {
            toolStatus = "error";
            toolErr = error.message;
            resultStr = JSON.stringify({ error: error.message });
          } else {
            const arr = Array.isArray(data) ? data : data ? [data] : [];
            rowsReturned = arr.length;
            resultStr = JSON.stringify(arr);
            if (resultStr.length > 30000) {
              resultStr = JSON.stringify({
                truncated: true,
                note: "Resultado muito grande; mostrando apenas os primeiros 50 itens.",
                data: arr.slice(0, 50),
              });
            }
          }
        }

        toolCallLogs.push({
          tool_name: toolName,
          params_sanitized: args,
          rows_returned: rowsReturned,
          duration_ms: Date.now() - tStart,
          status: toolStatus,
          error_message: toolErr,
        });

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: resultStr,
        });
      }
      continue; // próxima iteração: o modelo agora vê o resultado
    }

    // Resposta final (sem mais tools). Persiste e retorna.
    const finalContent = msg.content ?? "";
    const { data: assistantMsgRow } = await supabaseAdmin
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: finalContent,
        status: "ok",
      })
      .select("id")
      .single();

    await logRun("ok", null, null, assistantMsgRow?.id ?? null);

    return new Response(
      JSON.stringify({
        conversationId,
        requestId,
        message: finalContent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": requestId },
      },
    );
  }

  // Atingiu MAX_TOOL_ITERATIONS sem resposta final
  await logRun("error", "max_iterations", "Limite de iterações de tools atingido");
  return jsonResponse({ error: "Não consegui finalizar a análise. Tente reformular a pergunta." }, 500, requestId);

  // ----- helpers -----
  async function logRun(
    status: "ok" | "error" | "rate_limited" | "aborted",
    errorType: string | null,
    errorMessage: string | null,
    messageId: string | null = null,
  ) {
    try {
      const { data: runRow } = await supabaseAdmin
        .from("ai_runs")
        .insert({
          request_id: requestId,
          conversation_id: conversationId,
          message_id: messageId,
          user_id: userId,
          organization_id: organizationId ?? userId,
          provider: "lovable",
          model: MODEL,
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          cached_tokens: cachedTokens,
          duration_ms: Date.now() - startedAt,
          status,
          error_type: errorType,
          error_message: errorMessage,
        })
        .select("id")
        .single();

      if (runRow && toolCallLogs.length > 0) {
        await supabaseAdmin.from("ai_tool_calls").insert(
          toolCallLogs.map((t) => ({
            run_id: runRow.id,
            request_id: requestId,
            ...t,
          })),
        );
      }
    } catch (e) {
      logEvent("ai_agent_log_failed", { request_id: requestId, error: String(e) });
    }
  }
});
