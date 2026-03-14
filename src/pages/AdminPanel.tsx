import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShieldCheck,
  ShoppingBag,
  IndianRupee,
  Home,
  LogOut,
  Settings,
  FileStack,
  CreditCard,
  Key,
  MessageSquare,
  Monitor,
  UserCog,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminLicenses } from "@/components/admin/AdminLicenses";
import { AdminPricing } from "@/components/admin/AdminPricing";
import { AdminPsdTemplates } from "@/components/admin/AdminPsdTemplates";
import { AdminEnquiries } from "@/components/admin/AdminEnquiries";
import { AdminDeviceRequests } from "@/components/admin/AdminDeviceRequests";
import { AdminSyncUsers } from "@/components/admin/AdminSyncUsers";
import { AdminActivateLicense } from "@/components/admin/AdminActivateLicense";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminApiTokens } from "@/components/admin/AdminApiTokens";
import { useToast } from "@/hooks/use-toast";

type Tab = "stats" | "users" | "device_requests" | "licenses" | "pricing" | "templates" | "enquiries" | "sync" | "activate" | "api_tokens";

const AdminPanel = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("stats");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
    if (!user) return;

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (!data) {
        toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
        navigate("/dashboard");
      } else {
        setIsAdmin(true);
      }
      setCheckingRole(false);
    };

    checkAdmin();
  }, [user, authLoading, navigate, toast]);

  if (authLoading || checkingRole || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "stats", label: "Dashboard", icon: Settings },
    { id: "users", label: "Users", icon: UserCog },
    { id: "device_requests", label: "Device Requests", icon: Monitor },
    { id: "licenses", label: "Licenses", icon: Key },
    { id: "pricing", label: "Pricing", icon: CreditCard },
    { id: "templates", label: "PSD Templates", icon: FileStack },
    { id: "enquiries", label: "Enquiries", icon: MessageSquare },
    { id: "sync", label: "Sync Users", icon: Users },
    { id: "activate", label: "Activate", icon: ShieldCheck },
    { id: "api_tokens", label: "API Tokens", icon: Key },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-xl font-bold text-foreground">
            Album<span className="text-gradient-gold">Plus</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold">ADMIN</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2 text-muted-foreground">
              <Users size={16} /> User Panel
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground">
              <Home size={16} /> Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }} className="gap-2 text-muted-foreground">
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-gold text-accent-foreground shadow-gold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/30"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === "stats" && <AdminStats />}
          {activeTab === "users" && <AdminUsers />}
          {activeTab === "device_requests" && <AdminDeviceRequests />}
          {activeTab === "licenses" && <AdminLicenses />}
          {activeTab === "pricing" && <AdminPricing />}
          {activeTab === "templates" && <AdminPsdTemplates />}
          {activeTab === "enquiries" && <AdminEnquiries />}
          {activeTab === "sync" && <AdminSyncUsers />}
          {activeTab === "activate" && <AdminActivateLicense />}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
