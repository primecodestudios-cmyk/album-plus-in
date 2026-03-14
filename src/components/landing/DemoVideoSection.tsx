import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface DemoVideo {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
}

export function DemoVideoSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      const { data } = await supabase
        .from("demo_videos")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setVideos(data as unknown as DemoVideo[]);
      setLoading(false);
    }
    fetchVideos();
  }, []);

  if (!loading && videos.length === 0) return null;

  return (
    <section className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            🎬 Watch & Learn
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            Demo <span className="text-gradient-gold">Videos</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            See Album Plus in action — real workflows, real speed.
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="aspect-video rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto">
            {videos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group bg-card rounded-2xl border border-border shadow-card hover:border-accent/30 hover:shadow-gold transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => setActiveVideo(video.youtube_id)}
              >
                <div className="relative aspect-video bg-muted/50">
                  <img
                    src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center group-hover:bg-background/20 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform">
                      <Play size={24} className="text-accent-foreground ml-1" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/80 text-xs font-mono text-foreground">
                      {video.duration}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-sm font-semibold text-foreground mb-1 line-clamp-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{video.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {activeVideo && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setActiveVideo(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1&rel=0`}
              title="Demo Video"
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground hover:bg-background transition-colors"
            >
              <X size={18} />
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}
