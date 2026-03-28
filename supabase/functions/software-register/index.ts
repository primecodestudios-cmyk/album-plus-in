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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      whatsapp_number,
      country_code = "+91",
      studio_name,
      city,
      state,
      country = "India",
      languages = [],
      password,
      device_id,
      device_name = "",
      os = "",
      software_version = "",
    } = body;

    // ── Validation ──────────────────────────────────────────
    const errors: string[] = [];

    if (!whatsapp_number) errors.push("WhatsApp number is required");
    if (!studio_name?.trim()) errors.push("Studio name is required");
    if (!city?.trim()) errors.push("City is required");
    if (!state?.trim()) errors.push("State is required");
    if (!password) errors.push("Password is required");
    if (!device_id) errors.push("Device ID is required");

    // Phone validation
    if (whatsapp_number) {
      const digits = whatsapp_number.replace(/\D/g, "");
      if (country_code === "+91" && digits.length !== 10) {
        errors.push("Indian WhatsApp number must be exactly 10 digits");
      } else if (digits.length < 7 || digits.length > 15) {
        errors.push("WhatsApp number must be 7-15 digits");
      }
    }

    // Password strength
    if (password) {
      if (password.length < 8) errors.push("Password must be at least 8 characters");
      if (!/[a-zA-Z]/.test(password)) errors.push("Password must include letters");
      if (!/[0-9]/.test(password)) errors.push("Password must include numbers");
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ status: "error", message: errors.join("; ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fullPhone = `${country_code}${whatsapp_number.replace(/\D/g, "")}`;
    // Use phone as a pseudo-email for auth (software users don't have email)
    const email = `${whatsapp_number.replace(/\D/g, "")}@fxminutealbum.app`;

    // ── Check duplicate ─────────────────────────────────────
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find(
      (u) => u.email === email || u.phone === fullPhone
    );

    if (existing) {
      // Check if there's already a pending device request for this device
      const { data: pendingReq } = await supabaseAdmin
        .from("device_requests")
        .select("id, status")
        .eq("user_id", existing.id)
        .eq("device_id", device_id)
        .maybeSingle();

      if (pendingReq) {
        return new Response(
          JSON.stringify({
            status: "exists",
            message: "User already registered",
            user_id: existing.id,
            user_status: pendingReq.status,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Existing user, new device — create device request
      await supabaseAdmin.from("device_requests").insert({
        user_id: existing.id,
        email,
        device_id,
        system_name: device_name,
        windows_version: os,
        software_version,
        status: "pending",
      });

      return new Response(
        JSON.stringify({
          status: "success",
          message: "Device registration submitted. Waiting for activation.",
          user_id: existing.id,
          user_status: "pending",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Create new user ─────────────────────────────────────
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: studio_name,
        phone: fullPhone,
        studio_name,
        city,
        state,
        country,
        languages,
      },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ status: "error", message: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = newUser.user.id;

    // Update profile with additional fields (trigger may have already created it)
    await supabaseAdmin
      .from("profiles")
      .update({
        studio_name,
        city,
        state,
        country,
        languages,
        phone: fullPhone,
      })
      .eq("user_id", userId);

    // ── Create device request (pending) ─────────────────────
    await supabaseAdmin.from("device_requests").insert({
      user_id: userId,
      email,
      device_id,
      system_name: device_name,
      windows_version: os,
      software_version,
      status: "pending",
    });

    return new Response(
      JSON.stringify({
        status: "success",
        message: "Registration Successful. Waiting for Activation.",
        user_id: userId,
        user_status: "pending",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ status: "error", message: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
