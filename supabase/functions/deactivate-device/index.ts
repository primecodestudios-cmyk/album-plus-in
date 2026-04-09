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

    const { email, device_id, user_id } = await req.json();

    if (!device_id) {
      return new Response(
        JSON.stringify({ success: false, error: "device_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve user
    let resolvedUserId = user_id;
    if (!resolvedUserId && email) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users?.find((u: any) => u.email === email);
      if (user) resolvedUserId = user.id;
    }

    if (!resolvedUserId) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found. Provide email or user_id." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate the device
    const { data: device, error: deviceError } = await supabase
      .from("user_devices")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", resolvedUserId)
      .eq("device_id", device_id)
      .eq("is_active", true)
      .select("id, device_id, device_name")
      .maybeSingle();

    if (deviceError) {
      return new Response(
        JSON.stringify({ success: false, error: deviceError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!device) {
      return new Response(
        JSON.stringify({ success: false, error: "No active device found with this ID" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Device deactivated successfully",
        device_id: device.device_id,
        device_name: device.device_name,
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
