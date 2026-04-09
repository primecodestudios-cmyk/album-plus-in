import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, RefreshCw, Eye, EyeOff, Tag, Calendar } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";

interface Changelog {
  id: string;
  version: string;
  release_date: string;
  changes: string[];
  is_active: boolean;
  sort_order: number;
}

export function AdminChangelogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newChanges, setNewChanges] = useState("");
  const [adding, setAdding] = useState(false);

  const [editLog, setEditLog] = useState<Changelog | null>(null);
  const [editVersion, setEditVersion] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editChanges, setEditChanges] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchLogs = async () => {
    const { data } = await supabase.from("changelogs").select("*").order("sort_order");
    if (data) setLogs(data as unknown as Changelog[]);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const parseChanges = (text: string) => text.split("\n").map(s => s.trim()).filter(Boolean);

  const handleAdd = async () => {
    if (!newVersion.trim() || !newDate) {
      toast({ title: "Version and date required", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("changelogs").insert({
      version: newVersion,
      release_date: newDate,
      changes: parseChanges(newChanges),
      sort_order: logs.length + 1,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changelog added!" });
      setShowAdd(false);
      setNewVersion(""); setNewDate(""); setNewChanges("");
      fetchLogs();
    }
    setAdding(false);
  };

  const handleOpenEdit = (l: Changelog) => {
    setEditLog(l);
    setEditVersion(l.version);
    setEditDate(l.release_date);
    setEditChanges(l.changes.join("\n"));
  };

  const handleSaveEdit = async () => {
    if (!editLog) return;
    setEditSaving(true);
    const { error } = await supabase.from("changelogs").update({
      version: editVersion,
      release_date: editDate,
      changes: parseChanges(editChanges),
    } as any).eq("id", editLog.id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Changelog updated!" });
      setEditLog(null);
      fetchLogs();
    }
    setEditSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("changelogs").update({ is_active: !current } as any).eq("id", id);
    fetchLogs();
    toast({ title: current ? "Hidden" : "Visible" });
  };

  const handleDelete = async (id: string, version: string) => {
    if (!confirm(`Delete v${version}?`)) return;
    await supabase.from("changelogs").delete().eq("id", id);
    fetchLogs();
    toast({ title: "Deleted" });
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Changelogs</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchLogs} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl">
            <Plus size={16} /> Add Version
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`bg-card rounded-2xl border p-4 shadow-card transition-all ${log.is_active ? "border-border" : "border-destructive/30 opacity-60"}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-bold">
                  <Tag size={10} /> v{log.version}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(log.release_date).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="ghost" onClick={() => toggleActive(log.id, log.is_active)} className="px-2">
                  {log.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleOpenEdit(log)} className="text-xs gap-1">
                  <Save size={12} /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(log.id, log.version)} className="text-destructive hover:text-destructive px-2">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
            <ul className="text-xs text-foreground/80 space-y-0.5 pl-2">
              {log.changes.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center text-muted-foreground py-12">No changelogs yet.</div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus size={18} /> Add Changelog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Version *</Label>
              <Input value={newVersion} onChange={(e) => setNewVersion(e.target.value)} placeholder="e.g., 1.2.0.0" />
            </div>
            <div>
              <Label>Release Date *</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
            <div>
              <Label>Changes (one per line)</Label>
              <Textarea value={newChanges} onChange={(e) => setNewChanges(e.target.value)} placeholder="🔧 Bug Fixed: something&#10;✨ Added: new feature" rows={6} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAdd} disabled={adding} className="gap-2">
              {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditLog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Save size={18} /> Edit Changelog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Version</Label>
              <Input value={editVersion} onChange={(e) => setEditVersion(e.target.value)} />
            </div>
            <div>
              <Label>Release Date</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div>
              <Label>Changes (one per line)</Label>
              <Textarea value={editChanges} onChange={(e) => setEditChanges(e.target.value)} rows={6} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveEdit} disabled={editSaving} className="gap-2">
              {editSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
