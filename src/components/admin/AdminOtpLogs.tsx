import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Clock, CheckCircle, XCircle } from "lucide-react";

interface OtpLog {
  id: string;
  email: string;
  phone: string | null;
  otp_type: string;
  otp_code: string;
  verified: boolean;
  created_at: string;
  expires_at: string;
}

export const AdminOtpLogs = () => {
  const [logs, setLogs] = useState<OtpLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("signup_otps")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setLogs(data);
    setLoading(false);
  };

  const filtered = logs.filter(
    (l) =>
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      (l.phone && l.phone.includes(search))
  );

  if (loading) return <div className="text-muted-foreground text-center py-12">Loading OTP logs...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-foreground">OTP Verification Logs</h2>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or phone..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total OTPs", value: logs.length, icon: Clock },
          { label: "Verified", value: logs.filter((l) => l.verified).length, icon: CheckCircle },
          { label: "Pending", value: logs.filter((l) => !l.verified).length, icon: XCircle },
          { label: "Via WhatsApp", value: logs.filter((l) => l.otp_type === "whatsapp" || l.otp_type === "both").length, icon: Phone },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={14} className="text-accent" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="text-lg font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-muted-foreground font-medium">Email</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Phone</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
                <th className="text-left p-3 text-muted-foreground font-medium">OTP</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Created</th>
                <th className="text-left p-3 text-muted-foreground font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">No OTP logs found</td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isExpired = new Date(log.expires_at) < new Date();
                  return (
                    <tr key={log.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                      <td className="p-3 font-medium text-foreground">{log.email}</td>
                      <td className="p-3 text-muted-foreground">{log.phone || "—"}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="gap-1">
                          {log.otp_type === "whatsapp" ? <Phone size={10} /> : log.otp_type === "both" ? <Phone size={10} /> : <Mail size={10} />}
                          {log.otp_type}
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{log.otp_code || "—"}</td>
                      <td className="p-3">
                        {log.verified ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Verified</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(log.expires_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
