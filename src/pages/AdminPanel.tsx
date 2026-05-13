import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TicketCheck,
  Activity,
  Settings,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MessageSquare,
  FileStack,
  Video,
  Monitor,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminLicenses } from "@/components/admin/AdminLicenses";
import { AdminTickets } from "@/components/admin/AdminTickets";
import { AdminActivityLogs } from "@/components/admin/AdminActivityLogs";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminChangelogs } from "@/components/admin/AdminChangelogs";
import { AdminDemoVideos } from "@/components/admin/AdminDemoVideos";
import { AdminChatLogs } from "@/components/admin/AdminChatLogs";
import { AdminDeviceManagement } from "@/components/admin/AdminDeviceManagement";
import { AdminDeviceRequests } from "@/components/admin/AdminDeviceRequests";
import { AdminWhatsApp } from "@/components/admin/AdminWhatsApp";
import { AdminPricing } from "@/components/admin/AdminPricing";
import { AdminPsdTemplates } from "@/components/admin/AdminPsdTemplates";
import { AdminOtpLogs } from "@/components/admin/AdminOtpLogs";
import { AdminUsageNotice } from "@/components/admin/AdminUsageNotice";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import alplumLogo from "@/assets/alplum-plus-logo.png";

type Tab =
  | "dashboard"
  | "users"
  | "licenses"
  | "pricing"
  | "tickets"
  | "activity_logs"
  | "chat_logs"
  | "changelogs"
  | "demo_videos"
  | "device_requests"
  | "pc_management"
  | "templates"
  | "whatsapp"
  | "otp_logs"
  | "usage_notice"
  | "settings";

type UserFilter = "all" | "active" | "inactive" | "blocked" | "expiring" | "expiring7" | "expired";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Users;
  section?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Main" },
  { id: "users", label: "Users", icon: Users, section: "Main" },
  { id: "licenses", label: "Subscriptions", icon: CreditCard, section: "Main" },
  { id: "pricing", label: "Pricing Plans", icon: CreditCard, section: "Main" },
  { id: "tickets", label: "Support Tickets", icon: TicketCheck, section: "Support" },
  { id: "usage_notice", label: "90-Day Notice", icon: ShieldAlert, section: "Support" },
  { id: "chat_logs", label: "Chat Logs", icon: MessageSquare, section: "Support" },
  { id: "device_requests", label: "Device Requests", icon: Monitor, section: "Devices" },
  { id: "pc_management", label: "PC Management", icon: Monitor, section: "Devices" },
  { id: "templates", label: "PSD Templates", icon: FileStack, section: "Content" },
  { id: "demo_videos", label: "Demo Videos", icon: Video, section: "Content" },
  { id: "changelogs", label: "Changelogs", icon: FileStack, section: "Content" },
  { id: "activity_logs", label: "Activity Logs", icon: Activity, section: "Logs" },
  { id: "otp_logs", label: "OTP Logs", icon: Activity, section: "Logs" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, section: "Config" },
  { id: "settings", label: "Settings", icon: Settings, section: "Config" },
];

const AdminPanel = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const handleNavigateToUsers = (filter: UserFilter) => {
    setUserFilter(filter);
    setActiveTab("users");
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "users") setUserFilter("all");
    if (isMobile) setMobileSidebarOpen(false);
  };

  if (authLoading || checkingRole || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Group nav items by section
  const sections = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sidebarWidth = sidebarCollapsed ? "w-[68px]" : "w-[240px]";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? "fixed inset-y-0 left-0 z-50" : "sticky top-0 h-screen"}
          ${isMobile ? (mobileSidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          ${isMobile ? "w-[260px]" : sidebarWidth}
          bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <img src={alplumLogo} alt="Alplum Plus" className="h-9 w-9 shrink-0" />
            {(!sidebarCollapsed || isMobile) && (
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold text-foreground whitespace-nowrap">
                  Alplum <span className="text-primary">Plus</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-bold">
                  ADMIN
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {Object.entries(sections).map(([section, items]) => (
            <div key={section}>
              {(!sidebarCollapsed || isMobile) && (
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1.5">
                  {section}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all
                        ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        }
                        ${sidebarCollapsed && !isMobile ? "justify-center" : ""}
                      `}
                    >
                      <item.icon size={18} className="shrink-0" />
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {isActive && item.id === "tickets" && (!sidebarCollapsed || isMobile) && (
                        <span className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-border p-2 space-y-1 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all ${sidebarCollapsed && !isMobile ? "justify-center" : ""}`}
            title="User Panel"
          >
            <Users size={18} className="shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span>User Panel</span>}
          </button>
          <button
            onClick={() => navigate("/")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all ${sidebarCollapsed && !isMobile ? "justify-center" : ""}`}
            title="Home"
          >
            <Home size={18} className="shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span>Home</span>}
          </button>
          <button
            onClick={() => { signOut(); navigate("/"); }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all ${sidebarCollapsed && !isMobile ? "justify-center" : ""}`}
            title="Logout"
          >
            <LogOut size={18} className="shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span>Logout</span>}
          </button>

          {/* Collapse toggle - desktop only */}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all mt-1"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20 flex items-center px-4 gap-3 shrink-0">
          {isMobile && (
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            >
              <Menu size={20} />
            </button>
          )}
          <h1 className="font-display text-lg font-bold text-foreground capitalize">
            {navItems.find((n) => n.id === activeTab)?.label || "Dashboard"}
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "dashboard" && <AdminDashboard onNavigateToUsers={handleNavigateToUsers} onNavigateToTab={handleTabChange} />}
              {activeTab === "users" && <AdminUsers initialFilter={userFilter} />}
              {activeTab === "licenses" && <AdminLicenses />}
              {activeTab === "pricing" && <AdminPricing />}
              {activeTab === "tickets" && <AdminTickets />}
              {activeTab === "chat_logs" && <AdminChatLogs />}
              {activeTab === "device_requests" && <AdminDeviceRequests />}
              {activeTab === "pc_management" && <AdminDeviceManagement />}
              {activeTab === "templates" && <AdminPsdTemplates />}
              {activeTab === "demo_videos" && <AdminDemoVideos />}
              {activeTab === "changelogs" && <AdminChangelogs />}
              {activeTab === "activity_logs" && <AdminActivityLogs />}
              {activeTab === "otp_logs" && <AdminOtpLogs />}
              {activeTab === "whatsapp" && <AdminWhatsApp />}
              {activeTab === "settings" && <AdminSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
