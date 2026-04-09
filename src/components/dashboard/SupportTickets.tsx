import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { TicketPlus, MessageSquare, Send, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Reply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export const SupportTickets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setTickets(data);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    if (data) setReplies(data);
  };

  const handleSelectTicket = (id: string) => {
    setSelectedTicket(id);
    fetchReplies(id);
  };

  const handleCreateTicket = async () => {
    if (!user || !newSubject.trim() || !newMessage.trim()) {
      toast({ title: "Please fill subject and message", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user.id,
      subject: newSubject.trim(),
      message: newMessage.trim(),
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to create ticket", variant: "destructive" });
    } else {
      toast({ title: "Ticket created! ✅" });
      setNewSubject("");
      setNewMessage("");
      setShowNew(false);
      fetchTickets();

      // Notify admin via WhatsApp (fire and forget)
      try {
        await supabase.functions.invoke("send-whatsapp", {
          body: {
            template: "support_ticket",
            data: {
              name: user.email,
              subject: newSubject,
              message: newMessage.slice(0, 100),
            },
          },
        });
      } catch {}
    }
  };

  const handleReply = async () => {
    if (!user || !selectedTicket || !replyText.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket,
      user_id: user.id,
      message: replyText.trim(),
      is_admin: false,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } else {
      setReplyText("");
      fetchReplies(selectedTicket);
    }
  };

  const statusColor = (s: string) => {
    if (s === "open") return "bg-primary/20 text-primary";
    if (s === "in_progress") return "bg-[hsl(45,100%,51%)]/20 text-[hsl(45,100%,51%)]";
    if (s === "resolved") return "bg-green-500/20 text-green-500";
    return "bg-muted text-muted-foreground";
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-accent" />
          <h2 className="font-display text-lg font-bold text-foreground">Support Tickets</h2>
        </div>
        <Button size="sm" onClick={() => { setShowNew(!showNew); setSelectedTicket(null); }} className="gap-1 rounded-lg text-xs bg-accent text-accent-foreground h-8">
          <TicketPlus size={14} /> New Ticket
        </Button>
      </div>

      {showNew && (
        <div className="mb-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
          <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject" className={inputClass} />
          <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Describe your issue..." rows={3} className={`${inputClass} h-auto py-2`} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateTicket} disabled={loading} className="bg-accent text-accent-foreground rounded-lg text-xs h-8 gap-1">
              <Send size={12} /> {loading ? "Creating..." : "Submit"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowNew(false)} className="rounded-lg text-xs h-8">Cancel</Button>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No tickets yet. Create one if you need help!</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => (
            <div key={t.id}>
              <button
                onClick={() => handleSelectTicket(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedTicket === t.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{t.subject}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(t.status)}`}>{t.status}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock size={10} /> {new Date(t.created_at).toLocaleDateString("en-IN")}
                </div>
              </button>

              {selectedTicket === t.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden">
                  <div className="ml-4 mt-2 space-y-2 pb-2">
                    <div className="p-3 rounded-lg bg-secondary/50 text-sm text-foreground">{t.message}</div>
                    {replies.map((r) => (
                      <div key={r.id} className={`p-3 rounded-lg text-sm ${r.is_admin ? "bg-accent/10 border border-accent/20" : "bg-secondary/50"}`}>
                        <span className={`text-[10px] font-medium ${r.is_admin ? "text-accent" : "text-muted-foreground"}`}>
                          {r.is_admin ? "Admin" : "You"} · {new Date(r.created_at).toLocaleString("en-IN")}
                        </span>
                        <p className="text-foreground mt-1">{r.message}</p>
                      </div>
                    ))}
                    {t.status !== "resolved" && t.status !== "closed" && (
                      <div className="flex gap-2">
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Type a reply..." className={`${inputClass} flex-1`} onKeyDown={(e) => e.key === "Enter" && handleReply()} />
                        <Button size="sm" onClick={handleReply} disabled={loading} className="h-10 rounded-lg bg-accent text-accent-foreground">
                          <Send size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
