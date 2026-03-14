import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Upload, UserPlus } from "lucide-react";

export function AdminSyncUsers() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Single user sync form
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [mobile, setMobile] = useState("");
  const [pcId, setPcId] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [singleSyncing, setSingleSyncing] = useState(false);

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
          Sync users from your legacy MySQL database or add individual users manually.
        </p>
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

      {/* Bulk Sync Info */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Upload size={20} className="text-accent" />
          <h3 className="font-display text-lg font-semibold text-foreground">Bulk Sync (via PHP Script)</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          To bulk-sync all users from your MySQL database, run the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">sync_to_lovable.php</code> script on your cPanel server. 
          It will send all users to the sync API in batches.
        </p>
        <div className="bg-muted/50 rounded-xl p-4 text-xs font-mono text-muted-foreground">
          POST /functions/v1/sync-users<br />
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
