import { motion } from "framer-motion";
import { Globe, ShoppingBag, Monitor, Users, Shield, Headphones } from "lucide-react";

const pillars = [
  {
    icon: Globe,
    title: "SaaS Platform",
    description: "Cloud-powered software with license management, user dashboards, and automatic updates.",
    stats: "50K+ Active Users",
  },
  {
    icon: ShoppingBag,
    title: "PSD Marketplace",
    description: "Browse, purchase, and download premium PSD templates — wedding, birthday, engagement & more.",
    stats: "5000+ Templates",
  },
  {
    icon: Monitor,
    title: "Software Sales",
    description: "Instant license activation, device binding, and flexible subscription plans from ₹200.",
    stats: "4 Flexible Plans",
  },
];

const trust = [
  { icon: Users, label: "50,000+ Users" },
  { icon: Shield, label: "Secure Payments" },
  { icon: Headphones, label: "24/7 Support" },
];

export function PlatformSection() {
  return (
    <section className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            🏁 All-in-One Platform
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            More Than Just <span className="text-gradient-gold">Software</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Album Plus is a complete ecosystem — SaaS platform, PSD marketplace, and software sales hub, all in one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-card rounded-2xl p-6 md:p-8 border border-border shadow-card hover:border-accent/30 hover:shadow-gold transition-all duration-300 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                <p.icon size={30} className="text-accent" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.description}</p>
              <div className="inline-flex px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold">
                {p.stats}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-14">
          {trust.map((t) => (
            <div key={t.label} className="flex items-center gap-2 text-muted-foreground">
              <t.icon size={18} className="text-accent" />
              <span className="text-sm font-medium">{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
