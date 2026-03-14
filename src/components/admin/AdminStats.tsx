import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, ShoppingBag, IndianRupee } from "lucide-react";

interface Stats {
  total_users: number;
  active_licenses: number;
  total_purchases: number;
  total_revenue: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase.rpc("get_admin_stats");
      if (!error && data) setStats(data as unknown as Stats);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading stats...</div>;

  const cards = [
    { icon: Users, label: "Total Users", value: stats?.total_users ?? 0, color: "text-primary" },
    { icon: ShieldCheck, label: "Active Licenses", value: stats?.active_licenses ?? 0, color: "text-accent" },
    { icon: ShoppingBag, label: "PSD Sales", value: stats?.total_purchases ?? 0, color: "text-foreground" },
    { icon: IndianRupee, label: "Revenue", value: `₹${stats?.total_revenue ?? 0}`, color: "text-accent" },
  ];

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-5">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-card rounded-2xl border border-border p-5 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
              <c.icon size={20} className={c.color} />
            </div>
            <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
            <div className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
