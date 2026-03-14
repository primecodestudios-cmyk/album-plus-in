import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function useCountdown(targetMinutes: number) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = sessionStorage.getItem("lto-end");
    if (stored) {
      const diff = Math.max(0, Math.floor((parseInt(stored) - Date.now()) / 1000));
      return diff;
    }
    const end = Date.now() + targetMinutes * 60 * 1000;
    sessionStorage.setItem("lto-end", String(end));
    return targetMinutes * 60;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const hrs = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;
  return { hrs, mins, secs, expired: timeLeft <= 0 };
}

export function LimitedTimeBanner() {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("lto-dismissed") === "true");
  const { hrs, mins, secs, expired } = useCountdown(120); // 2 hours

  if (dismissed || expired) return null;

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("lto-dismissed", "true");
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -60, opacity: 0 }}
        className="fixed top-16 left-0 right-0 z-40 bg-gradient-gold border-b border-accent/30"
      >
        <div className="container mx-auto px-4 h-10 flex items-center justify-center gap-3 text-accent-foreground">
          <Zap size={14} className="shrink-0" />
          <span className="text-xs md:text-sm font-semibold truncate">
            🔥 Limited Time Offer — Get <strong>20% OFF</strong> on all plans!
          </span>
          <div className="flex items-center gap-1 font-mono text-xs font-bold shrink-0">
            <Clock size={12} />
            <span>{pad(hrs)}:{pad(mins)}:{pad(secs)}</span>
          </div>
          <Link to="/#pricing" className="hidden sm:block">
            <Button size="sm" className="h-7 px-3 text-[10px] font-bold bg-background text-foreground hover:bg-background/90 rounded-lg">
              Grab Deal
            </Button>
          </Link>
          <button onClick={dismiss} className="ml-1 shrink-0 text-accent-foreground/60 hover:text-accent-foreground">
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
