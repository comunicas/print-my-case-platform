import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !/^\d{10,11}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Número inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: "Código inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Step 1: Find the most recent valid (non-expired, non-verified) OTP for this phone
    // WITHOUT checking the code yet — to properly count attempts
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("id, code, attempt_count")
      .eq("phone", phone)
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return new Response(
        JSON.stringify({ verified: false, error: "Código inválido ou expirado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Check if too many failed attempts have been made
    if (otpRecord.attempt_count >= MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ verified: false, error: "Muitas tentativas incorretas. Solicite um novo código." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 3: Increment attempt_count before comparing the code
    // This ensures every attempt is counted, preventing race conditions
    await supabase
      .from("otp_verifications")
      .update({ attempt_count: otpRecord.attempt_count + 1 })
      .eq("id", otpRecord.id);

    // Step 4: Now compare the code
    if (otpRecord.code !== code) {
      const attemptsLeft = MAX_ATTEMPTS - (otpRecord.attempt_count + 1);
      const errorMsg = attemptsLeft > 0
        ? `Código incorreto. ${attemptsLeft} tentativa(s) restante(s).`
        : "Código incorreto. Número máximo de tentativas atingido. Solicite um novo código.";

      return new Response(
        JSON.stringify({ verified: false, error: errorMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 5: Code is correct — mark as verified
    await supabase
      .from("otp_verifications")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    return new Response(
      JSON.stringify({ verified: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-otp error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
