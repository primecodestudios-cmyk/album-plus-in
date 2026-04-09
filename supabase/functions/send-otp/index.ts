import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { phone, conversation_id } = await req.json();

    if (!phone || !conversation_id) {
      return new Response(
        JSON.stringify({ error: "phone and conversation_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      .update({ phone, otp_code: otp, otp_verified: false, otp_expires_at: expiresAt })
      .eq("id", conversation_id);

    if (updateErr) {
      console.error("OTP save error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save OTP" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send OTP via WhatsApp
    const cleanNum = phone.replace(/\D/g, "");
    const message = `🔐 *Album Plus* Verification Code\n\nYour OTP is: *${otp}*\n\nThis code expires in 5 minutes.\nDo not share it with anyone.\n\nIf you did not request this, please ignore this message.`;

    let whatsappSent = false;
    let whatsappError = "";

    try {
      const waRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ number: cleanNum, message, category: "otp" }),
      });

      const waData = await waRes.json();
      whatsappSent = waRes.ok && waData.success;
      if (!whatsappSent) whatsappError = waData.error || "WhatsApp send failed";
      console.log("OTP WhatsApp result:", { sent: whatsappSent, data: waData });
    } catch (e) {
      whatsappError = e instanceof Error ? e.message : "WhatsApp error";
      console.error("OTP WhatsApp error:", whatsappError);
    }

    // Log delivery result
    if (!whatsappSent) {
      console.error("OTP delivery failed - WhatsApp:", whatsappError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: whatsappSent
          ? "OTP sent via WhatsApp"
          : "OTP generated. If you did not receive it on WhatsApp, please verify your number and try again.",
        whatsapp_sent: whatsappSent,
        fallback_note: !whatsappSent
          ? "If you did not receive the OTP, please check your WhatsApp or contact support."
          : undefined,
      }),
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
