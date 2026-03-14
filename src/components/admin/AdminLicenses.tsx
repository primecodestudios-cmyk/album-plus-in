import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldX, Plus } from "lucide-react";

interface License {
  id: string;
  user_id: string;
  plan_name: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  license_key: string | null;
  device_id: string | null;
}

interface Profile {
  user_id: string;
  full_name: string;
}

export function AdminLicenses() {
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // New license form
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [planName, setPlanName] = useState("28 Days");
  const [days, setDays] = useState(28);

  const fetchData = async () => {
    const [licRes, profRes] = await Promise.all([
      supabase.from("user_licenses").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (licRes.data) setLicenses(licRes.data);
    if (profRes.data) {
      const map: Record<string, string> = {};
      profRes.data.forEach((p: Profile) => { map[p.user_id] = p.full_name; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleLicense = async (id: string, currentActive: boolean) => {
    const { error } = await supabase
      .from("user_licenses")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({ title: currentActive ? "License deactivated" : "License activated" });
      fetchData();
    }
  };

  const generateLicense = async () => {
    if (!email) {
      toast({ title: "Enter user email", variant: "destructive" });
      return;
    }

    // Look up user by email via profiles (we need user_id)
    // Since we can't query auth.users directly, we'll use the profiles
    const { data: allProfiles } = await supabase.from("profiles").select("user_id, full_name");
    // We need to find the user — for now let's search by checking auth metadata
    // Actually, let's use a simpler approach: search profiles
    toast({ title: "Looking up user..." });

    // We can't directly query auth.users from client, so let's just accept user_id
    // For a better UX, let's just ask for user info from profiles
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    // For simplicity, let's search by full_name or use email as identifier
    // In production, this would use an edge function
    const { error } = await supabase.from("user_licenses").insert({
      user_id: email, // This expects UUID — we'll handle this better
      plan_name: planName,
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
    });

    if (error) {
      toast({ title: "Error: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "License generated!" });
      setShowForm(false);
      setEmail("");
      fetchData();
    }
  };

  const remaining = (expiry: string) => {
    const d = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return d > 0 ? `${d} days` : "Expired";
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">License Management</h2>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-gold text-accent-foreground font-semibold gap-2 rounded-xl"
        >
          <Plus size={16} /> Generate License
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-2xl border border-accent/30 p-5 mb-6 shadow-gold space-y-3">
          <h3 className="font-display font-semibold text-foreground">New License</h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">User ID (UUID)</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Paste user UUID"
              className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Plan</label>
              <select
                value={planName}
                onChange={(e) => {
                  setPlanName(e.target.value);
                  const map: Record<string, number> = { "28 Days": 28, "3 Months": 90, "6 Months": 180, "1 Year": 365 };
                  setDays(map[e.target.value] || 28);
                }}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none"
              >
                <option>28 Days</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>1 Year</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duration (days)</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={generateLicense} className="bg-gradient-gold text-accent-foreground font-semibold rounded-xl">
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Licenses table */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-left p-4 font-medium">License Key</th>
                <th className="text-left p-4 font-medium">Plan</th>
                <th className="text-left p-4 font-medium">Device</th>
                <th className="text-left p-4 font-medium">Remaining</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">No licenses found</td>
                </tr>
              ) : (
                licenses.map((lic) => (
                  <tr key={lic.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="font-medium text-foreground">{profiles[lic.user_id] || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">{lic.user_id.slice(0, 8)}...</div>
                    </td>
                    <td className="p-4 text-foreground">{lic.plan_name}</td>
                    <td className="p-4 text-foreground">{remaining(lic.expires_at)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                        lic.is_active ? "bg-[hsl(142,70%,45%)]/10 text-[hsl(142,70%,45%)]" : "bg-destructive/10 text-destructive"
                      }`}>
                        {lic.is_active ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                        {lic.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleLicense(lic.id, lic.is_active)}
                        className={`text-xs ${lic.is_active ? "text-destructive" : "text-accent"}`}
                      >
                        {lic.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
