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
  MessageSquare, Activity, FileText, Circle
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

// ─── Health badge ────────────────────────────
function HealthBadge({ status }: { status: string }) {
  const color = status === "connected" ? "text-green-500" : status === "degraded" ? "text-yellow-500" : "text-red-500";
  return <Circle size={10} className={`${color} fill-current inline`} />;
}

// ─── Component ────────────────────────────────
export function AdminWhatsApp() {
  const { toast } = useToast();
  const [tab, setTab] = useState("apis");

  // APIs state
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting] = useState(false);

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

  const updateConfig = async (id: string, field: string, value: any) => {
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

  const handleTest = async (config: ApiConfig) => {
    if (!testNumber) { toast({ title: "Enter a test number", variant: "destructive" }); return; }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { number: testNumber, message: `✅ AlbumPlus test from ${config.label}`, category: "manual" },
      });
      if (error) throw error;
      toast({ title: data?.success ? "Test sent!" : "Failed", description: data?.channel || data?.error });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setTesting(false);
  };

  // Template CRUD
  const addTemplate = async () => {
    const { error } = await supabase.from("whatsapp_templates" as any).insert({
      category: "general",
      template_name: "New Template",
      template_text: "Hello {{name}}, welcome to AlbumPlus!",
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
        <MessageSquare size={24} className="text-green-500" /> WhatsApp Management
      </h2>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "logs") fetchLogs(); if (v === "templates") fetchTemplates(); }}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="apis" className="gap-1.5"><Activity size={14} /> API Configs</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5"><FileText size={14} /> Message Logs</TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5"><MessageSquare size={14} /> Templates</TabsTrigger>
        </TabsList>

        {/* ─── API Configs Tab ─── */}
        <TabsContent value="apis" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Configure multiple WhatsApp APIs with automatic failover.</p>
            <div className="flex gap-2">
              <Button onClick={fetchConfigs} variant="outline" size="sm"><RefreshCw size={14} /></Button>
              <Button onClick={addConfig} size="sm" className="gap-1.5"><Plus size={14} /> Add API</Button>
            </div>
          </div>

          {/* Test number input */}
          <div className="flex items-end gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="flex-1 space-y-1">
              <Label className="text-xs">Test Phone Number</Label>
              <Input placeholder="919876543210" value={testNumber} onChange={e => setTestNumber(e.target.value)} />
            </div>
          </div>

          {loading ? <p className="text-muted-foreground text-sm">Loading...</p> : configs.map(config => (
            <div key={config.id} className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HealthBadge status={config.health_status} />
                  <Input className="w-32 font-semibold" value={config.label} onChange={e => updateConfig(config.id, "label", e.target.value)} />
                  <span className="text-xs text-muted-foreground">Sent: {config.total_sent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.is_active} onCheckedChange={v => updateConfig(config.id, "is_active", v)} />
                  <Button variant="outline" size="sm" onClick={() => handleTest(config)} disabled={testing}><Send size={14} /></Button>
                  <Button variant="outline" size="sm" onClick={() => saveConfig(config)}><Save size={14} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteConfig(config.id)} className="text-destructive"><Trash2 size={14} /></Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">API URL</Label>
                  <Input value={config.api_url} onChange={e => updateConfig(config.id, "api_url", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Method</Label>
                  <select className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                    value={config.api_method} onChange={e => updateConfig(config.id, "api_method", e.target.value)}>
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Instance ID</Label>
                  <Input value={config.instance_id} onChange={e => updateConfig(config.id, "instance_id", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Access Token</Label>
                  <div className="relative">
                    <Input type={showTokens[config.id] ? "text" : "password"} value={config.api_token}
                      onChange={e => updateConfig(config.id, "api_token", e.target.value)} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowTokens(p => ({ ...p, [config.id]: !p[config.id] }))}>
                      {showTokens[config.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sender Number</Label>
                  <Input value={config.sender_number} onChange={e => updateConfig(config.id, "sender_number", e.target.value)} placeholder="919876543210" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sort Order (priority)</Label>
                  <Input type="number" value={config.sort_order} onChange={e => updateConfig(config.id, "sort_order", parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ─── Logs Tab ─── */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Recent WhatsApp message logs</p>
            <Button onClick={fetchLogs} variant="outline" size="sm"><RefreshCw size={14} /></Button>
          </div>

          {logsLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Number</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Channel</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.id} className="border-t border-border">
                        <td className="p-3 text-xs whitespace-nowrap">{new Date(log.created_at).toLocaleString("en-IN", { hour12: false })}</td>
                        <td className="p-3 text-xs font-mono">{log.whatsapp_number}</td>
                        <td className="p-3"><span className="px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">{log.category}</span></td>
                        <td className="p-3 text-xs">{log.channel}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${log.delivery_status === "sent" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                            {log.delivery_status}
                          </span>
                        </td>
                        <td className="p-3 text-xs max-w-[200px] truncate">{log.message_content}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No logs yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Message templates with variable support (use {"{{name}}"}, {"{{plan}}"}, etc.)</p>
            <div className="flex gap-2">
              <Button onClick={fetchTemplates} variant="outline" size="sm"><RefreshCw size={14} /></Button>
              <Button onClick={addTemplate} size="sm" className="gap-1.5"><Plus size={14} /> Add Template</Button>
            </div>
          </div>

          {templatesLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : templates.map(t => (
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
            <p className="text-center text-muted-foreground py-8">No templates yet. Click "Add Template" to create one.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
