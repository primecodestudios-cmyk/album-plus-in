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

    const { email, device_id, system_name, windows_version, software_version, ip_address } = await req.json();

    if (!email || !device_id) {
      return new Response(
        JSON.stringify({ success: false, error: "email and device_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up user by email
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => u.email === email);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found. Please sign up first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if a pending request already exists for this email + device
    const { data: existing } = await supabase
      .from("device_requests")
      .select("id, status")
      .eq("email", email)
      .eq("device_id", device_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Request already pending", request_id: existing.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already has active license for this device
    const { data: activeLicense } = await supabase
      .from("user_licenses")
      .select("id, expires_at, is_active")
      .eq("user_id", user.id)
      .eq("device_id", device_id)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (activeLicense) {
      return new Response(
        JSON.stringify({ success: true, message: "License already active", status: "active", expires_at: activeLicense.expires_at }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new device request
    const { data: request, error } = await supabase
      .from("device_requests")
      .insert({
        user_id: user.id,
        email,
        device_id,
        system_name: system_name || "",
        windows_version: windows_version || "",
        software_version: software_version || "",
        ip_address: ip_address || "",
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Activation request submitted. Waiting for admin approval.", request_id: request.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
