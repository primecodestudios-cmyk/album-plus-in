import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, ShoppingBag, IndianRupee, AlertTriangle, Clock, Ban, Monitor, XCircle, RefreshCw, Eye, Edit, ShieldOff, Laptop, UserPlus, Play, CalendarPlus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

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

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  devices_count: number;
  devices: any[];
  activation: number;
  is_blocked: boolean;
  active_license: any;
  sub_end: string | null;
  days_left: number | null;
  studio_name: string;
}

type UserFilter = "all" | "active" | "inactive" | "blocked" | "expiring" | "expiring7" | "expired";

interface AdminStatsProps {
  onNavigateToUsers: (filter: UserFilter) => void;
}

const AUTO_REFRESH_INTERVAL = 30000;

export function AdminStats({ onNavigateToUsers }: AdminStatsProps) {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [expiringUsers15, setExpiringUsers15] = useState<ExpiringUser[]>([]);
  const [expiringUsers7, setExpiringUsers7] = useState<ExpiringUser[]>([]);
  const [expiredUsers, setExpiredUsers] = useState<ExpiringUser[]>([]);
  const [pcStats, setPcStats] = useState<Record<number, number>>({});
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // PC activation dialog
  const [selectedPcCount, setSelectedPcCount] = useState<number | null>(null);

  // New users dialog
  const [showNewUsers, setShowNewUsers] = useState(false);
  const [subForm, setSubForm] = useState<{ userId: string; userName: string; startDate: string; endDate: string } | null>(null);

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
    if (usersRes.data?.users) setAllUsers(usersRes.data.users);
    setLoading(false);
    setRefreshing(false);
    setLastRefresh(new Date());
    setCountdown(30);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

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

  const invokeAction = async (actionName: string, userId: string, label: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: actionName, user_id: userId },
      });
      if (error) throw error;
      if (data?.success) {
        const syncMsg = data.cpanel_sync ? " (cPanel synced ✅)" : "";
        toast({ title: label + syncMsg });
        fetchAll(true);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleActivateAndSubscribe = async () => {
    if (!subForm) return;
    try {
      // Activate user
      await supabase.functions.invoke("admin-users", {
        body: { action: "activate_user", user_id: subForm.userId },
      });
      // Set subscription
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "update_subscription",
          user_id: subForm.userId,
          sub_start: subForm.startDate,
          sub_end: subForm.endDate,
          activation: 1,
        },
      });
      if (error) throw error;
      const syncMsg = data?.cpanel_sync ? " (cPanel synced ✅)" : "";
      toast({ title: "User activated & subscription enabled" + syncMsg });
      setSubForm(null);
      fetchAll(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

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

  // Build PC activation cards for 1-10
  const pcCards = Array.from({ length: 10 }, (_, i) => {
    const pcCount = i + 1;
    return { pcCount, userCount: pcStats[pcCount] || 0 };
  });

  // New users: activation=0 and not blocked
  const newUsers = allUsers.filter((u) => u.activation === 0 && !u.is_blocked);

  // Users for selected PC count
  const pcFilteredUsers = selectedPcCount !== null
    ? allUsers.filter((u) => u.devices_count === selectedPcCount)
    : [];

  const getStatusText = (user: UserInfo) => {
    if (user.is_blocked) return "🚫 Blocked";
    if (user.days_left !== null && user.days_left <= 0) return "❌ Expired";
    if (user.activation === 1) return "✅ Active";
    return "Inactive";
  };

  const getStatusClass = (user: UserInfo) => {
    if (user.is_blocked) return "text-destructive";
    if (user.days_left !== null && user.days_left <= 0) return "text-destructive";
    if (user.activation === 1) return "text-green-400";
    return "text-muted-foreground";
  };

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
      {/* Overview Cards */}
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

      {/* New Users (Pending Activation) */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">New Users</h2>
        </div>
        <button
          onClick={() => setShowNewUsers(true)}
          className="bg-card rounded-2xl border border-accent/30 p-5 shadow-card text-left transition-all hover:border-accent/50 hover:shadow-gold cursor-pointer w-full sm:w-auto sm:min-w-[220px]"
        >
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">
            <UserPlus size={20} className="text-accent" />
          </div>
          <div className="text-xs text-muted-foreground mb-1">New Users (Pending Activation)</div>
          <div className="font-display text-2xl font-bold text-accent">{newUsers.length}</div>
        </button>
      </div>

      {/* New Users Dialog */}
      <Dialog open={showNewUsers} onOpenChange={setShowNewUsers}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={18} className="text-accent" />
              New Users — Pending Activation ({newUsers.length})
            </DialogTitle>
          </DialogHeader>
          {newUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No new users pending activation 🎉</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-sm">{user.full_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                      <TableCell className="text-sm">{user.studio_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.sub_end ? new Date(user.sub_end).toLocaleDateString("en-IN") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-accent"
                            onClick={() => invokeAction("activate_user", user.id, "User activated")}>
                            <Play size={12} /> Activate
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-primary"
                            onClick={() => setSubForm({
                              userId: user.id,
                              userName: user.full_name || user.email,
                              startDate: new Date().toISOString().split("T")[0],
                              endDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
                            })}>
                            <CalendarPlus size={12} /> Activate + Subscribe
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1"
                            onClick={() => { setShowNewUsers(false); onNavigateToUsers("all"); }}>
                            <Edit size={12} /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-destructive"
                            onClick={() => invokeAction("block_user", user.id, "User blocked")}>
                            <Ban size={12} /> Block
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate + Subscribe Dialog */}
      <Dialog open={subForm !== null} onOpenChange={(open) => !open && setSubForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus size={18} className="text-primary" />
              Activate & Enable Subscription
            </DialogTitle>
          </DialogHeader>
          {subForm && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                User: <span className="text-foreground font-medium">{subForm.userName}</span>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                <input type="date" value={subForm.startDate}
                  onChange={(e) => setSubForm({ ...subForm, startDate: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">End Date</label>
                <input type="date" value={subForm.endDate}
                  onChange={(e) => setSubForm({ ...subForm, endDate: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
              <Button className="w-full" onClick={handleActivateAndSubscribe}>
                <Play size={14} /> Activate & Enable Subscription
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PC Activation Count — 1 to 10 PCs, clickable */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={18} className="text-primary" />
          <h2 className="font-display text-lg font-bold text-foreground">PC Activation Count</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
          {pcCards.map(({ pcCount, userCount }) => (
            <button
              key={pcCount}
              onClick={() => setSelectedPcCount(pcCount)}
              className="bg-card rounded-2xl border border-border p-4 shadow-card text-center transition-all hover:border-primary/40 hover:shadow-gold cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-2 mx-auto transition-colors">
                <Laptop size={18} className="text-primary" />
              </div>
              <div className="font-display text-2xl font-bold text-foreground">{userCount}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {pcCount} PC Activation
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PC Users Dialog */}
      <Dialog open={selectedPcCount !== null} onOpenChange={(open) => !open && setSelectedPcCount(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor size={18} className="text-primary" />
              {selectedPcCount} PC Activation — Users ({pcFilteredUsers.length})
            </DialogTitle>
          </DialogHeader>
          {pcFilteredUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No users with {selectedPcCount} PC activation</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>PC Count</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pcFilteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{user.full_name || "—"}</div>
                        {user.studio_name && <div className="text-xs text-muted-foreground">{user.studio_name}</div>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-bold">
                          {user.devices_count} PC{user.devices_count > 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{user.active_license?.plan_name || "—"}</div>
                        {user.days_left !== null && (
                          <div className={`font-semibold ${user.days_left <= 0 ? "text-destructive" : user.days_left <= 15 ? "text-amber-400" : "text-foreground"}`}>
                            {user.days_left <= 0 ? "Expired" : `${user.days_left}d left`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-bold ${getStatusClass(user)}`}>
                          {getStatusText(user)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end flex-wrap">
                          <Button size="sm" variant="ghost" className="text-xs h-7 gap-1"
                            onClick={() => { setSelectedPcCount(null); onNavigateToUsers("all"); }}>
                            <Eye size={12} /> View
                          </Button>
                          {!user.is_blocked && user.activation === 1 && (
                            <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-amber-400"
                              onClick={() => invokeAction("deactivate_user", user.id, "User deactivated")}>
                              <ShieldOff size={12} /> Deactivate
                            </Button>
                          )}
                          {!user.is_blocked ? (
                            <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-destructive"
                              onClick={() => invokeAction("block_user", user.id, "User blocked")}>
                              <Ban size={12} /> Block
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="text-xs h-7 gap-1 text-green-400"
                              onClick={() => invokeAction("unblock_user", user.id, "User unblocked")}>
                              <ShieldCheck size={12} /> Unblock
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expiry Alert Cards */}
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