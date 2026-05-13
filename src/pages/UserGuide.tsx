import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Download,
  FolderArchive,
  Settings,
  PlayCircle,
  UserPlus,
  ShieldCheck,
  Link2,
  FolderPlus,
  Upload,
  Image as ImageIcon,
  Camera,
  Wand2,
  Sparkles,
  LifeBuoy,
  MessageCircle,
  Languages,
  ChevronRight,
  Check,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";
import { LANG_LABEL, SECTIONS, UI_STRINGS, type Lang } from "@/data/userGuide";
import { useAppSettings } from "@/hooks/useAppSettings";
import alplumLogo from "@/assets/alplum-plus-logo.png";

const ICONS: Record<string, typeof BookOpen> = {
  BookOpen, Download, FolderArchive, Settings, PlayCircle, UserPlus, ShieldCheck,
  Link2, FolderPlus, Upload, Image: ImageIcon, Camera, Wand2, Sparkles, LifeBuoy,
};

const UserGuide = () => {
  const { settings } = useAppSettings();
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("guide_lang") as Lang) || "en");
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const setLanguage = (l: Lang) => {
    setLang(l);
    localStorage.setItem("guide_lang", l);
  };

  const active = useMemo(() => SECTIONS.find((s) => s.id === activeId) || SECTIONS[0], [activeId]);
  const phone = (settings.support_phone || "918883081855").replace(/\D/g, "");
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent("Hello AlbumPlus Support, I need help with the user guide.")}`;

  const t = (key: string) => UI_STRINGS[key]?.[lang] || UI_STRINGS[key]?.en || key;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-base md:text-xl font-bold text-foreground shrink-0">
            <img src={alplumLogo} alt="AlbumPlus" className="h-9 w-9" />
            <span className="hidden sm:inline">Album <span className="text-gradient-gold">Plus</span></span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:border-primary/40 transition-colors">
                <Languages size={14} className="text-accent" />
                <span className="hidden sm:inline">{LANG_LABEL[lang]}</span>
                <span className="sm:hidden uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-1 z-50">
                {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary/40 ${
                      lang === l ? "text-accent font-semibold" : "text-foreground"
                    }`}
                  >
                    {LANG_LABEL[l]}
                    {lang === l && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-border text-foreground"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <Link to="/" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={14} /> {t("back_home")}
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent text-[11px] font-semibold mb-3">
            <BookOpen size={12} /> Manual Book
          </div>
          <h1 className="font-display text-2xl md:text-4xl font-bold text-foreground">
            {t("guide_title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">{t("guide_subtitle")}</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-1 bg-card border border-border rounded-2xl p-3 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-2 font-bold">
                {t("on_this_page")}
              </p>
              {SECTIONS.map((s, idx) => {
                const Icon = ICONS[s.icon] || BookOpen;
                const isActive = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                      isActive
                        ? "bg-accent/10 text-accent font-semibold"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <span className={`text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center ${isActive ? "bg-accent/20" : "bg-secondary"}`}>
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{s.title[lang]}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile nav drawer */}
          {mobileNavOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)}>
              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 h-full w-72 bg-card border-l border-border p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-foreground">{t("on_this_page")}</p>
                  <button onClick={() => setMobileNavOpen(false)} className="p-2 rounded-lg hover:bg-secondary/40">
                    <X size={16} />
                  </button>
                </div>
                {SECTIONS.map((s, idx) => {
                  const Icon = ICONS[s.icon] || BookOpen;
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setActiveId(s.id); setMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left mb-1 ${
                        isActive ? "bg-accent/10 text-accent font-semibold" : "text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      <span className="text-[10px] font-bold w-5 h-5 rounded-md flex items-center justify-center bg-secondary">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <Icon size={14} />
                      <span className="truncate">{s.title[lang]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <main>
            <motion.article
              key={active.id + lang}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-card"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  {(() => {
                    const Icon = ICONS[active.icon] || BookOpen;
                    return <Icon size={22} />;
                  })()}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    {t("guide_title")}
                  </p>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                    {active.title[lang]}
                  </h2>
                </div>
              </div>

              {active.intro && (
                <p className="text-sm md:text-base text-foreground leading-relaxed mb-5">
                  {active.intro[lang]}
                </p>
              )}

              {active.steps && (
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("steps")}
                  </p>
                  <ol className="space-y-2.5">
                    {active.steps[lang].map((step, i) => (
                      <li key={i} className="flex gap-3 items-start bg-secondary/30 rounded-xl p-3">
                        <span className="shrink-0 w-7 h-7 rounded-lg bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-sm text-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {active.bullets && (
                <ul className="space-y-2 mb-5">
                  {active.bullets[lang].map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check size={16} className="text-accent shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {active.note && (
                <div className="flex gap-3 items-start bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 mb-5">
                  <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-0.5">
                      {t("important")}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{active.note[lang]}</p>
                  </div>
                </div>
              )}

              {/* Pagination + Support */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-5 border-t border-border">
                <div className="flex gap-2">
                  {SECTIONS.findIndex((s) => s.id === activeId) > 0 && (
                    <button
                      onClick={() => {
                        const i = SECTIONS.findIndex((s) => s.id === activeId);
                        setActiveId(SECTIONS[i - 1].id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold hover:border-primary/40 transition-colors"
                    >
                      <ArrowLeft size={12} /> {SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) - 1].title[lang]}
                    </button>
                  )}
                  {SECTIONS.findIndex((s) => s.id === activeId) < SECTIONS.length - 1 && (
                    <button
                      onClick={() => {
                        const i = SECTIONS.findIndex((s) => s.id === activeId);
                        setActiveId(SECTIONS[i + 1].id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      {SECTIONS[SECTIONS.findIndex((s) => s.id === activeId) + 1].title[lang]} <ChevronRight size={12} />
                    </button>
                  )}
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white text-xs font-semibold"
                >
                  <MessageCircle size={14} /> {t("contact_support")}
                </a>
              </div>
            </motion.article>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
