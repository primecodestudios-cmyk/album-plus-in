import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendRequest {
  number: string;
  message: string;
  type?: "text" | "media";
  media_url?: string;
  filename?: string;
  category?: string;
  user_id?: string;
  user_name?: string;
}

interface ApiConfig {
  id: string;
  label: string;
  api_url: string;
  api_method: string;
  api_token: string;
  instance_id: string;
  sender_number: string;
  sort_order: number;
  is_active: boolean;
  failure_count: number;
  total_sent: number;
}

function cleanNumber(num: string): string {
  let clean = num.replace(/[^0-9]/g, "");
  if (clean.length === 10) clean = "91" + clean;
  return clean;
}

async function sendViaApi(config: ApiConfig, payload: any): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    const body: any = {
      number: payload.number,
      type: payload.type || "text",
      message: payload.message,
      instance_id: config.instance_id,
      access_token: config.api_token,
    };
    if (payload.type === "media") {
      body.media_url = payload.media_url;
      body.filename = payload.filename;
    }

    let res: Response;
    if (config.api_method.toUpperCase() === "GET") {
      const params = new URLSearchParams();
      Object.entries(body).forEach(([k, v]) => params.set(k, String(v)));
      res = await fetch(`${config.api_url}?${params.toString()}`);
    } else {
      res = await fetch(config.api_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();
    if (res.ok && (data.status === "success" || data.status !== "error")) {
      return { ok: true, data };
    }
    return { ok: false, error: data.message || `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const input: SendRequest = await req.json();

    if (!input.number || !input.message) {
      return new Response(JSON.stringify({ error: "number and message are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const cleanNum = cleanNumber(input.number);
    const category = input.category || "manual";

    // Load active API configs sorted by sort_order
    const { data: configs } = await supabase
      .from("whatsapp_api_configs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!configs || configs.length === 0) {
      // Fallback: try legacy app_settings
      const { data: settings } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["whatsapp_instance_id", "whatsapp_access_token"]);

      let instanceId = "", accessToken = "";
      if (settings) {
        for (const r of settings) {
          if (r.key === "whatsapp_instance_id") instanceId = r.value;
          if (r.key === "whatsapp_access_token") accessToken = r.value;
        }
      }

      if (!instanceId || !accessToken) {
        return new Response(JSON.stringify({ error: "No WhatsApp API configured" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use legacy config
      const legacyConfig: ApiConfig = {
        id: "legacy", label: "Legacy", api_url: "https://chat2me.in/api/send",
        api_method: "POST", api_token: accessToken, instance_id: instanceId,
        sender_number: "", sort_order: 0, is_active: true, failure_count: 0, total_sent: 0,
      };

      const result = await sendViaApi(legacyConfig, { number: cleanNum, message: input.message, type: input.type || "text", media_url: input.media_url, filename: input.filename });

      // Log
      await supabase.from("whatsapp_logs").insert({
        user_id: input.user_id || null,
        user_name: input.user_name || null,
        whatsapp_number: cleanNum,
        category,
        channel: "Legacy",
        message_content: input.message.substring(0, 500),
        delivery_status: result.ok ? "sent" : "failed",
        error_message: result.ok ? null : result.error,
      });

      if (result.ok) {
        return new Response(JSON.stringify({ success: true, channel: "Legacy" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "All APIs failed", details: result.error }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Multi-API with failover
    let sent = false;
    let usedChannel = "";
    let lastError = "";

    for (const config of configs as ApiConfig[]) {
      const result = await sendViaApi(config, {
        number: cleanNum,
        message: input.message,
        type: input.type || "text",
        media_url: input.media_url,
        filename: input.filename,
      });

      if (result.ok) {
        sent = true;
        usedChannel = config.label;

        // Update success stats
        await supabase.from("whatsapp_api_configs").update({
          total_sent: (config.total_sent || 0) + 1,
          failure_count: 0,
          health_status: "connected",
          updated_at: new Date().toISOString(),
        }).eq("id", config.id);

        break;
      } else {
        lastError = result.error || "Unknown";
        const newFailCount = (config.failure_count || 0) + 1;
        const newStatus = newFailCount >= 3 ? "disconnected" : newFailCount >= 2 ? "degraded" : config.health_status;

        await supabase.from("whatsapp_api_configs").update({
          failure_count: newFailCount,
          health_status: newStatus,
          last_failure_at: new Date().toISOString(),
          is_active: newFailCount >= 5 ? false : config.is_active,
          updated_at: new Date().toISOString(),
        }).eq("id", config.id);

        console.error(`API ${config.label} failed:`, result.error);
      }
    }

    // Log the attempt
    await supabase.from("whatsapp_logs").insert({
      user_id: input.user_id || null,
      user_name: input.user_name || null,
      whatsapp_number: cleanNum,
      category,
      channel: usedChannel || "ALL_FAILED",
      message_content: input.message.substring(0, 500),
      delivery_status: sent ? "sent" : "failed",
      error_message: sent ? null : lastError,
    });

    if (sent) {
      return new Response(JSON.stringify({ success: true, channel: usedChannel }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "All WhatsApp APIs failed", last_error: lastError }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("send-whatsapp error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
