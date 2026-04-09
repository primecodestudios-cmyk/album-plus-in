import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import alplumLogo from "@/assets/alplum-plus-logo.png";

const TermsAndConditions = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
          <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" />
          Alplum <span className="text-gradient-gold">Plus</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Shield size={24} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Terms & Conditions</h1>
          <p className="text-xs text-muted-foreground">Last updated: March 14, 2026</p>
        </div>
      </div>

      <div className="prose-custom space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">1. Acceptance of Terms</h2>
          <p>By downloading, installing, or using Alplum Plus software ("Software"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Software.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">2. License Grant</h2>
          <p>Alplum Plus grants you a non-exclusive, non-transferable, revocable license to use the Software for personal or commercial photo album design purposes, subject to the terms of your purchased plan. Each license key is valid for one device only unless otherwise specified in your plan.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">3. Restrictions</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You may not reverse-engineer, decompile, or disassemble the Software.</li>
            <li>You may not redistribute, sublicense, rent, or lease the Software or your license key.</li>
            <li>You may not share your license key with third parties or use it on unauthorized devices.</li>
            <li>You may not remove or alter any proprietary notices, labels, or marks on the Software.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">4. Intellectual Property</h2>
          <p>All content, design, graphics, compilation, and other materials related to Alplum Plus are the intellectual property of Alplum Plus and are protected under applicable Indian copyright and trademark laws. PSD templates provided with the Software are licensed for use within Alplum Plus only.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">5. Payment & Pricing</h2>
          <p>All prices are listed in Indian Rupees (INR). Prices are subject to change without prior notice. Payment must be completed before license activation. Alplum Plus reserves the right to modify pricing for future purchases at any time.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">6. Account Responsibility</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and license key. Any activity conducted under your account is your responsibility. Notify us immediately if you suspect unauthorized access.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">7. Termination</h2>
          <p>Alplum Plus reserves the right to terminate or suspend your license at any time if you violate these Terms. Upon termination, you must cease all use of the Software and destroy any copies in your possession.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">8. Limitation of Liability</h2>
          <p>Alplum Plus shall not be liable for any indirect, incidental, or consequential damages arising from the use or inability to use the Software. Our total liability shall not exceed the amount paid by you for the Software license.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">9. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">10. Contact</h2>
          <p>For questions about these Terms, contact us via WhatsApp or email through our website.</p>
        </section>
      </div>
    </main>
  </div>
);

export default TermsAndConditions;
