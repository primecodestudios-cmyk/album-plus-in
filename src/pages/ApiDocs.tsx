import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Copy, Check, ChevronDown, ChevronRight, Code2, FileJson, Zap, Shield, Server, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import alplumLogo from "@/assets/alplum-plus-logo.png";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface ApiEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  category: string;
  requestBody?: Record<string, { type: string; required: boolean; description: string; example: string }>;
  queryParams?: Record<string, { type: string; required: boolean; description: string; example: string }>;
  sampleResponse: object;
  sampleErrorResponse?: object;
}

const endpoints: ApiEndpoint[] = [
  {
    id: "register",
    name: "Register User",
    method: "POST",
    path: "/software-register",
    description: "Register a new user from the desktop software. Creates account and submits device activation request.",
    category: "Authentication",
    requestBody: {
      whatsapp_number: { type: "string", required: true, description: "10-digit WhatsApp number", example: "9876543210" },
      country_code: { type: "string", required: false, description: "Country code (default: +91)", example: "+91" },
      studio_name: { type: "string", required: true, description: "Studio or business name", example: "Raj Photography" },
      city: { type: "string", required: true, description: "City name", example: "Chennai" },
      state: { type: "string", required: true, description: "State name", example: "Tamil Nadu" },
      country: { type: "string", required: false, description: "Country (default: India)", example: "India" },
      languages: { type: "array", required: false, description: "Preferred languages", example: '["Tamil","English"]' },
      password: { type: "string", required: true, description: "Min 8 chars, letters + numbers", example: "MyPass123" },
      device_id: { type: "string", required: true, description: "Hardware-based device fingerprint", example: "DEV-A1B2C3D4" },
      device_name: { type: "string", required: false, description: "Computer name", example: "DESKTOP-RAJ" },
      os: { type: "string", required: false, description: "Windows version", example: "Windows 11 Pro" },
      software_version: { type: "string", required: false, description: "Software version", example: "v5.2.1" },
    },
    sampleResponse: {
      status: "success",
      message: "Registration Successful. Waiting for Activation.",
      user_id: "uuid-xxxx-xxxx",
      user_status: "pending",
    },
    sampleErrorResponse: {
      status: "error",
      message: "WhatsApp number must be exactly 10 digits",
    },
  },
  {
    id: "check-license",
    name: "Check License",
    method: "POST",
    path: "/check-license",
    description: "Verify license status for a specific device. Software should call this on startup and periodically.",
    category: "License",
    requestBody: {
      email: { type: "string", required: true, description: "User email (phone@alplumplus.app)", example: "9876543210@alplumplus.app" },
      device_id: { type: "string", required: true, description: "Hardware device ID", example: "DEV-A1B2C3D4" },
      software_version: { type: "string", required: false, description: "Current software version", example: "v5.2.1" },
    },
    sampleResponse: {
      success: true,
      status: "active",
      plan_name: "Professional",
      expiry_date: "2027-03-15T00:00:00Z",
      remaining_days: 365,
      activation_date: "2026-03-15T00:00:00Z",
    },
    sampleErrorResponse: {
      success: true,
      status: "expired",
      message: "License has expired",
      expiry_date: "2026-01-01T00:00:00Z",
    },
  },
  {
    id: "user-status",
    name: "User Status",
    method: "POST",
    path: "/user-status",
    description: "Get user activation status. Supports both GET (query params) and POST (JSON body).",
    category: "Authentication",
    requestBody: {
      user_id: { type: "string", required: true, description: "User UUID", example: "uuid-xxxx-xxxx" },
      device_id: { type: "string", required: false, description: "Device ID for specific check", example: "DEV-A1B2C3D4" },
    },
    sampleResponse: {
      status: "active",
      message: "License is active",
      plan_name: "Professional",
      expires_at: "2027-03-15T00:00:00Z",
      remaining_days: 365,
    },
  },
  {
    id: "device-request",
    name: "Device Request",
    method: "POST",
    path: "/device-request",
    description: "Submit a new device activation request for admin approval.",
    category: "Device",
    requestBody: {
      email: { type: "string", required: true, description: "User email", example: "9876543210@alplumplus.app" },
      device_id: { type: "string", required: true, description: "Hardware device ID", example: "DEV-E5F6G7H8" },
      system_name: { type: "string", required: false, description: "Computer name", example: "LAPTOP-RAJ" },
      windows_version: { type: "string", required: false, description: "OS version", example: "Windows 10 Pro" },
      software_version: { type: "string", required: false, description: "Software version", example: "v5.2.1" },
      ip_address: { type: "string", required: false, description: "Client IP", example: "192.168.1.10" },
    },
    sampleResponse: {
      success: true,
      message: "Activation request submitted. Waiting for admin approval.",
      request_id: "uuid-xxxx-xxxx",
    },
  },
  {
    id: "device-list",
    name: "Device List",
    method: "POST",
    path: "/device-list",
    description: "Get all devices associated with a user, including license and device limit info.",
    category: "Device",
    requestBody: {
      user_id: { type: "string", required: false, description: "User UUID", example: "uuid-xxxx-xxxx" },
      email: { type: "string", required: false, description: "User email (alternative to user_id)", example: "9876543210@alplumplus.app" },
    },
    sampleResponse: {
      success: true,
      user_id: "uuid-xxxx-xxxx",
      license: {
        plan_name: "Professional",
        max_devices: 2,
        starts_at: "2026-03-15T00:00:00Z",
        expires_at: "2027-03-15T00:00:00Z",
        remaining_days: 365,
      },
      active_device_count: 1,
      max_devices: 2,
      can_add_device: true,
      devices: [
        {
          device_id: "DEV-A1B2C3D4",
          device_name: "DESKTOP-RAJ",
          is_active: true,
          last_seen_at: "2026-04-09T10:00:00Z",
          activated_at: "2026-03-15T00:00:00Z",
          system_info: "v5.2.1",
          ip_address: "192.168.1.10",
          running_version: "v5.2.1",
          windows_version: "Windows 11 Pro",
        },
      ],
    },
  },
  {
    id: "deactivate-device",
    name: "Deactivate Device",
    method: "POST",
    path: "/deactivate-device",
    description: "Deactivate a specific device to free up a device slot.",
    category: "Device",
    requestBody: {
      email: { type: "string", required: false, description: "User email (or use user_id)", example: "9876543210@alplumplus.app" },
      user_id: { type: "string", required: false, description: "User UUID (or use email)", example: "uuid-xxxx-xxxx" },
      device_id: { type: "string", required: true, description: "Device ID to deactivate", example: "DEV-A1B2C3D4" },
    },
    sampleResponse: {
      success: true,
      message: "Device deactivated successfully",
      device_id: "DEV-A1B2C3D4",
      device_name: "DESKTOP-RAJ",
    },
  },
  {
    id: "payment-verify",
    name: "Payment Verify",
    method: "POST",
    path: "/payment-verify",
    description: "Verify payment and auto-activate license. Use after payment gateway callback.",
    category: "License",
    requestBody: {
      email: { type: "string", required: false, description: "User email (or phone)", example: "9876543210@alplumplus.app" },
      phone: { type: "string", required: false, description: "User phone (or email)", example: "+919876543210" },
      payment_id: { type: "string", required: true, description: "Payment gateway transaction ID", example: "PAY_1234567890" },
      amount: { type: "number", required: false, description: "Payment amount", example: "2999" },
      plan_name: { type: "string", required: true, description: "Plan name to activate", example: "Professional" },
      duration_days: { type: "number", required: true, description: "License duration in days", example: "365" },
      max_pcs: { type: "number", required: false, description: "Max devices allowed (default: 1)", example: "2" },
      device_id: { type: "string", required: false, description: "Device to auto-activate", example: "DEV-A1B2C3D4" },
    },
    sampleResponse: {
      success: true,
      message: "Payment verified and license activated",
      license: {
        id: "uuid-xxxx",
        license_key: "ALPM-ABCD-EFGH-IJKL",
        plan_name: "Professional",
        starts_at: "2026-04-09T00:00:00Z",
        expires_at: "2027-04-09T00:00:00Z",
        max_devices: 2,
        remaining_days: 365,
      },
    },
  },
];

const categories = ["All", ...Array.from(new Set(endpoints.map((e) => e.category)))];

const ApiDocs = () => {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [testBodies, setTestBodies] = useState<Record<string, string>>({});
  const [testResponses, setTestResponses] = useState<Record<string, { status: number; body: string; time: number } | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = activeCategory === "All" ? endpoints : endpoints.filter((e) => e.category === activeCategory);

  const getDefaultBody = (ep: ApiEndpoint) => {
    if (!ep.requestBody) return "{}";
    const obj: Record<string, any> = {};
    Object.entries(ep.requestBody).forEach(([key, val]) => {
      try {
        obj[key] = JSON.parse(val.example);
      } catch {
        obj[key] = val.example;
      }
    });
    return JSON.stringify(obj, null, 2);
  };

  const handleTest = async (ep: ApiEndpoint) => {
    setLoading((p) => ({ ...p, [ep.id]: true }));
    setTestResponses((p) => ({ ...p, [ep.id]: null }));

    const body = testBodies[ep.id] || getDefaultBody(ep);
    const start = performance.now();

    try {
      const res = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: ep.method === "POST" ? body : undefined,
      });

      const text = await res.text();
      const time = Math.round(performance.now() - start);

      let formatted: string;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        formatted = text;
      }

      setTestResponses((p) => ({ ...p, [ep.id]: { status: res.status, body: formatted, time } }));
    } catch (err: any) {
      setTestResponses((p) => ({
        ...p,
        [ep.id]: { status: 0, body: JSON.stringify({ error: err.message }, null, 2), time: 0 },
      }));
    }

    setLoading((p) => ({ ...p, [ep.id]: false }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-[hsl(142,70%,45%)]";
    if (status >= 400 && status < 500) return "text-[hsl(45,100%,51%)]";
    return "text-destructive";
  };

  const getMethodColor = (method: string) => {
    return method === "GET"
      ? "bg-[hsl(142,70%,45%)]/15 text-[hsl(142,70%,45%)] border-[hsl(142,70%,45%)]/30"
      : "bg-accent/15 text-accent border-accent/30";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" />
            Alplum <span className="text-gradient-gold">Plus</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Code2 size={14} /> Developer API
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            API <span className="text-gradient-gold">Documentation</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Complete REST API reference for integrating with AlplumPlus software. Test endpoints live from your browser.
          </p>
        </motion.div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: Server, label: "Base URL", value: "Edge Functions" },
            { icon: FileJson, label: "Format", value: "JSON" },
            { icon: Shield, label: "Auth", value: "API Key" },
            { icon: Zap, label: "Endpoints", value: `${endpoints.length} APIs` },
          ].map((item) => (
            <div key={item.label} className="bg-card rounded-xl border border-border p-4 text-center shadow-card">
              <item.icon size={18} className="text-accent mx-auto mb-2" />
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-bold text-foreground">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Base URL */}
        <div className="bg-card rounded-xl border border-border p-4 mb-8 shadow-card">
          <div className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Base URL</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-accent bg-secondary/50 rounded-lg px-3 py-2 overflow-x-auto">
              {BASE_URL}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(BASE_URL, "base-url")}
              className="shrink-0"
            >
              {copied === "base-url" ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-gradient-gold text-accent-foreground shadow-gold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          {filtered.map((ep, i) => (
            <motion.div
              key={ep.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
            >
              {/* Endpoint Header */}
              <button
                onClick={() => setExpandedEndpoint(expandedEndpoint === ep.id ? null : ep.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
              >
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getMethodColor(ep.method)}`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                <span className="text-xs text-muted-foreground hidden md:block">{ep.name}</span>
                {expandedEndpoint === ep.id ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedEndpoint === ep.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">{ep.description}</p>

                      {/* Parameters Table */}
                      {ep.requestBody && (
                        <div>
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                            <BookOpen size={12} /> Request Body
                          </h4>
                          <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-secondary/50">
                                  <th className="text-left p-2.5 font-semibold text-muted-foreground">Parameter</th>
                                  <th className="text-left p-2.5 font-semibold text-muted-foreground">Type</th>
                                  <th className="text-left p-2.5 font-semibold text-muted-foreground hidden md:table-cell">Required</th>
                                  <th className="text-left p-2.5 font-semibold text-muted-foreground hidden lg:table-cell">Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(ep.requestBody).map(([key, val]) => (
                                  <tr key={key} className="border-t border-border">
                                    <td className="p-2.5 font-mono text-accent">{key}</td>
                                    <td className="p-2.5 text-muted-foreground">{val.type}</td>
                                    <td className="p-2.5 hidden md:table-cell">
                                      {val.required ? (
                                        <span className="text-[hsl(0,84%,60%)] font-semibold">Yes</span>
                                      ) : (
                                        <span className="text-muted-foreground">No</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-muted-foreground hidden lg:table-cell">{val.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Sample Response */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Sample Response (200)</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => copyToClipboard(JSON.stringify(ep.sampleResponse, null, 2), `resp-${ep.id}`)}
                          >
                            {copied === `resp-${ep.id}` ? <Check size={12} /> : <Copy size={12} />}
                          </Button>
                        </div>
                        <pre className="bg-secondary/50 rounded-xl p-3 text-xs font-mono text-foreground overflow-x-auto max-h-48">
                          {JSON.stringify(ep.sampleResponse, null, 2)}
                        </pre>
                      </div>

                      {ep.sampleErrorResponse && (
                        <div>
                          <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">Error Response</h4>
                          <pre className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-xs font-mono text-destructive overflow-x-auto max-h-32">
                            {JSON.stringify(ep.sampleErrorResponse, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Live Test */}
                      <div className="border-t border-border pt-4">
                        <button
                          onClick={() => setTestingEndpoint(testingEndpoint === ep.id ? null : ep.id)}
                          className="flex items-center gap-2 text-sm font-bold text-accent hover:underline"
                        >
                          <Zap size={14} />
                          {testingEndpoint === ep.id ? "Hide" : "Try it live"}
                        </button>

                        <AnimatePresence>
                          {testingEndpoint === ep.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden mt-3 space-y-3"
                            >
                              {ep.method === "POST" && (
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Request Body (JSON)</label>
                                  <textarea
                                    value={testBodies[ep.id] ?? getDefaultBody(ep)}
                                    onChange={(e) => setTestBodies((p) => ({ ...p, [ep.id]: e.target.value }))}
                                    className="w-full h-40 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
                                  />
                                </div>
                              )}

                              <Button
                                onClick={() => handleTest(ep)}
                                disabled={loading[ep.id]}
                                className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl"
                              >
                                <Send size={14} />
                                {loading[ep.id] ? "Sending..." : "Send Request"}
                              </Button>

                              {testResponses[ep.id] && (
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-sm font-bold ${getStatusColor(testResponses[ep.id]!.status)}`}>
                                      Status: {testResponses[ep.id]!.status}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {testResponses[ep.id]!.time}ms
                                    </span>
                                  </div>
                                  <pre className="bg-secondary/50 rounded-xl p-3 text-xs font-mono text-foreground overflow-x-auto max-h-64">
                                    {testResponses[ep.id]!.body}
                                  </pre>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Integration Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-card rounded-2xl border border-border p-6 shadow-card"
        >
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen size={20} className="text-accent" /> Quick Integration Guide
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">1. Software Startup Flow</h3>
              <code className="text-xs font-mono block text-accent">
                POST /check-license → active / expired / blocked / pending
              </code>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">2. New User Registration</h3>
              <code className="text-xs font-mono block text-accent">
                POST /software-register → user created as PENDING → admin activates
              </code>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">3. Payment Auto-Activation</h3>
              <code className="text-xs font-mono block text-accent">
                POST /payment-verify → license auto-created + device activated
              </code>
            </div>
            <div className="bg-secondary/50 rounded-xl p-4">
              <h3 className="font-bold text-foreground mb-2">4. Device Management</h3>
              <code className="text-xs font-mono block text-accent">
                POST /device-list → view devices | POST /deactivate-device → free slot
              </code>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ApiDocs;
