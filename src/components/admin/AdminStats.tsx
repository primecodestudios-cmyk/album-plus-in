import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, ShoppingBag, IndianRupee, AlertTriangle, Clock, Ban, Monitor, XCircle, RefreshCw } from "lucide-react";
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

type UserFilter = "all" | "active" | "inactive" | "blocked" | "expiring" | "expiring7" | "expired";

interface AdminStatsProps {
  onNavigateToUsers: (filter: UserFilter) => void;
}

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export function AdminStats({ onNavigateToUsers }: AdminStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiringUsers15, setExpiringUsers15] = useState<ExpiringUser[]>([]);
  const [expiringUsers7, setExpiringUsers7] = useState<ExpiringUser[]>([]);
  const [expiredUsers, setExpiredUsers] = useState<ExpiringUser[]>([]);
  const [pcStats, setPcStats] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    const [statsRes, expiring15Res, expiring7Res, expiredRes, usersRes] = await Promise.all([
      supabase.rpc("get_admin_stats"),
      supabase.functions.invoke("admin-users", {
        body: { action: "expiring_users", days: 15 },
      }),
      supabase.functions.invoke("admin-users", {
        body: { action: "expiring_users", days: 7 },
      }),
      supabase.functions.invoke("admin-users", {
        body: { action: "expired_users" },
      }),
      supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      }),
    ]);

    if (!statsRes.error && statsRes.data) setStats(statsRes.data as unknown as Stats);
    if (expiring15Res.data?.users) setExpiringUsers15(expiring15Res.data.users);
    if (expiring7Res.data?.users) setExpiringUsers7(expiring7Res.data.users);
    if (expiredRes.data?.users) setExpiredUsers(expiredRes.data.users);
    if (usersRes.data?.pc_activation_stats) setPcStats(usersRes.data.pc_activation_stats);
    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
    setCountdown(30);
  }, []);

  // Initial fetch
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchAll(true), AUTO_REFRESH_INTERVAL);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, fetchAll]);

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading stats...</div>;

  const overviewCards = [
    { icon: Users, label: "Total Users", value: stats?.total_users ?? 0, color: "text-primary", filter: "all" as UserFilter },
    { icon: ShieldCheck, label: "Active Licenses", value: stats?.active_licenses ?? 0, color: "text-accent", filter: "active" as UserFilter },
    { icon: ShoppingBag, label: "PSD Sales", value: stats?.total_purchases ?? 0, color: "text-foreground", filter: "all" as UserFilter },
    { icon: IndianRupee, label: "Revenue", value: `₹${stats?.total_revenue ?? 0}`, color: "text-accent", filter: "all" as UserFilter },
  ];

  const expiryCards = [
    { label: "Expiring in 15 Days", count: expiringUsers15.length, color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/30", filter: "expiring" as UserFilter },
    { label: "Expiring in 7 Days", count: expiringUsers7.length, color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/30", filter: "expiring7" as UserFilter },
    { label: "Expired Users", count: expiredUsers.length, color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/30", filter: "expired" as UserFilter },
  ];

  // PC activation count entries
  const pcEntries = Object.entries(pcStats)
    .map(([count, users]) => ({ pcCount: Number(count), userCount: users }))
    .sort((a, b) => a.pcCount - b.pcCount);

  const renderUserList = (users: ExpiringUser[], color: string) => {
    if (users.length === 0) {
      return (
        <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
          No users found 🎉
        </div>
      );
    }
    return (
      <div className="grid gap-2">
        {users.slice(0, 10).map((u) => (
          <div
            key={u.user_id + u.expires_at}
            className="bg-card rounded-xl border border-border p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${color === "text-destructive" ? "bg-destructive/10" : color === "text-orange-400" ? "bg-orange-500/10" : "bg-amber-500/10"} flex items-center justify-center`}>
                <Clock size={14} className={color} />
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">{u.full_name || "Unknown"}</div>
                <div className="text-xs text-muted-foreground">{u.phone || "No phone"} • {u.plan_name}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${color}`}>
                {u.days_left <= 0 ? "Expired" : `${u.days_left}d left`}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(u.expires_at).toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>
        ))}
        {users.length > 10 && (
          <div className="text-center text-xs text-muted-foreground py-2">
            +{users.length - 10} more users
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards - Clickable */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold text-foreground">Overview</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last: {lastRefresh.toLocaleTimeString("en-IN")}</span>
              {autoRefresh && (
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? "bg-accent animate-pulse" : "bg-green-500"}`} />
                  {countdown}s
                </span>
              )}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                autoRefresh
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-secondary border-border text-muted-foreground"
              }`}
            >
              {autoRefresh ? "Auto ⏸" : "Auto ▶"}
            </button>
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {overviewCards.map((c) => (
            <button
              key={c.label}
              onClick={() => onNavigateToUsers(c.filter)}
              className="bg-card rounded-2xl border border-border p-5 shadow-card text-left transition-all hover:border-accent/40 hover:shadow-gold cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
                <c.icon size={20} className={c.color} />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
              <div className={`font-display text-2xl font-bold ${c.color}`}>{c.value}</div>
            </button>
          ))}
        </div>
      </div>

      {/* PC Activation Counts */}
      {pcEntries.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">PC Activation Count</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {pcEntries.map(({ pcCount, userCount }) => (
              <div
                key={pcCount}
                className="bg-card rounded-2xl border border-border p-4 shadow-card text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 mx-auto">
                  <Monitor size={18} className="text-primary" />
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{userCount}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {pcCount} PC{pcCount > 1 ? "s" : ""} Activation
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiry Alert Cards - Clickable */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-400" />
          <h2 className="font-display text-lg font-bold text-foreground">Expiry Alerts</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {expiryCards.map((c) => (
            <button
              key={c.label}
              onClick={() => onNavigateToUsers(c.filter)}
              className={`rounded-2xl border p-5 text-left transition-all hover:shadow-md cursor-pointer ${c.bgColor}`}
            >
              <div className="text-xs text-muted-foreground mb-1">{c.label}</div>
              <div className={`font-display text-3xl font-bold ${c.color}`}>{c.count}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Expiring in 15 Days List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-amber-400" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Expiring in 15 Days
            {expiringUsers15.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{expiringUsers15.length}</Badge>
            )}
          </h2>
        </div>
        {renderUserList(expiringUsers15, "text-amber-400")}
      </div>

      {/* Expiring in 7 Days List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-orange-400" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Expiring in 7 Days
            {expiringUsers7.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{expiringUsers7.length}</Badge>
            )}
          </h2>
        </div>
        {renderUserList(expiringUsers7, "text-orange-400")}
      </div>

      {/* Expired Users List */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <XCircle size={18} className="text-destructive" />
          <h2 className="font-display text-lg font-bold text-foreground">
            Expired Users
            {expiredUsers.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{expiredUsers.length}</Badge>
            )}
          </h2>
        </div>
        {renderUserList(expiredUsers, "text-destructive")}
      </div>
    </div>
  );
}
