import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Power, RefreshCw, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface Device {
  device_id: string;
  device_name: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  activated_at: string;
  system_info: string | null;
  windows_version: string | null;
  running_version: string | null;
}

interface DeviceManagementProps {
  maxDevices: number;
}

export function DeviceManagement({ maxDevices }: DeviceManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_devices")
      .select("device_id, device_name, is_active, last_seen_at, activated_at, system_info, windows_version, running_version")
      .eq("user_id", user.id)
      .order("activated_at", { ascending: false });
    if (data) setDevices(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleDeactivate = async (deviceId: string) => {
    if (!user) return;
    setDeactivating(deviceId);
    try {
      const { data, error } = await supabase.functions.invoke("deactivate-device", {
        body: { user_id: user.id, device_id: deviceId },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Device deactivated successfully" });
        fetchDevices();
      } else {
        toast({ title: data?.error || "Failed to deactivate", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error deactivating device", variant: "destructive" });
    }
    setDeactivating(null);
  };

  const activeCount = devices.filter((d) => d.is_active).length;

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-card animate-pulse">
        <div className="h-6 bg-secondary rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-secondary rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-card rounded-2xl border border-border p-6 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor size={18} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">My Devices</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {activeCount}/{maxDevices} PCs used
          </span>
          <Button variant="ghost" size="sm" onClick={fetchDevices} className="h-8 w-8 p-0">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {devices.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No devices registered yet</p>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                device.is_active
                  ? "bg-[hsl(142,70%,45%)]/5 border-[hsl(142,70%,45%)]/20"
                  : "bg-secondary/50 border-border"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  device.is_active ? "bg-[hsl(142,70%,45%)]/10" : "bg-secondary"
                }`}>
                  <Smartphone size={16} className={device.is_active ? "text-[hsl(142,70%,45%)]" : "text-muted-foreground"} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {device.device_name || device.device_id}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {device.is_active ? (
                      <span className="text-[hsl(142,70%,45%)]">● Active</span>
                    ) : (
                      <span>● Inactive</span>
                    )}
                    {device.last_seen_at && (
                      <span className="ml-2">Last seen: {new Date(device.last_seen_at).toLocaleDateString("en-IN")}</span>
                    )}
                  </div>
                </div>
              </div>
              {device.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeactivate(device.device_id)}
                  disabled={deactivating === device.device_id}
                  className="shrink-0 text-xs h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <Power size={12} />
                  {deactivating === device.device_id ? "..." : "Deactivate"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
