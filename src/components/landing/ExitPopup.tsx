import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ExitPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("exit-popup-dismissed");
    if (dismissed) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) {
        setShow(true);
        document.removeEventListener("mouseout", handleMouseLeave);
      }
    };

    // Also trigger after 45s as fallback for mobile
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem("exit-popup-dismissed")) {
        setShow(true);
      }
    }, 45000);

    document.addEventListener("mouseout", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseout", handleMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem("exit-popup-dismissed", "true");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative bg-card rounded-2xl border border-accent/30 shadow-gold p-8 max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Gift size={32} className="text-accent" />
            </div>

            <h3 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
              Wait! Don't Leave Empty-Handed 🎁
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Download the <strong className="text-foreground">Free Demo</strong> and try Album Plus with no commitment. Plus get a special discount on your first purchase!
            </p>

            <div className="space-y-3">
              <Link to="/downloads" onClick={dismiss}>
                <Button className="w-full h-12 bg-gradient-gold text-accent-foreground font-display font-bold rounded-xl shadow-gold gap-2">
                  Download Free Demo <ArrowRight size={16} />
                </Button>
              </Link>
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                No thanks, I'll pass
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
