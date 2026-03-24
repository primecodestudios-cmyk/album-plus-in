import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, MessageCircle, Mail, Phone, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { ContactForm } from "@/components/support/ContactForm";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Navbar } from "@/components/landing/Navbar";
import { useAppSettings } from "@/hooks/useAppSettings";

const faqs = [
  {
    category: "General",
    questions: [
      { q: "What is Album Plus?", a: "Album Plus is India's #1 wedding album designing software. It helps photographers create stunning photo albums using smart automation tools, PSD template conversion, and 500+ templates — all compatible with Adobe Photoshop CS3 to CC 2026." },
      { q: "Is Album Plus compatible with my Photoshop version?", a: "Yes! Album Plus supports all Adobe Photoshop versions from CS3 to CC 2026, including both 32-bit and 64-bit systems." },
      { q: "Can I try before buying?", a: "Absolutely! We offer a free demo version with limited features so you can evaluate the software before purchasing a license." },
      { q: "Does Album Plus work on Mac?", a: "Currently, Album Plus is designed for Windows operating systems. Mac support is planned for future releases." },
    ],
  },
  {
    category: "License & Activation",
    questions: [
      { q: "How do I activate my license?", a: "After purchasing, you'll receive a license key (format: ALBM-XXXX-XXXX-XXXX). Go to the Activate License page, enter your key and device ID, and click Activate. Your license will be bound to that device." },
      { q: "Can I use my license on multiple devices?", a: "Each license key is bound to one device upon activation. If you need to switch devices, contact our support team for assistance." },
      { q: "What happens when my license expires?", a: "When your license expires, the software will switch to demo mode with limited features. You can renew anytime by purchasing a new plan from our website." },
      { q: "I lost my license key. What should I do?", a: "Log in to your dashboard to view your active license key. If you still can't find it, contact our support team with your purchase details." },
    ],
  },
  {
    category: "Pricing & Payments",
    questions: [
      { q: "What payment methods do you accept?", a: "We accept UPI, credit/debit cards, net banking, and popular wallets. All payments are processed securely through trusted Indian payment gateways." },
      { q: "Is there a refund policy?", a: "Since Album Plus is a digital product, refunds are not available after purchase. We strongly recommend trying the free demo version before buying. See our Refund Policy page for details." },
      { q: "Can I upgrade my plan?", a: "Yes! You can upgrade to a higher plan at any time. Contact our support team and we'll help you with the upgrade." },
    ],
  },
  {
    category: "Technical Support",
    questions: [
      { q: "Album Plus is running slow. What should I do?", a: "Ensure your system meets minimum requirements (4GB RAM, dual-core processor). Close other heavy applications, and make sure you're running the latest version of Album Plus." },
      { q: "I'm getting an error during installation.", a: "Try running the installer as Administrator. If the issue persists, temporarily disable your antivirus and try again. Contact support if the problem continues." },
      { q: "How do I update to the latest version?", a: "Visit the Downloads page to get the latest update patch. Download and install it over your existing installation — your settings and templates will be preserved." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="pb-4"
        >
          <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  );
}

const Support = () => {
  const { settings } = useAppSettings();
  const supportPhone = settings.support_phone || "918883081855";
  const formattedPhone = supportPhone.replace(/(\d{2})(\d{5})(\d{5})/, "+$1 $2 $3");

  const waUrl = `https://api.whatsapp.com/send?phone=${supportPhone.replace(/\D/g, "")}&text=${encodeURIComponent("Hi AlbumPlus Team, I need help with ...")}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              <HelpCircle size={14} /> Help & Support
            </div>
            <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              How Can We <span className="text-gradient-gold">Help?</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Find answers to common questions or reach out to our support team.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2 space-y-6">
              {faqs.map((section) => (
                <motion.div
                  key={section.category}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-card"
                >
                  <h2 className="font-display text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    {section.category}
                  </h2>
                  <div>
                    {section.questions.map((faq) => (
                      <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                    ))}
                  </div>
                </motion.div>
              ))}

              <ContactForm />
            </div>

            <div className="space-y-5">
              {/* WhatsApp Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl border border-[hsl(142,70%,45%)]/30 p-6 shadow-card"
              >
                <div className="w-12 h-12 rounded-2xl bg-[hsl(142,70%,45%)]/10 flex items-center justify-center mb-4">
                  <MessageCircle size={24} className="text-[hsl(142,70%,45%)]" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">Chat on WhatsApp</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Get instant help from our team. We typically respond within 5 minutes.
                </p>
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-[hsl(0,0%,100%)] font-semibold rounded-xl gap-2">
                    <MessageCircle size={16} /> Start Chat
                  </Button>
                </a>
                <p className="text-[10px] text-muted-foreground text-center mt-2">
                  {formattedPhone} • Mon–Sat, 10 AM – 6 PM
                </p>
              </motion.div>

              {/* Email Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Mail size={24} className="text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">Email Support</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  For detailed queries, license issues, or business inquiries.
                </p>
                <a href={`mailto:${settings.support_email || "support@albumplus.in"}`} className="text-sm text-accent font-medium hover:underline">
                  {settings.support_email || "support@albumplus.in"}
                </a>
              </motion.div>

              {/* Phone Card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card rounded-2xl border border-border p-6 shadow-card"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Phone size={24} className="text-accent" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1">Call Us</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Sales & general enquiries, or speak with support directly.
                </p>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Support</span>
                    <a href={`tel:+${supportPhone.replace(/\D/g, "")}`} className="block text-sm text-accent font-medium hover:underline">
                      {formattedPhone}
                    </a>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Mon–Sat: 10 AM – 6 PM • Sunday: Closed
                </p>
              </motion.div>

              {/* Quick Links */}
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
                <h3 className="font-display font-bold text-foreground mb-3 text-sm">Quick Links</h3>
                <div className="space-y-2">
                  {[
                    { label: "Download Center", to: "/downloads" },
                    { label: "Activate License", to: "/activate" },
                    { label: "Refund Policy", to: "/refund-policy" },
                    { label: "Terms & Conditions", to: "/terms" },
                  ].map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="block text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      {settings.enable_chat_widget && <ChatWidget />}
    </div>
  );
};

export default Support;
