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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // === LIST USERS with all cPanel data ===
    if (action === "list_users") {
      const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });
      if (authErr) throw authErr;

      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");
      const { data: cpanelData } = await supabaseAdmin.from("cpanel_user_data").select("*");
      const { data: licenses } = await supabaseAdmin
        .from("user_licenses")
        .select("*")
        .order("expires_at", { ascending: false });

      const userMap = (authUsers?.users || []).map((au: any) => {
        const profile = profiles?.find((p: any) => p.user_id === au.id);
        const cpanel = cpanelData?.find((c: any) => c.user_id === au.id);
        const userLicenses = licenses?.filter((l: any) => l.user_id === au.id) || [];
        const activeLicense = userLicenses.find(
          (l: any) => l.is_active && new Date(l.expires_at) > new Date()
        );
        const isBanned = au.banned_until && new Date(au.banned_until) > new Date();

        // Calculate days left
        let daysLeft: number | null = null;
        if (cpanel?.sub_end) {
          daysLeft = Math.ceil(
            (new Date(cpanel.sub_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
        } else if (activeLicense?.expires_at) {
          daysLeft = Math.ceil(
            (new Date(activeLicense.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
        }

        return {
          id: au.id,
          email: au.email,
          full_name: profile?.full_name || cpanel?.studio_name || "",
          phone: profile?.phone || "",
          created_at: au.created_at,
          has_active_license: !!activeLicense,
          active_license: activeLicense || null,
          licenses_count: userLicenses.length,
          is_blocked: !!(cpanel?.block_user === 1) || !!isBanned,
          days_left: daysLeft,
          // cPanel specific fields
          cpanel_id: cpanel?.cpanel_id || null,
          pc_id: cpanel?.pc_id || "",
          sub_start: cpanel?.sub_start || null,
          sub_end: cpanel?.sub_end || null,
          short_name: cpanel?.short_name || "",
          studio_name: cpanel?.studio_name || "",
          city: cpanel?.city || "",
          address: cpanel?.address || "",
          activation: cpanel?.activation ?? 0,
          block_user: cpanel?.block_user ?? 0,
          running_version: cpanel?.running_version || "",
          system_info: cpanel?.system_info || "",
          cpanel_created: cpanel?.cpanel_created || "",
          note1: cpanel?.note1 || "",
          note2: cpanel?.note2 || "",
        };
      });

      return new Response(JSON.stringify({ success: true, users: userMap }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DELETE USER ===
    if (action === "delete_user" && body.user_id) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      await supabaseAdmin.from("profiles").delete().eq("user_id", body.user_id);
      await supabaseAdmin.from("user_licenses").delete().eq("user_id", body.user_id);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", body.user_id);
      await supabaseAdmin.from("cpanel_user_data").delete().eq("user_id", body.user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTIVATE USER (set activation=1) ===
    if (action === "activate_user" && body.user_id) {
      await supabaseAdmin
        .from("cpanel_user_data")
        .update({ activation: 1 })
        .eq("user_id", body.user_id);
      // Also activate any licenses
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: true })
        .eq("user_id", body.user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DEACTIVATE USER (set activation=0) ===
    if (action === "deactivate_user" && body.user_id) {
      await supabaseAdmin
        .from("cpanel_user_data")
        .update({ activation: 0 })
        .eq("user_id", body.user_id);
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: false })
        .eq("user_id", body.user_id)
        .eq("is_active", true);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === BLOCK USER (set block_user=1) ===
    if (action === "block_user" && body.user_id) {
      await supabaseAdmin
        .from("cpanel_user_data")
        .update({ block_user: 1, activation: 0 })
        .eq("user_id", body.user_id);
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: false })
        .eq("user_id", body.user_id);
      await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
        ban_duration: "876000h",
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === UNBLOCK USER ===
    if (action === "unblock_user" && body.user_id) {
      await supabaseAdmin
        .from("cpanel_user_data")
        .update({ block_user: 0 })
        .eq("user_id", body.user_id);
      await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
        ban_duration: "none",
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === UPDATE PROFILE ===
    if (action === "update_profile" && body.user_id) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: body.full_name ?? undefined,
          phone: body.phone ?? undefined,
        })
        .eq("user_id", body.user_id);
      if (error) throw error;

      // Update cpanel_user_data too
      const cpanelUpdate: any = {};
      if (body.studio_name !== undefined) cpanelUpdate.studio_name = body.studio_name;
      if (body.city !== undefined) cpanelUpdate.city = body.city;
      if (body.address !== undefined) cpanelUpdate.address = body.address;
      if (body.note1 !== undefined) cpanelUpdate.note1 = body.note1;
      if (body.note2 !== undefined) cpanelUpdate.note2 = body.note2;

      if (Object.keys(cpanelUpdate).length > 0) {
        await supabaseAdmin
          .from("cpanel_user_data")
          .update(cpanelUpdate)
          .eq("user_id", body.user_id);
      }

      if (body.email) {
        await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
          email: body.email,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === EXPIRING USERS ===
    if (action === "expiring_users") {
      const days = body.days || 15;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

      const { data: cpanelUsers } = await supabaseAdmin
        .from("cpanel_user_data")
        .select("*")
        .gt("sub_end", new Date().toISOString())
        .lte("sub_end", cutoff.toISOString())
        .order("sub_end", { ascending: true });

      if (!cpanelUsers?.length) {
        // Fall back to user_licenses
        const { data: licenses } = await supabaseAdmin
          .from("user_licenses")
          .select("*")
          .eq("is_active", true)
          .gt("expires_at", new Date().toISOString())
          .lte("expires_at", cutoff.toISOString())
          .order("expires_at", { ascending: true });

        if (!licenses?.length) {
          return new Response(JSON.stringify({ success: true, users: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const userIds = [...new Set(licenses.map((l: any) => l.user_id))];
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);

        const result = licenses.map((l: any) => {
          const profile = profiles?.find((p: any) => p.user_id === l.user_id);
          const daysLeft = Math.ceil(
            (new Date(l.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return {
            ...l,
            full_name: profile?.full_name || "",
            phone: profile?.phone || "",
            days_left: daysLeft,
          };
        });

        return new Response(JSON.stringify({ success: true, users: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use cpanel data
      const userIds = cpanelUsers.map((c: any) => c.user_id);
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, full_name, phone")
        .in("user_id", userIds);

      const result = cpanelUsers.map((c: any) => {
        const profile = profiles?.find((p: any) => p.user_id === c.user_id);
        const daysLeft = Math.ceil(
          (new Date(c.sub_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return {
          user_id: c.user_id,
          full_name: profile?.full_name || c.studio_name || "",
          phone: profile?.phone || "",
          studio_name: c.studio_name,
          plan_name: c.pc_id ? "Subscription" : "—",
          expires_at: c.sub_end,
          days_left: daysLeft,
        };
      });

      return new Response(JSON.stringify({ success: true, users: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
