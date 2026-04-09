import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  enable_chat_widget: boolean;
  enable_whatsapp_button: boolean;
  maintenance_mode: boolean;
  whatsapp_instance_id: string;
  whatsapp_access_token: string;
  support_phone: string;
  support_email: string;
  site_title: string;
  app_version: string;
  intro_video_id: string;
}

const defaults: AppSettings = {
  enable_chat_widget: false,
  enable_whatsapp_button: false,
  maintenance_mode: false,
  whatsapp_instance_id: "",
  whatsapp_access_token: "",
  support_phone: "",
  support_email: "",
  site_title: "AlplumPlus",
  app_version: "",
  intro_video_id: "",
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("app_settings" as any)
      .select("key, value");

    if (data) {
      const map: Record<string, string> = {};
      (data as any[]).forEach((r: any) => { map[r.key] = r.value; });
      setSettings({
        enable_chat_widget: map.enable_chat_widget === "true",
        enable_whatsapp_button: map.enable_whatsapp_button === "true",
        maintenance_mode: map.maintenance_mode === "true",
        whatsapp_instance_id: map.whatsapp_instance_id || "",
        whatsapp_access_token: map.whatsapp_access_token || "",
        support_phone: map.support_phone || "",
        support_email: map.support_email || "",
        site_title: map.site_title || "AlplumPlus",
        app_version: map.app_version || "",
        intro_video_id: map.intro_video_id || "",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("app_settings" as any)
      .update({ value, updated_at: new Date().toISOString() } as any)
      .eq("key", key);
    
    if (error) {
      // Try upsert if row doesn't exist
      await supabase
        .from("app_settings" as any)
        .upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
    }
  };

  return { settings, loading, fetchSettings, updateSetting };
}
