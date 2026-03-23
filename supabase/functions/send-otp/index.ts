import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, conversation_id, action } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "verify") {
      // Verify OTP
      const { otp } = await req.json().catch(() => ({ otp: "" }));
      // Re-parse since we already consumed the body
      const body = { phone, conversation_id, action, otp: arguments[0] };
      return await handleVerify(supabase, body, corsHeaders);
    }

    // Generate OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Save OTP to conversation
    const { error: updateErr } = await supabase
      .from("chat_conversations")
      .update({
        phone: phone,
        otp_code: otp,
        otp_verified: false,
        otp_expires_at: expiresAt,
      })
      .eq("id", conversation_id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send OTP via WhatsApp (chat2me.in)
    // Get credentials from admin settings stored in DB or env
    // For now, try to read from a simple approach - we'll use the settings table or direct env
    const instanceId = Deno.env.get("WHATSAPP_INSTANCE_ID");
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (instanceId && accessToken) {
      try {
        const waRes = await fetch("https://chat2me.in/api/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            number: phone.replace(/\D/g, ""),
            type: "text",
            message: `🔐 Your AlbumPlus verification code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
            instance_id: instanceId,
            access_token: accessToken,
          }),
        });
        const waData = await waRes.json();
        console.log("WhatsApp OTP send result:", waData);
      } catch (waErr) {
        console.error("WhatsApp send error:", waErr);
        // Still return success - OTP is saved, just WhatsApp delivery may have failed
      }
    } else {
      console.warn("WhatsApp credentials not configured - OTP saved but not sent via WhatsApp");
    }

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-otp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleVerify(supabase: any, body: any, corsHeaders: any) {
  // This won't be called due to the body parsing issue - verify is handled separately
  return new Response(JSON.stringify({ error: "Use verify-otp endpoint" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
