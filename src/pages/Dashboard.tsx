import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  Download,
  ShoppingBag,
  User,
  LogOut,
  Home,
  Settings,
  CalendarClock,
  CreditCard,
  Code2,
} from "lucide-react";
import { motion } from "framer-motion";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { useAppSettings } from "@/hooks/useAppSettings";
import { DeviceManagement } from "@/components/dashboard/DeviceManagement";
import alplumLogo from "@/assets/alplum-plus-logo.png";

interface Profile {
  full_name: string;
  phone: string;
}

interface License {
  id: string;
  plan_name: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  max_devices: number;
}

interface Purchase {
  id: string;
  template_name: string;
  price: number;
  purchased_at: string;
}

interface DownloadRecord {
  id: string;
  template_name: string;
  downloaded_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings: appSettings } = useAppSettings();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [profileRes, licensesRes, purchasesRes, downloadsRes, roleRes, devRoleRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("user_id", user.id).single(),
      supabase.from("user_licenses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_purchases").select("*").eq("user_id", user.id).order("purchased_at", { ascending: false }),
      supabase.from("user_downloads").select("*").eq("user_id", user.id).order("downloaded_at", { ascending: false }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "developer" as any }),
    ]);

    if (profileRes.data) setProfile(profileRes.data);
    if (licensesRes.data) setLicenses(licensesRes.data);
    if (purchasesRes.data) setPurchases(purchasesRes.data);
    if (downloadsRes.data) setDownloads(downloadsRes.data);
    if (roleRes.data) setIsAdmin(true);
    if (devRoleRes.data) setIsDeveloper(true);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const activeLicense = licenses.find((l) => l.is_active);
  const remainingDays = activeLicense
    ? Math.max(0, Math.ceil((new Date(activeLicense.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" />
            Alplum <span className="text-gradient-gold">Plus</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="gap-2 text-destructive font-semibold">
                <Settings size={16} /> Admin Panel
              </Button>
            )}
            {(isAdmin || isDeveloper) && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/api/docs")} className="gap-2 text-accent font-semibold">
                <Code2 size={16} /> API Docs
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground">
              <Home size={16} /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Welcome, <span className="text-gradient-gold">{profile?.full_name || "User"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: ShieldCheck,
              label: "License Status",
              value: activeLicense ? activeLicense.plan_name : "No License",
              accent: !!activeLicense,
            },
            {
              icon: Clock,
              label: "Remaining Days",
              value: activeLicense ? `${remainingDays} Days` : "—",
              accent: remainingDays > 0,
            },
            {
              icon: ShoppingBag,
              label: "Purchased PSDs",
              value: String(purchases.length),
              accent: purchases.length > 0,
            },
            {
              icon: Download,
              label: "Total Downloads",
              value: String(downloads.length),
              accent: downloads.length > 0,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-5 shadow-card"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.accent ? "bg-accent/10" : "bg-secondary"}`}>
                <stat.icon size={20} className={stat.accent ? "text-accent" : "text-muted-foreground"} />
              </div>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className={`font-display text-lg font-bold ${stat.accent ? "text-accent" : "text-foreground"}`}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* License Details */}
        {activeLicense && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">License Details</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: ShieldCheck, label: "Plan", value: activeLicense.plan_name },
                { icon: CalendarClock, label: "Activation Date", value: new Date(activeLicense.starts_at).toLocaleDateString("en-IN") },
                { icon: Clock, label: "Expiry Date", value: new Date(activeLicense.expires_at).toLocaleDateString("en-IN") },
                { icon: CreditCard, label: "Status", value: remainingDays > 0 ? `Active — ${remainingDays} days left` : "Expired" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={14} className="text-accent" />
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold text-foreground">{item.value}</div>
                </div>
              ))}
            </div>
            {remainingDays <= 0 && (
              <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-sm text-destructive flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Your license has expired. Please renew to continue using the software.
                </div>
                <a href="/#pricing">
                  <Button size="sm" className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl">
                    <CreditCard size={14} /> Renew Now
                  </Button>
                </a>
              </div>
            )}
            {remainingDays > 0 && remainingDays <= 30 && (
              <div className="mt-4 p-3 rounded-xl bg-[hsl(45,100%,51%)]/5 border-[hsl(45,100%,51%)]/20 border text-sm text-[hsl(45,100%,51%)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  Your license expires in {remainingDays} days.
                </div>
                <a href="/#pricing">
                  <Button size="sm" variant="outline" className="gap-2 rounded-xl border-accent/30 text-accent hover:bg-accent/10">
                    <CreditCard size={14} /> Renew
                  </Button>
                </a>
              </div>
            )}
          </motion.div>
        )}

        {/* Device Management */}
        <div className="mb-6">
          <DeviceManagement maxDevices={activeLicense?.max_devices || 1} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <User size={18} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">Account Details</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Name", value: profile?.full_name || "—" },
                { label: "Email", value: user?.email || "—" },
                { label: "Phone", value: profile?.phone || "—" },
                { label: "Joined", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN") : "—" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Purchases */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag size={18} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">Recent Purchases</h2>
            </div>
            {purchases.length > 0 ? (
              <div className="space-y-3">
                {purchases.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.template_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(p.purchased_at).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-accent">
                      {p.price === 0 ? "Free" : `₹${p.price}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No purchases yet</p>
            )}
          </motion.div>

          {/* Recent Downloads */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <Download size={18} className="text-accent" />
              <h2 className="font-display text-lg font-bold text-foreground">Recent Downloads</h2>
            </div>
            {downloads.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {downloads.slice(0, 6).map((d) => (
                  <div key={d.id} className="flex justify-between items-center py-2 px-3 rounded-xl bg-secondary/50 border border-border">
                    <span className="text-sm font-medium text-foreground">{d.template_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(d.downloaded_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No downloads yet</p>
            )}
          </motion.div>
        </div>
      </main>
      {appSettings.enable_chat_widget && <ChatWidget />}
    </div>
  );
};

export default Dashboard;
