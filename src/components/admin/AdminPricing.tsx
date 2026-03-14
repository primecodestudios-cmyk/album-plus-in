import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, RefreshCw, Monitor, HardDrive, IndianRupee, Calendar, Percent, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  plan_name: string;
  duration_days: number;
  duration_type: string;
  price: number;
  max_pcs: number;
  data_pack: string;
  is_active: boolean;
}

export function AdminPricing() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Bulk update state
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<"fixed" | "percent">("percent");
  const [bulkValue, setBulkValue] = useState(0);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkPreviews, setBulkPreviews] = useState<Record<string, number>>({});

  // Add new plan dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDays, setNewDays] = useState(28);
  const [newDurationType, setNewDurationType] = useState("days");
  const [newPrice, setNewPrice] = useState(0);
  const [newPcs, setNewPcs] = useState(1);
  const [newDataPack, setNewDataPack] = useState("");
  const [adding, setAdding] = useState(false);

  // Edit plan dialog
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editName, setEditName] = useState("");
  const [editDays, setEditDays] = useState(0);
  const [editDurationType, setEditDurationType] = useState("days");
  const [editPrice, setEditPrice] = useState(0);
  const [editPcs, setEditPcs] = useState(1);
  const [editDataPack, setEditDataPack] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const fetchPlans = async () => {
    const { data } = await supabase.from("pricing_plans").select("*").order("duration_days");
    if (data) setPlans(data as unknown as Plan[]);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("pricing_plans")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      fetchPlans();
      toast({ title: current ? "Plan disabled" : "Plan enabled" });
    }
  };

  const handleAddPlan = async () => {
    if (!newName.trim()) {
      toast({ title: "Enter plan name", variant: "destructive" });
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("pricing_plans").insert({
      plan_name: newName,
      duration_days: newDays,
      duration_type: newDurationType,
      price: newPrice,
      max_pcs: newPcs,
      data_pack: newDataPack,
      is_active: true,
    } as any);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan created!" });
      setShowAdd(false);
      setNewName("");
      setNewDays(28);
      setNewPrice(0);
      setNewPcs(1);
      setNewDataPack("");
      setNewDurationType("days");
      fetchPlans();
    }
    setAdding(false);
  };

  const handleOpenEdit = (plan: Plan) => {
    setEditPlan(plan);
    setEditName(plan.plan_name);
    setEditDays(plan.duration_days);
    setEditDurationType(plan.duration_type || "days");
    setEditPrice(plan.price);
    setEditPcs(plan.max_pcs || 1);
    setEditDataPack(plan.data_pack || "");
  };

  const handleSaveEdit = async () => {
    if (!editPlan) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("pricing_plans")
      .update({
        plan_name: editName,
        duration_days: editDays,
        duration_type: editDurationType,
        price: editPrice,
        max_pcs: editPcs,
        data_pack: editDataPack,
      } as any)
      .eq("id", editPlan.id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan updated!" });
      setEditPlan(null);
      fetchPlans();
    }
    setEditSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plan "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("pricing_plans").delete().eq("id", id);
    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan deleted" });
      fetchPlans();
    }
  };

  const getDurationLabel = (plan: Plan) => {
    const type = plan.duration_type || "days";
    if (type === "months") return `${Math.round(plan.duration_days / 30)} Month${Math.round(plan.duration_days / 30) > 1 ? "s" : ""}`;
    if (type === "years") return `${Math.round(plan.duration_days / 365)} Year${Math.round(plan.duration_days / 365) > 1 ? "s" : ""}`;
    if (type === "custom") return `${plan.duration_days} Days (Custom)`;
    return `${plan.duration_days} Days`;
  };

  // Bulk price update
  const computeBulkPreviews = () => {
    const previews: Record<string, number> = {};
    plans.forEach((p) => {
      if (bulkMode === "percent") {
        previews[p.id] = Math.round(p.price * (1 + bulkValue / 100));
      } else {
        previews[p.id] = p.price + bulkValue;
      }
      if (previews[p.id] < 0) previews[p.id] = 0;
    });
    setBulkPreviews(previews);
  };

  useEffect(() => {
    if (showBulk) computeBulkPreviews();
  }, [bulkValue, bulkMode, showBulk, plans]);

  const handleBulkUpdate = async () => {
    setBulkSaving(true);
    let hasError = false;
    for (const plan of plans) {
      const newPrice = bulkPreviews[plan.id];
      if (newPrice !== undefined && newPrice !== plan.price) {
        const { error } = await supabase
          .from("pricing_plans")
          .update({ price: newPrice } as any)
          .eq("id", plan.id);
        if (error) hasError = true;
      }
    }
    if (hasError) {
      toast({ title: "Some plans failed to update", variant: "destructive" });
    } else {
      toast({ title: "All plan prices updated!" });
    }
    setShowBulk(false);
    setBulkValue(0);
    fetchPlans();
    setBulkSaving(false);
  };



  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Pricing Control</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchPlans} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setShowBulk(true); setBulkValue(0); }}
            className="gap-2"
          >
            <Percent size={14} /> Bulk Update
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAdd(true)}
            className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl"
          >
            <Plus size={16} /> Add Plan
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card rounded-2xl border p-5 shadow-card transition-all ${
              plan.is_active ? "border-border" : "border-destructive/30 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-foreground text-lg">{plan.plan_name}</h3>
              <button
                onClick={() => toggleActive(plan.id, plan.is_active)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  plan.is_active
                    ? "bg-green-600/10 text-green-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {plan.is_active ? "Active" : "Disabled"}
              </button>
            </div>

            {/* Price */}
            <div className="flex items-center gap-1 mb-3">
              <IndianRupee size={16} className="text-accent" />
              <span className="font-display text-2xl font-bold text-accent">{plan.price}</span>
            </div>

            {/* Details */}
            <div className="space-y-2 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={12} />
                <span>{getDurationLabel(plan)}</span>
                <span className="text-muted-foreground/50">({plan.duration_days}d)</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor size={12} />
                <span>{plan.max_pcs || 1} PC{(plan.max_pcs || 1) > 1 ? "s" : ""} Allowed</span>
              </div>
              {plan.data_pack && (
                <div className="flex items-center gap-2">
                  <HardDrive size={12} />
                  <span>{plan.data_pack}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenEdit(plan)}
                className="flex-1 text-xs gap-1"
              >
                <Save size={12} /> Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(plan.id, plan.plan_name)}
                className="text-destructive hover:text-destructive text-xs px-2"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plan Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} /> Add New Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Plan Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., 1 Year Premium" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration Type</Label>
                <select
                  value={newDurationType}
                  onChange={(e) => {
                    setNewDurationType(e.target.value);
                    const map: Record<string, number> = { days: 28, months: 90, years: 365, custom: 28 };
                    setNewDays(map[e.target.value] || 28);
                  }}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label>Duration (Days)</Label>
                <Input type="number" value={newDays} onChange={(e) => setNewDays(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} />
              </div>
              <div>
                <Label>Max PCs</Label>
                <Input type="number" value={newPcs} onChange={(e) => setNewPcs(Number(e.target.value))} min={1} />
              </div>
            </div>
            <div>
              <Label>Data Pack (optional)</Label>
              <Input value={newDataPack} onChange={(e) => setNewDataPack(e.target.value)} placeholder="e.g., 500GB Data Pack" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleAddPlan} disabled={adding} className="gap-2">
              {adding ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editPlan} onOpenChange={(open) => !open && setEditPlan(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save size={18} /> Edit Plan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Plan Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration Type</Label>
                <select
                  value={editDurationType}
                  onChange={(e) => {
                    setEditDurationType(e.target.value);
                    const map: Record<string, number> = { days: 28, months: 90, years: 365, custom: editDays };
                    setEditDays(map[e.target.value] || editDays);
                  }}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm"
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <Label>Duration (Days)</Label>
                <Input type="number" value={editDays} onChange={(e) => setEditDays(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} />
              </div>
              <div>
                <Label>Max PCs</Label>
                <Input type="number" value={editPcs} onChange={(e) => setEditPcs(Number(e.target.value))} min={1} />
              </div>
            </div>
            <div>
              <Label>Data Pack (optional)</Label>
              <Input value={editDataPack} onChange={(e) => setEditDataPack(e.target.value)} placeholder="e.g., 500GB Data Pack" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
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
