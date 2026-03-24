import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getWhatsAppCredentials(supabase: any) {
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claims.claims.sub as string;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversation_id, message } = await req.json();

    if (!conversation_id || !message) {
      return new Response(JSON.stringify({ error: "Missing conversation_id or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save admin reply
    const { error: insertErr } = await adminSupabase.from("chat_messages").insert({
      conversation_id,
      role: "admin",
      content: message,
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await adminSupabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversation_id);

    // Send via WhatsApp if phone is available
    const { data: conv } = await adminSupabase
      .from("chat_conversations")
      .select("phone, otp_verified")
      .eq("id", conversation_id)
      .single();

    let whatsappSent = false;
    if (conv?.phone && conv?.otp_verified) {
      const { instanceId, accessToken } = await getWhatsAppCredentials(adminSupabase);

      if (instanceId && accessToken) {
        try {
          const waRes = await fetch("https://chat2me.in/api/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              number: conv.phone.replace(/\D/g, ""),
              type: "text",
              message: `📩 *AlbumPlus Support*\n\n${message}`,
              instance_id: instanceId,
              access_token: accessToken,
            }),
          });
          whatsappSent = waRes.ok;
        } catch (e) {
          console.error("WhatsApp send error:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, whatsapp_sent: whatsappSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("admin-reply error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
