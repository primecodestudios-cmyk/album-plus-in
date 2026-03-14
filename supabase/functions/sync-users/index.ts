import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sync-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Support secret from header OR body
    const headerSecret = (req.headers.get("x-sync-secret") || "").trim();
    const syncSecret = (Deno.env.get("SYNC_API_SECRET") || "").trim();
    
    // Clone request to peek at body for sync_secret
    const bodyText = await req.text();
    let bodyJson: any = {};
    try { bodyJson = JSON.parse(bodyText); } catch {}
    const bodySecret = (bodyJson?.sync_secret || "").trim();
    
    const secretMatch = (headerSecret === syncSecret) || (bodySecret === syncSecret);
    console.log("Sync request received, secret match:", secretMatch, "header:", !!headerSecret, "body:", !!bodySecret);

    if (!syncSecret || !secretMatch) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = bodyJson;
    const { action } = body;

    console.log("Action:", action, "Users count:", body.users?.length || 0);

    // Helper: find user by email across all pages
    async function findUserByEmail(email: string) {
      let page = 1;
      const perPage = 500;
      while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error || !data?.users?.length) return null;
        const found = data.users.find((u: any) => u.email === email);
        if (found) return found;
        if (data.users.length < perPage) return null;
        page++;
      }
    }

    const pick = (...values: any[]) => values.find((v) => v !== undefined && v !== null && v !== "");
    const toInt = (value: any, fallback = 0) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    function normalizeCpanelUser(raw: any) {
      return {
        id: pick(raw.id, raw.cpanel_id, raw.cpanelId),
        email: (pick(raw.email, raw.mail) || "").toString().trim(),
        pcId: pick(raw.pcId, raw.pcid, raw.pc_id, raw.pcID, ""),
        subStart: pick(raw.subStart, raw.sub_start, null),
        subEnd: pick(raw.subEnd, raw.sub_end, null),
        userName: pick(raw.userName, raw.user_name, raw.username, ""),
        shortName: pick(raw.shortName, raw.short_name, ""),
        studioName: pick(raw.studioName, raw.studio_name, ""),
        mobile: pick(raw.mobile, raw.phone, ""),
        city: pick(raw.city, ""),
        address: pick(raw.address, ""),
        activation: toInt(pick(raw.activation, raw.activated), 0),
        blockUser: toInt(pick(raw.block_user, raw.blockedUser), 0),
        runningVersion: pick(raw.running_version, raw.runningVersion, ""),
        systemInfo: pick(raw.system_info, raw.systemInfo, ""),
        created: pick(raw.created, raw.cpanel_created, ""),
        note1: pick(raw.note1, ""),
        note2: pick(raw.note2, ""),
      };
    }

    // === BULK SYNC from cPanel ===
    if (action === "sync_users" && Array.isArray(body.users)) {
      const results = { created: 0, updated: 0, errors: [] as string[] };

      for (const rawUser of body.users) {
        try {
          const u = normalizeCpanelUser(rawUser);
          const email = u.email;

          if (!email) {
            results.errors.push(`Skipped: no email for cpanel id=${u.id ?? "unknown"}`);
            continue;
          }

          const existingUser = await findUserByEmail(email);
          let userId: string;

          if (existingUser) {
            userId = existingUser.id;
            results.updated++;
          } else {
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

          // Upsert cpanel_user_data with ALL fields
          await supabase.from("cpanel_user_data").upsert({
            user_id: userId,
            cpanel_id: toInt(u.id, 0) || null,
            pc_id: u.pcId || "",
            sub_start: u.subStart || null,
            sub_end: u.subEnd || null,
            short_name: u.shortName || "",
            studio_name: u.studioName || "",
            city: u.city || "",
            address: u.address || "",
            activation: u.activation,
            block_user: u.blockUser,
            running_version: u.runningVersion || "",
            system_info: u.systemInfo || "",
            cpanel_created: u.created || "",
            note1: u.note1 || "",
            note2: u.note2 || "",
          }, { onConflict: "user_id" });

          // If user has active subscription, create/update license
          if (u.subEnd && u.pcId) {
            const subEnd = new Date(u.subEnd);
            if (subEnd > new Date()) {
              const { data: existingLic } = await supabase
                .from("user_licenses")
                .select("id")
                .eq("user_id", userId)
                .eq("device_id", u.pcId)
                .maybeSingle();

              if (!existingLic) {
                const subStart = u.subStart ? new Date(u.subStart) : new Date();
                const daysDiff = Math.ceil((subEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
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
                  is_active: u.activation === 1,
                });
              }
            }
          }
        } catch (err: any) {
          const rawEmail = rawUser?.email || rawUser?.mail || "unknown";
          results.errors.push(`Error processing ${rawEmail}: ${err.message}`);
        }
      }

      console.log("Sync results:", JSON.stringify(results));

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === SINGLE USER SYNC ===
    if (action === "sync_single" && body.user) {
      const u = normalizeCpanelUser(body.user);
      const email = u.email;
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const existingUser = await findUserByEmail(email);
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

      await supabase.from("cpanel_user_data").upsert({
        user_id: userId,
        cpanel_id: toInt(u.id, 0) || null,
        pc_id: u.pcId || "",
        sub_start: u.subStart || null,
        sub_end: u.subEnd || null,
        short_name: u.shortName || "",
        studio_name: u.studioName || "",
        city: u.city || "",
        address: u.address || "",
        activation: u.activation,
        block_user: u.blockUser,
        running_version: u.runningVersion || "",
        system_info: u.systemInfo || "",
        cpanel_created: u.created || "",
        note1: u.note1 || "",
        note2: u.note2 || "",
      }, { onConflict: "user_id" });

      return new Response(
        JSON.stringify({ success: true, user_id: userId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Sync error:", err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
