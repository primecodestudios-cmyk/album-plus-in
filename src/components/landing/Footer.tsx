export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="font-display text-lg font-bold text-foreground mb-3">
              Album<span className="text-gradient-gold">Plus</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional photo album design software for photographers worldwide.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "Templates", "Download"],
            },
            {
              title: "Company",
              links: ["About", "Blog", "Careers", "Contact"],
            },
            {
              title: "Support",
              links: ["Help Center", "Documentation", "FAQ", "Community"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-foreground text-sm mb-3">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <span>© 2026 Album Plus. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
