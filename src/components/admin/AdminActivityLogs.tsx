import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  device_id: string;
  ip_address: string;
  details: any;
  user_agent: string;
  created_at: string;
}

export const AdminActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setLogs(data);
    setLoading(false);
  };

  const filtered = logs.filter((log) => {
    if (search && !log.user_id.includes(search) && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.ip_address.includes(search) && !log.device_id.includes(search)) return false;
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(log.created_at) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const actions = [...new Set(logs.map((l) => l.action))];

  const inputClass = "h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Activity size={20} className="text-accent" />
        <h2 className="font-display text-xl font-bold text-foreground">Activity Logs</h2>
        <span className="text-xs text-muted-foreground ml-2">({filtered.length} records)</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user ID, action, IP..." className={`${inputClass} w-full pl-9`} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={inputClass}>
          <option value="all">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputClass} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputClass} />
        <Button size="sm" onClick={fetchLogs} variant="outline" className="rounded-lg h-10">
          Refresh
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No activity logs found</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Time</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Action</th>
                <th className="text-left p-3 text-muted-foreground font-medium">User ID</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Device ID</th>
                <th className="text-left p-3 text-muted-foreground font-medium">IP Address</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="p-3 text-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">{log.action}</span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs font-mono">{log.user_id.slice(0, 8)}...</td>
                  <td className="p-3 text-muted-foreground text-xs font-mono">{log.device_id || "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{log.ip_address || "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{log.details ? JSON.stringify(log.details) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
