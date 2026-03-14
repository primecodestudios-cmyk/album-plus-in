import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import heroMockup from "@/assets/hero-mockup.jpg";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero opacity-[0.03]" />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              New: PSD Template Marketplace is Live
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground mb-6">
              Design Stunning
              <br />
              Photo Albums{" "}
              <span className="text-gradient-accent">Effortlessly</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              The all-in-one album design software for photographers. Create,
              customize, and deliver beautiful photo albums with 500+ professional
              PSD templates.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-gradient-accent text-accent-foreground hover:opacity-90 transition-opacity gap-2 text-base px-8"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base"
              >
                <Play size={18} />
                Watch Demo
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-bold text-secondary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>
                Trusted by <strong className="text-foreground">12,000+</strong>{" "}
                photographers
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={heroMockup}
                alt="Album Plus software interface showing professional photo album design"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-card rounded-xl p-4 shadow-elevated border border-border"
            >
              <div className="text-2xl font-display font-bold text-foreground">500+</div>
              <div className="text-xs text-muted-foreground">PSD Templates</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
