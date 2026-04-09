import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileData {
  full_name: string;
  phone: string;
  studio_name: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  address: string;
  whatsapp_numbers: string[];
  languages: string[];
}

const LANGUAGES = [
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "Malayalam", label: "Malayalam (മലയാളം)" },
];

export const ProfileCompletionBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, studio_name, city, state, country, pincode, address, whatsapp_numbers, languages")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setProfile(data as ProfileData);
        const missing: string[] = [];
        if (!data.phone) missing.push("Phone");
        if (!data.studio_name) missing.push("Studio Name");
        if (!data.city) missing.push("City");
        if (!data.state) missing.push("State");
        if (!(data as any).pincode) missing.push("Pincode");
        if (!(data as any).address) missing.push("Address");
        if (!(data as any).whatsapp_numbers?.length) missing.push("WhatsApp Number");
        if (!data.languages?.length) missing.push("Languages");
        setMissingFields(missing);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: profile.phone,
        studio_name: profile.studio_name,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        pincode: profile.pincode,
        address: profile.address,
        whatsapp_numbers: profile.whatsapp_numbers,
        languages: profile.languages,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated! ✅" });
      setMissingFields([]);
      setShowForm(false);
    }
  };

  if (dismissed || missingFields.length === 0) return null;

  const inputClass = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
      <div className="bg-[hsl(45,100%,51%)]/5 border border-[hsl(45,100%,51%)]/20 rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-[hsl(45,100%,51%)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Complete your profile</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Missing: {missingFields.join(", ")}
              </p>
              {!showForm && (
                <Button size="sm" onClick={() => setShowForm(true)} className="mt-2 gap-1 bg-accent text-accent-foreground rounded-lg text-xs h-8">
                  Complete Now <ArrowRight size={12} />
                </Button>
              )}
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <AnimatePresence>
          {showForm && profile && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[hsl(45,100%,51%)]/10">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                  <input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, "") })} placeholder="Phone number" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Studio Name</label>
                  <input value={profile.studio_name || ""} onChange={(e) => setProfile({ ...profile, studio_name: e.target.value })} placeholder="Studio name" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">City</label>
                  <input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} placeholder="City" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">State</label>
                  <input value={profile.state || ""} onChange={(e) => setProfile({ ...profile, state: e.target.value })} placeholder="State" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Pincode</label>
                  <input value={profile.pincode || ""} onChange={(e) => setProfile({ ...profile, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="Pincode" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                  <input value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Short address" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">WhatsApp Number</label>
                  <input
                    value={profile.whatsapp_numbers?.[0] || ""}
                    onChange={(e) => setProfile({ ...profile, whatsapp_numbers: [e.target.value.replace(/\D/g, "")] })}
                    placeholder="WhatsApp number"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Languages</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => {
                          const langs = profile.languages || [];
                          setProfile({
                            ...profile,
                            languages: langs.includes(lang.value) ? langs.filter((l) => l !== lang.value) : [...langs, lang.value],
                          });
                        }}
                        className={`px-2 py-1 rounded-lg text-xs border transition-all ${
                          profile.languages?.includes(lang.value) ? "bg-accent/20 border-accent text-accent" : "bg-secondary border-border text-muted-foreground"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground rounded-lg text-xs h-8">
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="rounded-lg text-xs h-8">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
