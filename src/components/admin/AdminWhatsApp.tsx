import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Send, RefreshCw, Eye, EyeOff, Save,
  MessageSquare, Activity, FileText, Circle, Wifi,
  Phone, Bell, TestTube, Settings, Heart, SendHorizonal,
} from "lucide-react";

// ─── Types ────────────────────────────────────
interface ApiConfig {
  id: string;
  label: string;
  api_url: string;
  api_method: string;
  api_token: string;
  instance_id: string;
  sender_number: string;
  sort_order: number;
  is_active: boolean;
  health_status: string;
  failure_count: number;
  total_sent: number;
}

interface WaLog {
  id: string;
  whatsapp_number: string;
  category: string;
  channel: string;
  delivery_status: string;
  message_content: string;
  error_message: string | null;
  created_at: string;
}

interface WaTemplate {
  id: string;
  category: string;
  template_name: string;
  template_text: string;
  is_active: boolean;
}

// ─── Stat Card ───────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </div>
  );
}

// ─── Health Badge ────────────────────────────
function HealthBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    connected: { color: "text-green-500", label: "Connected" },
    degraded: { color: "text-yellow-500", label: "Degraded" },
    disconnected: { color: "text-red-500", label: "Disconnected" },
  };
  const s = map[status] || map.disconnected;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
      status === "connected" ? "border-green-500/30 bg-green-500/10" : status === "degraded" ? "border-yellow-500/30 bg-yellow-500/10" : "border-red-500/30 bg-red-500/10"
    }`}>
      <Wifi size={12} className={s.color} />
      <Circle size={6} className={`${s.color} fill-current`} />
      <span className={s.color}>{s.label}</span>
    </span>
  );
}

// ─── Component ────────────────────────────────
export function AdminWhatsApp() {
  const { toast } = useToast();
  const [tab, setTab] = useState("apis");

  // APIs state
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  // Test state
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("✅ FXMinuteAlbum WhatsApp API test successful!");
  const [testing, setTesting] = useState(false);

  // Messaging state
  const [msgNumber, setMsgNumber] = useState("");
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<WaLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const { data } = await supabase.from("whatsapp_api_configs" as any).select("*").order("sort_order");
    if (data) setConfigs(data as any);
    setLoading(false);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    const { data } = await supabase.from("whatsapp_logs" as any).select("*").order("created_at", { ascending: false }).limit(100);
    if (data) setLogs(data as any);
    setLogsLoading(false);
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    const { data } = await supabase.from("whatsapp_templates" as any).select("*").order("category");
    if (data) setTemplates(data as any);
    setTemplatesLoading(false);
  };

  const addConfig = async () => {
    const next = configs.length + 1;
    const { error } = await supabase.from("whatsapp_api_configs" as any).insert({
      label: `API ${next}`,
      sort_order: next,
    } as any);
    if (!error) { fetchConfigs(); toast({ title: "API config added" }); }
  };

  const updateConfig = (id: string, field: string, value: any) => {
    setConfigs(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveConfig = async (config: ApiConfig) => {
    const { error } = await supabase.from("whatsapp_api_configs" as any)
      .update({
        label: config.label, api_url: config.api_url, api_method: config.api_method,
        api_token: config.api_token, instance_id: config.instance_id,
        sender_number: config.sender_number, sort_order: config.sort_order,
        is_active: config.is_active, updated_at: new Date().toISOString(),
      } as any).eq("id", config.id);
    if (!error) toast({ title: `${config.label} saved` });
    else toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const deleteConfig = async (id: string) => {
    await supabase.from("whatsapp_api_configs" as any).delete().eq("id", id);
    fetchConfigs();
    toast({ title: "API config deleted" });
  };

  const handleHealthCheck = async () => {
    toast({ title: "Health Check", description: "Checking all APIs..." });
    for (const config of configs.filter(c => c.is_active)) {
      try {
        const { data } = await supabase.functions.invoke("send-whatsapp", {
          body: { number: config.sender_number || "919999999999", message: `🏥 Health check - ${config.label}`, category: "system_alert" },
        });
        toast({ title: `${config.label}`, description: data?.success ? "✅ Connected" : "❌ Failed" });
      } catch {
        toast({ title: `${config.label}`, description: "❌ Error", variant: "destructive" });
      }
    }
    fetchConfigs();
  };

  const handleTestSend = async () => {
    if (!testNumber) { toast({ title: "Enter a test number", variant: "destructive" }); return; }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { number: testNumber, message: testMessage, category: "manual" },
      });
      if (error) throw error;
      toast({ title: data?.success ? "Test sent!" : "Failed", description: data?.channel || data?.error });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setTesting(false);
  };

  const handleSendMessage = async () => {
    if (!msgNumber || !msgText) { toast({ title: "Enter number and message", variant: "destructive" }); return; }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { number: msgNumber, message: msgText, category: "manual" },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Message sent!", description: `Via ${data.channel}` });
        setMsgText("");
      } else {
        toast({ title: "Failed", description: data?.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  // Template CRUD
  const addTemplate = async () => {
    const { error } = await supabase.from("whatsapp_templates" as any).insert({
      category: "general", template_name: "New Template",
      template_text: "Hello {{name}}, welcome to FXMinuteAlbum!",
    } as any);
    if (!error) { fetchTemplates(); toast({ title: "Template added" }); }
  };

  const saveTemplate = async (t: WaTemplate) => {
    const { error } = await supabase.from("whatsapp_templates" as any).update({
      category: t.category, template_name: t.template_name,
      template_text: t.template_text, is_active: t.is_active,
      updated_at: new Date().toISOString(),
    } as any).eq("id", t.id);
    if (!error) toast({ title: "Template saved" });
  };

  const deleteTemplate = async (id: string) => {
    await supabase.from("whatsapp_templates" as any).delete().eq("id", id);
    fetchTemplates();
  };

  // Stats
  const totalApis = configs.length;
  const activeApis = configs.filter(c => c.is_active).length;
  const connectedApis = configs.filter(c => c.health_status === "connected" && c.is_active).length;
  const downApis = configs.filter(c => c.health_status === "disconnected" || !c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare size={24} className="text-green-500" /> WhatsApp Integration
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unified Load Balancing — {activeApis} API{activeApis !== 1 ? "s" : ""} active
          </p>
        </div>
        <Button onClick={handleHealthCheck} variant="outline" className="gap-2">
          <Heart size={16} /> Health Check
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total APIs" value={totalApis} />
        <StatCard label="Active" value={activeApis} color="text-primary" />
        <StatCard label="Connected" value={connectedApis} color="text-green-500" />
        <StatCard label="Down" value={downApis} color={downApis > 0 ? "text-red-500" : "text-muted-foreground"} />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "logs") fetchLogs(); if (v === "templates") fetchTemplates(); }}>
        <TabsList className="bg-card border border-border flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="apis" className="gap-1.5 text-xs"><Settings size={13} /> APIs</TabsTrigger>
          <TabsTrigger value="test" className="gap-1.5 text-xs"><TestTube size={13} /> Test</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 text-xs"><FileText size={13} /> Templates</TabsTrigger>
          <TabsTrigger value="messaging" className="gap-1.5 text-xs"><SendHorizonal size={13} /> Messaging</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5 text-xs"><Activity size={13} /> Logs</TabsTrigger>
        </TabsList>

        {/* ─── APIs Tab ─── */}
        <TabsContent value="apis" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">WhatsApp APIs</span>
              <span className="text-xs text-muted-foreground">{activeApis}/{totalApis}</span>
            </div>
            <Button onClick={addConfig} variant="outline" size="sm" className="gap-1.5">
              <Plus size={14} /> Add API
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading API configs...</p>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Phone size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">No WhatsApp APIs configured yet</p>
              <Button onClick={addConfig} className="gap-1.5"><Plus size={14} /> Add First API</Button>
            </div>
          ) : configs.map(config => (
            <div key={config.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-muted-foreground" />
                  <Input className="w-28 font-semibold h-8 text-sm" value={config.label}
                    onChange={e => updateConfig(config.id, "label", e.target.value)} />
                  <HealthBadge status={config.is_active ? config.health_status : "disconnected"} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.is_active} onCheckedChange={v => updateConfig(config.id, "is_active", v)} />
                  <Button variant="ghost" size="sm" onClick={() => deleteConfig(config.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">API Token</Label>
                  <div className="relative">
                    <Input type={showTokens[config.id] ? "text" : "password"} value={config.api_token}
                      onChange={e => updateConfig(config.id, "api_token", e.target.value)} className="pr-10" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowTokens(p => ({ ...p, [config.id]: !p[config.id] }))}>
                      {showTokens[config.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Instance ID</Label>
                  <Input value={config.instance_id} onChange={e => updateConfig(config.id, "instance_id", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Phone Number</Label>
                  <Input value={config.sender_number} onChange={e => updateConfig(config.id, "sender_number", e.target.value)} placeholder="919876543210" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">API URL</Label>
                  <Input value={config.api_url} onChange={e => updateConfig(config.id, "api_url", e.target.value)} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Sent: <strong className="text-foreground">{config.total_sent}</strong></span>
                  <span>Failures: <strong className={config.failure_count > 0 ? "text-red-500" : "text-foreground"}>{config.failure_count}</strong></span>
                </div>
                <Button onClick={() => saveConfig(config)} size="sm" className="gap-1.5 bg-primary text-primary-foreground">
                  <Save size={14} /> Save
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ─── Test Tab ─── */}
        <TabsContent value="test" className="mt-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TestTube size={18} /> Send Test Message
            </h3>
            <p className="text-sm text-muted-foreground">Send a test message through the load balancer to verify API connectivity.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number</Label>
                <Input placeholder="919876543210" value={testNumber} onChange={e => setTestNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Input value={testMessage} onChange={e => setTestMessage(e.target.value)} />
              </div>
              <Button onClick={handleTestSend} disabled={testing} className="w-full gap-2">
                <Send size={14} /> {testing ? "Sending..." : "Send Test Message"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── Messaging Tab ─── */}
        <TabsContent value="messaging" className="mt-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <SendHorizonal size={18} /> Send Direct Message
            </h3>
            <p className="text-sm text-muted-foreground">Send a WhatsApp message to any number via the API.</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Recipient Number</Label>
                <Input placeholder="919876543210" value={msgNumber} onChange={e => setMsgNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <textarea className="w-full min-h-[100px] rounded-xl border border-border bg-background p-3 text-sm resize-y"
                  placeholder="Type your message here..."
                  value={msgText} onChange={e => setMsgText(e.target.value)} />
              </div>
              <Button onClick={handleSendMessage} disabled={sending} className="w-full gap-2">
                <Send size={14} /> {sending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Message templates with variable support (use {"{{name}}"}, {"{{plan}}"}, etc.)</p>
            <div className="flex gap-2">
              <Button onClick={fetchTemplates} variant="outline" size="sm"><RefreshCw size={14} /></Button>
              <Button onClick={addTemplate} size="sm" className="gap-1.5"><Plus size={14} /> Add Template</Button>
            </div>
          </div>

          {templatesLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p> : templates.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Input className="w-40" placeholder="Template Name" value={t.template_name}
                    onChange={e => setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, template_name: e.target.value } : x))} />
                  <Input className="w-28" placeholder="Category" value={t.category}
                    onChange={e => setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, category: e.target.value } : x))} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.is_active}
                    onCheckedChange={v => setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: v } : x))} />
                  <Button variant="outline" size="sm" onClick={() => saveTemplate(t)}><Save size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTemplate(t.id)} className="text-destructive"><Trash2 size={14} /></Button>
                </div>
              </div>
              <textarea className="w-full min-h-[80px] rounded-xl border border-border bg-background p-3 text-sm resize-y"
                value={t.template_text}
                onChange={e => setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, template_text: e.target.value } : x))} />
            </div>
          ))}
          {templates.length === 0 && !templatesLoading && (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">No templates yet</p>
              <Button onClick={addTemplate} className="gap-1.5"><Plus size={14} /> Add Template</Button>
            </div>
          )}
        </TabsContent>

        {/* ─── Logs Tab ─── */}
        <TabsContent value="logs" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recent WhatsApp message delivery logs</p>
            <Button onClick={fetchLogs} variant="outline" size="sm"><RefreshCw size={14} /></Button>
          </div>

          {logsLoading ? <p className="text-sm text-muted-foreground py-8 text-center">Loading logs...</p> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Time</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Number</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Category</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Channel</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground text-xs">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString("en-IN", { hour12: false })}</td>
                        <td className="p-3 text-xs font-mono">{log.whatsapp_number}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">{log.category}</span></td>
                        <td className="p-3 text-xs">{log.channel}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.delivery_status === "sent" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          }`}>
                            {log.delivery_status}
                          </span>
                        </td>
                        <td className="p-3 text-xs max-w-[200px] truncate" title={log.message_content}>{log.message_content}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted-foreground py-12">No logs yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
