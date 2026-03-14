import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Upload, UserPlus, Zap, Globe, CheckCircle2, AlertCircle } from "lucide-react";

const SYNC_URL_KEY = "albumplus_sync_url";

export function AdminSyncUsers() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // PHP Sync URL
  const [syncUrl, setSyncUrl] = useState(() => localStorage.getItem(SYNC_URL_KEY) || "");
  const [editingUrl, setEditingUrl] = useState(false);

  // Single user sync form
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pcId, setPcId] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [singleSyncing, setSingleSyncing] = useState(false);

  // DB stats
  const [dbStats, setDbStats] = useState<{ cpanel: number; auth: number; profiles: number } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [cpanel, profiles] = await Promise.all([
      supabase.from("cpanel_user_data").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);
    setDbStats({
      cpanel: cpanel.count || 0,
      auth: profiles.count || 0, // approximate
      profiles: profiles.count || 0,
    });
  };

  const handleSaveSyncUrl = () => {
    localStorage.setItem(SYNC_URL_KEY, syncUrl.trim());
    setEditingUrl(false);
    toast({ title: "Sync URL saved" });
  };

  const handleTriggerSync = async () => {
    if (!syncUrl.trim()) {
      toast({ title: "Set your PHP sync URL first", variant: "destructive" });
      setEditingUrl(true);
      return;
    }

    setSyncStatus("syncing");
    setSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch(syncUrl.trim(), {
        method: "GET",
        mode: "no-cors",
      });

      // With no-cors we can't read the response, but the request was sent
      toast({
        title: "Sync triggered!",
        description: "The PHP script has been called. It may take 1-2 minutes for all users to sync. Refresh stats to check progress.",
      });
      setSyncStatus("success");

      // Refresh stats after a delay
      setTimeout(() => fetchStats(), 5000);
      setTimeout(() => fetchStats(), 15000);
      setTimeout(() => fetchStats(), 30000);
    } catch (err: any) {
      setSyncStatus("error");
      toast({
        title: "Could not reach sync URL",
        description: "Make sure the URL is correct and your cPanel server is accessible. Error: " + err.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncSingle = async () => {
    if (!email.trim()) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }
    setSingleSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-users", {
        body: {
          action: "sync_single",
          user: {
            email: email.trim(),
            userName: userName.trim(),
            mobile: mobile.trim(),
            pcId: pcId.trim(),
            subEnd: subEnd || undefined,
          },
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({ title: "User synced successfully", description: `User ID: ${data.user_id}` });
        setEmail("");
        setUserName("");
        setMobile("");
        setPcId("");
        setSubEnd("");
        fetchStats();
      } else {
        toast({ title: "Sync failed", description: data?.error || "Unknown error", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSingleSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Sync Users</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Sync users from your cPanel MySQL database or add individual users manually.
        </p>
      </div>

      {/* DB Stats */}
      {dbStats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-primary">{dbStats.cpanel}</div>
            <div className="text-xs text-muted-foreground">Synced Users (cPanel)</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card text-center">
            <div className="text-2xl font-bold text-accent">{dbStats.profiles}</div>
            <div className="text-xs text-muted-foreground">Total Profiles</div>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card text-center">
            <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
              <RefreshCw size={14} /> Refresh Stats
            </Button>
          </div>
        </div>
      )}

      {/* Manual Bulk Sync Trigger */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={20} className="text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Manual Bulk Sync</h3>
          {syncStatus === "success" && <CheckCircle2 size={16} className="text-green-500" />}
          {syncStatus === "error" && <AlertCircle size={16} className="text-destructive" />}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Trigger the PHP sync script on your cPanel server to pull all users into the admin panel.
        </p>

        {/* Sync URL Config */}
        <div className="mb-4">
          <Label htmlFor="sync-url" className="flex items-center gap-1.5 mb-1.5">
            <Globe size={14} />
            PHP Sync Script URL
          </Label>
          {editingUrl || !syncUrl ? (
            <div className="flex gap-2">
              <Input
                id="sync-url"
                value={syncUrl}
                onChange={(e) => setSyncUrl(e.target.value)}
                placeholder="https://yourdomain.com/albumplus/sync_users.php"
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveSyncUrl} disabled={!syncUrl.trim()}>
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-1.5 rounded-lg text-xs text-muted-foreground flex-1 truncate">
                {syncUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setEditingUrl(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleTriggerSync}
          disabled={syncing || !syncUrl.trim()}
          className="gap-2 bg-gradient-gold text-accent-foreground shadow-gold hover:opacity-90"
          size="lg"
        >
          {syncing ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Zap size={18} />
          )}
          {syncing ? "Syncing from cPanel..." : "🔄 Trigger Bulk Sync Now"}
        </Button>

        {syncStatus === "success" && (
          <p className="text-xs text-green-600 mt-2">
            ✅ Sync triggered! Stats will auto-refresh. Check the Users tab in ~30 seconds.
          </p>
        )}
      </div>

      {/* Single User Sync */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">Add / Sync Single User</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="sync-email">Email *</Label>
            <Input id="sync-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
          </div>
          <div>
            <Label htmlFor="sync-name">Name</Label>
            <Input id="sync-name" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name or studio name" />
          </div>
          <div>
            <Label htmlFor="sync-mobile">Mobile</Label>
            <Input id="sync-mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div>
            <Label htmlFor="sync-pcid">Device / PC ID</Label>
            <Input id="sync-pcid" value={pcId} onChange={(e) => setPcId(e.target.value)} placeholder="PC ID (optional)" />
          </div>
          <div>
            <Label htmlFor="sync-subend">Subscription End Date</Label>
            <Input id="sync-subend" type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleSyncSingle} disabled={singleSyncing} className="gap-2">
          {singleSyncing ? <RefreshCw size={16} className="animate-spin" /> : <UserPlus size={16} />}
          {singleSyncing ? "Syncing..." : "Sync User"}
        </Button>
      </div>

      {/* API Reference */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-accent" />
          <h3 className="font-display text-lg font-semibold text-foreground">API Reference</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Your PHP script should POST to the sync API endpoint with the configured secret.
        </p>
        <div className="bg-muted/50 rounded-xl p-4 text-xs font-mono text-muted-foreground">
          POST https://nnlrtacjnbgjqmndllfs.supabase.co/functions/v1/sync-users<br />
          Header: x-sync-secret: YOUR_SECRET<br />
          Body: {"{"} "action": "sync_users", "users": [...] {"}"}
        </div>
      </div>

      {/* Sync Results */}
      {syncResult && (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <h3 className="font-display text-lg font-semibold text-foreground mb-3">Last Sync Results</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="text-2xl font-bold text-primary">{syncResult.created}</div>
              <div className="text-xs text-muted-foreground">Created</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="text-2xl font-bold text-accent">{syncResult.updated}</div>
              <div className="text-xs text-muted-foreground">Updated</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="text-2xl font-bold text-destructive">{syncResult.errors?.length ?? 0}</div>
              <div className="text-xs text-muted-foreground">Errors</div>
            </div>
          </div>
          {syncResult.errors?.length > 0 && (
            <div className="mt-4 max-h-40 overflow-y-auto text-xs text-destructive space-y-1">
              {syncResult.errors.map((e: string, i: number) => (
                <div key={i}>• {e}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
