import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Key, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Profile {
  user_id: string;
  full_name: string;
  phone: string | null;
}

interface PricingPlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
}

export function AdminActivateLicense() {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserName, setSelectedUserName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [activating, setActivating] = useState(false);

  // Search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from("pricing_plans").select("*").eq("is_active", true).order("duration_days");
      if (data) setPlans(data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, phone")
      .or(`full_name.ilike.%${searchEmail}%,phone.ilike.%${searchEmail}%`);
    
    setSearchResults(data || []);
    setSearching(false);

    if (!data?.length) {
      toast({ title: "No users found", description: "Try a different search term", variant: "destructive" });
    }
  };

  const selectUser = (profile: Profile) => {
    setSelectedUserId(profile.user_id);
    setSelectedUserName(profile.full_name || profile.user_id);
    setSearchResults([]);
    setSearchEmail("");
  };

  const handleActivate = async () => {
    if (!selectedUserId || !selectedPlan) {
      toast({ title: "Select user and plan", variant: "destructive" });
      return;
    }

    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setActivating(true);
    try {
      const startsAt = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      const { error } = await supabase.from("user_licenses").insert({
        user_id: selectedUserId,
        plan_name: plan.plan_name,
        device_id: deviceId.trim() || null,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true,
      });

      if (error) throw error;

      toast({ title: "License activated!", description: `${plan.plan_name} for ${selectedUserName}` });
      setSelectedUserId("");
      setSelectedUserName("");
      setSelectedPlan("");
      setDeviceId("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setActivating(false);
    }
  };

  if (loading) return <div className="text-muted-foreground py-8 text-center">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Activate License</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manually activate a license for any user. Search by name or phone.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={20} className="text-primary" />
          <h3 className="font-display text-lg font-semibold text-foreground">New License Activation</h3>
        </div>

        {/* User Search */}
        <div className="mb-4">
          <Label>Search User (by name or phone)</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter name or phone..."
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button variant="outline" onClick={handleSearch} disabled={searching} className="gap-2 shrink-0">
              {searching ? <RefreshCw size={16} className="animate-spin" /> : <Search size={16} />}
              Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4 bg-muted/30 rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((p) => (
                  <TableRow key={p.user_id}>
                    <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                    <TableCell>{p.phone || "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => selectUser(p)}>
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Selected User */}
        {selectedUserId && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Selected: </span>
              <span className="font-semibold text-foreground">{selectedUserName}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedUserId(""); setSelectedUserName(""); }}>
              Change
            </Button>
          </div>
        )}

        {/* Plan & Device */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Plan *</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.plan_name} — {p.duration_days} days — ₹{p.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Device ID (optional)</Label>
            <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="PC/Device ID" />
          </div>
        </div>

        <Button onClick={handleActivate} disabled={activating || !selectedUserId || !selectedPlan} className="gap-2">
          {activating ? <RefreshCw size={16} className="animate-spin" /> : <Key size={16} />}
          {activating ? "Activating..." : "Activate License"}
        </Button>
      </div>
    </div>
  );
}
