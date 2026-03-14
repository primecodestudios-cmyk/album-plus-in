import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight } from "lucide-react";

const comparisons = [
  {
    label: "Wedding Album — Traditional to Modern",
    description: "Manual 6-hour layout vs Album Plus 20-minute auto-design",
    beforeColor: "hsl(var(--muted))",
    afterColor: "hsl(var(--accent))",
    beforeStats: { time: "6 Hours", quality: "Basic", pages: "24 Pages" },
    afterStats: { time: "20 Min", quality: "Premium", pages: "24 Pages" },
  },
  {
    label: "Engagement Album — Flat vs Professional",
    description: "Plain photo placement vs smart cinematic layouts",
    beforeColor: "hsl(var(--muted))",
    afterColor: "hsl(var(--accent))",
    beforeStats: { time: "4 Hours", quality: "Flat", pages: "16 Pages" },
    afterStats: { time: "15 Min", quality: "Cinematic", pages: "16 Pages" },
  },
  {
    label: "Birthday Album — Amateur vs Studio Grade",
    description: "Manual cropping vs smart auto-fit with effects",
    beforeColor: "hsl(var(--muted))",
    afterColor: "hsl(var(--accent))",
    beforeStats: { time: "3 Hours", quality: "Amateur", pages: "12 Pages" },
    afterStats: { time: "10 Min", quality: "Studio", pages: "12 Pages" },
  },
];

export function BeforeAfterSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = comparisons[activeIndex];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-[150px]" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            <ArrowLeftRight size={14} /> Before & After
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            See the <span className="text-gradient-gold">Difference</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Compare manual album designing vs Album Plus automated workflow.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {comparisons.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActiveIndex(i)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all ${
                activeIndex === i
                  ? "bg-gradient-gold text-accent-foreground shadow-gold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label.split("—")[0].trim()}
            </button>
          ))}
        </div>

        {/* Comparison card */}
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-6">
            <h3 className="font-display text-lg font-bold text-foreground">{active.label}</h3>
            <p className="text-sm text-muted-foreground">{active.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Before */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
              <div className="text-xs font-bold text-destructive uppercase tracking-wider mb-4">❌ Without Album Plus</div>
              <div className="aspect-[4/3] rounded-xl bg-muted/50 border border-border flex items-center justify-center mb-5">
                <div className="text-center p-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">Manual Layout</div>
                  <div className="text-xs text-muted-foreground/60">Time-consuming & inconsistent</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(active.beforeStats).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                    <span className="text-xs font-bold text-muted-foreground">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After */}
            <div className="bg-card rounded-2xl border border-accent/30 p-6 shadow-gold">
              <div className="text-xs font-bold text-accent uppercase tracking-wider mb-4">✅ With Album Plus</div>
              <div className="aspect-[4/3] rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center mb-5">
                <div className="text-center p-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="text-sm font-medium text-foreground">Smart Auto-Design</div>
                  <div className="text-xs text-muted-foreground">Fast, professional & consistent</div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(active.afterStats).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-accent/10 last:border-0">
                    <span className="text-xs text-muted-foreground capitalize">{key}</span>
                    <span className="text-xs font-bold text-accent">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
