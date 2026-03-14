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
  X,
  Check,
  ShieldCheck,
  AlertTriangle,
  Download,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
  has_active_license: boolean;
  active_license: any;
  licenses_count: number;
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
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired">("all");

  // Edit dialog
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);

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
          u.phone?.toLowerCase().includes(q)
      );
    }
    if (filterStatus === "active") result = result.filter((u) => u.has_active_license);
    if (filterStatus === "expired") result = result.filter((u) => !u.has_active_license);
    return result;
  }, [users, searchQuery, filterStatus]);

  const handleDelete = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete_user", user_id: userId },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "User deleted" });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
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
        device_id: activateDeviceId.trim() || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });
      if (error) throw error;

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

  const getRemainingDays = (license: any) => {
    if (!license) return null;
    const days = Math.ceil(
      (new Date(license.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Plan", "Expires", "Days Left"];
    const rows = filteredUsers.map((u) => {
      const days = getRemainingDays(u.active_license);
      return [
        u.full_name,
        u.email,
        u.phone,
        u.has_active_license ? "Active" : "Expired",
        u.active_license?.plan_name || "—",
        u.active_license?.expires_at ? new Date(u.active_license.expires_at).toLocaleDateString() : "—",
        days !== null ? days : "—",
      ];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Users <span className="text-muted-foreground font-normal text-base">({users.length})</span>
          </h2>
          <p className="text-sm text-muted-foreground">Manage all users, licenses, and profiles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active License</SelectItem>
            <SelectItem value="expired">No License</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const days = getRemainingDays(user.active_license);
                  const isExpiring = days !== null && days <= 15 && days > 0;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{user.email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.phone || "—"}</TableCell>
                      <TableCell>
                        {user.has_active_license ? (
                          <Badge variant="default" className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Expired
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.active_license?.plan_name || "—"}
                      </TableCell>
                      <TableCell>
                        {days !== null ? (
                          <span
                            className={`text-sm font-semibold ${
                              isExpiring
                                ? "text-amber-400"
                                : days <= 0
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {days <= 0 ? "Expired" : `${days}d`}
                            {isExpiring && (
                              <AlertTriangle size={12} className="inline ml-1 text-amber-400" />
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setActivateUser(user);
                              setSelectedPlan("");
                              setActivateDeviceId("");
                            }}
                            title="Activate License"
                          >
                            <ShieldCheck size={15} className="text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(user)}
                            title="Edit"
                          >
                            <Edit size={15} className="text-muted-foreground" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete">
                                <Trash2 size={15} className="text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{user.full_name || user.email}</strong> and all their data including licenses, downloads, and purchases. This cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
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
              <Label>Device ID (optional)</Label>
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
