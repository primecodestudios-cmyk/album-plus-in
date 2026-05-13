import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void };

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("theme") as Theme) || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme: setThemeState,
        toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
};
