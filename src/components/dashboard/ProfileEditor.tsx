import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Camera, Check, X, Plus, Edit3 } from "lucide-react";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "United Arab Emirates", "Saudi Arabia", "Singapore", "Malaysia",
  "Sri Lanka", "Bangladesh", "Nepal", "Pakistan", "South Africa",
  "Germany", "France", "Japan", "South Korea", "Thailand", "Indonesia",
  "Philippines", "Vietnam", "Brazil", "Mexico", "Nigeria", "Kenya", "Other"
];

const LANGUAGES = [
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "Malayalam", label: "Malayalam (മலயாளം)" },
];

interface ProfileData {
  full_name: string;
  phone: string;
  studio_name: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  address: string;
  languages: string[];
  whatsapp_numbers: string[];
  avatar_url: string;
}

export const ProfileEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileData>({
    full_name: "", phone: "", studio_name: "", city: "", state: "",
    country: "India", pincode: "", address: "", languages: [],
    whatsapp_numbers: [""], avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, studio_name, city, state, country, pincode, address, languages, whatsapp_numbers, avatar_url")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const p = data as ProfileData;
        setProfile(p);
        setForm({
          ...p,
          whatsapp_numbers: p.whatsapp_numbers?.length ? p.whatsapp_numbers : [""],
          languages: p.languages || [],
        });
      }
    };
    fetch();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleWhatsAppChange = (index: number, value: string) => {
    const nums = [...form.whatsapp_numbers];
    nums[index] = value.replace(/\D/g, "");
    setForm({ ...form, whatsapp_numbers: nums });
  };

  const toggleLanguage = (lang: string) => {
    setForm({
      ...form,
      languages: form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang],
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large (max 2MB)", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    if (urlData?.publicUrl) {
      setForm({ ...form, avatar_url: urlData.publicUrl });
      toast({ title: "Photo uploaded" });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const whatsappNums = form.whatsapp_numbers.filter((n) => n.trim());
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          studio_name: form.studio_name,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
          address: form.address,
          languages: form.languages,
          whatsapp_numbers: whatsappNums,
          avatar_url: form.avatar_url,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Log activity
      await supabase.functions.invoke("activity-log", {
        body: { user_id: user.id, action: "profile_update", details: { updated_fields: Object.keys(form) } },
      });

      setProfile({ ...form, whatsapp_numbers: whatsappNums });
      setEditing(false);
      toast({ title: "Profile updated! ✅" });
    } catch (err: any) {
      toast({ title: err.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;

  const inputClass = "w-full h-10 px-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User size={18} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">Profile</h2>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
            <Edit3 size={14} /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setForm({ ...profile, whatsapp_numbers: profile.whatsapp_numbers?.length ? profile.whatsapp_numbers : [""] }); }}>
              <X size={14} /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-gradient-gold text-accent-foreground">
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        /* View Mode */
        <div className="space-y-3">
          <div className="flex items-center gap-4 mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <User size={24} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="font-display font-bold text-foreground">{profile.full_name || "—"}</div>
              <div className="text-xs text-muted-foreground">{profile.studio_name || "No studio"}</div>
            </div>
          </div>
          {[
            { label: "Phone", value: profile.phone },
            { label: "Country", value: profile.country },
            { label: "City", value: `${profile.city}${profile.state ? `, ${profile.state}` : ""}` },
            { label: "Pincode", value: profile.pincode },
            { label: "Address", value: profile.address },
            { label: "WhatsApp", value: profile.whatsapp_numbers?.join(", ") },
            { label: "Languages", value: profile.languages?.join(", ") },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground">{item.value || "—"}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-accent/50">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={20} className="text-muted-foreground" />
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <span className="text-xs text-muted-foreground">Click to change photo</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Phone</label>
              <input name="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Studio Name</label>
            <input name="studio_name" value={form.studio_name} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Country</label>
              <select name="country" value={form.country} onChange={handleChange} className={inputClass}>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">City</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">State</label>
              <input name="state" value={form.state} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Pincode</label>
              <input name="pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Address</label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* WhatsApp Numbers */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">WhatsApp Numbers</label>
            {form.whatsapp_numbers.map((num, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={num} onChange={(e) => handleWhatsAppChange(i, e.target.value)} maxLength={form.country === "India" ? 10 : 15} className={`${inputClass} flex-1`} />
                {form.whatsapp_numbers.length > 1 && (
                  <button type="button" onClick={() => setForm({ ...form, whatsapp_numbers: form.whatsapp_numbers.filter((_, idx) => idx !== i) })} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            {form.whatsapp_numbers.length < 3 && (
              <button type="button" onClick={() => setForm({ ...form, whatsapp_numbers: [...form.whatsapp_numbers, ""] })} className="flex items-center gap-1 text-xs text-accent hover:underline">
                <Plus size={12} /> Add number
              </button>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Languages</label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button key={lang.value} type="button" onClick={() => toggleLanguage(lang.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    form.languages.includes(lang.value)
                      ? "bg-accent/20 border-accent text-accent"
                      : "bg-secondary border-border text-muted-foreground hover:border-accent/30"
                  }`}>
                  {form.languages.includes(lang.value) && <Check size={10} className="inline mr-1" />}
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
