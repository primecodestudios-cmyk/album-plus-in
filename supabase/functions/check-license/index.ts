import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, device_id, software_version } = await req.json();

    if (!email || !device_id) {
      return new Response(
        JSON.stringify({ success: false, error: "email and device_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up user
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, status: "not_found", error: "User not registered" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active license (any device)
    const { data: license } = await supabase
      .from("user_licenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!license) {
      // Check pending request
      const { data: pendingReq } = await supabase
        .from("device_requests")
        .select("id, status")
        .eq("email", email)
        .eq("device_id", device_id)
        .order("request_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingReq) {
        return new Response(
          JSON.stringify({
            success: true,
            status: pendingReq.status === "pending" ? "pending" : "rejected",
            message: pendingReq.status === "pending"
              ? "Activation request is pending admin approval"
              : "Activation request was rejected",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: "no_license", message: "No license found. Please submit an activation request." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check license status
    const now = new Date();
    const expiresAt = new Date(license.expires_at);

    if (!license.is_active) {
      return new Response(
        JSON.stringify({ success: true, status: "blocked", message: "License has been blocked by admin", expiry_date: license.expires_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (expiresAt < now) {
      return new Response(
        JSON.stringify({ success: true, status: "expired", message: "License has expired", expiry_date: license.expires_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Multi-device limit check ──────────────────────────
    const maxDevices = license.max_devices || 1;

    // Get active devices for this user
    const { data: activeDevices } = await supabase
      .from("user_devices")
      .select("device_id, device_name, last_seen_at")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const isDeviceAlreadyActive = (activeDevices || []).some((d: any) => d.device_id === device_id);
    const activeCount = (activeDevices || []).length;

    // If this device is NOT already active and we've hit the limit
    if (!isDeviceAlreadyActive && activeCount >= maxDevices) {
      return new Response(
        JSON.stringify({
          success: true,
          status: "device_limit_reached",
          message: `You have reached your device limit (${maxDevices} PCs). Please deactivate an existing device first.`,
          max_devices: maxDevices,
          active_device_count: activeCount,
          active_devices: (activeDevices || []).map((d: any) => ({
            device_id: d.device_id,
            device_name: d.device_name,
            last_seen: d.last_seen_at,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const remainingDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Auto-register/update device in user_devices table
    await supabase
      .from("user_devices")
      .upsert({
        user_id: user.id,
        device_id: device_id,
        system_info: software_version || "",
        is_active: true,
        last_seen_at: new Date().toISOString(),
        license_id: license.id,
      }, { onConflict: "user_id,device_id" });

    return new Response(
      JSON.stringify({
        success: true,
        status: "active",
        plan_name: license.plan_name,
        expiry_date: license.expires_at,
        activation_date: license.starts_at,
        remaining_days: remainingDays,
        max_devices: maxDevices,
        active_device_count: isDeviceAlreadyActive ? activeCount : activeCount + 1,
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
