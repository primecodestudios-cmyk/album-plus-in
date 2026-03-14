import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify sync secret
    const authHeader = req.headers.get("x-sync-secret");
    const syncSecret = Deno.env.get("SYNC_API_SECRET");
    
    if (!syncSecret || authHeader !== syncSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { action, users } = body;

    // Action: sync_users — bulk sync from MySQL
    if (action === "sync_users" && Array.isArray(users)) {
      const results = { created: 0, updated: 0, errors: [] as string[] };

      for (const u of users) {
        try {
          // MySQL fields: id, pcId, subStart, subEnd, userName, studioName, mobile, email, city, address
          const email = u.email?.trim();
          if (!email) {
            results.errors.push(`Skipped: no email for user id=${u.id}`);
            continue;
          }

          // Check if user already exists in auth
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find((eu: any) => eu.email === email);

          let userId: string;

          if (existingUser) {
            userId = existingUser.id;
            results.updated++;
          } else {
            // Create user in auth with a random password (they'll need to reset)
            const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
            const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
              email,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                full_name: u.userName || u.studioName || "",
                phone: u.mobile || "",
              },
            });

            if (authError || !newUser.user) {
              results.errors.push(`Auth error for ${email}: ${authError?.message}`);
              continue;
            }
            userId = newUser.user.id;
            results.created++;
          }

          // Upsert profile
          await supabase.from("profiles").upsert({
            user_id: userId,
            full_name: u.userName || u.studioName || "",
            phone: u.mobile || "",
          }, { onConflict: "user_id" });

          // If user has active subscription (subEnd > now), create license
          if (u.subEnd && u.pcId) {
            const subEnd = new Date(u.subEnd);
            if (subEnd > new Date()) {
              // Check if license already exists for this device
              const { data: existingLic } = await supabase
                .from("user_licenses")
                .select("id")
                .eq("user_id", userId)
                .eq("device_id", u.pcId)
                .maybeSingle();

              if (!existingLic) {
                const subStart = u.subStart ? new Date(u.subStart) : new Date();
                const daysDiff = Math.ceil((subEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                let planName = "28 Days";
                if (daysDiff > 300) planName = "1 Year";
                else if (daysDiff > 150) planName = "6 Months";
                else if (daysDiff > 60) planName = "3 Months";

                await supabase.from("user_licenses").insert({
                  user_id: userId,
                  device_id: u.pcId,
                  plan_name: planName,
                  starts_at: subStart.toISOString(),
                  expires_at: subEnd.toISOString(),
                  is_active: true,
                });
              }
            }
          }
        } catch (err: any) {
          results.errors.push(`Error processing ${u.email}: ${err.message}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Action: sync_single — sync one user (for real-time PHP webhook)
    if (action === "sync_single" && body.user) {
      const u = body.user;
      const email = u.email?.trim();
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((eu: any) => eu.email === email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        const tempPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: u.userName || u.studioName || "",
            phone: u.mobile || "",
          },
        });
        if (error || !newUser.user) {
          return new Response(
            JSON.stringify({ success: false, error: error?.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        userId = newUser.user.id;
      }

      await supabase.from("profiles").upsert({
        user_id: userId,
        full_name: u.userName || u.studioName || "",
        phone: u.mobile || "",
      }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({ success: true, user_id: userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action. Use sync_users or sync_single" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
