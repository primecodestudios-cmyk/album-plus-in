import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, X, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: string;
  category: string;
}

const categoryLabels: Record<string, string> = {
  all: "All Videos",
  intro: "Introduction",
  tutorial: "Tutorials",
  demo: "Demo",
  installation: "Installation",
  "error-fix": "Error Fixing",
  activation: "Activation",
  "multi-camera": "Multi-Camera",
};

const Videos = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("demo_videos")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (data) setVideos(data as unknown as Video[]);
      setLoading(false);
    }
    fetch();
  }, []);

  const categories = ["all", ...Array.from(new Set(videos.map((v) => v.category)))];

  const filtered = videos.filter((v) => {
    const matchCat = activeCategory === "all" || v.category === activeCategory;
    const matchSearch =
      !search ||
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              🎬 Video Tutorials
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">
              Learn <span className="text-gradient-gold">Album Plus</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Step-by-step video guides for installation, activation, album design, and more.
            </p>
          </motion.div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 max-w-5xl mx-auto">
            <div className="relative w-full md:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-accent text-accent-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>

          {/* Video Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-video rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No videos found.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {filtered.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
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
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-accent/20 text-[10px] font-semibold text-accent border border-accent/20">
                      {categoryLabels[video.category] || video.category}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-sm font-semibold text-foreground mb-1 line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Video Modal */}
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
              title="Video"
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
    </div>
  );
};

export default Videos;
