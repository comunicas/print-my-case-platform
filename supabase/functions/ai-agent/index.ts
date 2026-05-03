import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { SKILL_CORE as DEFAULT_SKILL_CORE } from "./skill.ts";
import { TOOLS as DEFAULT_TOOLS, TOOL_TO_RPC } from "./tools.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Expose-Headers": "x-request-id",
};

const DEFAULT_MODEL = "gpt-5-mini";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const PROVIDER = "openai";
const DEFAULT_MAX_TOOL_ITERATIONS = 5;
const OPENAI_REQUEST_TIMEOUT_MS = 45_000;
const OVERALL_BUDGET_MS = 130_000;
const DEFAULT_RATE_LIMIT_PER_10_MIN = 20;
const DEFAULT_HISTORY_LIMIT = 20;
const DEFAULT_MAX_MESSAGE_CHARS = 4000;
const CONFIG_CACHE_TTL_MS = 60 * 1000;
type AgentConfig = {
  model: string;
  system_prompt: string;
  max_tool_iterations: number;
  history_limit: number;
  rate_limit_per_10min: number;
  max_message_chars: number;
  tools: typeof DEFAULT_TOOLS;
};

let cachedConfig: { value: AgentConfig; ts: number } | null = null;
let configLoadPromise: Promise<AgentConfig> | null = null;

async function loadAgentConfig(supabaseAdmin: ReturnType<typeof createClient>): Promise<AgentConfig> {
  const now = Date.now();
  if (cachedConfig && now - cachedConfig.ts < CONFIG_CACHE_TTL_MS) return cachedConfig.value;
  if (configLoadPromise) return configLoadPromise;
  configLoadPromise = _doLoadAgentConfig(supabaseAdmin).finally(() => {
    configLoadPromise = null;
  });
  return configLoadPromise;
}

async function _doLoadAgentConfig(supabaseAdmin: ReturnType<typeof createClient>): Promise<AgentConfig> {
  const now = Date.now();
  const fallback: AgentConfig = {
    model: DEFAULT_MODEL,
    system_prompt: DEFAULT_SKILL_CORE,
    max_tool_iterations: DEFAULT_MAX_TOOL_ITERATIONS,
    history_limit: DEFAULT_HISTORY_LIMIT,
    rate_limit_per_10min: DEFAULT_RATE_LIMIT_PER_10_MIN,
    max_message_chars: DEFAULT_MAX_MESSAGE_CHARS,
    tools: DEFAULT_TOOLS,
  };

  try {
    const [{ data: cfg }, { data: tools }] = await Promise.all([
      supabaseAdmin.from("ai_agent_config").select("*").eq("singleton", true).maybeSingle(),
      supabaseAdmin
        .from("ai_agent_tools")
        .select("name, description, parameters_schema, enabled")
        .eq("enabled", true),
    ]);

    const dynamicTools = (tools ?? [])
      .filter((t: any) => TOOL_TO_RPC[t.name])
      .map((t: any) => ({
        type: "function" as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters_schema,
        },
      })) as typeof DEFAULT_TOOLS;

    const value: AgentConfig = {
      model: (cfg?.model as string) ?? fallback.model,
      system_prompt: (cfg?.system_prompt as string) ?? fallback.system_prompt,
      max_tool_iterations: (cfg?.max_tool_iterations as number) ?? fallback.max_tool_iterations,
      history_limit: (cfg?.history_limit as number) ?? fallback.history_limit,
      rate_limit_per_10min: (cfg?.rate_limit_per_10min as number) ?? fallback.rate_limit_per_10min,
      max_message_chars: (cfg?.max_message_chars as number) ?? fallback.max_message_chars,
      tools: dynamicTools.length > 0 ? dynamicTools : fallback.tools,
    };
    cachedConfig = { value, ts: now };
    return value;
  } catch (e) {
    console.warn("ai-agent: config load failed, using defaults", e);
    return fallback;
  }
}


function normalizeProductNames(value: unknown): { values: string[]; valid: boolean } {
  if (!Array.isArray(value)) return { values: [], valid: false };
  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const uniqueExactOrder = Array.from(new Set(normalized));
  return { values: uniqueExactOrder, valid: uniqueExactOrder.length > 0 };
}

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

  const { data: { user }, error: claimsErr } = await supabaseUser.auth.getUser();
  if (claimsErr || !user) {
    return jsonResponse({ error: "Sessão inválida." }, 401, requestId);
  }
  const userId = user.id;

  const agentCfg = await loadAgentConfig(supabaseAdmin);

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
  if (userMessage.length > agentCfg.max_message_chars) {
    return jsonResponse(
      { error: `Mensagem muito longa (máx. ${agentCfg.max_message_chars} caracteres).` },
      400,
      requestId,
    );
  }

  // 4. Rate limit (por usuário, últimos 10 min)
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from("ai_messages")
    .select("id, ai_conversations!inner(user_id)", { count: "exact", head: true })
    .eq("role", "user")
    .eq("ai_conversations.user_id", userId)
    .gte("created_at", tenMinAgo);

  if ((recentCount ?? 0) >= agentCfg.rate_limit_per_10min) {
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
    .select("role, content, tool_calls, tool_results, tool_call_id")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(agentCfg.history_limit);
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
    { role: "system", content: agentCfg.system_prompt },
  ];
  for (const h of history) {
    if (h.role === "user" || h.role === "assistant") {
      messages.push({ role: h.role, content: h.content });
    }
    // Tool messages from history are skipped: OpenAI requires them to be paired
    // with the preceding assistant message containing matching tool_calls, which
    // we don't persist. Including orphan tool messages causes a 400 error.
  }
  messages.push({ role: "user", content: userMessage });

  // 9. Tool-calling loop
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) {
    return jsonResponse(
      { error: "OpenAI não configurada. Defina OPENAI_API_KEY nas secrets." },
      500,
      requestId,
    );
  }

  // Helpers para registrar run/tool_calls
  const toolCallLogs: Array<Record<string, unknown>> = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let cachedTokens = 0;

  // Executa as tools até o modelo dar resposta final OU atingir limite
  // Para a parte FINAL (sem tools restantes), fazemos streaming SSE para o cliente.
  for (let iter = 0; iter < agentCfg.max_tool_iterations; iter++) {
    if (Date.now() - startedAt > OVERALL_BUDGET_MS) {
      logEvent("ai_agent_budget_exceeded", { request_id: requestId, iter });
      break;
    }
    // Na última iteração, forçamos o modelo a responder em texto (sem mais tools)
    // para garantir uma resposta útil ao usuário com os dados já coletados.
    const isLastIteration = iter === agentCfg.max_tool_iterations - 1;
    const aiCtrl = new AbortController();
    const aiTimer = setTimeout(() => aiCtrl.abort(), OPENAI_REQUEST_TIMEOUT_MS);
    let aiResp: Response;
    try {
      aiResp = await fetch(OPENAI_CHAT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: agentCfg.model,
          messages,
          ...(isLastIteration ? { tool_choice: "none" } : { tools: agentCfg.tools }),
          stream: false,
        }),
        signal: aiCtrl.signal,
      });
    } catch (e) {
      clearTimeout(aiTimer);
      await logRun("error", "provider_timeout", String(e).slice(0, 500));
      logEvent("ai_agent_provider_timeout", { request_id: requestId, iter, error: String(e) });
      return jsonResponse({ error: "Tempo esgotado ao consultar o modelo. Tente novamente." }, 504, requestId);
    } finally {
      clearTimeout(aiTimer);
    }

    if (aiResp.status === 401) {
      await logRun("error", "unauthorized", "OpenAI API key inválida");
      return jsonResponse(
        { error: "Chave da OpenAI inválida. Verifique OPENAI_API_KEY." },
        500,
        requestId,
      );
    }
    if (aiResp.status === 429) {
      const errBody = await aiResp.text();
      const isQuota = /insufficient_quota|exceeded.*quota/i.test(errBody);
      if (isQuota) {
        await logRun("error", "insufficient_quota", "Cota OpenAI esgotada");
        return jsonResponse(
          { error: "Saldo/cota da OpenAI esgotado. Verifique billing em platform.openai.com." },
          402,
          requestId,
        );
      }
      await logRun("rate_limited", "rate_limited", "Provider rate limit");
      return jsonResponse(
        { error: "Limite da OpenAI atingido. Tente novamente em instantes." },
        429,
        requestId,
      );
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

      const toolResults = await Promise.all(toolCalls.map(async (tc: any) => {
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

        const argsSanitized: Record<string, unknown> = { ...args };
        const requiresProductNames = toolName === "analyze_restock_targets";
        const supportsOptionalProductNames = toolName === "get_purchases_summary";
        if (requiresProductNames || supportsOptionalProductNames) {
          const hasProductNames = Object.hasOwn(args, "product_names");

          if (hasProductNames) {
            const normalizedProducts = normalizeProductNames(args.product_names);
            argsSanitized.product_names = normalizedProducts.values;
            args.product_names = normalizedProducts.values;

            if (!normalizedProducts.valid) {
              toolStatus = "error";
              toolErr = "product_names_empty_or_invalid";
              resultStr = JSON.stringify({
                error: "invalid_product_names",
                user_message:
                  "Não consegui mapear os nomes dos produtos da etapa anterior; vou listar novamente os faltantes e reanalisar com os nomes exatos.",
                recovery_instruction:
                  "Reliste os produtos faltantes com os nomes exatos e execute novamente a análise de reposição.",
              });
            }
          } else if (requiresProductNames) {
            argsSanitized.product_names = [];
            toolStatus = "error";
            toolErr = "product_names_empty_or_invalid";
            resultStr = JSON.stringify({
              error: "invalid_product_names",
              user_message:
                "Não consegui mapear os nomes dos produtos da etapa anterior; vou listar novamente os faltantes e reanalisar com os nomes exatos.",
              recovery_instruction:
                "Reliste os produtos faltantes com os nomes exatos e execute novamente a análise de reposição.",
            });
          }
        }

        if (!mapping) {
          toolStatus = "error";
          toolErr = `Tool desconhecida: ${toolName}`;
          resultStr = JSON.stringify({ error: "tool_unavailable", user_message: "Esta consulta não está disponível no momento." });
        } else if (!resultStr) {
          const rpcParams = mapping.mapParams(args);
          const { data, error } = await supabaseUser.rpc(mapping.rpc, rpcParams as never);
          if (error) {
            toolStatus = "error";
            toolErr = error.message;
            // Sanitiza: nunca expor SQL/nome de coluna/tabela ao modelo (que poderia repassar ao usuário)
            resultStr = JSON.stringify({
              error: "tool_failed",
              user_message:
                "Não consegui executar essa consulta agora. Informe ao usuário de forma genérica que a análise falhou e sugira refinar a pergunta ou tentar novamente. Não mencione detalhes técnicos.",
              recovery_hint:
                "Se citou PDV por nome, confirme o nome exato. Se parecer instabilidade momentânea, tente novamente em instantes.",
            });
          } else {
            const arr = Array.isArray(data) ? data : data ? [data] : [];
            rowsReturned = arr.length;
            // Trunca em nível de array para garantir JSON sempre válido ao modelo
            const MAX_TOOL_RESULT_ROWS = 80;
            if (arr.length > MAX_TOOL_RESULT_ROWS) {
              const truncated = arr.slice(0, MAX_TOOL_RESULT_ROWS);
              resultStr =
                JSON.stringify(truncated) +
                `\n…[exibindo ${MAX_TOOL_RESULT_ROWS} de ${arr.length} registros]`;
            } else {
              resultStr = JSON.stringify(arr);
            }
          }
        }

        toolCallLogs.push({
          tool_name: toolName,
          params_sanitized: argsSanitized,
          rows_returned: rowsReturned,
          duration_ms: Date.now() - tStart,
          status: toolStatus,
          error_message: toolErr,
        });

        return { tc, resultStr, toolStatus };
      }));

      for (const { tc, resultStr } of toolResults) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: resultStr });
      }
      // Persiste resultados em paralelo (não bloqueia a próxima iteração se falhar)
      await Promise.all(toolResults.map(({ tc, resultStr, toolStatus }) =>
        supabaseAdmin.from("ai_messages").insert({
          conversation_id: conversationId,
          role: "tool",
          content: resultStr,
          tool_call_id: tc.id,
          status: toolStatus === "ok" ? "ok" : "failed",
        })
      ));
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

  // Atingiu MAX_TOOL_ITERATIONS sem resposta final (não deve ocorrer com tool_choice=none na última)
  await logRun("error", "max_iterations", "Limite de iterações de tools atingido");
  const fallback =
    "Reuni vários dados, mas não consegui consolidar uma resposta final. Tente reformular a pergunta de forma mais específica (por exemplo, focando em um PDV, produto ou período).";
  await supabaseAdmin
    .from("ai_messages")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: fallback,
      status: "error",
    });
  return jsonResponse({ conversationId, requestId, message: fallback }, 200, requestId);

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
          provider: PROVIDER,
          model: agentCfg.model,
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
