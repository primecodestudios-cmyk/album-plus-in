import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getWhatsAppCredentials(supabase: any) {
  // Try env vars first, then fall back to app_settings table
  let instanceId = Deno.env.get("WHATSAPP_INSTANCE_ID");
  let accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

  if (!instanceId || !accessToken) {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["whatsapp_instance_id", "whatsapp_access_token"]);

    if (data) {
      for (const row of data) {
        if (row.key === "whatsapp_instance_id" && row.value) instanceId = row.value;
        if (row.key === "whatsapp_access_token" && row.value) accessToken = row.value;
      }
    }
  }

  return { instanceId, accessToken };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, conversation_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    // Send OTP via WhatsApp
    const { instanceId, accessToken } = await getWhatsAppCredentials(supabase);

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
