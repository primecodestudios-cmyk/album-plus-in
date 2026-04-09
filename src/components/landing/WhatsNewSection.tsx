import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Changelog {
  id: string;
  version: string;
  release_date: string;
  changes: string[];
}

export function WhatsNewSection() {
  const [latest, setLatest] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("changelogs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
        .limit(1);
      if (data && data.length > 0) setLatest(data[0] as unknown as Changelog);
      setLoading(false);
    }
    fetch();
  }, []);

  if (loading || !latest) return null;

  return (
    <section className="py-16 md:py-20 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              📢 What's New
            </div>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground">
              Latest <span className="text-gradient-gold">Updates</span>
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="bg-card rounded-2xl border border-border p-6 md:p-8 hover:border-accent/30 hover:shadow-gold transition-all duration-300"
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                <Tag size={12} /> v{latest.version}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar size={12} />
                {new Date(latest.release_date).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <ul className="space-y-2 mb-6">
              {latest.changes.slice(0, 5).map((change, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-foreground/90">
                  <ArrowRight size={14} className="text-accent shrink-0 mt-0.5" />
                  <span>{change}</span>
                </li>
              ))}
              {latest.changes.length > 5 && (
                <li className="text-xs text-muted-foreground pl-6">
                  +{latest.changes.length - 5} more changes...
                </li>
              )}
            </ul>

            <Link to="/changelog">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                View All Updates <ArrowRight size={14} />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
