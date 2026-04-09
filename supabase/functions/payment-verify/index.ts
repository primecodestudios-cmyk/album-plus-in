import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const {
      email,
      phone,
      payment_id,
      amount,
      plan_name,
      duration_days,
      max_pcs = 1,
      device_id,
    } = await req.json();

    // Validation
    if (!payment_id) {
      return new Response(
        JSON.stringify({ success: false, error: "payment_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!email && !phone) {
      return new Response(
        JSON.stringify({ success: false, error: "email or phone is required to identify user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!plan_name || !duration_days) {
      return new Response(
        JSON.stringify({ success: false, error: "plan_name and duration_days are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find user by email or phone
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find((u: any) => {
      if (email && u.email === email) return true;
      if (phone) {
        const userPhone = u.user_metadata?.phone || u.phone;
        return userPhone === phone || userPhone?.endsWith(phone.replace(/\D/g, ""));
      }
      return false;
    });

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found. Please register first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create license
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + duration_days * 24 * 60 * 60 * 1000);

    const { data: license, error: licError } = await supabase
      .from("user_licenses")
      .insert({
        user_id: user.id,
        plan_name,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
        max_devices: max_pcs,
        device_id: device_id || null,
      })
      .select("id, license_key, plan_name, starts_at, expires_at, max_devices")
      .single();

    if (licError) {
      return new Response(
        JSON.stringify({ success: false, error: licError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record purchase
    await supabase.from("user_purchases").insert({
      user_id: user.id,
      template_id: payment_id,
      template_name: `${plan_name} License (${payment_id})`,
      price: amount || 0,
    });

    // Approve any pending device requests
    if (device_id) {
      await supabase
        .from("device_requests")
        .update({ status: "approved" })
        .eq("user_id", user.id)
        .eq("device_id", device_id)
        .eq("status", "pending");

      // Register device
      await supabase.from("user_devices").upsert({
        user_id: user.id,
        device_id,
        is_active: true,
        license_id: license.id,
        activated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      }, { onConflict: "user_id,device_id" });
    }

    // Update cpanel data
    await supabase.from("cpanel_user_data").upsert({
      user_id: user.id,
      activation: 1,
      block_user: 0,
      sub_start: startsAt.toISOString(),
      sub_end: expiresAt.toISOString(),
    }, { onConflict: "user_id" });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and license activated",
        license: {
          id: license.id,
          license_key: license.license_key,
          plan_name: license.plan_name,
          starts_at: license.starts_at,
          expires_at: license.expires_at,
          max_devices: license.max_devices,
          remaining_days: duration_days,
        },
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
