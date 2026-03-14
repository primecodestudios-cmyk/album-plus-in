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

    // Check admin role
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

    // LIST USERS with auth emails
    if (action === "list_users") {
      const { data: authUsers, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authErr) throw authErr;

      // Get profiles
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("*");

      // Get licenses
      const { data: licenses } = await supabaseAdmin
        .from("user_licenses")
        .select("*")
        .order("expires_at", { ascending: false });

      const userMap = (authUsers?.users || []).map((au: any) => {
        const profile = profiles?.find((p: any) => p.user_id === au.id);
        const userLicenses = licenses?.filter((l: any) => l.user_id === au.id) || [];
        const activeLicense = userLicenses.find(
          (l: any) => l.is_active && new Date(l.expires_at) > new Date()
        );
        const isBanned = au.banned_until && new Date(au.banned_until) > new Date();

        return {
          id: au.id,
          email: au.email,
          full_name: profile?.full_name || "",
          phone: profile?.phone || "",
          created_at: au.created_at,
          has_active_license: !!activeLicense,
          active_license: activeLicense || null,
          licenses_count: userLicenses.length,
          is_blocked: !!isBanned,
        };
      });

      return new Response(JSON.stringify({ success: true, users: userMap }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE USER
    if (action === "delete_user" && body.user_id) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(body.user_id);
      if (error) throw error;
      await supabaseAdmin.from("profiles").delete().eq("user_id", body.user_id);
      await supabaseAdmin.from("user_licenses").delete().eq("user_id", body.user_id);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", body.user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DEACTIVATE USER (set all active licenses to inactive)
    if (action === "deactivate_user" && body.user_id) {
      const { error } = await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: false })
        .eq("user_id", body.user_id)
        .eq("is_active", true);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // BLOCK USER (deactivate + ban from auth)
    if (action === "block_user" && body.user_id) {
      // Deactivate all licenses
      await supabaseAdmin
        .from("user_licenses")
        .update({ is_active: false })
        .eq("user_id", body.user_id);
      // Ban user in auth
      const { error } = await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
        ban_duration: "876000h", // ~100 years
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, status: "blocked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UNBLOCK USER
    if (action === "unblock_user" && body.user_id) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
        ban_duration: "none",
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE PROFILE
    if (action === "update_profile" && body.user_id) {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: body.full_name ?? undefined,
          phone: body.phone ?? undefined,
        })
        .eq("user_id", body.user_id);

      if (error) throw error;

      // Also update auth email if provided
      if (body.email) {
        await supabaseAdmin.auth.admin.updateUserById(body.user_id, {
          email: body.email,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET EXPIRING USERS (within N days)
    if (action === "expiring_users") {
      const days = body.days || 15;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + days);

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
