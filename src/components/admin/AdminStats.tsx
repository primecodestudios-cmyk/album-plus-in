import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, ShoppingBag, IndianRupee, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  total_users: number;
  active_licenses: number;
  total_purchases: number;
  total_revenue: number;
}

interface ExpiringUser {
  user_id: string;
  full_name: string;
  phone: string;
  plan_name: string;
  expires_at: string;
  days_left: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiringUsers, setExpiringUsers] = useState<ExpiringUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [statsRes, expiringRes] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.functions.invoke("admin-users", {
          body: { action: "expiring_users", days: 15 },
        }),
      ]);

      if (!statsRes.error && statsRes.data) setStats(statsRes.data as unknown as Stats);
      if (expiringRes.data?.users) setExpiringUsers(expiringRes.data.users);
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading stats...</div>;

  const cards = [
    { icon: Users, label: "Total Users", value: stats?.total_users ?? 0, color: "text-primary" },
    { icon: ShieldCheck, label: "Active Licenses", value: stats?.active_licenses ?? 0, color: "text-accent" },
    { icon: ShoppingBag, label: "PSD Sales", value: stats?.total_purchases ?? 0, color: "text-foreground" },
    { icon: IndianRupee, label: "Revenue", value: `₹${stats?.total_revenue ?? 0}`, color: "text-accent" },
  ];

  return (
    <div className="space-y-8">
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

      {/* Expiring in 15 Days */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-400" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Expiring in 15 Days
            {expiringUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {expiringUsers.length}
              </Badge>
            )}
          </h2>
        </div>

        {expiringUsers.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
            No users expiring in the next 15 days 🎉
          </div>
        ) : (
          <div className="grid gap-3">
            {expiringUsers.map((u) => (
              <div
                key={u.user_id + u.expires_at}
                className="bg-card rounded-xl border border-border p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">
                      {u.full_name || "Unknown"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.phone || "No phone"} • {u.plan_name}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-400">
                    {u.days_left}d left
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(u.expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
