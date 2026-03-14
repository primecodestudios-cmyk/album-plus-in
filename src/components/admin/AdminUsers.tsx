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

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  has_active_license: boolean;
  active_license: any;
  licenses_count: number;
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

export function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "blocked" | "expiring">("all");

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
    return result;
  }, [users, searchQuery, filterStatus]);

  const invokeAction = async (actionName: string, userId: string, label: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: actionName, user_id: userId },
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

      // Also set activation=1 in cpanel_user_data
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
    const headers = ["ID", "Name", "Studio", "Email", "Phone", "PCID", "City", "Plan", "Expiry", "Days Left", "Status"];
    const rows = filteredUsers.map((u) => [
      u.cpanel_id || "",
      u.full_name,
      u.studio_name,
      u.email,
      u.phone,
      u.pc_id,
      u.city,
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
    if (user.days_left !== null && user.days_left > 0 && user.days_left <= 15) {
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">🔴 Expiring</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setFilterStatus("all")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "all" ? "border-primary shadow-gold" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Users size={14} /> Total Users</div>
          <div className="font-display text-2xl font-bold text-foreground">{totalUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("active")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "active" ? "border-green-500" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ShieldCheck size={14} /> Active Users</div>
          <div className="font-display text-2xl font-bold text-green-400">{activeUsers}</div>
        </button>
        <button onClick={() => setFilterStatus("expiring")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filterStatus === "expiring" ? "border-amber-500" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><AlertTriangle size={14} /> Expiring ≤15d</div>
          <div className="font-display text-2xl font-bold text-amber-400">{expiringUsers}</div>
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
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const isExpiring = user.days_left !== null && user.days_left > 0 && user.days_left <= 15;
                  return (
                    <TableRow
                      key={user.id}
                      className={isExpiring ? "bg-amber-500/5" : user.is_blocked ? "bg-destructive/5" : ""}
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
                            user.days_left <= 0 ? "text-destructive" : isExpiring ? "text-amber-400" : "text-foreground"
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
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setViewUser(user)}>
                              <Eye size={14} className="mr-2" /> View Details
                            </DropdownMenuItem>
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
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit size={14} className="mr-2" /> Edit
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
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Monitor size={14} /> System Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">PC ID</div>
                    <div className="font-mono text-xs break-all">{viewUser.pc_id || "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Running Version</div>
                    <div className="font-medium">{viewUser.running_version || "—"}</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                    <div className="text-xs text-muted-foreground">System Info</div>
                    <div className="font-medium">{viewUser.system_info || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <h4 className="font-semibold text-foreground mb-2">Subscription</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Start Date</div>
                    <div className="font-medium">
                      {viewUser.sub_start ? new Date(viewUser.sub_start).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">End Date</div>
                    <div className="font-medium">
                      {viewUser.sub_end ? new Date(viewUser.sub_end).toLocaleDateString("en-IN") : "—"}
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground">Days Left</div>
                    <div className={`font-bold ${
                      viewUser.days_left !== null && viewUser.days_left <= 15 ? "text-amber-400" :
                      viewUser.days_left !== null && viewUser.days_left <= 0 ? "text-destructive" : "text-foreground"
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
