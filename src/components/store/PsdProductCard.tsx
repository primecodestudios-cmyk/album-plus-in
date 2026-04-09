import { PsdTemplate } from "@/data/psdTemplates";
import { Download, HardDrive, Monitor, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PsdProductCardProps {
  template: PsdTemplate;
  onSelect: (template: PsdTemplate) => void;
}

export function PsdProductCard({ template, onSelect }: PsdProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-gold hover:border-accent/30 transition-all duration-300 cursor-pointer"
      onClick={() => onSelect(template)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={template.image}
          alt={template.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {template.isFree ? (
            <span className="px-3 py-1 rounded-full bg-[hsl(142,70%,45%)] text-[hsl(0,0%,100%)] text-xs font-bold">
              FREE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold">
              ₹{template.price}
            </span>
          )}
        </div>

        {/* Quick action on hover */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            className="w-full bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90 gap-2 rounded-xl"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(template);
            }}
          >
            <Download size={14} />
            {template.isFree ? "Download Free" : "Buy & Download"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display text-sm font-semibold text-foreground mb-2 truncate">
          {template.name}
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText size={12} /> {template.pages} Pages
          </span>
          <span className="flex items-center gap-1">
            <HardDrive size={12} /> {template.fileSize}
          </span>
          <span className="flex items-center gap-1">
            <Monitor size={12} /> {template.photoshopVersion.split("—")[0].trim()}+
          </span>
        </div>
      </div>
    </motion.div>
  );
}
