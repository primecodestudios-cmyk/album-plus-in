import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import alplumLogo from "@/assets/alplum-plus-logo.png";

export function Footer() {
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    supabase
      .from("app_settings" as any)
      .select("value")
      .eq("key", "app_version")
      .single()
      .then(({ data }: any) => {
        if (data?.value) setAppVersion(data.value);
      });
  }, []);
  return (
    <footer className="border-t border-border py-10 md:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center md:text-left md:items-start md:grid md:grid-cols-4 gap-8"
        >
          <div className="w-full flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-3">
              <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10 md:h-11 md:w-11" loading="lazy" width={512} height={512} />
              <span className="font-display text-lg font-bold text-foreground">
                Alplum <span className="text-gradient-gold">Plus</span>
                {appVersion && (
                  <span className="ml-1.5 text-[10px] font-medium text-muted-foreground align-super">v{appVersion}</span>
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Professional photo album design software for photographers worldwide.
            </p>
          </div>

          <div className="w-full">
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-sm text-muted-foreground hover:text-accent transition-colors">Features</a></li>
              <li><a href="/#pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">Pricing</a></li>
              <li><Link to="/store" className="text-sm text-muted-foreground hover:text-accent transition-colors">PSD Store</Link></li>
              <li><Link to="/videos" className="text-sm text-muted-foreground hover:text-accent transition-colors">Video Tutorials</Link></li>
              <li><Link to="/downloads" className="text-sm text-muted-foreground hover:text-accent transition-colors">Downloads</Link></li>
            </ul>
          </div>

          <div className="w-full">
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-sm text-muted-foreground hover:text-accent transition-colors">Support</Link></li>
              <li><Link to="/login" className="text-sm text-muted-foreground hover:text-accent transition-colors">Login</Link></li>
              <li><Link to="/signup" className="text-sm text-muted-foreground hover:text-accent transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          <div className="w-full">
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="text-sm text-muted-foreground hover:text-accent transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-3 text-xs text-muted-foreground text-center"
        >
          <span>© 2026 Album Plus{appVersion && ` — Version v${appVersion}`}. All rights reserved.</span>
          <span>Developed by <a href="https://fxtechie.in" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">FX Techie</a></span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-accent transition-colors">Refund</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
