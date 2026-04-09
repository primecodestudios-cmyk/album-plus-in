import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VolumeX, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function IntroVideoSection() {
  const [isMuted, setIsMuted] = useState(true);
  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "intro_video_id")
      .single()
      .then(({ data }: any) => {
        if (data?.value) setVideoId(data.value);
      });
  }, []);

  if (!videoId) return null;

  return (
    <section className="relative w-full bg-background overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            🎬 Software Overview
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
            See <span className="text-gradient-gold">Alplum Plus</span> in Action
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Discover how Alplum Plus revolutionizes album designing with speed, automation, and professional-grade features.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative max-w-5xl mx-auto rounded-xl md:rounded-2xl overflow-hidden border border-border shadow-elevated group"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/30 z-10 pointer-events-none" />

          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`}
              title="Alplum Plus - Software Overview"
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 z-20">
            <h3 className="font-display text-sm md:text-2xl font-bold text-foreground drop-shadow-lg">
              Alplum Plus — Smart Album Designing Software
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 drop-shadow-lg">
              Auto layout • Multi-camera • Batch processing • Professional output
            </p>
          </div>

          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="w-10 h-10 rounded-full bg-background/70 border border-border flex items-center justify-center text-foreground hover:bg-background/90 transition-colors"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
