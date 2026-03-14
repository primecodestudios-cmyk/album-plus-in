import { motion } from "framer-motion";
import { Layers, Palette, Download, ShieldCheck, Zap, Monitor } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Drag & Drop Designer",
    description: "Intuitive album layout editor with smart alignment, grids, and auto-arrange tools.",
  },
  {
    icon: Palette,
    title: "500+ PSD Templates",
    description: "Premium, fully customizable PSD templates for weddings, portraits, and events.",
  },
  {
    icon: Zap,
    title: "Batch Processing",
    description: "Apply layouts to hundreds of photos at once. Save hours on every project.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Export as high-res PDF, JPEG, or PSD — ready for print labs or digital delivery.",
  },
  {
    icon: Monitor,
    title: "Live Preview",
    description: "See real-time album previews with spread view, 3D flip, and client sharing.",
  },
  {
    icon: ShieldCheck,
    title: "License Management",
    description: "Activate on multiple devices, manage team seats, and track usage effortlessly.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-gradient-gold">Create</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Professional-grade tools designed for photographers who demand speed,
            quality, and creative freedom.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative bg-card rounded-2xl p-6 border border-border hover:border-accent/30 shadow-card hover:shadow-gold transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-gradient-gold transition-all duration-300">
                <feature.icon size={24} className="text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
