import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Plan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
}

export function AdminPricing() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPlans = async () => {
    const { data } = await supabase.from("pricing_plans").select("*").order("duration_days");
    if (data) setPlans(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const updatePrice = async (id: string, price: number) => {
    setSaving(id);
    const { error } = await supabase
      .from("pricing_plans")
      .update({ price })
      .eq("id", id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: "Price updated!" });
    }
    setSaving(null);
  };

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

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-5">Pricing Control</h2>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-card rounded-2xl border p-5 shadow-card ${
              plan.is_active ? "border-border" : "border-destructive/30 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">{plan.plan_name}</h3>
              <button
                onClick={() => toggleActive(plan.id, plan.is_active)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  plan.is_active
                    ? "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {plan.is_active ? "Active" : "Disabled"}
              </button>
            </div>

            <div className="text-xs text-muted-foreground mb-1">{plan.duration_days} days</div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-muted-foreground text-sm">₹</span>
              <input
                type="number"
                defaultValue={plan.price}
                onBlur={(e) => {
                  const val = Number(e.target.value);
                  if (val !== plan.price) updatePrice(plan.id, val);
                }}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground font-display font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>

            <Button
              size="sm"
              onClick={(e) => {
                const input = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                if (input) updatePrice(plan.id, Number(input.value));
              }}
              disabled={saving === plan.id}
              className="w-full mt-3 bg-gradient-gold text-accent-foreground font-semibold rounded-xl gap-2 text-xs"
            >
              <Save size={14} />
              {saving === plan.id ? "Saving..." : "Save Price"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
