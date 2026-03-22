import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, ChevronRight, ArrowLeft, Trash2, RefreshCw, Search, Bot, User } from "lucide-react";
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

  const openConversation = async (convId: string) => {
    setSelectedConv(convId);
    setLoadingMessages(true);
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

  const filtered = conversations.filter((c) =>
    (c.session_id || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.user_email || "").toLowerCase().includes(search.toLowerCase())
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
            <h3 className="font-display text-sm font-bold text-foreground truncate">
              Session: {conv?.session_id?.slice(0, 20)}...
            </h3>
            <p className="text-xs text-muted-foreground">
              {conv?.message_count} messages • {conv?.started_at ? new Date(conv.started_at).toLocaleString("en-IN") : ""}
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => deleteConversation(selectedConv)} className="gap-2">
            <Trash2 size={14} /> Delete
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 max-h-[600px] overflow-y-auto space-y-3">
          {loadingMessages ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No messages found</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={14} className="text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-accent text-accent-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
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
              placeholder="Search sessions..."
              className="text-sm bg-muted rounded-xl pl-9 pr-3 py-2 outline-none placeholder:text-muted-foreground text-foreground w-48"
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
                    {conv.user_email || conv.session_id.slice(0, 24) + "..."}
                  </p>
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
