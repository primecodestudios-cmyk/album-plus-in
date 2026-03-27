import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;
    let deviceId: string | null = null;

    // Support both GET (query params) and POST (JSON body)
    if (req.method === "GET") {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      deviceId = url.searchParams.get("device_id");
    } else {
      const body = await req.json();
      userId = body.user_id;
      deviceId = body.device_id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ status: "error", message: "user_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check active license
    const { data: license } = await supabaseAdmin
      .from("user_licenses")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (license) {
      const now = new Date();
      const expiresAt = new Date(license.expires_at);
      const remainingDays = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      // Check if blocked
      const { data: cpanelData } = await supabaseAdmin
        .from("cpanel_user_data")
        .select("block_user, activation")
        .eq("user_id", userId)
        .maybeSingle();

      if (cpanelData?.block_user === 1) {
        return new Response(
          JSON.stringify({ status: "blocked", message: "Your account has been blocked" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (expiresAt < now) {
        return new Response(
          JSON.stringify({ status: "expired", message: "Your license has expired", expires_at: license.expires_at }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          status: "active",
          message: "License is active",
          plan_name: license.plan_name,
          expires_at: license.expires_at,
          remaining_days: remainingDays,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No license — check device requests
    const query = supabaseAdmin
      .from("device_requests")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (deviceId) query.eq("device_id", deviceId);

    const { data: deviceReq } = await query.maybeSingle();

    if (deviceReq) {
      return new Response(
        JSON.stringify({
          status: deviceReq.status,
          message: deviceReq.status === "pending"
            ? "Waiting for admin activation"
            : deviceReq.status === "rejected"
            ? "Your request was rejected"
            : "Request processed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "not_found", message: "No registration found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
