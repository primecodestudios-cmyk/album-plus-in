import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Key, Monitor, CalendarClock, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ActivationResult {
  success: boolean;
  error?: string;
  plan_name?: string;
  expires_at?: string;
  remaining_days?: number;
}

const ActivateLicense = () => {
  const { toast } = useToast();
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActivationResult | null>(null);

  const generateDeviceId = () => {
    const nav = navigator;
    const raw = `${nav.userAgent}|${nav.language}|${screen.width}x${screen.height}|${nav.hardwareConcurrency || 0}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const id = `DEV-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}`;
    setDeviceId(id);
    toast({ title: "Device ID detected", description: id });
  };

  const handleActivate = async () => {
    const key = licenseKey.trim().toUpperCase();
    const dev = deviceId.trim();

    if (!key) {
      toast({ title: "Enter your license key", variant: "destructive" });
      return;
    }
    if (!dev) {
      toast({ title: "Generate or enter a Device ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    const { data, error } = await supabase.rpc("activate_license", {
      _license_key: key,
      _device_id: dev,
    });

    if (error) {
      setResult({ success: false, error: error.message });
    } else {
      setResult(data as unknown as ActivationResult);
    }
    setLoading(false);
  };

  const formatKey = (val: string) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.join("-").slice(0, 19);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            Album <span className="text-gradient-gold">Album</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-accent" />
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              License <span className="text-gradient-gold">Activation</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enter your license key and device ID to activate AlbumPlus
            </p>
          </div>

          {/* Activation Form */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
            {/* License Key */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Key size={14} className="text-accent" /> License Key
              </label>
              <input
                value={licenseKey}
                onChange={(e) => setLicenseKey(formatKey(e.target.value))}
                placeholder="ALBM-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground font-mono text-lg tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Device ID */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Monitor size={14} className="text-accent" /> Device ID
              </label>
              <div className="flex gap-2">
                <input
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Click detect to auto-fill"
                  className="flex-1 h-12 px-4 rounded-xl bg-secondary border border-border text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-muted-foreground/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateDeviceId}
                  className="h-12 rounded-xl px-4 text-xs font-semibold border-accent/30 text-accent hover:bg-accent/10"
                >
                  Detect
                </Button>
              </div>
            </div>

            {/* Activate Button */}
            <Button
              onClick={handleActivate}
              disabled={loading}
              className="w-full h-12 bg-gradient-gold text-accent-foreground font-display font-bold text-base rounded-xl shadow-gold"
            >
              {loading ? "Verifying..." : "Activate License"}
            </Button>

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: Key, label: "License Key", desc: "Unique activation key" },
                { icon: Monitor, label: "Device ID", desc: "Hardware fingerprint" },
                { icon: CalendarClock, label: "Expiry Date", desc: "Auto-checked" },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-secondary/50 border border-border">
                  <item.icon size={16} className="text-accent mx-auto mb-1.5" />
                  <div className="text-[10px] font-bold text-foreground leading-tight">{item.label}</div>
                  <div className="text-[9px] text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Result */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 rounded-2xl border p-6 ${
                result.success
                  ? "bg-[hsl(142,70%,45%)]/5 border-[hsl(142,70%,45%)]/30"
                  : "bg-destructive/5 border-destructive/30"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {result.success ? (
                  <CheckCircle2 size={24} className="text-[hsl(142,70%,45%)]" />
                ) : (
                  <XCircle size={24} className="text-destructive" />
                )}
                <h3 className="font-display font-bold text-foreground text-lg">
                  {result.success ? "License Activated!" : "Activation Failed"}
                </h3>
              </div>

              {result.success ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-bold text-accent">{result.plan_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires</span>
                    <span className="font-medium text-foreground">
                      {result.expires_at ? new Date(result.expires_at).toLocaleDateString("en-IN") : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-bold text-foreground">{result.remaining_days} days</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-destructive">{result.error}</p>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ActivateLicense;
