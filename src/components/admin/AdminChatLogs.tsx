import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ChevronRight, ArrowLeft, Trash2, RefreshCw, Search, Bot, User, Send, Headphones, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface Conversation {
  id: string;
  session_id: string;
  user_email: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  status: string;
  phone?: string | null;
  otp_verified?: boolean;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export function AdminChatLogs() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime for messages in selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    const channel = supabase
      .channel(`admin-chat-${selectedConv}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${selectedConv}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (convId: string) => {
    setSelectedConv(convId);
    setLoadingMessages(true);
    setReplyText("");
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages(data || []);
    }
    setLoadingMessages(false);
  };

  const deleteConversation = async (convId: string) => {
    const { error } = await supabase.from("chat_conversations").delete().eq("id", convId);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Conversation removed" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (selectedConv === convId) {
        setSelectedConv(null);
        setMessages([]);
      }
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConv || sending) return;
    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ conversation_id: selectedConv, message: replyText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Reply sent",
          description: data.whatsapp_sent ? "Chat + WhatsApp-ல் அனுப்பப்பட்டது" : "Chat-ல் அனுப்பப்பட்டது",
        });
        setReplyText("");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setSending(false);
  };

  const filtered = conversations.filter((c) =>
    (c.session_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  if (selectedConv) {
    const conv = conversations.find((c) => c.id === selectedConv);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedConv(null); setMessages([]); }} className="gap-2">
            <ArrowLeft size={16} /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-sm font-bold text-foreground truncate flex items-center gap-2">
              {conv?.phone ? (
                <><Phone size={14} className="text-green-500" /> {conv.phone}</>
              ) : (
                <>Session: {conv?.session_id?.slice(0, 20)}...</>
              )}
              {conv?.otp_verified && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">✓ Verified</span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              {conv?.message_count} messages • {conv?.started_at ? new Date(conv.started_at).toLocaleString("en-IN") : ""}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => deleteConversation(selectedConv)} className="gap-2">
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 max-h-[500px] overflow-y-auto space-y-3">
          {loadingMessages ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages found</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {(m.role === "assistant" || m.role === "admin") && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    m.role === "admin" ? "bg-green-500/10" : "bg-accent/10"
                  }`}>
                    {m.role === "admin" ? <Headphones size={14} className="text-green-500" /> : <Bot size={14} className="text-accent" />}
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground rounded-tr-sm"
                      : m.role === "admin"
                      ? "bg-green-500/10 text-foreground rounded-tl-sm border border-green-500/20"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {m.role === "admin" && (
                    <p className="text-[10px] font-semibold text-green-600 mb-0.5">👨‍💼 Admin Reply</p>
                  )}
                  {m.role === "assistant" || m.role === "admin" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                  <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-accent-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("en-IN")}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                    <User size={14} className="text-accent-foreground" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Admin Reply Input */}
        <div className="bg-card rounded-2xl border border-border p-3">
          <div className="flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Admin reply type செய்யவும்..."
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground text-foreground"
              disabled={sending}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
            />
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || sending}
              size="sm"
              className="rounded-xl h-10 px-4 gap-2"
            >
              <Send size={14} /> {sending ? "..." : "Reply"}
            </Button>
          </div>
          {conv?.phone && conv?.otp_verified && (
            <p className="text-[10px] text-green-600 mt-1.5 ml-1 flex items-center gap-1">
              <Phone size={10} /> Reply will also be sent to WhatsApp ({conv.phone})
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare size={20} className="text-accent" /> Chat Logs
          <span className="text-sm font-normal text-muted-foreground">({conversations.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sessions / phone..."
              className="text-sm bg-muted rounded-xl pl-9 pr-3 py-2 outline-none placeholder:text-muted-foreground text-foreground w-52"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchConversations} className="gap-2">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading conversations...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <MessageSquare size={40} className="text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No chat conversations found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <div
              key={conv.id}
              onClick={() => openConversation(conv.id)}
              className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 cursor-pointer hover:border-accent/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-green-500" />
                        {conv.phone}
                      </span>
                    ) : (
                      conv.user_email || conv.session_id.slice(0, 24) + "..."
                    )}
                  </p>
                  {conv.otp_verified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">✓</span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    conv.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                  }`}>
                    {conv.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {conv.message_count} messages • {new Date(conv.last_message_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                >
                  <Trash2 size={14} />
                </Button>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
