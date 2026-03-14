import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, ChevronLeft, ChevronRight, Sparkles, Cpu, Monitor, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import heroSlide4 from "@/assets/hero-slide-4.jpg";

const slides = [
  {
    image: heroSlide1,
    badge: "🇮🇳 #1 in India",
    title: "India's Fastest Wedding Album Designing Software",
    subtitle: "Create professional album sheets faster with smart automation tools.",
    buttons: [
      { label: "Download Demo", icon: Download, variant: "outline" as const },
      { label: "Buy License", icon: ArrowRight, variant: "gold" as const },
    ],
    stats: [
      { value: "200+", label: "Sheets/Day" },
      { value: "50K+", label: "Users" },
    ],
  },
  {
    image: heroSlide2,
    badge: "✨ AI Powered",
    title: "AI Powered Album Designing",
    subtitle: "Let artificial intelligence do the heavy lifting",
    features: [
      { icon: Sparkles, text: "Auto Album Design" },
      { icon: Cpu, text: "Auto Photo Cutting" },
      { icon: Monitor, text: "Auto Color Correction" },
    ],
    buttons: [
      { label: "Try AI Features", icon: ArrowRight, variant: "gold" as const },
    ],
  },
  {
    image: heroSlide3,
    badge: "🔧 Full Compatibility",
    title: "Compatible With All Photoshop Versions",
    subtitle: "CS3 to CC 2024 — 32 Bit & 64 Bit Supported",
    tags: ["CS3", "CS4", "CS5", "CS6", "CC 2014", "CC 2020", "CC 2024"],
    buttons: [
      { label: "Check Compatibility", icon: ArrowRight, variant: "gold" as const },
    ],
  },
  {
    image: heroSlide4,
    badge: "🎁 Free Bonus",
    title: "Get Free PSD Templates & Data Pack",
    subtitle: "Everything you need to start designing right away",
    stats: [
      { value: "12GB", label: "Free Data Pack" },
      { value: "500GB", label: "Bonus for Year Plan" },
    ],
    buttons: [
      { label: "Download Free Pack", icon: FolderOpen, variant: "outline" as const },
      { label: "Get Year Plan", icon: ArrowRight, variant: "gold" as const },
    ],
  },
];

const AUTOPLAY_MS = 6000;

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((p) => (p + 1) % slides.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((p) => (p - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? "60%" : "-60%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-60%" : "60%", opacity: 0 }),
  };

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-16 touch-pan-y">
      {/* Background image with overlay */}
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0"
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading={current === 0 ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={current === 0 ? "high" : "low"}
          />
          <div className="absolute inset-0 bg-background/75" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="max-w-3xl"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-6">
              {slide.badge}
            </div>

            {/* Title */}
            <h1 className="font-display text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-foreground mb-4">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-xl text-muted-foreground mb-8 max-w-xl">
              {slide.subtitle}
            </p>

            {/* Features list (Slide 2) */}
            {slide.features && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {slide.features.map((f) => (
                  <div
                    key={f.text}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/60 backdrop-blur border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <f.icon size={20} className="text-accent" />
                    </div>
                    <span className="font-display font-semibold text-sm text-foreground">
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tags (Slide 3) */}
            {slide.tags && (
              <div className="flex flex-wrap gap-2 mb-8">
                {slide.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary-foreground text-xs font-bold border border-primary/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats */}
            {slide.stats && (
              <div className="flex gap-6 mb-8">
                {slide.stats.map((s) => (
                  <div key={s.label}>
                    <div className="font-display text-3xl md:text-4xl font-bold text-accent">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {slide.buttons.map((btn) => (
                <Button
                  key={btn.label}
                  size="lg"
                  variant={btn.variant === "gold" ? "default" : "outline"}
                  className={`gap-2 text-sm md:text-base h-12 md:h-14 rounded-xl font-semibold ${
                    btn.variant === "gold"
                      ? "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
                      : "border-border hover:border-accent/40 hover:text-accent"
                  }`}
                >
                  <btn.icon size={18} />
                  {btn.label}
                </Button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card/60 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-card hover:border-accent/30 transition-all active:scale-95"
        aria-label="Previous slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card/60 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-card hover:border-accent/30 transition-all active:scale-95"
        aria-label="Next slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots + progress */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative h-2 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: i === current ? 40 : 12 }}
          >
            <div className="absolute inset-0 bg-foreground/20 rounded-full" />
            {i === current && (
              <motion.div
                className="absolute inset-0 bg-gradient-gold rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            )}
            {i !== current && (
              <div className="absolute inset-0 bg-foreground/30 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
