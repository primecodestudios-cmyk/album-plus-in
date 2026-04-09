import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  MessageSquare,
  Globe,
  Save,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Shield,
  Bell,
  Palette,
  Bot,
} from "lucide-react";

interface AppSettings {
  whatsapp_instance_id: string;
  whatsapp_access_token: string;
  cpanel_sync_url: string;
  sync_api_secret: string;
  auto_refresh_interval: number;
  enable_chat_widget: boolean;
  enable_whatsapp_button: boolean;
  maintenance_mode: boolean;
  site_title: string;
  support_email: string;
  support_phone: string;
  chatbot_system_prompt: string;
}

const defaultSettings: AppSettings = {
  whatsapp_instance_id: "",
  whatsapp_access_token: "",
  cpanel_sync_url: "",
  sync_api_secret: "",
  auto_refresh_interval: 30,
  enable_chat_widget: false,
  enable_whatsapp_button: false,
  maintenance_mode: false,
  site_title: "AlbumPlus",
  support_email: "",
  support_phone: "",
  chatbot_system_prompt: "",
};

// Keys stored in DB (app_settings table)
const DB_KEYS = [
  "enable_chat_widget",
  "enable_whatsapp_button",
  "maintenance_mode",
  "whatsapp_instance_id",
  "whatsapp_access_token",
  "support_phone",
  "support_email",
  "site_title",
  "chatbot_system_prompt",
];

export function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [showSyncSecret, setShowSyncSecret] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testNumber, setTestNumber] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Load DB settings
    const { data: dbRows } = await supabase
      .from("app_settings" as any)
      .select("key, value");

    const dbMap: Record<string, string> = {};
    if (dbRows) {
      (dbRows as any[]).forEach((r: any) => { dbMap[r.key] = r.value; });
    }

    // Load localStorage settings (for cpanel_sync_url, sync_api_secret, auto_refresh_interval)
    const SETTINGS_KEY = "alplumplus_admin_settings";
    let localSettings: Record<string, any> = {};
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) localSettings = JSON.parse(saved);
    } catch {}

    const legacySyncUrl = localStorage.getItem("alplumplus_sync_url");

    setSettings({
      enable_chat_widget: dbMap.enable_chat_widget === "true",
      enable_whatsapp_button: dbMap.enable_whatsapp_button === "true",
      maintenance_mode: dbMap.maintenance_mode === "true",
      whatsapp_instance_id: dbMap.whatsapp_instance_id || "",
      whatsapp_access_token: dbMap.whatsapp_access_token || "",
      support_phone: dbMap.support_phone || "",
      support_email: dbMap.support_email || "",
      site_title: dbMap.site_title || "AlbumPlus",
      chatbot_system_prompt: dbMap.chatbot_system_prompt || "",
      cpanel_sync_url: localSettings.cpanel_sync_url || legacySyncUrl || "",
      sync_api_secret: localSettings.sync_api_secret || "",
      auto_refresh_interval: localSettings.auto_refresh_interval || 30,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save DB settings
      for (const key of DB_KEYS) {
        const val = String((settings as any)[key] ?? "");
        await supabase
          .from("app_settings" as any)
          .update({ value: val, updated_at: new Date().toISOString() } as any)
          .eq("key", key);
      }

      // Save local-only settings
      const SETTINGS_KEY = "alplumplus_admin_settings";
      const localData = {
        cpanel_sync_url: settings.cpanel_sync_url,
        sync_api_secret: settings.sync_api_secret,
        auto_refresh_interval: settings.auto_refresh_interval,
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(localData));
      localStorage.setItem("alplumplus_sync_url", settings.cpanel_sync_url);

      toast({ title: "Settings saved", description: "All settings saved to database." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleTestWhatsApp = async () => {
    if (!testNumber || !settings.whatsapp_instance_id || !settings.whatsapp_access_token) {
      toast({ title: "Missing info", description: "Enter a phone number and WhatsApp API credentials.", variant: "destructive" });
      return;
    }
    setTestingWhatsApp(true);
    try {
      const res = await fetch("https://chat2me.in/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: testNumber.replace(/\D/g, ""),
          type: "text",
          message: "✅ AlplumPlus WhatsApp API test successful!",
          instance_id: settings.whatsapp_instance_id,
          access_token: settings.whatsapp_access_token,
        }),
      });
      const data = await res.json();
      if (data.status === "success" || res.ok) {
        toast({ title: "Test sent!", description: `Message sent to ${testNumber}` });
      } else {
        toast({ title: "Failed", description: data.message || "API returned an error.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to send test message.", variant: "destructive" });
    }
    setTestingWhatsApp(false);
  };

  const update = (key: keyof AppSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings size={24} /> Admin Settings
        </h2>
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-gold text-accent-foreground">
          <Save size={16} /> {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>

      {/* WhatsApp API Configuration */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <MessageSquare size={20} className="text-green-500" /> WhatsApp API Configuration
        </h3>
        <p className="text-sm text-muted-foreground">Configure chat2me.in API credentials for sending WhatsApp messages.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wa_instance">Instance ID</Label>
            <Input
              id="wa_instance"
              placeholder="609ACF283XXXX"
              value={settings.whatsapp_instance_id}
              onChange={(e) => update("whatsapp_instance_id", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wa_token">Access Token</Label>
            <div className="relative">
              <Input
                id="wa_token"
                type={showWhatsAppToken ? "text" : "password"}
                placeholder="69b7cb415ee3c"
                value={settings.whatsapp_access_token}
                onChange={(e) => update("whatsapp_access_token", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowWhatsAppToken(!showWhatsAppToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showWhatsAppToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-end gap-3 pt-2 border-t border-border">
          <div className="flex-1 space-y-2">
            <Label htmlFor="test_number">Test Phone Number</Label>
            <Input
              id="test_number"
              placeholder="919876543210"
              value={testNumber}
              onChange={(e) => setTestNumber(e.target.value)}
            />
          </div>
          <Button onClick={handleTestWhatsApp} disabled={testingWhatsApp} variant="outline" className="gap-2">
            <Send size={16} /> {testingWhatsApp ? "Sending..." : "Send Test"}
          </Button>
        </div>
      </div>

      {/* cPanel Sync Configuration */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <RefreshCw size={20} className="text-blue-500" /> cPanel Sync Configuration
        </h3>
        <p className="text-sm text-muted-foreground">Configure the sync endpoint URL and API secret for cPanel user synchronization.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sync_url">Sync Endpoint URL</Label>
            <Input
              id="sync_url"
              placeholder="https://yourdomain.com/sync.php"
              value={settings.cpanel_sync_url}
              onChange={(e) => update("cpanel_sync_url", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync_secret">Sync API Secret</Label>
            <div className="relative">
              <Input
                id="sync_secret"
                type={showSyncSecret ? "text" : "password"}
                placeholder="your-sync-secret"
                value={settings.sync_api_secret}
                onChange={(e) => update("sync_api_secret", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSyncSecret(!showSyncSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSyncSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Palette size={20} className="text-purple-500" /> General Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site_title">Site Title</Label>
            <Input
              id="site_title"
              value={settings.site_title}
              onChange={(e) => update("site_title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refresh_interval">Auto-Refresh Interval (seconds)</Label>
            <Input
              id="refresh_interval"
              type="number"
              min={10}
              max={300}
              value={settings.auto_refresh_interval}
              onChange={(e) => update("auto_refresh_interval", parseInt(e.target.value) || 30)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              placeholder="support@alplumplus.in"
              value={settings.support_email}
              onChange={(e) => update("support_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support_phone">Support Phone (with country code)</Label>
            <Input
              id="support_phone"
              placeholder="918883081855"
              value={settings.support_phone}
              onChange={(e) => update("support_phone", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell size={20} className="text-amber-500" /> Feature Toggles
        </h3>
        <p className="text-xs text-muted-foreground">These toggles control frontend visibility. Changes are saved to the database and take effect immediately.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-foreground">AI Chat Widget</p>
              <p className="text-sm text-muted-foreground">Show the AI chat assistant on pages</p>
            </div>
            <Switch
              checked={settings.enable_chat_widget}
              onCheckedChange={(v) => update("enable_chat_widget", v)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <p className="font-medium text-foreground">WhatsApp Button</p>
              <p className="text-sm text-muted-foreground">Show floating WhatsApp contact button</p>
            </div>
            <Switch
              checked={settings.enable_whatsapp_button}
              onCheckedChange={(v) => update("enable_whatsapp_button", v)}
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                <Shield size={16} className="text-destructive" /> Maintenance Mode
              </p>
              <p className="text-sm text-muted-foreground">Temporarily disable the site for visitors</p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(v) => update("maintenance_mode", v)}
            />
          </div>
        </div>
      </div>

      {/* Save button bottom */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2 bg-gradient-gold text-accent-foreground">
          <Save size={16} /> {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
