import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  ta: "Tamil (தமிழ்)",
  en: "English",
  hi: "Hindi (हिन्दी)",
  te: "Telugu (తెలుగు)",
  kn: "Kannada (ಕನ್ನಡ)",
  ml: "Malayalam (മലയാളം)",
};

const DEFAULT_PROMPT = `You are Album Plus AI Assistant — a friendly, knowledgeable customer support chatbot for Album Plus, India's #1 wedding album designing software.

About Album Plus:
- Wedding album designing software for photographers
- Compatible with Adobe Photoshop CS3 to CC 2026 (Windows only, Mac planned)
- Features: smart automation tools, PSD template conversion, 500+ templates
- Free demo version available with limited features

License & Activation:
- No serial key system — activation is done via login and admin approval
- Users register with their mobile number or email
- Registration is PENDING until manually activated by admin or upon payment
- Each license is bound to specific devices via hardware-based Device ID

Pricing & Payment:
- Accepts UPI, credit/debit cards, net banking, wallets
- Refund only if the software does NOT work on the user's system
- Otherwise, no refund (recommend trying demo first)
- Plan upgrades available via support

Support Contacts:
- WhatsApp: +91 88830 81855
- Sales: +91 88709 97799
- Email: support@albumplus.in
- Hours: Mon–Sat, 10 AM – 6 PM IST

If user asks for a demo, suggest visiting the Video Page.
If user asks about pricing, explain the available plans.
If user seems confused, suggest contacting support.
Always respond politely, even if the user is rude.
Use markdown formatting for clarity.`;

async function getSystemPrompt(): Promise<string> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "chatbot_system_prompt")
      .single();
    return data?.value || DEFAULT_PROMPT;
  } catch {
    return DEFAULT_PROMPT;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = await getSystemPrompt();

    // Add language instruction
    const langName = LANGUAGE_NAMES[language] || "English";
    const languageInstruction = `\n\nIMPORTANT: The user has selected "${langName}" as their preferred language. You MUST respond ONLY in ${langName}. Do not mix languages unless the user explicitly uses another language. Keep your entire response in ${langName}.`;

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
            { role: "system", content: systemPrompt + languageInstruction },
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
