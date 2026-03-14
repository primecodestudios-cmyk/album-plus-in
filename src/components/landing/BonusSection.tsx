import { motion } from "framer-motion";
import { Gift, HardDrive, FolderOpen, Crown } from "lucide-react";

export function BonusSection() {
  return (
    <section id="bonus" className="py-20 md:py-28 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-[150px]" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <Gift size={14} /> Free With Every License
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Free <span className="text-gradient-gold">Data Pack</span> Included
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Every license comes loaded with free resources to get you started immediately.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {/* Standard Bonus */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl p-8 bg-card border border-border shadow-card group hover:border-accent/30 hover:shadow-gold transition-all duration-300"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <HardDrive size={28} className="text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Every License Includes
            </h3>
            <div className="flex items-center gap-3 mt-5 p-4 rounded-xl bg-secondary/50 border border-border">
              <FolderOpen size={20} className="text-accent shrink-0" />
              <div>
                <div className="font-display font-bold text-2xl text-accent">12GB</div>
                <div className="text-sm text-muted-foreground">Data Pack Free</div>
              </div>
            </div>
          </motion.div>

          {/* Annual Bonus */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative rounded-2xl p-8 bg-card border border-accent/30 shadow-gold group hover:shadow-elevated transition-all duration-300"
          >
            <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold">
              Best Value
            </div>
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mb-5 group-hover:bg-gradient-gold group-hover:scale-110 transition-all duration-300">
              <Crown size={28} className="text-accent group-hover:text-accent-foreground transition-colors" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Annual Plan Bonus
            </h3>
            <div className="space-y-3 mt-5">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                <HardDrive size={20} className="text-accent shrink-0" />
                <div>
                  <div className="font-display font-bold text-2xl text-accent">500GB</div>
                  <div className="text-sm text-muted-foreground">Data Free</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/20">
                <FolderOpen size={20} className="text-accent shrink-0" />
                <div>
                  <div className="font-display font-bold text-2xl text-accent">5000</div>
                  <div className="text-sm text-muted-foreground">PSD Templates Free</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
