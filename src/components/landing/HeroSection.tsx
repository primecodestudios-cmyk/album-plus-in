import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import heroMockup from "@/assets/hero-mockup.jpg";

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/8 blur-[150px]" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
              New: PSD Template Marketplace is Live
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-6">
              Design Stunning
              <br />
              Photo Albums{" "}
              <span className="text-gradient-gold">Effortlessly</span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              The all-in-one album design software for photographers. Create,
              customize, and deliver beautiful photo albums with 500+ professional
              PSD templates.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90 transition-opacity gap-2 text-base px-8 h-14 rounded-xl shadow-gold"
              >
                Start Free Trial
                <ArrowRight size={18} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-base h-14 rounded-xl border-border hover:border-accent/40 hover:text-accent transition-all"
              >
                <Play size={18} />
                Watch Demo
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-bold text-secondary-foreground"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <span>
                Trusted by <strong className="text-accent">12,000+</strong>{" "}
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
            <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-border">
              <img
                src={heroMockup}
                alt="FX MinuteAlbum software interface showing professional photo album design"
                className="w-full h-auto"
                loading="eager"
              />
            </div>
            {/* Floating stat card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-card rounded-xl p-4 shadow-elevated border border-accent/20 animate-float"
            >
              <div className="text-2xl font-display font-bold text-accent">500+</div>
              <div className="text-xs text-muted-foreground">PSD Templates</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-card rounded-xl p-4 shadow-elevated border border-primary/20"
              style={{ animationDelay: "1.5s" }}
            >
              <div className="text-2xl font-display font-bold text-primary">4.9★</div>
              <div className="text-xs text-muted-foreground">User Rating</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
