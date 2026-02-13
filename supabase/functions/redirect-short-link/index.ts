import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shortCode = url.searchParams.get("code");

    if (!shortCode) {
      return new Response(JSON.stringify({ error: "Missing code parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Increment click count and get target URL atomically
    const { data, error } = await supabase.rpc("increment_click_count", {
      p_short_code: shortCode,
    });

    if (error || !data || data.length === 0) {
      return new Response(JSON.stringify({ error: "Short link not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetUrl = data[0].target_url;
    const shortLinkId = data[0].short_link_id;

    // Record click event async (don't block redirect)
    const referrer = req.headers.get("referer") || null;
    const userAgent = req.headers.get("user-agent") || null;
    // Hash IP for privacy
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(ip + "salt_catalog_links")
    );
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);

    // Fire and forget - don't await
    supabase
      .from("link_click_events")
      .insert({
        short_link_id: shortLinkId,
        referrer,
        user_agent: userAgent,
        ip_hash: ipHash,
      })
      .then(() => {});

    return new Response(JSON.stringify({ target_url: targetUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
