import { PsdTemplate } from "@/data/psdTemplates";
import { X, Download, HardDrive, Monitor, FileText, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface PsdDetailModalProps {
  template: PsdTemplate | null;
  onClose: () => void;
}

export function PsdDetailModal({ template, onClose }: PsdDetailModalProps) {
  if (!template) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-elevated"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/60 backdrop-blur border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
          >
            <X size={18} />
          </button>

          <div className="grid md:grid-cols-2">
            {/* Image */}
            <div className="aspect-[4/3] md:aspect-auto md:min-h-[400px] relative">
              <img
                src={template.image}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                {template.isFree ? (
                  <span className="px-4 py-1.5 rounded-full bg-[hsl(142,70%,45%)] text-[hsl(0,0%,100%)] text-sm font-bold">
                    FREE
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-gold text-accent-foreground text-sm font-bold">
                    ₹{template.price}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col">
              <div className="mb-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  {template.category}
                </span>
              </div>
              <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4">
                {template.name}
              </h2>

              {/* Specs */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <HardDrive size={18} className="text-accent shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">File Size</div>
                    <div className="text-sm font-semibold text-foreground">{template.fileSize}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <Monitor size={18} className="text-accent shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Photoshop Version</div>
                    <div className="text-sm font-semibold text-foreground">{template.photoshopVersion}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <FileText size={18} className="text-accent shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Pages</div>
                    <div className="text-sm font-semibold text-foreground">{template.pages} Pages</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                  <Users size={18} className="text-accent shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                    <div className="text-sm font-semibold text-foreground">{template.downloads.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Includes */}
              <div className="mb-6">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Includes</div>
                <ul className="space-y-1.5">
                  {["Layered PSD File", "High Resolution (300 DPI)", "Easy to Customize", "Print Ready"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto">
                <Button
                  size="lg"
                  className="w-full h-14 rounded-xl font-semibold text-base bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold gap-2"
                >
                  <Download size={18} />
                  {template.isFree ? "Download Free" : `Buy for ₹${template.price}`}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
