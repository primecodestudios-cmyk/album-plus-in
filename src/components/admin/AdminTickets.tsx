import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { TicketCheck, Search, Send, Clock, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: string;
  message: string;
  is_admin: boolean;
  user_id: string;
  created_at: string;
}

export const AdminTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setReplies(data);
  };

  const handleSelect = (id: string) => {
    setSelectedTicket(id === selectedTicket ? null : id);
    if (id !== selectedTicket) fetchReplies(id);
  };

  const handleReply = async () => {
    if (!user || !selectedTicket || !replyText.trim()) return;
    setReplying(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket,
      user_id: user.id,
      message: replyText.trim(),
      is_admin: true,
    });
    setReplying(false);
    if (error) {
      toast({ title: "Failed to reply", variant: "destructive" });
    } else {
      setReplyText("");
      fetchReplies(selectedTicket);
      toast({ title: "Reply sent ✅" });
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
    fetchTickets();
    toast({ title: `Ticket marked as ${status}` });
  };

  const filtered = tickets.filter((t) => {
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase()) && !t.user_id.includes(search)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "open") return "bg-primary/20 text-primary";
    if (s === "in_progress") return "bg-[hsl(45,100%,51%)]/20 text-[hsl(45,100%,51%)]";
    if (s === "resolved") return "bg-green-500/20 text-green-500";
    return "bg-muted text-muted-foreground";
  };

  const inputClass = "h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/40";

  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TicketCheck size={20} className="text-accent" />
        <h2 className="font-display text-xl font-bold text-foreground">Support Tickets</h2>
        {openCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-bold">{openCount} open</span>
        )}
        {inProgressCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-[hsl(45,100%,51%)]/20 text-[hsl(45,100%,51%)] text-xs font-bold">{inProgressCount} in progress</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subject or user..." className={`${inputClass} w-full pl-9`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <Button size="sm" onClick={fetchTickets} variant="outline" className="rounded-lg h-10">Refresh</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No tickets found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="border border-border rounded-xl overflow-hidden">
              <button onClick={() => handleSelect(t.id)} className={`w-full text-left p-4 transition-all ${selectedTicket === t.id ? "bg-accent/5" : "hover:bg-secondary/50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{t.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                    <span className="text-[10px] text-muted-foreground">{t.priority}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{t.user_id.slice(0, 8)}...</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{new Date(t.created_at).toLocaleString("en-IN")}</span>
                </div>
              </button>

              {selectedTicket === t.id && (
                <div className="p-4 border-t border-border bg-card">
                  <p className="text-sm text-foreground mb-3 p-3 rounded-lg bg-secondary/50">{t.message}</p>

                  {/* Status actions */}
                  <div className="flex gap-2 mb-3">
                    {t.status !== "in_progress" && <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "in_progress")} className="rounded-lg text-xs h-7">Mark In Progress</Button>}
                    {t.status !== "resolved" && <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "resolved")} className="rounded-lg text-xs h-7 text-green-500">Mark Resolved</Button>}
                    {t.status !== "closed" && <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, "closed")} className="rounded-lg text-xs h-7">Close</Button>}
                  </div>

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {replies.map((r) => (
                        <div key={r.id} className={`p-3 rounded-lg text-sm ${r.is_admin ? "bg-accent/10 border border-accent/20" : "bg-secondary/50"}`}>
                          <span className={`text-[10px] font-medium ${r.is_admin ? "text-accent" : "text-muted-foreground"}`}>
                            {r.is_admin ? "Admin" : "User"} · {new Date(r.created_at).toLocaleString("en-IN")}
                          </span>
                          <p className="text-foreground mt-1">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  <div className="flex gap-2">
                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Admin reply..." className={`${inputClass} flex-1`} onKeyDown={(e) => e.key === "Enter" && handleReply()} />
                    <Button size="sm" onClick={handleReply} disabled={replying} className="h-10 rounded-lg bg-accent text-accent-foreground gap-1">
                      <Send size={14} /> Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
