import { useState, useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppButton } from "@/components/landing/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { DownloadSectionSkeleton } from "@/components/skeletons/PageSkeletons";
import {
  Download,
  Monitor,
  RefreshCw,
  Puzzle,
  FileStack,
  HardDrive,
  Shield,
  ArrowDown,
  Clock,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";

interface DownloadItem {
  title: string;
  description: string;
  version: string;
  size: string;
  date: string;
  icon: typeof Download;
  tag?: string;
  tagColor?: string;
}

const sections: { title: string; description: string; icon: typeof Download; items: DownloadItem[] }[] = [
  {
    title: "Software Setup",
    description: "Download the latest Alplum Plus installer",
    icon: Monitor,
    items: [
      {
        title: "Alplum Plus Full Setup (64-bit)",
        description: "Complete installer for Windows 10/11 — includes all features and data pack.",
        version: "v5.2.1",
        size: "245 MB",
        date: "March 2026",
        icon: Monitor,
        tag: "Recommended",
        tagColor: "bg-[hsl(142,70%,45%)]",
      },
      {
        title: "Alplum Plus Full Setup (32-bit)",
        description: "For older Windows 7/8 systems with 32-bit architecture.",
        version: "v5.2.1",
        size: "210 MB",
        date: "March 2026",
        icon: Monitor,
      },
      {
        title: "Alplum Plus Demo",
        description: "Try Alplum Plus free with limited features. No license required.",
        version: "v5.2.1",
        size: "180 MB",
        date: "March 2026",
        icon: Monitor,
        tag: "Free",
        tagColor: "bg-accent",
      },
    ],
  },
  {
    title: "Updates & Patches",
    description: "Keep your software up to date",
    icon: RefreshCw,
    items: [
      {
        title: "Update Patch v5.2.1",
        description: "Bug fixes, performance improvements, and new AI color correction engine.",
        version: "v5.2.1",
        size: "45 MB",
        date: "March 2026",
        icon: RefreshCw,
        tag: "Latest",
        tagColor: "bg-[hsl(142,70%,45%)]",
      },
      {
        title: "Update Patch v5.1.0",
        description: "Added multi-camera editing and new wedding templates.",
        version: "v5.1.0",
        size: "38 MB",
        date: "January 2026",
        icon: RefreshCw,
      },
    ],
  },
  {
    title: "Plugins & Add-ons",
    description: "Extend Alplum Plus with powerful plugins",
    icon: Puzzle,
    items: [
      {
        title: "Oil Painting Effect Plugin",
        description: "Convert any photo into realistic oil painting style with one click.",
        version: "v2.0",
        size: "12 MB",
        date: "February 2026",
        icon: Puzzle,
        tag: "Popular",
        tagColor: "bg-accent",
      },
      {
        title: "Background Removal Plugin",
        description: "AI-powered auto background removal for portrait photos.",
        version: "v1.5",
        size: "18 MB",
        date: "February 2026",
        icon: Puzzle,
      },
      {
        title: "Batch Export Plugin",
        description: "Export hundreds of album pages in one go — PDF, JPEG, TIFF.",
        version: "v1.2",
        size: "8 MB",
        date: "December 2025",
        icon: Puzzle,
      },
    ],
  },
  {
    title: "PSD Templates",
    description: "Free template packs to get started",
    icon: FileStack,
    items: [
      {
        title: "Wedding Template Pack (50 PSD)",
        description: "Premium wedding album templates with gold and floral designs.",
        version: "Pack 1",
        size: "1.2 GB",
        date: "March 2026",
        icon: FileStack,
        tag: "Free",
        tagColor: "bg-[hsl(142,70%,45%)]",
      },
      {
        title: "Birthday & Baby Pack (30 PSD)",
        description: "Colorful birthday and baby shoot album templates.",
        version: "Pack 2",
        size: "680 MB",
        date: "January 2026",
        icon: FileStack,
        tag: "Free",
        tagColor: "bg-[hsl(142,70%,45%)]",
      },
      {
        title: "Traditional Album Pack (40 PSD)",
        description: "Indian traditional and engagement album template collection.",
        version: "Pack 3",
        size: "950 MB",
        date: "December 2025",
        icon: FileStack,
      },
    ],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const DownloadCenter = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
              <ArrowDown size={14} /> Download Center
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Download <span className="text-gradient-gold">Alplum Plus</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">
              Get the latest software, updates, plugins, and free template packs.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Shield, label: "Virus Free", value: "100% Safe" },
              { icon: Clock, label: "Latest Version", value: "v5.2.1" },
              { icon: HardDrive, label: "Data Included", value: "12GB Free" },
              { icon: Star, label: "User Rating", value: "4.9 / 5" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-xl border border-border p-4 text-center shadow-card"
              >
                <stat.icon size={20} className="text-accent mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="font-display text-sm font-bold text-foreground">{stat.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Sections */}
          {loading ? (
            <DownloadSectionSkeleton />
          ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <section.icon size={20} className="text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-foreground">
                      {section.title}
                    </h2>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>

                <motion.div
                  variants={container}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {section.items.map((dl) => (
                    <motion.div
                      key={dl.title}
                      variants={item}
                      className="group bg-card rounded-2xl border border-border p-5 shadow-card hover:shadow-gold hover:border-accent/30 transition-all duration-300 flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <dl.icon size={18} className="text-muted-foreground group-hover:text-accent transition-colors" />
                        </div>
                        {dl.tag && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[hsl(0,0%,100%)] text-[10px] font-bold ${dl.tagColor}`}>
                            {dl.tag}
                          </span>
                        )}
                      </div>

                      <h3 className="font-display text-sm font-semibold text-foreground mb-1">
                        {dl.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 flex-1">
                        {dl.description}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-4">
                        <span>{dl.version}</span>
                        <span>•</span>
                        <span>{dl.size}</span>
                        <span>•</span>
                        <span>{dl.date}</span>
                      </div>

                      <Button
                        size="sm"
                        className="w-full rounded-xl bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90 gap-2"
                      >
                        <Download size={14} />
                        Download
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default DownloadCenter;
