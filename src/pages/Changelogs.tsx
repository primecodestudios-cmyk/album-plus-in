import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Tag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/skeleton";

interface Changelog {
  id: string;
  version: string;
  release_date: string;
  changes: string[];
  is_active: boolean;
}

const Changelogs = () => {
  const [logs, setLogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("changelogs")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setLogs(data as unknown as Changelog[]);
      setLoading(false);
    }
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              📢 What's New
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Album Plus <span className="text-gradient-gold">Updates</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Stay up to date with the latest features, improvements, and bug fixes.
            </p>
          </motion.div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[18px] md:left-[22px] top-0 bottom-0 w-px bg-border" />

              <div className="space-y-8">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="relative pl-12 md:pl-14"
                  >
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 md:left-3.5 top-1 w-3 h-3 rounded-full bg-accent border-2 border-background shadow-gold" />

                    <div className="bg-card rounded-2xl border border-border p-5 md:p-6 hover:border-accent/30 hover:shadow-gold transition-all duration-300">
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold border border-accent/20">
                          <Tag size={12} /> v{log.version}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar size={12} />
                          {new Date(log.release_date).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Changes list */}
                      <ul className="space-y-2">
                        {log.changes.map((change, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-foreground/90"
                          >
                            <ArrowRight size={14} className="text-accent shrink-0 mt-0.5" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Changelogs;
