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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let userId: string | null = null;
    let email: string | null = null;

    if (req.method === "GET") {
      const url = new URL(req.url);
      userId = url.searchParams.get("user_id");
      email = url.searchParams.get("email");
    } else {
      const body = await req.json();
      userId = body.user_id;
      email = body.email;
    }

    // Resolve user_id from email if needed
    if (!userId && email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);
      if (user) userId = user.id;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "user_id or email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's license info
    const { data: license } = await supabase
      .from("user_licenses")
      .select("id, plan_name, max_devices, is_active, expires_at, starts_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get all devices
    const { data: devices, error } = await supabase
      .from("user_devices")
      .select("device_id, device_name, is_active, last_seen_at, activated_at, system_info, ip_address, running_version, windows_version")
      .eq("user_id", userId)
      .order("activated_at", { ascending: false });

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const activeDevices = (devices || []).filter((d: any) => d.is_active);
    const maxDevices = license?.max_devices || 1;

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        license: license ? {
          plan_name: license.plan_name,
          max_devices: maxDevices,
          starts_at: license.starts_at,
          expires_at: license.expires_at,
          remaining_days: Math.max(0, Math.ceil((new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
        } : null,
        active_device_count: activeDevices.length,
        max_devices: maxDevices,
        can_add_device: activeDevices.length < maxDevices,
        devices: devices || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
