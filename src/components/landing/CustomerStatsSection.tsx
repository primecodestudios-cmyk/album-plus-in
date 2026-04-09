import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Image, Camera, Globe } from "lucide-react";

interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

function AnimatedCounter({ end, suffix = "", prefix = "", duration = 2000 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <div ref={ref} className="font-display text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-accent tabular-nums leading-none">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

const stats = [
  { icon: Users, end: 2000, suffix: "+", label: "Customers Using", description: "Active photographers worldwide" },
  { icon: Image, end: 50000, suffix: "+", label: "Album Sheets Designed", description: "Professional quality albums" },
  { icon: Camera, end: 1000000, suffix: "+", prefix: "", label: "Photos Processed", description: "High-resolution images handled" },
  { icon: Globe, end: 3, suffix: "", label: "Countries", description: "India • Malaysia • Singapore" },
];

export function CustomerStatsSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
            Trusted by <span className="text-gradient-gold">2000+ Photographers</span> Since 2024
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Join thousands of professionals who trust Alplum Plus for their album designing needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center text-center bg-card/50 rounded-2xl border border-border p-4 md:p-7 min-h-[160px] md:min-h-[180px] hover:border-accent/30 hover:shadow-gold transition-all duration-300 overflow-hidden"
            >
              <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-3 shrink-0">
                <stat.icon size={22} className="text-accent" />
              </div>
              <AnimatedCounter
                end={stat.end}
                suffix={stat.suffix}
                prefix={stat.prefix}
              />
              <div className="font-display text-sm font-semibold text-foreground mt-2 leading-tight">
                {stat.label}
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
