import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for",
};

const PHONE_REGEX = /^\d{10,11}$/;

function parseClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return null;
  return forwarded.split(",")[0]?.trim() || null;
}

async function logAbuseEvent(
  supabase: ReturnType<typeof createClient>,
  payload: {
    reason: string;
    organization_id?: string;
    pdv_id?: string | null;
    catalog_slug?: string;
    phone?: string;
    ip_address?: string | null;
    fingerprint?: string | null;
    details?: Record<string, unknown>;
  },
) {
  await supabase.from("catalog_lead_abuse_events").insert({
    reason: payload.reason,
    organization_id: payload.organization_id ?? null,
    pdv_id: payload.pdv_id ?? null,
    catalog_slug: payload.catalog_slug ?? null,
    phone: payload.phone ?? null,
    ip_address: payload.ip_address ?? null,
    fingerprint: payload.fingerprint ?? null,
    details: payload.details ?? null,
  });
}

async function verifyHCaptcha(token: string): Promise<boolean> {
  const secret = Deno.env.get("HCAPTCHA_SECRET");
  if (!secret) return true;

  const response = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  if (!response.ok) return false;
  const data = await response.json();
  return Boolean(data?.success);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      organization_id,
      pdv_id,
      phone,
      product_name,
      catalog_slug,
      fingerprint,
      captcha_token,
    } = await req.json();

    const normalizedPhone = String(phone || "").replace(/\D/g, "");
    const normalizedFingerprint = typeof fingerprint === "string" ? fingerprint.trim().slice(0, 255) : null;
    const ipAddress = parseClientIp(req);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!PHONE_REGEX.test(normalizedPhone)) {
      await logAbuseEvent(supabase, {
        reason: "invalid_phone",
        organization_id,
        pdv_id,
        catalog_slug,
        phone: normalizedPhone,
        ip_address: ipAddress,
        fingerprint: normalizedFingerprint,
      });

      return new Response(JSON.stringify({ error: "Telefone inválido." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!product_name || !catalog_slug || !organization_id) {
      await logAbuseEvent(supabase, {
        reason: "missing_fields",
        organization_id,
        pdv_id,
        catalog_slug,
        phone: normalizedPhone,
        ip_address: ipAddress,
        fingerprint: normalizedFingerprint,
      });

      return new Response(JSON.stringify({ error: "Dados obrigatórios ausentes." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!captcha_token) {
      await logAbuseEvent(supabase, {
        reason: "missing_captcha",
        organization_id,
        pdv_id,
        catalog_slug,
        phone: normalizedPhone,
        ip_address: ipAddress,
        fingerprint: normalizedFingerprint,
      });

      return new Response(JSON.stringify({ error: "Captcha obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const captchaOk = await verifyHCaptcha(captcha_token);
    if (!captchaOk) {
      await logAbuseEvent(supabase, {
        reason: "captcha_failed",
        organization_id,
        pdv_id,
        catalog_slug,
        phone: normalizedPhone,
        ip_address: ipAddress,
        fingerprint: normalizedFingerprint,
      });

      return new Response(JSON.stringify({ error: "Falha ao validar captcha." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limit by IP/fingerprint in rolling window
    const windowStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    if (ipAddress) {
      const { count: ipCount } = await supabase
        .from("catalog_leads")
        .select("id", { count: "exact", head: true })
        .eq("request_ip", ipAddress)
        .gte("created_at", windowStart);

      if ((ipCount ?? 0) >= 10) {
        await logAbuseEvent(supabase, {
          reason: "ip_rate_limited",
          organization_id,
          pdv_id,
          catalog_slug,
          phone: normalizedPhone,
          ip_address: ipAddress,
          fingerprint: normalizedFingerprint,
          details: { window_minutes: 10, limit: 10 },
        });

        return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (normalizedFingerprint) {
      const { count: fingerprintCount } = await supabase
        .from("catalog_leads")
        .select("id", { count: "exact", head: true })
        .eq("request_fingerprint", normalizedFingerprint)
        .gte("created_at", windowStart);

      if ((fingerprintCount ?? 0) >= 8) {
        await logAbuseEvent(supabase, {
          reason: "fingerprint_rate_limited",
          organization_id,
          pdv_id,
          catalog_slug,
          phone: normalizedPhone,
          ip_address: ipAddress,
          fingerprint: normalizedFingerprint,
          details: { window_minutes: 10, limit: 8 },
        });

        return new Response(JSON.stringify({ error: "Muitas tentativas. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate relationship: slug + org + optional pdv
    const { data: slugMatch, error: slugError } = await supabase
      .from("pdv_catalog_settings")
      .select("public_slug, pdv_id, pdvs!inner(id, organization_id)")
      .eq("public_slug", catalog_slug)
      .eq("is_public_enabled", true)
      .maybeSingle();

    if (slugError) throw slugError;

    const matchesPdvSlug = Boolean(
      slugMatch &&
      slugMatch.pdvs &&
      slugMatch.pdvs.organization_id === organization_id &&
      (!pdv_id || slugMatch.pdv_id === pdv_id),
    );

    let matchesOrgSlug = false;
    if (!matchesPdvSlug && !pdv_id) {
      const { data: orgMatch, error: orgError } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organization_id)
        .eq("public_slug", catalog_slug)
        .eq("public_catalog_enabled", true)
        .maybeSingle();

      if (orgError) throw orgError;
      matchesOrgSlug = Boolean(orgMatch);
    }

    if (!matchesPdvSlug && !matchesOrgSlug) {
      await logAbuseEvent(supabase, {
        reason: "invalid_slug_binding",
        organization_id,
        pdv_id,
        catalog_slug,
        phone: normalizedPhone,
        ip_address: ipAddress,
        fingerprint: normalizedFingerprint,
      });

      return new Response(JSON.stringify({ error: "Slug/organização inválidos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: insertError } = await supabase.from("catalog_leads").insert({
      organization_id,
      pdv_id: pdv_id ?? null,
      phone: normalizedPhone,
      product_name,
      catalog_slug,
      request_ip: ipAddress,
      request_fingerprint: normalizedFingerprint,
    });

    if (insertError) {
      if (String(insertError.message).includes("duplicate_lead_window")) {
        await logAbuseEvent(supabase, {
          reason: "duplicate_lead_window",
          organization_id,
          pdv_id,
          catalog_slug,
          phone: normalizedPhone,
          ip_address: ipAddress,
          fingerprint: normalizedFingerprint,
        });

        return new Response(JSON.stringify({ error: "Você já solicitou este cupom recentemente." }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("submit-catalog-lead error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
