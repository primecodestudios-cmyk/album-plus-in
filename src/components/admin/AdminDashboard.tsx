import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  ShieldCheck,
  Clock,
  XCircle,
  TicketCheck,
  RefreshCw,
  AlertTriangle,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type UserFilter = "all" | "active" | "inactive" | "blocked" | "expiring" | "expiring7" | "expired";

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

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user_id: string;
}

interface AdminDashboardProps {
  onNavigateToUsers: (filter: UserFilter) => void;
  onNavigateToTab: (tab: string) => void;
}

export function AdminDashboard({ onNavigateToUsers, onNavigateToTab }: AdminDashboardProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiringUsers15, setExpiringUsers15] = useState<ExpiringUser[]>([]);
  const [expiredUsers, setExpiredUsers] = useState<ExpiringUser[]>([]);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);

    const [statsRes, expiring15Res, expiredRes, ticketsRes] = await Promise.all([
      supabase.rpc("get_admin_stats"),
      supabase.functions.invoke("admin-users", { body: { action: "expiring_users", days: 15 } }),
      supabase.functions.invoke("admin-users", { body: { action: "expired_users" } }),
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(5),
    ]);

    if (!statsRes.error && statsRes.data) setStats(statsRes.data as unknown as Stats);
    if (expiring15Res.data?.users) setExpiringUsers15(expiring15Res.data.users);
    if (expiredRes.data?.users) setExpiredUsers(expiredRes.data.users);
    if (ticketsRes.data) setRecentTickets(ticketsRes.data);

    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statusColor = (s: string) => {
    if (s === "open") return "bg-primary/15 text-primary";
    if (s === "in_progress") return "bg-amber-500/15 text-amber-500";
    if (s === "resolved") return "bg-green-500/15 text-green-500";
    return "bg-muted text-muted-foreground";
  };

  const openTickets = recentTickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-8">
      {/* Refresh Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Overview</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastRefresh.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.total_users ?? 0}
          color="text-primary"
          bgColor="bg-primary/10"
          onClick={() => onNavigateToUsers("all")}
        />
        <StatCard
          icon={ShieldCheck}
          label="Active Users"
          value={stats?.active_licenses ?? 0}
          color="text-green-500"
          bgColor="bg-green-500/10"
          onClick={() => onNavigateToUsers("active")}
        />
        <StatCard
          icon={XCircle}
          label="Expired Users"
          value={expiredUsers.length}
          color="text-destructive"
          bgColor="bg-destructive/10"
          onClick={() => onNavigateToUsers("expired")}
        />
        <StatCard
          icon={CalendarClock}
          label="Expiring (15d)"
          value={expiringUsers15.length}
          color="text-amber-500"
          bgColor="bg-amber-500/10"
          onClick={() => onNavigateToUsers("expiring")}
        />
        <StatCard
          icon={TicketCheck}
          label="Open Tickets"
          value={openTickets}
          color="text-primary"
          bgColor="bg-primary/10"
          onClick={() => onNavigateToTab("tickets")}
          highlight={openTickets > 0}
        />
      </div>

      {/* Revenue Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-display text-2xl font-bold text-accent">₹{stats?.total_revenue ?? 0}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            From {stats?.total_purchases ?? 0} PSD template purchases
          </p>
        </div>

        {/* Expiry Alert Summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-display text-sm font-bold text-foreground">Expiry Alerts</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => onNavigateToUsers("expiring")}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-all text-sm"
            >
              <span className="text-muted-foreground">Expiring in 15 days</span>
              <span className="font-bold text-amber-500">{expiringUsers15.length}</span>
            </button>
            <button
              onClick={() => onNavigateToUsers("expired")}
              className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5 hover:bg-destructive/10 transition-all text-sm"
            >
              <span className="text-muted-foreground">Expired</span>
              <span className="font-bold text-destructive">{expiredUsers.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <TicketCheck size={18} className="text-primary" />
            <h3 className="font-display text-sm font-bold text-foreground">Recent Tickets</h3>
            {openTickets > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold">
                {openTickets} open
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateToTab("tickets")}
            className="text-xs text-primary hover:underline font-medium"
          >
            View All →
          </button>
        </div>

        {recentTickets.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No tickets yet
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentTickets.map((t) => (
              <button
                key={t.id}
                onClick={() => onNavigateToTab("tickets")}
                className="w-full text-left px-5 py-3 hover:bg-secondary/30 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(t.created_at).toLocaleDateString("en-IN")} • {t.priority}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${statusColor(t.status)}`}>
                  {t.status.replace("_", " ")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expiring Users List */}
      {expiringUsers15.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500" />
              <h3 className="font-display text-sm font-bold text-foreground">Users Expiring Soon</h3>
              <span className="text-xs text-muted-foreground">({expiringUsers15.length})</span>
            </div>
            <button
              onClick={() => onNavigateToUsers("expiring")}
              className="text-xs text-primary hover:underline font-medium"
            >
              View All →
            </button>
          </div>
          <div className="divide-y divide-border">
            {expiringUsers15.slice(0, 5).map((u) => (
              <div key={u.user_id + u.expires_at} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{u.phone || "—"} • {u.plan_name}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${u.days_left <= 3 ? "text-destructive" : u.days_left <= 7 ? "text-amber-500" : "text-muted-foreground"}`}>
                    {u.days_left}d left
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(u.expires_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable stat card
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bgColor,
  onClick,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  color: string;
  bgColor: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-card rounded-xl border p-4 text-left transition-all hover:shadow-lg cursor-pointer group ${
        highlight ? "border-primary/40 shadow-gold" : "border-border hover:border-primary/30"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
        <Icon size={20} className={color} />
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
    </button>
  );
}
