import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { PsdProductCard } from "@/components/store/PsdProductCard";
import { PsdDetailModal } from "@/components/store/PsdDetailModal";
import { categories, templates as fallbackTemplates, categoryFallbackImages, defaultFallbackImage, PsdCategory, PsdTemplate } from "@/data/psdTemplates";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const PsdStore = () => {
  const [activeCategory, setActiveCategory] = useState<PsdCategory>("All");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PsdTemplate | null>(null);
  const [templates, setTemplates] = useState<PsdTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data, error } = await supabase
        .from("psd_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to hardcoded data
        setTemplates(fallbackTemplates);
      } else {
        setTemplates(
          data.map((t) => ({
            id: t.id,
            name: t.name,
            category: t.category,
            image: t.preview_url || categoryFallbackImages[t.category] || defaultFallbackImage,
            price: Number(t.price),
            isFree: t.is_free,
            fileSize: t.file_size || "—",
            photoshopVersion: t.photoshop_version || "CS6 — CC 2026",
            pages: t.pages,
            downloads: t.downloads_count,
            description: t.description || "",
          }))
        );
      }
      setLoading(false);
    };

    fetchTemplates();
  }, []);

  const filtered = templates.filter((t) => {
    const matchCategory = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              🛒 PSD Template Store
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Premium <span className="text-gradient-gold">PSD Templates</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Browse, preview, and download professional album templates for every occasion.
            </p>
          </motion.div>

          {/* Search + Filters */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="relative max-w-md mx-auto w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-card border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition-all"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-gradient-gold text-accent-foreground shadow-gold"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-accent/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-accent" />
              <span className="ml-3 text-muted-foreground">Loading templates...</span>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-6">
                Showing <strong className="text-foreground">{filtered.length}</strong> templates
                {activeCategory !== "All" && (
                  <> in <strong className="text-accent">{activeCategory}</strong></>
                )}
              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {filtered.map((template) => (
                    <PsdProductCard
                      key={template.id}
                      template={template}
                      onSelect={setSelectedTemplate}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">No templates found.</p>
                  <button
                    onClick={() => { setActiveCategory("All"); setSearch(""); }}
                    className="mt-3 text-accent text-sm font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />

      <PsdDetailModal
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </div>
  );
};

export default PsdStore;
