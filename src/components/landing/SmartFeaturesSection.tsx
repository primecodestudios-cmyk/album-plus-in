import { motion } from "framer-motion";
import { Brain, LayoutTemplate, FileOutput, CloudUpload, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const smartFeatures = [
  {
    icon: Brain,
    badge: "Smart Tools",
    title: "Smart Album Layout Generator",
    description: "Select your photos, choose a style, and let our automation engine create stunning album layouts in seconds. Supports Wedding, Birthday, Engagement, and Traditional album styles.",
    highlights: ["Auto photo arrangement", "Style-aware layouts", "One-click generation"],
    gradient: "from-[hsl(280,80%,60%)] to-[hsl(320,80%,55%)]",
  },
  {
    icon: LayoutTemplate,
    badge: "Automation",
    title: "PSD Auto Layout Converter",
    description: "Import any PSD template and our engine auto-converts it into a reusable layout. No manual setup — just drag, drop, and design at 10x speed.",
    highlights: ["Import any PSD file", "Auto layer detection", "Instant reusable templates"],
    gradient: "from-[hsl(200,80%,55%)] to-[hsl(230,80%,60%)]",
  },
  {
    icon: FileOutput,
    badge: "Export",
    title: "One Click Album Export",
    description: "Export your entire album as print-ready PDFs, high-res JPEGs, or layered PSDs — in a single click. Batch export 200+ pages instantly.",
    highlights: ["PDF, JPEG, PSD formats", "Print-ready output", "Batch export 200+ pages"],
    gradient: "from-[hsl(142,70%,45%)] to-[hsl(170,70%,40%)]",
  },
  {
    icon: CloudUpload,
    badge: "Cloud",
    title: "Cloud Backup & Sync",
    description: "Never lose your work. Auto-backup your projects, templates, and settings to the cloud. Access your designs from any device, anywhere.",
    highlights: ["Auto cloud backup", "Cross-device sync", "Secure encrypted storage"],
    gradient: "from-[hsl(35,90%,55%)] to-[hsl(25,90%,50%)]",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export function SmartFeaturesSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[180px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[150px]" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Sparkles size={14} /> Smart Features
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            Powered by <span className="text-gradient-gold">Smart Automation</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Advanced automation features that make Album Plus the smartest album designing software in India.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto"
        >
          {smartFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border hover:border-accent/30 shadow-card hover:shadow-gold transition-all duration-400"
            >
              {/* Badge */}
              <div className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                {feature.badge}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon size={26} className="text-[hsl(0,0%,100%)]" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {feature.description}
              </p>

              {/* Highlights */}
              <div className="space-y-2">
                {feature.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs">
                    <Zap size={12} className="text-accent shrink-0" />
                    <span className="text-foreground font-medium">{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link to="/downloads">
            <Button className="bg-gradient-gold text-accent-foreground font-display font-bold h-13 px-8 rounded-xl shadow-gold gap-2 text-sm">
              Try All Features Free <ArrowRight size={16} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
