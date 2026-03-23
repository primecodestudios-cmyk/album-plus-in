import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, RotateCcw, BookOpen, IndianRupee, Headphones, HelpCircle, Download, Shield, Sparkles, Phone, KeyRound, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant" | "admin"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const OTP_SEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`;
const OTP_VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`;

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (e: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: messages.filter(m => m.role !== "admin").map(m => ({ role: m.role === "admin" ? "assistant" : m.role, content: m.content })) }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Connection failed" }));
    onError(err.error || "Something went wrong");
    return;
  }
  if (!resp.body) { onError("No response"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: rd, value } = await reader.read();
    if (rd) break;
    buf += decoder.decode(value, { stream: true });

    let ni: number;
    while ((ni = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, ni);
      buf = buf.slice(ni + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const quickTemplates = [
  { icon: BookOpen, label: "Album Demo", prompt: "Show me a demo of Album Plus features and how to create a wedding album step by step" },
  { icon: IndianRupee, label: "Pricing Plans", prompt: "What are the pricing plans available for Album Plus? Show all plans with prices" },
  { icon: Headphones, label: "Support Help", prompt: "I need technical support. How can I contact your team and what are your support hours?" },
  { icon: Download, label: "Download & Install", prompt: "How do I download and install Album Plus? What are the system requirements?" },
  { icon: Shield, label: "License & Activation", prompt: "How do I activate my license key? Can I transfer it to another device?" },
  { icon: HelpCircle, label: "Troubleshooting", prompt: "Album Plus is running slow or showing errors. How can I fix common issues?" },
  { icon: Sparkles, label: "Smart Features", prompt: "What are the smart automation features in Album Plus? Tell me about PSD conversion and templates" },
  { icon: MessageCircle, label: "Refund Policy", prompt: "What is the refund policy for Album Plus? Can I get a refund after purchase?" },
];

type OtpStep = "phone" | "otp" | "verified";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);

  // OTP states
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Realtime subscription for admin replies
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.role === "admin") {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.content === newMsg.content && m.role === "admin")) return prev;
              return [...prev, { role: "admin", content: newMsg.content }];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId;
    const { data } = await supabase
      .from("chat_conversations")
      .insert({ session_id: sessionId })
      .select("id")
      .single();
    if (data) {
      setConversationId(data.id);
      return data.id;
    }
    return null;
  }, [conversationId, sessionId]);

  const saveMessage = useCallback(async (convId: string, role: string, content: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      role,
      content,
    });
    await supabase
      .from("chat_conversations")
      .update({ last_message_at: new Date().toISOString(), message_count: messages.length + 1 })
      .eq("id", convId);
  }, [messages.length]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setConversationId(null);
    setOtpStep("phone");
    setPhoneNumber("");
    setOtpInput("");
    setOtpError("");
    setPendingMessage("");
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 10) {
      setOtpError("சரியான WhatsApp number உள்ளிடவும்");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      const convId = await ensureConversation();
      if (!convId) {
        setOtpError("Connection error. Please try again.");
        setOtpLoading(false);
        return;
      }

      const res = await fetch(OTP_SEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ phone: phoneNumber.replace(/\D/g, ""), conversation_id: convId }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpStep("otp");
      } else {
        setOtpError(data.error || "OTP அனுப்ப முடியவில்லை");
      }
    } catch {
      setOtpError("Connection error. Please try again.");
    }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.length !== 6) {
      setOtpError("6 digit OTP உள்ளிடவும்");
      return;
    }
    setOtpLoading(true);
    setOtpError("");

    try {
      const res = await fetch(OTP_VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ conversation_id: conversationId, otp: otpInput }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpStep("verified");
        // If there was a pending message, send it now
        if (pendingMessage) {
          setTimeout(() => send(pendingMessage), 300);
          setPendingMessage("");
        }
      } else {
        setOtpError(data.error || "Invalid OTP");
      }
    } catch {
      setOtpError("Connection error. Please try again.");
    }
    setOtpLoading(false);
  };

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      // If not verified, store pending message and show phone input
      if (otpStep !== "verified") {
        setPendingMessage(text.trim());
        return;
      }

      const userMsg: Msg = { role: "user", content: text.trim() };
      setMessages((p) => [...p, userMsg]);
      setInput("");
      setLoading(true);

      const convId = await ensureConversation();
      if (convId) {
        saveMessage(convId, "user", text.trim());
      }

      let assistantSoFar = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: [...messages, userMsg],
          onDelta: upsert,
          onDone: () => {
            setLoading(false);
            if (convId && assistantSoFar) {
              saveMessage(convId, "assistant", assistantSoFar);
            }
          },
          onError: (e) => {
            upsert(`⚠️ ${e}`);
            setLoading(false);
          },
        });
      } catch {
        upsert("⚠️ Connection error. Please try again.");
        setLoading(false);
      }
    },
    [messages, loading, ensureConversation, saveMessage, otpStep]
  );

  const handleFirstMessage = (text: string) => {
    if (otpStep !== "verified") {
      setPendingMessage(text);
      // Don't show phone step until they try to send
      return;
    }
    send(text);
  };

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Open chat"
          >
            <MessageCircle size={26} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-accent/5">
              <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                <Headphones size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Album Plus Support</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  24/7 Online Support
                </p>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleNewChat}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="New Chat"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Welcome + Templates (shown when no messages and verified or first time) */}
              {messages.length === 0 && !pendingMessage && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-accent" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-foreground">
                      👋 Hi! I'm <strong>Album Plus AI Assistant</strong>. How can I help you today? Pick a topic below or type your question!
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-0">
                    {quickTemplates.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.label}
                          onClick={() => handleFirstMessage(t.prompt)}
                          className="flex items-center gap-2 text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-card hover:border-accent/50 hover:bg-accent/5 transition-all group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                            <Icon size={14} className="text-accent" />
                          </div>
                          <span className="text-foreground font-medium leading-tight">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OTP Phone Input Step */}
              {pendingMessage && otpStep === "phone" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-accent" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground space-y-2">
                      <p>📱 Chat தொடங்க, உங்கள் <strong>WhatsApp number</strong> உள்ளிடவும். OTP verification செய்யப்படும்.</p>
                    </div>
                  </div>
                  <div className="ml-9 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="919876543210"
                          className="w-full text-sm bg-muted rounded-xl pl-9 pr-3 py-2.5 outline-none placeholder:text-muted-foreground text-foreground border border-border focus:border-accent"
                          disabled={otpLoading}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        className="rounded-xl h-10 px-4 gap-1.5"
                      >
                        {otpLoading ? "..." : <><Send size={14} /> OTP</>}
                      </Button>
                    </div>
                    {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                  </div>
                </div>
              )}

              {/* OTP Verify Step */}
              {pendingMessage && otpStep === "otp" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={14} className="text-accent" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground space-y-1">
                      <p>✅ OTP <strong>{phoneNumber}</strong> WhatsApp-க்கு அனுப்பப்பட்டது!</p>
                      <p className="text-muted-foreground text-xs">6 digit code-ஐ கீழே உள்ளிடவும்</p>
                    </div>
                  </div>
                  <div className="ml-9 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="000000"
                          className="w-full text-sm bg-muted rounded-xl pl-9 pr-3 py-2.5 outline-none placeholder:text-muted-foreground text-foreground border border-border focus:border-accent tracking-widest text-center font-mono"
                          disabled={otpLoading}
                          maxLength={6}
                          onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleVerifyOtp}
                        disabled={otpLoading}
                        className="rounded-xl h-10 px-4 gap-1.5"
                      >
                        {otpLoading ? "..." : <><ShieldCheck size={14} /> Verify</>}
                      </Button>
                    </div>
                    {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                    <button
                      onClick={() => { setOtpStep("phone"); setOtpInput(""); setOtpError(""); }}
                      className="text-xs text-accent hover:underline"
                    >
                      ← Number மாற்ற
                    </button>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
                  {(m.role === "assistant" || m.role === "admin") && (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      m.role === "admin" ? "bg-green-500/10" : "bg-accent/10"
                    }`}>
                      {m.role === "admin" ? (
                        <Headphones size={14} className="text-green-500" />
                      ) : (
                        <Bot size={14} className="text-accent" />
                      )}
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
                      <p className="text-[10px] font-semibold text-green-600 mb-0.5">👨‍💼 Support Agent</p>
                    )}
                    {m.role === "assistant" || m.role === "admin" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} className="text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-accent" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-2 border-t border-border bg-card">
              {otpStep === "verified" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your question..."
                    className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground text-foreground"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || loading}
                    className="rounded-xl h-9 w-9 shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </form>
              ) : (
                <div className="text-center py-1">
                  <p className="text-xs text-muted-foreground">
                    📱 Chat தொடங்க WhatsApp verify செய்யவும்
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
