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

    // Helper: reverse sync status changes to cPanel MySQL
    async function syncToCpanel(userId: string, updates: Record<string, any>) {
      const cpanelSyncUrl = Deno.env.get("CPANEL_SYNC_URL");
      if (!cpanelSyncUrl) {
        console.log("CPANEL_SYNC_URL not configured, skipping reverse sync");
        return null;
      }
      try {
        const { data: cpanelRow } = await supabaseAdmin
          .from("cpanel_user_data")
          .select("cpanel_id, pc_id")
          .eq("user_id", userId)
          .maybeSingle();
        const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (!cpanelRow?.cpanel_id && !authUser?.email) return null;
        const syncPayload = {
          action: "update_subscription",
          cpanel_id: cpanelRow?.cpanel_id || null,
          email: authUser?.email || "",
          pc_id: cpanelRow?.pc_id || "",
          sync_secret: Deno.env.get("SYNC_API_SECRET") || "",
          ...updates,
        };
        console.log("Reverse sync to cPanel:", JSON.stringify({ cpanel_id: syncPayload.cpanel_id, updates }));
        const resp = await fetch(cpanelSyncUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(syncPayload),
        });
        const result = await resp.text();
        console.log("cPanel sync response:", result);
        return result;
      } catch (err: any) {
        console.error("cPanel reverse sync error:", err.message);
        return `Error: ${err.message}`;
      }
    }

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

      // Group all cpanel entries by email/phone for multi-PC tracking
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

        // Collect all devices (from licenses with different device_ids)
        const deviceMap = new Map<string, any>();
        for (const lic of userLicenses) {
          if (lic.device_id && !deviceMap.has(lic.device_id)) {
            deviceMap.set(lic.device_id, {
              device_id: lic.device_id,
              plan_name: lic.plan_name,
              is_active: lic.is_active,
              expires_at: lic.expires_at,
              starts_at: lic.starts_at,
              license_id: lic.id,
            });
          }
        }
        // Also add cpanel pc_id if not already there
        if (cpanel?.pc_id && !deviceMap.has(cpanel.pc_id)) {
          deviceMap.set(cpanel.pc_id, {
            device_id: cpanel.pc_id,
            system_info: cpanel.system_info || "",
            running_version: cpanel.running_version || "",
            is_active: cpanel.activation === 1,
            plan_name: activeLicense?.plan_name || "—",
            expires_at: cpanel.sub_end || activeLicense?.expires_at || null,
            starts_at: cpanel.sub_start || activeLicense?.starts_at || null,
          });
        }

        return {
          id: au.id,
          email: au.email,
          full_name: profile?.full_name || cpanel?.studio_name || "",
          phone: profile?.phone || "",
          created_at: au.created_at,
          has_active_license: !!activeLicense,
          active_license: activeLicense || null,
          all_licenses: userLicenses,
          licenses_count: userLicenses.length,
          devices: Array.from(deviceMap.values()),
          devices_count: deviceMap.size,
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

      // Compute activation count stats
      const pcCountMap: Record<number, number> = {};
      for (const u of userMap) {
        const count = u.devices_count;
        if (count > 0) {
          pcCountMap[count] = (pcCountMap[count] || 0) + 1;
        }
      }

      return new Response(JSON.stringify({ success: true, users: userMap, pc_activation_stats: pcCountMap }), {
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
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: true })
        .eq("user_id", body.user_id);
      const cpSync = await syncToCpanel(body.user_id, { activation: 1 });
      return new Response(JSON.stringify({ success: true, cpanel_sync: cpSync }), {
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
      const cpSync = await syncToCpanel(body.user_id, { activation: 0 });
      return new Response(JSON.stringify({ success: true, cpanel_sync: cpSync }), {
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
      const cpSync = await syncToCpanel(body.user_id, { activation: 0, block_user: 1 });
      return new Response(JSON.stringify({ success: true, cpanel_sync: cpSync }), {
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
      const cpSync = await syncToCpanel(body.user_id, { block_user: 0 });
      return new Response(JSON.stringify({ success: true, cpanel_sync: cpSync }), {
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

    // === UPDATE SUBSCRIPTION ===
    if (action === "update_subscription" && body.user_id) {
      const { sub_start, sub_end, plan_name, is_enabled } = body;

      // Update cpanel_user_data subscription dates
      const cpanelUpdate: any = {};
      if (sub_start !== undefined) cpanelUpdate.sub_start = sub_start;
      if (sub_end !== undefined) cpanelUpdate.sub_end = sub_end;
      if (is_enabled !== undefined) cpanelUpdate.activation = is_enabled ? 1 : 0;

      if (Object.keys(cpanelUpdate).length > 0) {
        await supabaseAdmin
          .from("cpanel_user_data")
          .update(cpanelUpdate)
          .eq("user_id", body.user_id);
      }

      // Update active license if exists
      if (body.license_id) {
        const licUpdate: any = {};
        if (sub_start !== undefined) licUpdate.starts_at = sub_start;
        if (sub_end !== undefined) licUpdate.expires_at = sub_end;
        if (plan_name !== undefined) licUpdate.plan_name = plan_name;
        if (is_enabled !== undefined) licUpdate.is_active = is_enabled;

        if (Object.keys(licUpdate).length > 0) {
          await supabaseAdmin
            .from("user_licenses")
            .update(licUpdate)
            .eq("id", body.license_id);
        }
      } else {
        // Update all active licenses for this user
        const licUpdate: any = {};
        if (sub_start !== undefined) licUpdate.starts_at = sub_start;
        if (sub_end !== undefined) licUpdate.expires_at = sub_end;
        if (plan_name !== undefined) licUpdate.plan_name = plan_name;
        if (is_enabled !== undefined) licUpdate.is_active = is_enabled;

        if (Object.keys(licUpdate).length > 0) {
          await supabaseAdmin
            .from("user_licenses")
            .update(licUpdate)
            .eq("user_id", body.user_id);
        }
      }

      // Reverse sync to cPanel MySQL
      const syncUpdates: Record<string, any> = {};
      if (sub_start) syncUpdates.sub_start = sub_start;
      if (sub_end) syncUpdates.sub_end = sub_end;
      if (is_enabled !== undefined) syncUpdates.activation = is_enabled ? 1 : 0;
      const cpSync = await syncToCpanel(body.user_id, syncUpdates);

      return new Response(JSON.stringify({ success: true, cpanel_sync: cpSync }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DEACTIVATE DEVICE (specific license) ===
    if (action === "deactivate_device" && body.license_id) {
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: false })
        .eq("id", body.license_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTIVATE DEVICE (specific license) ===
    if (action === "activate_device" && body.license_id) {
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: true })
        .eq("id", body.license_id);
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

    // === EXPIRED USERS ===
    if (action === "expired_users") {
      const { data: cpanelUsers } = await supabaseAdmin
        .from("cpanel_user_data")
        .select("*")
        .lt("sub_end", new Date().toISOString())
        .order("sub_end", { ascending: false })
        .limit(50);

      const userIds = (cpanelUsers || []).map((c: any) => c.user_id);
      let profiles: any[] = [];
      if (userIds.length) {
        const { data } = await supabaseAdmin
          .from("profiles")
          .select("user_id, full_name, phone")
          .in("user_id", userIds);
        profiles = data || [];
      }

      const result = (cpanelUsers || []).map((c: any) => {
        const profile = profiles.find((p: any) => p.user_id === c.user_id);
        const daysLeft = Math.ceil(
          (new Date(c.sub_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return {
          user_id: c.user_id,
          full_name: profile?.full_name || c.studio_name || "",
          phone: profile?.phone || "",
          studio_name: c.studio_name,
          plan_name: "Expired",
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
