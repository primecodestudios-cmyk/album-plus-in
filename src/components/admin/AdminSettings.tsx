import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

const SETTINGS_KEY = "albumplus_admin_settings";

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
}

const defaultSettings: AppSettings = {
  whatsapp_instance_id: "",
  whatsapp_access_token: "",
  cpanel_sync_url: "",
  sync_api_secret: "",
  auto_refresh_interval: 30,
  enable_chat_widget: true,
  enable_whatsapp_button: true,
  maintenance_mode: false,
  site_title: "AlbumPlus",
  support_email: "",
  support_phone: "",
};

export function AdminSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [showWhatsAppToken, setShowWhatsAppToken] = useState(false);
  const [showSyncSecret, setShowSyncSecret] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [testNumber, setTestNumber] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // ignore
      }
    }
    // Also load sync URL from legacy key
    const legacySyncUrl = localStorage.getItem("albumplus_sync_url");
    if (legacySyncUrl) {
      setSettings((prev) => ({
        ...prev,
        cpanel_sync_url: prev.cpanel_sync_url || legacySyncUrl,
      }));
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      // Also save sync URL to legacy key for backward compatibility
      localStorage.setItem("albumplus_sync_url", settings.cpanel_sync_url);
      toast({ title: "Settings saved", description: "All settings have been saved successfully." });
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
          message: "✅ AlbumPlus WhatsApp API test successful!",
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

        {/* Test WhatsApp */}
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
              placeholder="support@albumplus.in"
              value={settings.support_email}
              onChange={(e) => update("support_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support_phone">Support Phone</Label>
            <Input
              id="support_phone"
              placeholder="+91 98765 43210"
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
