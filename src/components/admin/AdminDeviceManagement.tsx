import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor,
  Search,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Download,
  Laptop,
  Smartphone,
  Cpu,
  Globe,
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
} from "@/components/ui/alert-dialog";

interface DeviceRecord {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  system_info: string;
  windows_version: string;
  running_version: string;
  ip_address: string;
  is_active: boolean;
  activated_at: string;
  last_seen_at: string;
  license_id: string | null;
  created_at: string;
  // Enriched
  full_name: string;
  phone: string;
  email: string;
}

type FilterType = "all" | "active" | "inactive";

export function AdminDeviceManagement() {
  const { toast } = useToast();
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [deleteDevice, setDeleteDevice] = useState<DeviceRecord | null>(null);
  const [detailDevice, setDetailDevice] = useState<DeviceRecord | null>(null);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list_devices" },
      });
      if (error) throw error;
      if (data?.devices) setDevices(data.devices);
    } catch (err: any) {
      toast({ title: "Error loading devices", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const filteredDevices = useMemo(() => {
    let result = devices;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.device_id?.toLowerCase().includes(q) ||
          d.full_name?.toLowerCase().includes(q) ||
          d.email?.toLowerCase().includes(q) ||
          d.phone?.toLowerCase().includes(q) ||
          d.device_name?.toLowerCase().includes(q) ||
          d.system_info?.toLowerCase().includes(q)
      );
    }
    if (filter === "active") result = result.filter((d) => d.is_active);
    if (filter === "inactive") result = result.filter((d) => !d.is_active);
    return result;
  }, [devices, searchQuery, filter]);

  const handleToggle = async (device: DeviceRecord) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "toggle_device", device_record_id: device.id },
      });
      if (error) throw error;
      if (data?.success) {
        const syncMsg = data.cpanel_sync ? " (cPanel synced ✅)" : "";
        toast({ title: `Device ${data.is_active ? "activated" : "deactivated"}${syncMsg}` });
        fetchDevices();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteDevice) return;
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "remove_device", device_record_id: deleteDevice.id },
      });
      if (error) throw error;
      if (data?.success) {
        const syncMsg = data.cpanel_sync ? " (cPanel synced ✅)" : "";
        toast({ title: `Device removed${syncMsg}` });
        setDeleteDevice(null);
        fetchDevices();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = ["User", "Email", "Phone", "Device ID", "System", "Version", "Status", "Activated", "Last Seen"];
    const rows = filteredDevices.map((d) => [
      d.full_name,
      d.email,
      d.phone,
      d.device_id,
      d.system_info,
      d.running_version,
      d.is_active ? "Active" : "Inactive",
      new Date(d.activated_at).toLocaleDateString("en-IN"),
      d.last_seen_at ? new Date(d.last_seen_at).toLocaleDateString("en-IN") : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const totalDevices = devices.length;
  const activeDevices = devices.filter((d) => d.is_active).length;
  const inactiveDevices = totalDevices - activeDevices;
  const uniqueUsers = new Set(devices.map((d) => d.user_id)).size;
  const multiPcUsers = (() => {
    const counts: Record<string, number> = {};
    devices.forEach((d) => { counts[d.user_id] = (counts[d.user_id] || 0) + 1; });
    return Object.values(counts).filter((c) => c > 1).length;
  })();

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading devices...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Monitor size={14} /> Total Devices</div>
          <div className="font-display text-2xl font-bold text-foreground">{totalDevices}</div>
        </div>
        <button onClick={() => setFilter("active")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filter === "active" ? "border-green-500" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ShieldCheck size={14} /> Active</div>
          <div className="font-display text-2xl font-bold text-green-400">{activeDevices}</div>
        </button>
        <button onClick={() => setFilter("inactive")} className={`bg-card rounded-2xl border p-4 text-left transition-all ${filter === "inactive" ? "border-destructive" : "border-border"}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><ShieldOff size={14} /> Inactive</div>
          <div className="font-display text-2xl font-bold text-destructive">{inactiveDevices}</div>
        </button>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Laptop size={14} /> Unique Users</div>
          <div className="font-display text-2xl font-bold text-foreground">{uniqueUsers}</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Cpu size={14} /> Multi-PC Users</div>
          <div className="font-display text-2xl font-bold text-primary">{multiPcUsers}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          PC Management <span className="text-muted-foreground font-normal text-base">({filteredDevices.length})</span>
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download size={14} /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setFilter("all"); setSearchQuery(""); }} className="gap-2">
            Clear Filter
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDevices} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, device ID, system info..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "all" as FilterType, label: "All", count: totalDevices },
          { id: "active" as FilterType, label: "Active", count: activeDevices },
          { id: "inactive" as FilterType, label: "Inactive", count: inactiveDevices },
        ]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.id
                ? "bg-accent/15 text-accent border border-accent/30"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Devices Table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>System</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Activated</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No devices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id} className={!device.is_active ? "bg-destructive/5" : ""}>
                    <TableCell>
                      <div className="font-medium text-sm">{device.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{device.phone || ""}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{device.email}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => setDetailDevice(device)}
                        className="font-mono text-xs text-primary hover:underline cursor-pointer max-w-[140px] truncate block"
                        title={device.device_id}
                      >
                        {device.device_id.length > 16 ? device.device_id.slice(0, 16) + "..." : device.device_id}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={device.system_info}>
                      {device.system_info || "—"}
                    </TableCell>
                    <TableCell className="text-xs">{device.running_version || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(device.activated_at).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {device.last_seen_at ? new Date(device.last_seen_at).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={device.is_active
                        ? "bg-green-600/20 text-green-400 border-green-600/30"
                        : "bg-destructive/20 text-destructive border-destructive/30"
                      }>
                        {device.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`text-xs h-7 ${device.is_active ? "text-amber-400" : "text-green-400"}`}
                          onClick={() => handleToggle(device)}
                        >
                          {device.is_active ? <><ShieldOff size={12} className="mr-1" /> Deactivate</> : <><ShieldCheck size={12} className="mr-1" /> Activate</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-destructive"
                          onClick={() => setDeleteDevice(device)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Device Detail Dialog */}
      <Dialog open={!!detailDevice} onOpenChange={(open) => !open && setDetailDevice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Monitor size={18} /> Device Details</DialogTitle>
          </DialogHeader>
          {detailDevice && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">User</div>
                  <div className="font-medium">{detailDevice.full_name || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="font-medium text-xs break-all">{detailDevice.email}</div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-xs text-muted-foreground">Full Device ID</div>
                <div className="font-mono text-xs break-all">{detailDevice.device_id}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Cpu size={10} /> System</div>
                  <div className="font-medium text-xs">{detailDevice.system_info || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Windows</div>
                  <div className="font-medium text-xs">{detailDevice.windows_version || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">App Version</div>
                  <div className="font-medium text-xs">{detailDevice.running_version || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Globe size={10} /> IP</div>
                  <div className="font-medium text-xs">{detailDevice.ip_address || "—"}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Activated</div>
                  <div className="font-medium text-xs">{new Date(detailDevice.activated_at).toLocaleDateString("en-IN")}</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">Last Seen</div>
                  <div className="font-medium text-xs">{detailDevice.last_seen_at ? new Date(detailDevice.last_seen_at).toLocaleDateString("en-IN") : "—"}</div>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <Badge className={detailDevice.is_active
                    ? "bg-green-600/20 text-green-400 border-green-600/30"
                    : "bg-destructive/20 text-destructive border-destructive/30"
                  }>
                    {detailDevice.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className={`text-xs ${detailDevice.is_active ? "text-amber-400" : "text-green-400"}`}
                  onClick={() => { handleToggle(detailDevice); setDetailDevice(null); }}
                >
                  {detailDevice.is_active ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDevice} onOpenChange={(open) => !open && setDeleteDevice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device</AlertDialogTitle>
            <AlertDialogDescription>
              Remove device <strong className="font-mono">{deleteDevice?.device_id?.slice(0, 20)}...</strong> for{" "}
              <strong>{deleteDevice?.full_name || deleteDevice?.email}</strong>? This will also deactivate any linked licenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
