import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

interface PsdTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
  file_size: string;
  photoshop_version: string;
  pages: number;
  price: number;
  is_free: boolean;
  is_active: boolean;
  downloads_count: number;
}

const CATEGORIES = ["Wedding", "Engagement", "Birthday", "Baby Shoot", "Traditional"];

export function AdminPsdTemplates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PsdTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "Wedding",
    description: "",
    preview_url: "",
    file_size: "",
    photoshop_version: "CS6 — CC 2026",
    pages: 1,
    price: 0,
    is_free: false,
  });

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("psd_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreate = async () => {
    if (!form.name) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("psd_templates").insert({
      ...form,
      is_active: true,
      downloads_count: 0,
    });

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template added!" });
      setShowForm(false);
      setForm({ name: "", category: "Wedding", description: "", preview_url: "", file_size: "", photoshop_version: "CS6 — CC 2024", pages: 1, price: 0, is_free: false });
      fetchTemplates();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from("psd_templates").update({ is_active: !current }).eq("id", id);
    if (error) toast({ title: error.message, variant: "destructive" });
    else { fetchTemplates(); toast({ title: current ? "Download disabled" : "Download enabled" }); }
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from("psd_templates").delete().eq("id", id);
    if (error) toast({ title: error.message, variant: "destructive" });
    else { fetchTemplates(); toast({ title: "Template deleted" }); }
  };

  const updatePrice = async (id: string, price: number, isFree: boolean) => {
    const { error } = await supabase.from("psd_templates").update({ price, is_free: isFree }).eq("id", id);
    if (error) toast({ title: error.message, variant: "destructive" });
    else { fetchTemplates(); toast({ title: "Price updated" }); }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">PSD Templates</h2>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl"
        >
          <Plus size={16} /> Add Template
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-card rounded-2xl border border-accent/30 p-5 mb-6 shadow-gold space-y-3">
          <h3 className="font-display font-semibold text-foreground">New PSD Template</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preview Image URL</label>
              <input
                value={form.preview_url}
                onChange={(e) => setForm({ ...form, preview_url: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">File Size</label>
              <input
                value={form.file_size}
                onChange={(e) => setForm({ ...form, file_size: e.target.value })}
                placeholder="e.g. 85 MB"
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Pages</label>
              <input
                type="number"
                value={form.pages}
                onChange={(e) => setForm({ ...form, pages: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Price (₹)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_free}
              onChange={(e) => setForm({ ...form, is_free: e.target.checked, price: e.target.checked ? 0 : form.price })}
              className="rounded"
            />
            Mark as Free
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} className="bg-gradient-gold text-accent-foreground font-semibold rounded-xl">
              Upload Template
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Templates table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-4 font-medium">Template</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Price</th>
                <th className="text-left p-4 font-medium">Downloads</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-muted-foreground">No templates yet</td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {t.preview_url && (
                          <img src={t.preview_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="font-medium text-foreground">{t.name}</div>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{t.category}</td>
                    <td className="p-4">
                      {t.is_free ? (
                        <span className="text-[hsl(142,70%,45%)] font-bold text-xs">FREE</span>
                      ) : (
                        <span className="text-accent font-bold">₹{t.price}</span>
                      )}
                    </td>
                    <td className="p-4 text-foreground">{t.downloads_count}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        t.is_active ? "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]" : "bg-destructive/10 text-destructive"
                      }`}>
                        {t.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleActive(t.id, t.is_active)}
                          title={t.is_active ? "Disable download" : "Enable download"}
                        >
                          {t.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTemplate(t.id)}
                          className="text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
