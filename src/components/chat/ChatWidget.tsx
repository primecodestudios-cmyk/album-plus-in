import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, RotateCcw, BookOpen, IndianRupee, Headphones, HelpCircle, Download, Shield, Sparkles, Phone, KeyRound, ShieldCheck, Mic, MicOff, Volume2, Globe, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant" | "admin"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const OTP_SEND_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-otp`;
const OTP_VERIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-otp`;

const LANGUAGES = [
  { code: "ta", label: "தமிழ்", name: "Tamil", speechCode: "ta-IN" },
  { code: "en", label: "English", name: "English", speechCode: "en-IN" },
  { code: "hi", label: "हिन्दी", name: "Hindi", speechCode: "hi-IN" },
  { code: "te", label: "తెలుగు", name: "Telugu", speechCode: "te-IN" },
  { code: "kn", label: "ಕನ್ನಡ", name: "Kannada", speechCode: "kn-IN" },
  { code: "ml", label: "മലയാളം", name: "Malayalam", speechCode: "ml-IN" },
];

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function streamChat({
  messages,
  language,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  language: string;
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
    body: JSON.stringify({
      messages: messages.filter(m => m.role !== "admin").map(m => ({ role: m.role === "admin" ? "assistant" : m.role, content: m.content })),
      language,
    }),
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
  { icon: Shield, label: "License & Activation", prompt: "How do I activate my license? Can I transfer it to another device?" },
  { icon: HelpCircle, label: "Troubleshooting", prompt: "Album Plus is running slow or showing errors. How can I fix common issues?" },
  { icon: Sparkles, label: "Smart Features", prompt: "What are the smart automation features in Album Plus? Tell me about PSD conversion and templates" },
  { icon: MessageCircle, label: "Refund Policy", prompt: "What is the refund policy for Album Plus? Can I get a refund after purchase?" },
];

type OtpStep = "phone" | "otp" | "verified";
type ChatStep = "language" | "chat";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>("language");
  const [selectedLang, setSelectedLang] = useState<typeof LANGUAGES[0] | null>(null);
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

  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Admin settings
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [otpRequired, setOtpRequired] = useState(true);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Load admin chatbot settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["chatbot_voice_enabled", "chatbot_otp_required"]);
      if (data) {
        data.forEach((r: any) => {
          if (r.key === "chatbot_voice_enabled") setVoiceEnabled(r.value === "true");
          if (r.key === "chatbot_otp_required") setOtpRequired(r.value === "true");
        });
      }
    };
    loadSettings();
  }, []);

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
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.role === "admin") {
            setMessages((prev) => {
              if (prev.some((m) => m.content === newMsg.content && m.role === "admin")) return prev;
              return [...prev, { role: "admin", content: newMsg.content }];
            });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    await supabase.from("chat_messages").insert({ conversation_id: convId, role, content });
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
    setChatStep("language");
    setSelectedLang(null);
    setOtpStep("phone");
    setPhoneNumber("");
    setOtpInput("");
    setOtpError("");
    setPendingMessage("");
    stopListening();
    stopSpeaking();
  };

  const handleSelectLanguage = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setChatStep("chat");
    // If OTP not required, skip to verified
    if (!otpRequired) {
      setOtpStep("verified");
    }
  };

  const handleSwitchLanguage = (lang: typeof LANGUAGES[0]) => {
    setSelectedLang(lang);
    setShowLangDropdown(false);
  };

  // ========== Voice Input (Speech-to-Text) ==========
  const startListening = useCallback(() => {
    if (!selectedLang) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLang.speechCode;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [selectedLang]);

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // ========== Voice Output (Text-to-Speech) ==========
  const speakText = useCallback((text: string) => {
    if (!selectedLang || !voiceEnabled) return;
    // Strip markdown
    const clean = text.replace(/[#*_`~\[\]()>-]/g, "").replace(/\n+/g, ". ");
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = selectedLang.speechCode;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [selectedLang, voiceEnabled]);

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // ========== OTP Handlers ==========
  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 10) {
      setOtpError("Please enter a valid WhatsApp number");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const convId = await ensureConversation();
      if (!convId) { setOtpError("Connection error"); setOtpLoading(false); return; }
      const res = await fetch(OTP_SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ phone: phoneNumber.replace(/\D/g, ""), conversation_id: convId }),
      });
      const data = await res.json();
      if (data.success) setOtpStep("otp");
      else setOtpError(data.error || "Failed to send OTP");
    } catch { setOtpError("Connection error"); }
    setOtpLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpInput.trim() || otpInput.length !== 6) { setOtpError("Enter 6-digit OTP"); return; }
    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await fetch(OTP_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ conversation_id: conversationId, otp: otpInput }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep("verified");
        if (pendingMessage) { setTimeout(() => send(pendingMessage), 300); setPendingMessage(""); }
      } else setOtpError(data.error || "Invalid OTP");
    } catch { setOtpError("Connection error"); }
    setOtpLoading(false);
  };

  // ========== Send Message ==========
  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading || !selectedLang) return;

      if (otpRequired && otpStep !== "verified") {
        setPendingMessage(text.trim());
        return;
      }

      const userMsg: Msg = { role: "user", content: text.trim() };
      setMessages((p) => [...p, userMsg]);
      setInput("");
      setLoading(true);

      const convId = await ensureConversation();
      if (convId) saveMessage(convId, "user", text.trim());

      let assistantSoFar = "";
      const upsert = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        await streamChat({
          messages: [...messages, userMsg],
          language: selectedLang.code,
          onDelta: upsert,
          onDone: () => {
            setLoading(false);
            if (convId && assistantSoFar) saveMessage(convId, "assistant", assistantSoFar);
          },
          onError: (e) => { upsert(`⚠️ ${e}`); setLoading(false); },
        });
      } catch {
        upsert("⚠️ Connection error. Please try again.");
        setLoading(false);
      }
    },
    [messages, loading, ensureConversation, saveMessage, otpStep, otpRequired, selectedLang]
  );

  const handleFirstMessage = (text: string) => {
    if (otpRequired && otpStep !== "verified") { setPendingMessage(text); return; }
    send(text);
  };

  const langObj = selectedLang || LANGUAGES[0];

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
            className="fixed bottom-20 right-4 z-50 w-12 h-12 md:w-14 md:h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
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
            className="fixed bottom-0 right-0 md:bottom-4 md:right-4 z-50 w-full md:w-[400px] md:max-w-[calc(100vw-2rem)] h-[100dvh] md:h-[600px] md:max-h-[calc(100vh-2rem)] bg-card border border-border md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
                {/* Language switcher */}
                {chatStep === "chat" && selectedLang && (
                  <div className="relative">
                    <button
                      onClick={() => setShowLangDropdown(!showLangDropdown)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Switch Language"
                    >
                      <Globe size={14} />
                      <span>{selectedLang.label}</span>
                      <ChevronDown size={12} />
                    </button>
                    {showLangDropdown && (
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg py-1 z-50 min-w-[140px]">
                        {LANGUAGES.map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleSwitchLanguage(lang)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                              selectedLang.code === lang.code ? "text-accent font-semibold" : "text-foreground"
                            }`}
                          >
                            <span>{lang.label}</span>
                            <span className="text-xs text-muted-foreground">({lang.name})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {messages.length > 0 && (
                  <button onClick={handleNewChat} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="New Chat">
                    <RotateCcw size={16} />
                  </button>
                )}
                <button onClick={() => { setOpen(false); setShowLangDropdown(false); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ========== LANGUAGE SELECTION STEP ========== */}
            {chatStep === "language" && (
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-6">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Globe size={32} className="text-accent" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-foreground">Select Your Language</h3>
                  <p className="text-sm text-muted-foreground">Choose your preferred language for the conversation</p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-[300px]">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelectLanguage(lang)}
                      className="flex flex-col items-center gap-1 px-4 py-4 rounded-xl border border-border bg-card hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                      <span className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">{lang.label}</span>
                      <span className="text-xs text-muted-foreground">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ========== CHAT STEP ========== */}
            {chatStep === "chat" && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* Welcome + Templates */}
                  {messages.length === 0 && !pendingMessage && (!otpRequired || otpStep === "verified") && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={14} className="text-accent" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-foreground">
                          👋 Hi! I'm <strong>Album Plus AI Assistant</strong>. How can I help you today? Pick a topic below or type your question!
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                  {otpRequired && pendingMessage && otpStep === "phone" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={14} className="text-accent" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground">
                          <p>📱 Please enter your <strong>WhatsApp number</strong> to verify via OTP before chatting.</p>
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
                          <Button size="sm" onClick={handleSendOtp} disabled={otpLoading} className="rounded-xl h-10 px-4 gap-1.5">
                            {otpLoading ? "..." : <><Send size={14} /> OTP</>}
                          </Button>
                        </div>
                        {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                      </div>
                    </div>
                  )}

                  {/* OTP Verify Step */}
                  {otpRequired && pendingMessage && otpStep === "otp" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={14} className="text-accent" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 text-sm text-foreground space-y-1">
                          <p>✅ OTP sent to <strong>{phoneNumber}</strong> via WhatsApp!</p>
                          <p className="text-muted-foreground text-xs">Enter the 6-digit code below</p>
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
                          <Button size="sm" onClick={handleVerifyOtp} disabled={otpLoading} className="rounded-xl h-10 px-4 gap-1.5">
                            {otpLoading ? "..." : <><ShieldCheck size={14} /> Verify</>}
                          </Button>
                        </div>
                        {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                        <button onClick={() => { setOtpStep("phone"); setOtpInput(""); setOtpError(""); }} className="text-xs text-accent hover:underline">
                          ← Change Number
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
                          <p className="text-[10px] font-semibold text-green-600 mb-0.5">👨‍💼 Support Agent</p>
                        )}
                        {m.role === "assistant" || m.role === "admin" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                            <ReactMarkdown>{m.content}</ReactMarkdown>
                          </div>
                        ) : (
                          m.content
                        )}
                        {/* Speaker button for AI messages */}
                        {voiceEnabled && (m.role === "assistant" || m.role === "admin") && m.content && !loading && (
                          <button
                            onClick={() => isSpeaking ? stopSpeaking() : speakText(m.content)}
                            className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-accent transition-colors"
                            title={isSpeaking ? "Stop" : "Listen"}
                          >
                            <Volume2 size={12} className={isSpeaking ? "text-accent animate-pulse" : ""} />
                            {isSpeaking ? "Stop" : "🔊 Listen"}
                          </button>
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
                  {(!otpRequired || otpStep === "verified") ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); send(input); }}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none placeholder:text-muted-foreground text-foreground"
                        disabled={loading}
                      />
                      {/* Voice Input Button */}
                      {voiceEnabled && (
                        <button
                          type="button"
                          onClick={() => isListening ? stopListening() : startListening()}
                          className={`p-2 rounded-xl transition-all ${
                            isListening
                              ? "bg-destructive text-destructive-foreground animate-pulse"
                              : "bg-muted text-muted-foreground hover:text-foreground hover:bg-accent/10"
                          }`}
                          title={isListening ? "Stop listening" : "Voice input"}
                          disabled={loading}
                        >
                          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                        </button>
                      )}
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
                        📱 Verify via WhatsApp to start chatting
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
