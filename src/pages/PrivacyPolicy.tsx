import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold text-foreground">
          FX Minute<span className="text-gradient-gold">Album</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Lock size={24} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: March 14, 2026</p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">1. Information We Collect</h2>
          <p>We collect the following information when you register or purchase a license:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-foreground">Personal Information:</strong> Full name, email address, phone number.</li>
            <li><strong className="text-foreground">Device Information:</strong> Device ID generated during license activation for binding purposes.</li>
            <li><strong className="text-foreground">Usage Data:</strong> Software usage patterns, download history, and purchase records.</li>
            <li><strong className="text-foreground">Payment Information:</strong> Transaction details (processed securely through third-party payment gateways — we do not store card details).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To activate and manage your software license.</li>
            <li>To provide customer support and respond to inquiries.</li>
            <li>To send product updates, new features, and promotional offers.</li>
            <li>To prevent fraud and unauthorized use of the Software.</li>
            <li>To improve our products and services.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">3. Data Storage & Security</h2>
          <p>Your data is stored securely on cloud infrastructure with encryption at rest and in transit. We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Payment processors to complete transactions.</li>
            <li>Service providers who assist in operating our platform.</li>
            <li>Law enforcement when required by law.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">5. Cookies & Tracking</h2>
          <p>Our website uses cookies to enhance user experience, remember preferences, and analyze traffic. You can disable cookies through your browser settings, though some features may not function properly.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">6. Your Rights</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may request access to your personal data at any time.</li>
            <li>You may request correction or deletion of your data.</li>
            <li>You may opt out of promotional communications.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">7. Children's Privacy</h2>
          <p>FX MinuteAlbum is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">8. Changes to This Policy</h2>
          <p>We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with a revised date. Continued use of the Software constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">9. Contact</h2>
          <p>For privacy-related inquiries, contact us via WhatsApp or email through our website.</p>
        </section>
      </div>
    </main>
  </div>
);

export default PrivacyPolicy;
