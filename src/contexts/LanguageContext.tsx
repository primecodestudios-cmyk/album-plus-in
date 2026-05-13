import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Lang } from "@/lib/translations";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  languages: { code: Lang; label: string; native: string }[];
};

const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
];

const Ctx = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    return ((localStorage.getItem("lang") as Lang) || "en");
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string): string => {
    const dict = (translations as any)[lang] || (translations as any).en;
    return dict[key] ?? (translations as any).en[key] ?? key;
  };

  return (
    <Ctx.Provider value={{ lang, setLang: setLangState, t, languages: LANGS }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = (): LangCtx => {
  const c = useContext(Ctx);
  if (c) return c;
  // Safe fallback so missing-provider never crashes the app
  return {
    lang: "en",
    setLang: () => {},
    languages: LANGS,
    t: (key: string) => (translations as any).en?.[key] ?? key,
  };
};
