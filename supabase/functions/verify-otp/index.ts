import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, otp } = await req.json();

    if (!conversation_id || !otp) {
      return new Response(JSON.stringify({ error: "Missing conversation_id or otp" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get conversation
    const { data: conv, error: fetchErr } = await supabase
      .from("chat_conversations")
      .select("otp_code, otp_expires_at, otp_verified")
      .eq("id", conversation_id)
      .single();

    if (fetchErr || !conv) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (conv.otp_verified) {
      return new Response(JSON.stringify({ success: true, message: "Already verified" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (new Date(conv.otp_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "OTP expired. Please request a new one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check OTP match
    if (conv.otp_code !== otp.trim()) {
      return new Response(JSON.stringify({ error: "Invalid OTP. Please try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark verified
    await supabase
      .from("chat_conversations")
      .update({ otp_verified: true, otp_code: null })
      .eq("id", conversation_id);

    return new Response(
      JSON.stringify({ success: true, message: "Phone verified successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-otp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
