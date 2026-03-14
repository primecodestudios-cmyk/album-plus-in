import { motion } from "framer-motion";
import {
  PenTool,
  Wand2,
  Paintbrush,
  SunMedium,
  Camera,
  LayoutGrid,
  FileStack,
  Scissors,
} from "lucide-react";

const features = [
  {
    icon: PenTool,
    title: "Manual Album Designing",
    description: "Create albums manually with full creative control.",
  },
  {
    icon: Wand2,
    title: "Semi Auto Designing",
    description: "Automatically generate layouts quickly.",
  },
  {
    icon: Paintbrush,
    title: "Oil Painting Effect",
    description: "Convert photos to oil painting style instantly.",
  },
  {
    icon: SunMedium,
    title: "Auto Color Correction",
    description: "Fix lighting and skin tones automatically.",
  },
  {
    icon: Camera,
    title: "Multi Camera Editing",
    description: "Edit photos captured from multiple cameras.",
  },
  {
    icon: LayoutGrid,
    title: "Multi Window Editing",
    description: "Work with multiple images simultaneously.",
  },
  {
    icon: FileStack,
    title: "PSD Automation",
    description: "Convert PSD templates into auto layouts.",
  },
  {
    icon: Scissors,
    title: "Background Removal",
    description: "AI powered photo cutting.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            ⭐ Powerful Features
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to <span className="text-gradient-gold">Design</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Professional-grade tools built for speed, precision, and creativity.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative bg-card rounded-2xl p-5 md:p-6 border border-border hover:border-accent/30 shadow-card hover:shadow-gold transition-all duration-300 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-gradient-gold group-hover:scale-110 transition-all duration-300">
                <feature.icon
                  size={26}
                  className="text-accent group-hover:text-accent-foreground transition-colors"
                />
              </div>
              <h3 className="font-display text-sm md:text-base font-semibold text-foreground mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
