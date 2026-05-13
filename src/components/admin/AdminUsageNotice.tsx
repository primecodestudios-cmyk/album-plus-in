import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, RotateCcw, RefreshCw, Search } from "lucide-react";
import { calcDaysUsed, USAGE_LIMIT_DAYS } from "@/components/UsageNotice";

interface Row {
  user_id: string;
  full_name: string;
  phone: string;
  created_at: string;
  usage_reset_at: string | null;
}

export function AdminUsageNotice() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"reached" | "approaching" | "all">("reached");

  const fetchRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone, created_at, usage_reset_at")
      .order("created_at", { ascending: true });
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setRows((data as Row[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleReset = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ usage_reset_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usage window reset", description: "User has a fresh 90-day window." });
      fetchRows();
    }
  };

  const enriched = rows
    .map((r) => ({ ...r, daysUsed: calcDaysUsed(r.created_at, r.usage_reset_at) }))
    .filter((r) => {
      if (filter === "reached") return r.daysUsed >= USAGE_LIMIT_DAYS;
      if (filter === "approaching") return r.daysUsed >= USAGE_LIMIT_DAYS - 14 && r.daysUsed < USAGE_LIMIT_DAYS;
      return true;
    })
    .filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (r.full_name || "").toLowerCase().includes(q) || (r.phone || "").toLowerCase().includes(q);
    })
    .sort((a, b) => b.daysUsed - a.daysUsed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">90-Day Usage Notice</h2>
            <p className="text-xs text-muted-foreground">Users reaching the security review window.</p>
          </div>
        </div>
        <button
          onClick={fetchRows}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:border-primary/30"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(["reached", "approaching", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "reached" ? "Reached 90d" : f === "approaching" ? "Approaching" : "All Users"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-12">Loading...</div>
        ) : enriched.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-12">No users in this category.</div>
        ) : (
          <div className="divide-y divide-border">
            {enriched.map((u) => {
              const reached = u.daysUsed >= USAGE_LIMIT_DAYS;
              return (
                <div key={u.user_id} className="px-4 md:px-5 py-3 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {u.full_name || "Unnamed user"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.phone || "—"} • Started {new Date(u.usage_reset_at || u.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      reached ? "bg-amber-500/15 text-amber-500" : "bg-primary/10 text-primary"
                    }`}>
                      {u.daysUsed}d used
                    </span>
                    <button
                      onClick={() => handleReset(u.user_id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <RotateCcw size={12} /> Reset window
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsageNotice;
