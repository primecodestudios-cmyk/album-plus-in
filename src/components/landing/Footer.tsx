import { Link } from "react-router-dom";
import alplumLogo from "@/assets/alplum-plus-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" loading="lazy" width={512} height={512} />
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
              <li><Link to="/downloads" className="text-sm text-muted-foreground hover:text-accent transition-colors">Downloads</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground text-sm mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/activate" className="text-sm text-muted-foreground hover:text-accent transition-colors">Activate License</Link></li>
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
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <span>© 2026 Alplum Plus. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-accent transition-colors">Terms</Link>
            <Link to="/refund-policy" className="hover:text-accent transition-colors">Refund</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
