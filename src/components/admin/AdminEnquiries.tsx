import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, Trash2, Clock, User, MessageSquare, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
}

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const { toast } = useToast();

  const fetchEnquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_enquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading enquiries", variant: "destructive" });
    } else {
      setEnquiries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contact_enquiries").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    } else {
      toast({ title: "Enquiry deleted" });
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  if (enquiries.length === 0) {
    return (
      <div className="text-center py-16">
        <MessageSquare size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">No Enquiries Yet</h3>
        <p className="text-sm text-muted-foreground">Contact form submissions will appear here.</p>
      </div>
    );
  }

  const filtered = enquiries.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.message.toLowerCase().includes(q) ||
      (e.phone && e.phone.includes(q));

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;
    const created = new Date(e.created_at);
    const now = new Date();
    if (dateFilter === "today") return created.toDateString() === now.toDateString();
    if (dateFilter === "week") return now.getTime() - created.getTime() < 7 * 86400000;
    if (dateFilter === "month") return now.getTime() - created.getTime() < 30 * 86400000;
    return true;
  });

  const dateFilters: { id: typeof dateFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          Contact Enquiries ({filtered.length})
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-full sm:w-64"
            />
          </div>
          <div className="flex gap-1">
            {dateFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateFilter === f.id
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search size={36} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No enquiries match your search.</p>
        </div>
      )}

      {enquiries.map((enquiry, i) => (
        <motion.div
          key={enquiry.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className="bg-card rounded-2xl border border-border p-5 shadow-card hover:border-accent/20 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Subject */}
              <h3 className="font-display font-semibold text-foreground mb-2 truncate">
                {enquiry.subject}
              </h3>

              {/* Contact info */}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-accent" />
                  {enquiry.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail size={12} className="text-accent" />
                  {enquiry.email}
                </span>
                {enquiry.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone size={12} className="text-accent" />
                    {enquiry.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  {formatDate(enquiry.created_at)}
                </span>
              </div>

              {/* Message */}
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {enquiry.message}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              {enquiry.phone && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                >
                  <a
                    href={`https://wa.me/${enquiry.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi ${enquiry.name},\n\nThank you for contacting Album Plus regarding "${enquiry.subject}".\n\n`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle size={16} />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-accent hover:bg-accent/10"
              >
                <a
                  href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(enquiry.subject)}&body=${encodeURIComponent(`Hi ${enquiry.name},\n\nThank you for contacting Album Plus regarding "${enquiry.subject}".\n\n`)}`}
                >
                  <Mail size={16} />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(enquiry.id)}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
