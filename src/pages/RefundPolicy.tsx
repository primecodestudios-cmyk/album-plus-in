import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, AlertTriangle } from "lucide-react";

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display text-xl font-bold text-foreground">
          Album<span className="text-gradient-gold">Plus</span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
      </div>
    </header>

    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
          <RotateCcw size={24} className="text-accent" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Refund Policy</h1>
          <p className="text-xs text-muted-foreground">Last updated: March 14, 2026</p>
        </div>
      </div>

      {/* Important notice */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 mb-8 flex gap-4 items-start">
        <AlertTriangle size={22} className="text-destructive shrink-0 mt-0.5" />
        <div>
          <h3 className="font-display font-bold text-foreground mb-1">No Refund Policy</h3>
          <p className="text-sm text-muted-foreground">
            Because Album Plus is a <strong className="text-foreground">Digital Product</strong>, refunds are not available after purchase. Once a license key has been generated and delivered, the sale is considered final.
          </p>
        </div>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">1. Digital Product — No Refunds</h2>
          <p>Album Plus is a digital software product delivered electronically. Due to the nature of digital goods, we are unable to process refunds once a license key has been issued and delivered to your account. By completing your purchase, you acknowledge and agree to this no-refund policy.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">2. Why No Refunds?</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The software is delivered instantly as a digital download with an activation key.</li>
            <li>Once the license key is generated, it cannot be "returned" like a physical product.</li>
            <li>A free demo version is available for you to evaluate the software before purchase.</li>
            <li>This policy is standard practice for digital software products.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">3. Try Before You Buy</h2>
          <p>We strongly recommend downloading and testing the <strong className="text-foreground">free demo version</strong> of Album Plus before making a purchase. The demo includes limited features that allow you to evaluate the software's compatibility with your system and workflow.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">4. Exceptions</h2>
          <p>In rare cases, we may consider a resolution (not a refund) if:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>You were charged multiple times for the same purchase due to a technical error.</li>
            <li>The license key was never delivered due to a system failure (verified by our team).</li>
          </ul>
          <p className="mt-2">In such cases, contact our support team within <strong className="text-foreground">48 hours</strong> of purchase with your transaction details.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">5. License Transfers</h2>
          <p>License keys are non-transferable and bound to the device used during activation. We do not support transferring licenses between users or devices unless authorized by our support team.</p>
        </section>

        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-2">6. Contact Support</h2>
          <p>If you have any billing issues or questions about your purchase, reach out to our support team via WhatsApp or through the contact options on our website. We are happy to assist with technical issues to ensure you get the most out of Album Plus.</p>
        </section>
      </div>
    </main>
  </div>
);

export default RefundPolicy;
