import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, RefreshCw, Play, GripVertical, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
  sort_order: number;
  is_active: boolean;
  category: string;
}

const categoryOptions = [
  { value: "intro", label: "Introduction" },
  { value: "tutorial", label: "Tutorial" },
  { value: "demo", label: "Demo" },
  { value: "installation", label: "Installation" },
  { value: "error-fix", label: "Error Fixing" },
  { value: "activation", label: "Activation" },
  { value: "multi-camera", label: "Multi-Camera" },
];

export function AdminDemoVideos() {
  const { toast } = useToast();
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newYoutubeId, setNewYoutubeId] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newCategory, setNewCategory] = useState("tutorial");
  const [adding, setAdding] = useState(false);

  const [editVideo, setEditVideo] = useState<DemoVideo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editYoutubeId, setEditYoutubeId] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editCategory, setEditCategory] = useState("tutorial");
  const [editSaving, setEditSaving] = useState(false);

  const fetchVideos = async () => {
    const { data } = await supabase
      .from("demo_videos")
      .select("*")
      .order("sort_order");
    if (data) setVideos(data as unknown as DemoVideo[]);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  const extractYoutubeId = (input: string) => {
    // Accept full URL or just ID
    const match = input.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : input.trim();
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newYoutubeId.trim()) {
      toast({ title: "Title and YouTube ID/URL required", variant: "destructive" });
      return;
    }
    setAdding(true);
    const ytId = extractYoutubeId(newYoutubeId);
    const { error } = await supabase.from("demo_videos").insert({
      title: newTitle,
      description: newDesc,
      youtube_id: ytId,
      duration: newDuration,
      category: newCategory,
      sort_order: videos.length + 1,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video added!" });
      setShowAdd(false);
      setNewTitle(""); setNewDesc(""); setNewYoutubeId(""); setNewDuration(""); setNewCategory("tutorial");
      fetchVideos();
    }
    setAdding(false);
  };

  const handleOpenEdit = (v: DemoVideo) => {
    setEditVideo(v);
    setEditTitle(v.title);
    setEditDesc(v.description);
    setEditYoutubeId(v.youtube_id);
    setEditDuration(v.duration);
    setEditCategory(v.category || "tutorial");
  };

  const handleSaveEdit = async () => {
    if (!editVideo) return;
    setEditSaving(true);
    const ytId = extractYoutubeId(editYoutubeId);
    const { error } = await supabase
      .from("demo_videos")
      .update({
        title: editTitle,
        description: editDesc,
        youtube_id: ytId,
        duration: editDuration,
        category: editCategory,
      } as any)
      .eq("id", editVideo.id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Video updated!" });
      setEditVideo(null);
      fetchVideos();
    }
    setEditSaving(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("demo_videos").update({ is_active: !current } as any).eq("id", id);
    fetchVideos();
    toast({ title: current ? "Video hidden" : "Video visible" });
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await supabase.from("demo_videos").delete().eq("id", id);
    fetchVideos();
    toast({ title: "Video deleted" });
  };

  const moveOrder = async (id: string, direction: "up" | "down") => {
    const idx = videos.findIndex((v) => v.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === videos.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = videos[idx];
    const b = videos[swapIdx];
    await Promise.all([
      supabase.from("demo_videos").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("demo_videos").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    fetchVideos();
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Demo Videos</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchVideos} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl"
          >
            <Plus size={16} /> Add Video
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {videos.map((video, i) => (
          <div
            key={video.id}
            className={`flex items-center gap-4 bg-card rounded-2xl border p-4 shadow-card transition-all ${
              video.is_active ? "border-border" : "border-destructive/30 opacity-60"
            }`}
          >
            {/* Thumbnail */}
            <div className="relative w-32 aspect-video rounded-lg overflow-hidden shrink-0 bg-muted">
              <img
                src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                <Play size={20} className="text-accent" />
              </div>
              {video.duration && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono text-foreground">
                  {video.duration}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-foreground text-sm truncate">{video.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{video.description}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">ID: {video.youtube_id}</p>
            </div>

            {/* Order */}
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveOrder(video.id, "up")}
                disabled={i === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              >
                ▲
              </button>
              <span className="text-[10px] text-muted-foreground text-center">{video.sort_order}</span>
              <button
                onClick={() => moveOrder(video.id, "down")}
                disabled={i === videos.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              >
                ▼
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => toggleActive(video.id, video.is_active)} className="px-2">
                {video.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleOpenEdit(video)} className="text-xs gap-1">
                <Save size={12} /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(video.id, video.title)} className="text-destructive hover:text-destructive px-2">
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <div className="text-center text-muted-foreground py-12">No videos added yet.</div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus size={18} /> Add Demo Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title *</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Alplum Plus Full Demo" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description" />
            </div>
            <div>
              <Label>YouTube URL or Video ID *</Label>
              <Input value={newYoutubeId} onChange={(e) => setNewYoutubeId(e.target.value)} placeholder="e.g., https://youtube.com/watch?v=xxxx or just xxxx" />
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={newDuration} onChange={(e) => setNewDuration(e.target.value)} placeholder="e.g., 12:45" />
            </div>
            <div>
              <Label>Category</Label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleAdd} disabled={adding} className="gap-2">
              {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editVideo} onOpenChange={(open) => !open && setEditVideo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Save size={18} /> Edit Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div>
              <Label>YouTube URL or Video ID</Label>
              <Input value={editYoutubeId} onChange={(e) => setEditYoutubeId(e.target.value)} />
            </div>
            <div>
              <Label>Duration</Label>
              <Input value={editDuration} onChange={(e) => setEditDuration(e.target.value)} />
            </div>
            <div>
              <Label>Category</Label>
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSaveEdit} disabled={editSaving} className="gap-2">
              {editSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
