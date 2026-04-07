import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const IDEMPOTENCY_WINDOW_MS = 30 * 1000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^\d{10,11}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Número de telefone inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = Date.now();
    const idempotencyWindowStart = new Date(now - IDEMPOTENCY_WINDOW_MS).toISOString();
    const rateLimitWindowStart = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString();

    // Idempotência básica para reduzir duplicidade em retries imediatos.
    const { data: recentOtp } = await supabase
      .from("otp_verifications")
      .select("id")
      .eq("phone", phone)
      .eq("verified", false)
      .gte("created_at", idempotencyWindowStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOtp) {
      return new Response(
        JSON.stringify({ success: true, idempotent: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: conta apenas OTPs efetivamente persistidos (enviados com sucesso).
    const { count } = await supabase
      .from("otp_verifications")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", rateLimitWindowStart);

    if (count !== null && count >= RATE_LIMIT_MAX) {
      return new Response(
        JSON.stringify({ error: "Muitas tentativas. Aguarde alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Send via Twilio
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER")!;

    const toPhone = `+55${phone}`;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const twilioRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
      },
      body: new URLSearchParams({
        To: toPhone,
        From: fromPhone,
        Body: `Seu código de verificação é: ${code}. Válido por 5 minutos.`,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!twilioRes.ok) {
      const errBody = await twilioRes.text();
      console.error("Twilio error:", errBody);

      // Telemetria de falha de envio (não confundida com OTP válido).
      await supabase.from("otp_send_attempts").insert({
        phone,
        status: "failed",
        provider: "twilio",
        error_message: `Twilio API failed [${twilioRes.status}]`,
      });

      return new Response(
        JSON.stringify({ error: "Falha ao enviar OTP. Tente novamente." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioPayload = await twilioRes.json();

    // Só grava OTP se o envio foi confirmado.
    const { error: insertError } = await supabase
      .from("otp_verifications")
      .insert({ phone, code });

    if (insertError) throw insertError;

    // Telemetria de sucesso de envio.
    await supabase.from("otp_send_attempts").insert({
      phone,
      status: "sent",
      provider: "twilio",
      provider_message_id:
        typeof twilioPayload?.sid === "string" ? twilioPayload.sid : null,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-otp error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
