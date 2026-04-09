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
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={alplumLogo} alt="Alplum Plus" className="h-11 w-11" loading="lazy" width={512} height={512} />
              <span className="font-display text-lg font-bold text-foreground">Alplum <span className="text-gradient-gold">Plus</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional photo album design software for photographers worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-sm text-muted-foreground hover:text-accent transition-colors">Features</a></li>
              <li><a href="/#pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">Pricing</a></li>
              <li><Link to="/store" className="text-sm text-muted-foreground hover:text-accent transition-colors">PSD Store</Link></li>
              <li><Link to="/videos" className="text-sm text-muted-foreground hover:text-accent transition-colors">Video Tutorials</Link></li>
              <li><Link to="/downloads" className="text-sm text-muted-foreground hover:text-accent transition-colors">Downloads</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/support" className="text-sm text-muted-foreground hover:text-accent transition-colors">Support</Link></li>
              <li><Link to="/login" className="text-sm text-muted-foreground hover:text-accent transition-colors">Login</Link></li>
              <li><Link to="/signup" className="text-sm text-muted-foreground hover:text-accent transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          <div>
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
          className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground"
        >
          <span>© 2026 Album Plus. All rights reserved. Developed by <a href="https://fxtechie.in" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">FX Techie</a></span>
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
