import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldOff,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface ApiToken {
  id: string;
  name: string;
  token_preview: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  created_by: string;
}

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function AdminApiTokens() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Reveal token dialog (shown once after creation)
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Rotate dialog
  const [rotateTarget, setRotateTarget] = useState<ApiToken | null>(null);
  const [rotating, setRotating] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<ApiToken | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("api_tokens")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setTokens(data as unknown as ApiToken[]);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast({ title: "Token name is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const plainToken = generateToken();
      const hashed = await hashToken(plainToken);
      const preview = plainToken.slice(0, 6) + "..." + plainToken.slice(-4);

      const { error } = await supabase.from("api_tokens").insert({
        name: newName.trim(),
        token_hash: hashed,
        token_preview: preview,
        created_by: user?.id,
      } as any);

      if (error) throw error;

      setRevealedToken(plainToken);
      setShowCreate(false);
      setNewName("");
      fetchTokens();
      toast({ title: "Token created successfully" });
    } catch (err: any) {
      toast({ title: "Error creating token", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleRotate = async () => {
    if (!rotateTarget) return;
    setRotating(true);
    try {
      const plainToken = generateToken();
      const hashed = await hashToken(plainToken);
      const preview = plainToken.slice(0, 6) + "..." + plainToken.slice(-4);

      const { error } = await supabase
        .from("api_tokens")
        .update({ token_hash: hashed, token_preview: preview } as any)
        .eq("id", rotateTarget.id);

      if (error) throw error;

      setRotateTarget(null);
      setRevealedToken(plainToken);
      fetchTokens();
      toast({ title: "Token rotated successfully" });
    } catch (err: any) {
      toast({ title: "Error rotating token", description: err.message, variant: "destructive" });
    } finally {
      setRotating(false);
    }
  };

  const handleToggleActive = async (token: ApiToken) => {
    const { error } = await supabase
      .from("api_tokens")
      .update({ is_active: !token.is_active } as any)
      .eq("id", token.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchTokens();
      toast({ title: token.is_active ? "Token deactivated" : "Token activated" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("api_tokens").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      setDeleteTarget(null);
      fetchTokens();
      toast({ title: "Token deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">API Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Manage API tokens for cPanel sync and external integrations.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={16} /> Create Token
        </Button>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading tokens...</div>
      ) : tokens.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-card">
          <Key size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No API tokens created yet.</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 gap-2" variant="outline">
            <Plus size={14} /> Create your first token
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className={`bg-card rounded-2xl border p-5 shadow-card transition-all ${
                token.is_active ? "border-border" : "border-destructive/20 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${token.is_active ? "bg-primary/10" : "bg-muted"}`}>
                    <Key size={18} className={token.is_active ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{token.name}</span>
                      <Badge variant={token.is_active ? "default" : "secondary"}>
                        {token.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <code className="bg-muted px-2 py-0.5 rounded">{token.token_preview}</code>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Created {new Date(token.created_at).toLocaleDateString()}
                      </span>
                      {token.last_used_at && (
                        <span>Last used {new Date(token.last_used_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(token)}
                    className="gap-1.5"
                    title={token.is_active ? "Deactivate" : "Activate"}
                  >
                    {token.is_active ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                    {token.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotateTarget(token)}
                    className="gap-1.5"
                    title="Rotate token"
                  >
                    <RefreshCw size={14} /> Rotate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(token)}
                    className="text-destructive hover:text-destructive gap-1.5"
                    title="Delete token"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Token Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Token</DialogTitle>
            <DialogDescription>
              Create a new API token for external integrations like cPanel sync.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., alplumplus, cpanel-sync"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <RefreshCw size={14} className="animate-spin" /> : <Key size={14} />}
              Generate Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revealed Token Dialog */}
      <Dialog open={!!revealedToken} onOpenChange={() => setRevealedToken(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔑 Your New API Token</DialogTitle>
            <DialogDescription>
              Copy this token now — it won't be shown again! Use it as the{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">x-sync-secret</code> header in your PHP script.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted rounded-xl p-4 font-mono text-sm break-all text-foreground">
            {revealedToken}
          </div>
          <DialogFooter>
            <Button
              onClick={() => revealedToken && copyToClipboard(revealedToken)}
              className="gap-2 w-full"
              variant={copied ? "secondary" : "default"}
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy Token"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate Confirmation Dialog */}
      <Dialog open={!!rotateTarget} onOpenChange={() => setRotateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rotate Token: {rotateTarget?.name}</DialogTitle>
            <DialogDescription>
              This will generate a new token value. The old token will stop working immediately.
              Update your PHP script with the new token.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleRotate} disabled={rotating} variant="destructive" className="gap-2">
              {rotating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Rotate Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Token: {deleteTarget?.name}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Any integrations using this token will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting} variant="destructive" className="gap-2">
              {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
