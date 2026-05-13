import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLang } from "@/contexts/LanguageContext";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, languages } = useLang();
  const current = languages.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} aria-label="Language">
          <Globe className="h-4 w-4 mr-1.5" />
          <span className="text-xs font-medium">{current?.native ?? "EN"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border z-50">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={lang === l.code ? "bg-accent/20 font-semibold" : ""}
          >
            <span className="mr-2">{l.native}</span>
            <span className="text-xs text-muted-foreground">({l.label})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
