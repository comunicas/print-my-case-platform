const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isEnabled() {
  return Deno.env.get("INGEST_REVENUE_ENABLED") === "true";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const enabled = isEnabled();

  if (!enabled) {
    console.warn(
      `[ingest-revenue] blocked_by_feature_flag request_id=${requestId} method=${req.method}`,
    );

    return new Response(
      JSON.stringify({
        error: "Endpoint desativado por feature flag.",
        status: "disabled",
        feature_flag: "INGEST_REVENUE_ENABLED",
        request_id: requestId,
      }),
      {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  console.info(
    `[ingest-revenue] enabled_but_not_implemented request_id=${requestId} method=${req.method}`,
  );

  return new Response(
    JSON.stringify({
      error: "Endpoint habilitado, mas ainda sem implementação funcional.",
      status: "not_implemented",
      request_id: requestId,
    }),
    {
      status: 501,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
