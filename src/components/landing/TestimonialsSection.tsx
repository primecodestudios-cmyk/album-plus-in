import { motion } from "framer-motion";
import { Star, Quote, MapPin } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Sharma",
    studio: "Sharma Studio, Jaipur",
    avatar: "RS",
    rating: 5,
    text: "FX MinuteAlbum has completely transformed our workflow. We now deliver wedding albums in half the time. The AI auto-design feature alone saves us 3-4 hours daily.",
  },
  {
    name: "Priya Patel",
    studio: "ClickPerfect Photography, Ahmedabad",
    avatar: "PP",
    rating: 5,
    text: "Best investment for our studio. The PSD automation feature is incredible — we design 150+ sheets per day now. Our clients love the quality.",
  },
  {
    name: "Arjun Reddy",
    studio: "Royal Lens Studio, Hyderabad",
    avatar: "AR",
    rating: 5,
    text: "We switched from manual designing to FX MinuteAlbum and the difference is night and day. The oil painting effect and color correction tools are top-notch.",
  },
  {
    name: "Meena Kumari",
    studio: "Divine Clicks, Lucknow",
    avatar: "MK",
    rating: 4,
    text: "Very user-friendly software. Even our junior team members can design professional albums without any training. Great customer support too!",
  },
  {
    name: "Suresh Nair",
    studio: "Golden Frame Studio, Kochi",
    avatar: "SN",
    rating: 5,
    text: "The 12GB free data pack was a game-changer for us. 500+ PSD templates and we're still exploring. Worth every rupee spent on the yearly plan.",
  },
  {
    name: "Deepak Verma",
    studio: "Studio Deepak, Delhi",
    avatar: "DV",
    rating: 5,
    text: "Compatible with all Photoshop versions — this was the biggest selling point for us. Running it on CS6 with no issues. Lightning fast.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TestimonialsSection() {
  return (
    <section id="reviews" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-hero" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            ⭐ Trusted by 50,000+ Studios
          </div>
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            What <span className="text-gradient-gold">Photographers</span> Say
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Real reviews from studios across India who transformed their album designing workflow.
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={item}
              className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-card hover:border-accent/30 hover:shadow-gold transition-all duration-300"
            >
              <Quote size={20} className="text-accent/30 mb-3" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-display font-bold text-accent text-sm">
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-sm text-foreground">{t.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={10} className="shrink-0" />
                    <span className="truncate">{t.studio}</span>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={12} className="text-accent fill-accent" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust bar */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            { value: "50,000+", label: "Active Users" },
            { value: "4.8★", label: "Average Rating" },
            { value: "500+", label: "Cities in India" },
            { value: "10M+", label: "Albums Designed" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-xl md:text-2xl font-bold text-accent">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
