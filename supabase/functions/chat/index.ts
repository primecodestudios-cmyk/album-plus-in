import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Album Plus AI Assistant — a friendly, knowledgeable customer support chatbot for Album Plus, India's #1 wedding album designing software.

About Album Plus:
- Wedding album designing software for photographers
- Compatible with Adobe Photoshop CS3 to CC 2026 (Windows only, Mac planned)
- Features: smart automation tools, PSD template conversion, 500+ templates
- Free demo version available with limited features

License & Activation:
- License key format: ALBM-XXXX-XXXX-XXXX
- Each license is bound to one device
- Activation: Go to Activate License page → enter key + device ID → click Activate
- License expires → software switches to demo mode
- Lost key? Check dashboard or contact support

Pricing & Payment:
- Accepts UPI, credit/debit cards, net banking, wallets
- No refunds on digital products (recommend trying demo first)
- Plan upgrades available via support

Technical:
- Minimum: 4GB RAM, dual-core processor
- Run installer as Administrator if issues
- Updates from Downloads page preserve settings

Support Contacts:
- WhatsApp: +91 88830 81855
- Sales: +91 88709 97799
- Email: support@albumplus.in
- Hours: Mon–Sat, 10 AM – 6 PM IST

Guidelines:
- Be concise, friendly, and helpful
- Answer in the same language the user writes in (Hindi, Tamil, English, etc.)
- If you don't know something, direct them to WhatsApp or email support
- Never make up pricing or feature details
- Use markdown formatting for clarity`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
