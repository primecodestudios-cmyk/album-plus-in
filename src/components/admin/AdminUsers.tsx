import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  Edit,
  Check,
  ShieldCheck,
  ShieldOff,
  Ban,
  Unlock,
  AlertTriangle,
  Download,
  Eye,
  X,
  Monitor,
  MapPin,
  Calendar,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type UserFilter = "all" | "active" | "inactive" | "blocked" | "expiring" | "expiring7" | "expired";

interface DeviceInfo {
  device_id: string;
  plan_name?: string;
  is_active?: boolean;
  expires_at?: string;
  starts_at?: string;
  license_id?: string;
  record_id?: string;
  system_info?: string;
  running_version?: string;
  windows_version?: string;
  ip_address?: string;
  activated_at?: string;
  last_seen_at?: string;
  device_name?: string;
}

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  has_active_license: boolean;
  active_license: any;
  all_licenses: any[];
  licenses_count: number;
  devices: DeviceInfo[];
  devices_count: number;
  is_blocked: boolean;
  days_left: number | null;
  cpanel_id: number | null;
  pc_id: string;
  sub_start: string | null;
  sub_end: string | null;
  short_name: string;
  studio_name: string;
  city: string;
  address: string;
  activation: number;
  block_user: number;
  running_version: string;
  system_info: string;
  cpanel_created: string;
  note1: string;
  note2: string;
}

interface PricingPlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
}

interface AdminUsersProps {
  initialFilter?: UserFilter;
}

export function AdminUsers({ initialFilter = "all" }: AdminUsersProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<UserFilter>(initialFilter);

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStudio, setEditStudio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNote1, setEditNote1] = useState("");
  const [editNote2, setEditNote2] = useState("");
  const [saving, setSaving] = useState(false);

  // View details dialog
  const [viewUser, setViewUser] = useState<UserRow | null>(null);

  // Activate dialog
  const [activateUser, setActivateUser] = useState<UserRow | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [activateDeviceId, setActivateDeviceId] = useState("");
  const [activating, setActivating] = useState(false);

  // Subscription edit dialog
  const [subEditUser, setSubEditUser] = useState<UserRow | null>(null);
  const [subStart, setSubStart] = useState("");
  const [subEnd, setSubEnd] = useState("");
  const [subPlan, setSubPlan] = useState("");
  const [subEnabled, setSubEnabled] = useState(true);
  const [subSaving, setSubSaving] = useState(false);

  // Devices dialog
  const [devicesUser, setDevicesUser] = useState<UserRow | null>(null);

  // Sync filter from parent
  useEffect(() => {
    setFilterStatus(initialFilter);
  }, [initialFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_users" },
      });
      if (error) throw error;
      if (data?.users) setUsers(data.users);
    } catch (err: any) {
      toast({ title: "Error loading users", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("duration_days");
    if (data) setPlans(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.studio_name?.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q) ||
          u.pc_id?.toLowerCase().includes(q)
      );
    }
    if (filterStatus === "active") result = result.filter((u) => u.activation === 1 && !u.is_blocked);
    if (filterStatus === "inactive") result = result.filter((u) => u.activation !== 1 && !u.is_blocked);
    if (filterStatus === "blocked") result = result.filter((u) => u.is_blocked || u.block_user === 1);
    if (filterStatus === "expiring") {
      result = result.filter((u) => u.days_left !== null && u.days_left > 0 && u.days_left <= 15);
    }
    if (filterStatus === "expiring7") {
      result = result.filter((u) => u.days_left !== null && u.days_left > 0 && u.days_left <= 7);
    }
    if (filterStatus === "expired") {
      result = result.filter((u) => u.days_left !== null && u.days_left <= 0);
    }
    return result;
  }, [users, searchQuery, filterStatus]);

  const invokeAction = async (actionName: string, userId: string, label: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: actionName, user_id: userId },
      });
      if (error) throw error;
      if (data?.success) {
        const syncInfo = data.cpanel_sync ? " (cPanel synced ✅)" : "";
        toast({ title: label + syncInfo });
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const invokeDeviceAction = async (actionName: string, licenseId: string, label: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: actionName, license_id: licenseId },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: label });
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = (user: UserRow) => {
    setEditUser(user);
    setEditName(user.full_name);
    setEditPhone(user.phone);
    setEditEmail(user.email);
    setEditStudio(user.studio_name);
    setEditCity(user.city);
    setEditAddress(user.address);
    setEditNote1(user.note1);
    setEditNote2(user.note2);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "update_profile",
          user_id: editUser.id,
          full_name: editName,
          phone: editPhone,
          email: editEmail,
          studio_name: editStudio,
          city: editCity,
          address: editAddress,
          note1: editNote1,
          note2: editNote2,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "User updated" });
        setEditUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSubEdit = (user: UserRow) => {
    setSubEditUser(user);
    const start = user.sub_start || user.active_license?.starts_at || "";
    const end = user.sub_end || user.active_license?.expires_at || "";
    setSubStart(start ? new Date(start).toISOString().split("T")[0] : "");
    setSubEnd(end ? new Date(end).toISOString().split("T")[0] : "");
    setSubPlan(user.active_license?.plan_name || "28 Days");
    setSubEnabled(user.activation === 1);
  };

  const handleSaveSubscription = async () => {
    if (!subEditUser) return;
    setSubSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: {
          action: "update_subscription",
          user_id: subEditUser.id,
          sub_start: subStart ? new Date(subStart).toISOString() : undefined,
          sub_end: subEnd ? new Date(subEnd).toISOString() : undefined,
          plan_name: subPlan,
          is_enabled: subEnabled,
          license_id: subEditUser.active_license?.id || undefined,
        },
      });
      if (error) throw error;
      if (data?.success) {
        const syncMsg = data.cpanel_sync 
          ? "Subscription updated & synced to cPanel ✅" 
          : "Subscription updated (cPanel sync not configured)";
        toast({ title: syncMsg });
        setSubEditUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubSaving(false);
    }
  };

  const subDaysRemaining = useMemo(() => {
    if (!subEnd) return null;
    const diff = Math.ceil((new Date(subEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [subEnd]);

  const subTotalDays = useMemo(() => {
    if (!subStart || !subEnd) return null;
    return Math.ceil((new Date(subEnd).getTime() - new Date(subStart).getTime()) / (1000 * 60 * 60 * 24));
  }, [subStart, subEnd]);

  const handleActivate = async () => {
    if (!activateUser || !selectedPlan) return;
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setActivating(true);
    try {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      const { error } = await supabase.from("user_licenses").insert({
        user_id: activateUser.id,
        plan_name: plan.plan_name,
        device_id: activateDeviceId.trim() || activateUser.pc_id || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });
      if (error) throw error;

      await supabase.functions.invoke("admin-users", {
        body: { action: "activate_user", user_id: activateUser.id },
      });

      toast({ title: "License activated!", description: `${plan.plan_name} for ${activateUser.full_name || activateUser.email}` });
      setActivateUser(null);
      setSelectedPlan("");
      setActivateDeviceId("");
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActivating(false);
    }
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Studio", "Email", "Phone", "PCID", "City", "PCs", "Plan", "Expiry", "Days Left", "Status"];
    const rows = filteredUsers.map((u) => [
      u.cpanel_id || "",
      u.full_name,
      u.studio_name,
      u.email,
      u.phone,
      u.pc_id,
      u.city,
      u.devices_count || 0,
      u.active_license?.plan_name || "—",
      u.sub_end ? new Date(u.sub_end).toLocaleDateString("en-IN") : "—",
      u.days_left ?? "—",
      u.is_blocked ? "Blocked" : u.activation === 1 ? "Active" : "Inactive",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (user: UserRow) => {
    if (user.is_blocked || user.block_user === 1) {
      return <Badge variant="destructive" className="text-xs">🚫 Blocked</Badge>;
    }
    if (user.days_left !== null && user.days_left <= 0) {
      return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">❌ Expired</Badge>;
    }
    if (user.days_left !== null && user.days_left > 0 && user.days_left <= 7) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">🔴 Expiring</Badge>;
    }
    if (user.days_left !== null && user.days_left > 0 && user.days_left <= 15) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">🟡 Expiring</Badge>;
    }
    if (user.activation === 1) {
      return <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">✅ Active</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
  };

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading users...</div>;
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.activation === 1 && !u.is_blocked).length;
  const blockedUsers = users.filter((u) => u.is_blocked || u.block_user === 1).length;
  const expiringUsers = users.filter((u) => u.days_left !== null && u.days_left > 0 && u.days_left <= 15).length;
  const expiredUsers = users.filter((u) => u.days_left !== null && u.days_left <= 0).length;

  const filterButtons: { id: UserFilter; label: string; count?: number; color?: string }[] = [
    { id: "all", label: "All", count: totalUsers },
    { id: "active", label: "Active", count: activeUsers, color: "text-green-400" },
    { id: "expiring", label: "Expiring ≤15d", count: expiringUsers, color: "text-amber-400" },
    { id: "expiring7", label: "Expiring ≤7d", color: "text-orange-400" },
    { id: "expired", label: "Expired", count: expiredUsers, color: "text-destructive" },
    { id: "blocked", label: "Blocked", count: blockedUsers, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button onClick={() => setFilterStatus("all")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "all" ? "border-primary shadow-gold" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Users size={14} /> Total Users</div>
          <div className="font-display text-2xl font-bold text-foreground">{totalUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("active")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "active" ? "border-green-500" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ShieldCheck size={14} /> Active</div>
          <div className="font-display text-2xl font-bold text-green-400">{activeUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("expiring")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "expiring" ? "border-amber-500" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><AlertTriangle size={14} /> Expiring ≤15d</div>
          <div className="font-display text-2xl font-bold text-amber-400">{expiringUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("expired")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "expired" ? "border-destructive" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><X size={14} /> Expired</div>
          <div className="font-display text-2xl font-bold text-destructive">{expiredUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("blocked")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "blocked" ? "border-destructive" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Ban size={14} /> Blocked</div>
          <div className="font-display text-2xl font-bold text-destructive">{blockedUsers}</div>
        </button>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          Users <span className="text-muted-foreground font-normal text-base">({filteredUsers.length})</span>
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, phone, studio, city, PCID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterStatus === f.id
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label} {f.count !== undefined && `(${f.count})`}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">ID</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Studio</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>PCID</TableHead>
                <TableHead>PCs</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isExpiring = user.days_left !== null && user.days_left > 0 && user.days_left <= 15;
                  const isExpired = user.days_left !== null && user.days_left <= 0;
                  return (
                    <TableRow
                      key={user.id}
                      className={isExpired ? "bg-destructive/5" : isExpiring ? "bg-amber-500/5" : user.is_blocked ? "bg-destructive/5" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground">{user.cpanel_id || "—"}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{user.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{user.phone || ""}</div>
                      </TableCell>
                      <TableCell className="text-sm">{user.studio_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground max-w-[120px] truncate" title={user.pc_id}>
                        {user.pc_id ? user.pc_id.substring(0, 12) + "..." : "—"}
                      </TableCell>
                      <TableCell>
                        {user.devices_count > 0 ? (
                          <button
                            onClick={() => setDevicesUser(user)}
                            className="text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            {user.devices_count} PC{user.devices_count > 1 ? "s" : ""}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{user.active_license?.plan_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {user.sub_end
                          ? new Date(user.sub_end).toLocaleDateString("en-IN")
                          : user.active_license?.expires_at
                          ? new Date(user.active_license.expires_at).toLocaleDateString("en-IN")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {user.days_left !== null ? (
                          <span className={`text-sm font-semibold ${
                            user.days_left <= 0 ? "text-destructive" : user.days_left <= 7 ? "text-orange-400" : isExpiring ? "text-amber-400" : "text-foreground"
                          }`}>
                            {user.days_left <= 0 ? "Expired" : `${user.days_left}d`}
                            {isExpiring && <AlertTriangle size={12} className="inline ml-1" />}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                              Actions ▾
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setViewUser(user)}>
                              <Eye size={14} className="mr-2" /> View Details
                            </DropdownMenuItem>
                            {user.devices_count > 0 && (
                              <DropdownMenuItem onClick={() => setDevicesUser(user)}>
                                <Monitor size={14} className="mr-2" /> View Devices ({user.devices_count})
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.activation !== 1 && (
                              <DropdownMenuItem onClick={() => invokeAction("activate_user", user.id, "User activated")}>
                                <ShieldCheck size={14} className="mr-2 text-green-400" /> Activate
                              </DropdownMenuItem>
                            )}
                            {user.activation === 1 && (
                              <DropdownMenuItem onClick={() => invokeAction("deactivate_user", user.id, "User deactivated")}>
                                <ShieldOff size={14} className="mr-2 text-amber-400" /> Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setActivateUser(user);
                              setSelectedPlan("");
                              setActivateDeviceId(user.pc_id || "");
                            }}>
                              <ShieldCheck size={14} className="mr-2 text-primary" /> New License
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenSubEdit(user)}>
                              <Calendar size={14} className="mr-2 text-accent" /> Edit Subscription
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit size={14} className="mr-2" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.is_blocked || user.block_user === 1 ? (
                              <DropdownMenuItem onClick={() => invokeAction("unblock_user", user.id, "User unblocked")}>
                                <Unlock size={14} className="mr-2 text-green-400" /> Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => invokeAction("block_user", user.id, "User blocked")} className="text-amber-400">
                                <Ban size={14} className="mr-2" /> Block
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) {
                                  invokeAction("delete_user", user.id, "User deleted");
                                }
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">cPanel ID</div>
                  <div className="font-medium">{viewUser.cpanel_id || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Short Name</div>
                  <div className="font-medium">{viewUser.short_name || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">User Name</div>
                  <div className="font-medium">{viewUser.full_name || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Studio Name</div>
                  <div className="font-medium">{viewUser.studio_name || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium">{viewUser.email}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Mobile</div>
                  <div className="font-medium">{viewUser.phone || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12} /> City</div>
                  <div className="font-medium">{viewUser.city || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Address</div>
                  <div className="font-medium">{viewUser.address || "—"}</div>
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Monitor size={14} /> Devices ({viewUser.devices_count})</h4>
                {viewUser.devices && viewUser.devices.length > 0 ? (
                  <div className="space-y-2">
                    {viewUser.devices.map((d: DeviceInfo, i: number) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">PCID</span>
                          <p className="font-mono break-all">{d.device_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status</span>
                          <p className={d.is_active ? "text-green-400 font-bold" : "text-destructive font-bold"}>
                            {d.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                        {d.running_version && (
                          <div>
                            <span className="text-muted-foreground">Version</span>
                            <p>{d.running_version}</p>
                          </div>
                        )}
                        {d.system_info && (
                          <div>
                            <span className="text-muted-foreground">System</span>
                            <p>{d.system_info}</p>
                          </div>
                        )}
                        {d.plan_name && (
                          <div>
                            <span className="text-muted-foreground">Plan</span>
                            <p>{d.plan_name}</p>
                          </div>
                        )}
                        {d.expires_at && (
                          <div>
                            <span className="text-muted-foreground">Expires</span>
                            <p>{new Date(d.expires_at).toLocaleDateString("en-IN")}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">PC ID</div>
                      <div className="font-mono text-xs break-all">{viewUser.pc_id || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Running Version</div>
                      <div className="font-medium">{viewUser.running_version || "—"}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">System Info</div>
                      <div className="font-medium">{viewUser.system_info || "—"}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="font-semibold text-foreground mb-2">Subscription</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Start Date</div>
                    <div className="font-medium">{viewUser.sub_start ? new Date(viewUser.sub_start).toLocaleDateString("en-IN") : "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">End Date</div>
                    <div className="font-medium">{viewUser.sub_end ? new Date(viewUser.sub_end).toLocaleDateString("en-IN") : "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Days Left</div>
                    <div className={`font-bold ${
                      viewUser.days_left !== null && viewUser.days_left <= 0 ? "text-destructive" :
                      viewUser.days_left !== null && viewUser.days_left <= 15 ? "text-amber-400" : "text-foreground"
                    }`}>
                      {viewUser.days_left !== null ? (viewUser.days_left <= 0 ? "Expired" : `${viewUser.days_left} days`) : "—"}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div>{getStatusBadge(viewUser)}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Note 1</div>
                    <div className="font-medium">{viewUser.note1 || "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Note 2</div>
                    <div className="font-medium">{viewUser.note2 || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Account Created</div>
                <div className="font-medium">{viewUser.cpanel_created || new Date(viewUser.created_at).toLocaleDateString("en-IN")}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div>
                <Label>Studio Name</Label>
                <Input value={editStudio} onChange={(e) => setEditStudio(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value={editCity} onChange={(e) => setEditCity(e.target.value)} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Note 1</Label>
              <Textarea value={editNote1} onChange={(e) => setEditNote1(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Note 2</Label>
              <Textarea value={editNote2} onChange={(e) => setEditNote2(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={saving} className="gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Edit Dialog */}
      <Dialog open={!!subEditUser} onOpenChange={(open) => !open && setSubEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar size={18} /> Edit Subscription
            </DialogTitle>
          </DialogHeader>
          {subEditUser && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/30 rounded-xl p-3 text-sm">
                <span className="text-muted-foreground">User: </span>
                <strong>{subEditUser.full_name || subEditUser.email}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={subStart} onChange={(e) => setSubStart(e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={subEnd} onChange={(e) => setSubEnd(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Days</Label>
                  <div className="h-10 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm font-medium">
                    {subTotalDays !== null ? `${subTotalDays} days` : "—"}
                  </div>
                </div>
                <div>
                  <Label>Days Remaining</Label>
                  <div className={`h-10 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm font-bold ${
                    subDaysRemaining !== null && subDaysRemaining <= 0 ? "text-destructive" :
                    subDaysRemaining !== null && subDaysRemaining <= 15 ? "text-amber-400" : "text-foreground"
                  }`}>
                    {subDaysRemaining !== null ? (subDaysRemaining <= 0 ? "Expired" : `${subDaysRemaining} days`) : "—"}
                  </div>
                </div>
              </div>

              <div>
                <Label>Plan Name</Label>
                <select
                  value={subPlan}
                  onChange={(e) => {
                    setSubPlan(e.target.value);
                    // Auto-set end date based on plan
                    const planDays: Record<string, number> = { "28 Days": 28, "3 Months": 90, "6 Months": 180, "1 Year": 365 };
                    if (planDays[e.target.value] && subStart) {
                      const end = new Date(subStart);
                      end.setDate(end.getDate() + planDays[e.target.value]);
                      setSubEnd(end.toISOString().split("T")[0]);
                    }
                  }}
                  className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-foreground text-sm"
                >
                  <option>28 Days</option>
                  <option>3 Months</option>
                  <option>6 Months</option>
                  <option>1 Year</option>
                  <option>Custom</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Label>Subscription Status</Label>
                <button
                  onClick={() => setSubEnabled(!subEnabled)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    subEnabled
                      ? "bg-green-600/20 text-green-400 border border-green-600/30"
                      : "bg-destructive/20 text-destructive border border-destructive/30"
                  }`}
                >
                  {subEnabled ? "✅ Enabled" : "❌ Disabled"}
                </button>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveSubscription} disabled={subSaving} className="gap-2">
              {subSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Save Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Devices Dialog */}
      <Dialog open={!!devicesUser} onOpenChange={(open) => !open && setDevicesUser(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor size={18} /> Device Activations
            </DialogTitle>
          </DialogHeader>
          {devicesUser && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-3 text-sm flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <strong>{devicesUser.full_name || devicesUser.email}</strong>
                  {devicesUser.phone && <span className="text-muted-foreground ml-2">• {devicesUser.phone}</span>}
                </div>
                <Badge variant="secondary">{devicesUser.devices_count} PC{devicesUser.devices_count > 1 ? "s" : ""}</Badge>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PCID</TableHead>
                    <TableHead>System Info</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devicesUser.devices && devicesUser.devices.length > 0 ? (
                    devicesUser.devices.map((d: DeviceInfo, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs max-w-[150px] truncate" title={d.device_id}>
                          {d.device_id.length > 16 ? d.device_id.slice(0, 16) + "..." : d.device_id}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{d.system_info || "—"}</TableCell>
                        <TableCell className="text-xs">{d.running_version || "—"}</TableCell>
                        <TableCell className="text-xs">{d.plan_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {d.last_seen_at ? new Date(d.last_seen_at).toLocaleDateString("en-IN") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={d.is_active ? "bg-green-600/20 text-green-400 border-green-600/30" : "bg-destructive/20 text-destructive border-destructive/30"}>
                            {d.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {d.license_id && d.is_active && (
                              <Button size="sm" variant="ghost" className="text-xs text-amber-400 h-7"
                                onClick={() => { invokeDeviceAction("deactivate_device", d.license_id!, "Device deactivated"); setDevicesUser(null); }}>
                                <ShieldOff size={12} className="mr-1" /> Deactivate
                              </Button>
                            )}
                            {d.license_id && !d.is_active && (
                              <Button size="sm" variant="ghost" className="text-xs text-green-400 h-7"
                                onClick={() => { invokeDeviceAction("activate_device", d.license_id!, "Device activated"); setDevicesUser(null); }}>
                                <ShieldCheck size={12} className="mr-1" /> Activate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-4">No devices found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activate License Dialog */}
      <Dialog open={!!activateUser} onOpenChange={(open) => !open && setActivateUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate License</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/30 rounded-xl p-3 text-sm">
              <span className="text-muted-foreground">User: </span>
              <strong>{activateUser?.full_name || activateUser?.email}</strong>
              {activateUser?.studio_name && (
                <span className="text-muted-foreground"> • {activateUser.studio_name}</span>
              )}
            </div>
            <div>
              <Label>Plan *</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.plan_name} — {p.duration_days} days — ₹{p.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Device ID</Label>
              <Input
                value={activateDeviceId}
                onChange={(e) => setActivateDeviceId(e.target.value)}
                placeholder="PC/Device ID"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleActivate} disabled={activating || !selectedPlan} className="gap-2">
              {activating ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
