import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor, Search, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Eye, Trash2,
} from "lucide-react";

const PAGE_SIZE = 10;

interface DeviceRequest {
  id: string;
  user_id: string;
  email: string;
  device_id: string;
  system_name: string;
  windows_version: string;
  software_version: string;
  ip_address: string;
  request_date: string;
  status: string;
  admin_notes: string;
}

export function AdminDeviceRequests() {
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activatingPlan, setActivatingPlan] = useState<Record<string, string>>({});
  const [activatingDays, setActivatingDays] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("device_requests")
      .select("*")
      .order("request_date", { ascending: false });

    if (error) {
      toast({ title: "Error loading requests", variant: "destructive" });
    } else {
      setRequests((data as DeviceRequest[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (req: DeviceRequest) => {
    const planName = activatingPlan[req.id] || "28 Days";
    const days = activatingDays[req.id] || 28;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // Create license
    const { error: licError } = await supabase.from("user_licenses").insert({
      user_id: req.user_id,
      device_id: req.device_id,
      plan_name: planName,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (licError) {
      toast({ title: "Failed to create license: " + licError.message, variant: "destructive" });
      return;
    }

    // Update request status
    const { error } = await supabase
      .from("device_requests")
      .update({ status: "approved" } as any)
      .eq("id", req.id);

    if (error) {
      toast({ title: "Failed to update request", variant: "destructive" });
    } else {
      toast({ title: `License activated for ${req.email}` });
      fetchRequests();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from("device_requests")
      .update({ status: "rejected" } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to reject", variant: "destructive" });
    } else {
      toast({ title: "Request rejected" });
      fetchRequests();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("device_requests").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Request deleted" });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.email.toLowerCase().includes(q) ||
      r.device_id.toLowerCase().includes(q) ||
      r.system_name.toLowerCase().includes(q) ||
      r.ip_address.includes(q);

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const statusFilters: { id: typeof statusFilter; label: string }[] = [
    { id: "all", label: `All (${requests.length})` },
    { id: "pending", label: `Pending (${pendingCount})` },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ];

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/10 text-amber-500",
      approved: "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]",
      rejected: "bg-destructive/10 text-destructive",
    };
    const icons: Record<string, typeof Clock> = {
      pending: Clock,
      approved: CheckCircle,
      rejected: XCircle,
    };
    const Icon = icons[status] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${styles[status] || ""}`}>
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg font-bold text-foreground">
            Device Requests
          </h2>
          {pendingCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search email, device ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 h-9 text-sm w-full sm:w-64"
            />
          </div>
          <div className="flex gap-1">
            {statusFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => { setStatusFilter(f.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.id
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Monitor size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No device requests found.</p>
        </div>
      )}

      {/* Table */}
      {paginated.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Device ID</th>
                  <th className="text-left p-4 font-medium">System</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((req) => (
                  <>
                    <tr key={req.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4">
                        <div className="font-medium text-foreground text-xs">{req.email}</div>
                      </td>
                      <td className="p-4">
                        <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {req.device_id.length > 16 ? req.device_id.slice(0, 16) + "..." : req.device_id}
                        </code>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {req.system_name || "—"}
                        {req.windows_version && <span className="ml-1 text-[10px]">({req.windows_version})</span>}
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">{formatDate(req.request_date)}</td>
                      <td className="p-4">{statusBadge(req.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {req.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-accent h-7"
                                onClick={() => setDetailId(detailId === req.id ? null : req.id)}
                              >
                                <CheckCircle size={14} className="mr-1" /> Activate
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs text-destructive h-7"
                                onClick={() => handleReject(req.id)}
                              >
                                <XCircle size={14} className="mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground h-7"
                            onClick={() => setDetailId(detailId === req.id ? null : req.id)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-muted-foreground hover:text-destructive h-7"
                            onClick={() => handleDelete(req.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable detail row */}
                    {detailId === req.id && (
                      <tr key={`${req.id}-detail`}>
                        <td colSpan={6} className="p-0">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-muted/30 px-4 py-4 border-b border-border"
                          >
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                              <div>
                                <span className="text-muted-foreground">Full Device ID</span>
                                <p className="font-mono text-foreground mt-0.5 break-all">{req.device_id}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">System Name</span>
                                <p className="text-foreground mt-0.5">{req.system_name || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Windows Version</span>
                                <p className="text-foreground mt-0.5">{req.windows_version || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Software Version</span>
                                <p className="text-foreground mt-0.5">{req.software_version || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">IP Address</span>
                                <p className="font-mono text-foreground mt-0.5">{req.ip_address || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">User ID</span>
                                <p className="font-mono text-foreground mt-0.5 break-all">{req.user_id}</p>
                              </div>
                            </div>

                            {req.status === "pending" && (
                              <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
                                <div>
                                  <label className="text-[10px] text-muted-foreground mb-1 block">Plan</label>
                                  <select
                                    value={activatingPlan[req.id] || "28 Days"}
                                    onChange={(e) => {
                                      setActivatingPlan((p) => ({ ...p, [req.id]: e.target.value }));
                                      const map: Record<string, number> = { "28 Days": 28, "3 Months": 90, "6 Months": 180, "1 Year": 365 };
                                      setActivatingDays((p) => ({ ...p, [req.id]: map[e.target.value] || 28 }));
                                    }}
                                    className="h-8 px-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                                  >
                                    <option>28 Days</option>
                                    <option>3 Months</option>
                                    <option>6 Months</option>
                                    <option>1 Year</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground mb-1 block">Days</label>
                                  <input
                                    type="number"
                                    value={activatingDays[req.id] || 28}
                                    onChange={(e) => setActivatingDays((p) => ({ ...p, [req.id]: Number(e.target.value) }))}
                                    className="h-8 w-20 px-2 rounded-lg bg-secondary border border-border text-foreground text-xs"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-gradient-gold text-accent-foreground font-semibold h-8 text-xs rounded-lg gap-1"
                                  onClick={() => handleApprove(req)}
                                >
                                  <CheckCircle size={14} /> Approve & Create License
                                </Button>
                              </div>
                            )}
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={`e-${idx}`} className="px-1 text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                      p === safePage
                        ? "bg-accent/15 text-accent border border-accent/30"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
