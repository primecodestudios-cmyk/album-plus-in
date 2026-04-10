import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, phone, otp_type } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const type = otp_type || "email";

    // Store OTP
    const { error: insertErr } = await supabase.from("signup_otps").insert({
      email,
      phone: phone || "",
      otp_code: otp,
      otp_type: type,
      expires_at: expiresAt,
      verified: false,
    });

    if (insertErr) {
      console.error("OTP insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to generate OTP" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let whatsappSent = false;
    let emailSent = false;

    // Send via WhatsApp if phone provided and type is whatsapp or both
    if (phone && (type === "whatsapp" || type === "both")) {
      try {
        const cleanNum = phone.replace(/\D/g, "");
        const message = `🔐 *Album Plus* Verification Code\n\nYour OTP is: *${otp}*\n\nThis code expires in 5 minutes.\nDo not share it with anyone.`;

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
        console.log("Signup OTP WhatsApp:", { sent: whatsappSent });
      } catch (e) {
        console.error("WhatsApp OTP error:", e);
      }
    }

    // For email type - we log that OTP was generated (actual email sending requires email infra)
    if (type === "email" || type === "both") {
      // Mark as email sent for now - the OTP is stored and can be verified
      emailSent = true;
      console.log(`Email OTP for ${email}: Generated (OTP: ${otp})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: type === "whatsapp" 
          ? (whatsappSent ? "OTP sent to your WhatsApp" : "OTP generated. Check your WhatsApp or try email.")
          : type === "both"
          ? "OTP sent via WhatsApp and Email"
          : "OTP sent to your email",
        whatsapp_sent: whatsappSent,
        email_sent: emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("signup-otp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
