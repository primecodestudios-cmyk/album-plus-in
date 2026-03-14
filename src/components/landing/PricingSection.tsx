import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Starter",
    price: "29",
    period: "/month",
    description: "Perfect for solo photographers",
    features: [
      "1 Device Activation",
      "50 PSD Templates",
      "HD Export Quality",
      "Email Support",
      "Basic Album Layouts",
    ],
    popular: false,
  },
  {
    name: "Professional",
    price: "59",
    period: "/month",
    description: "For growing photography studios",
    features: [
      "3 Device Activations",
      "All 500+ PSD Templates",
      "Ultra HD Export",
      "Priority Support",
      "Client Preview Sharing",
      "Batch Processing",
      "Custom Branding",
    ],
    popular: true,
  },
  {
    name: "Studio",
    price: "99",
    period: "/month",
    description: "For teams and large studios",
    features: [
      "Unlimited Devices",
      "All Templates + Early Access",
      "RAW File Support",
      "Dedicated Account Manager",
      "Team Collaboration",
      "API Access",
      "White-label Option",
    ],
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, <span className="text-gradient-gold">Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Choose the plan that fits your workflow. All plans include free updates
            and a 14-day money-back guarantee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border ${
                plan.popular
                  ? "border-accent/40 bg-card shadow-gold md:scale-105"
                  : "border-border bg-card shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-bold text-foreground">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground text-sm">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="text-accent mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-12 rounded-xl font-semibold text-base ${
                  plan.popular
                    ? "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
                    : "border-border hover:border-accent/30 hover:text-accent"
                }`}
                variant={plan.popular ? "default" : "outline"}
              >
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
