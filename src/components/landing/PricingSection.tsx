import { Button } from "@/components/ui/button";
import { Check, Star, Crown } from "lucide-react";
import { motion } from "framer-motion";

const plans = [
  {
    name: "28 Days",
    price: "₹200",
    period: "",
    description: "Quick start license",
    features: [
      "Full Software Access",
      "12GB Data Pack",
      "Email Support",
      "All Basic Features",
    ],
    popular: false,
    bonus: false,
  },
  {
    name: "3 Months",
    price: "₹499",
    period: "",
    description: "Standard plan",
    features: [
      "Full Software Access",
      "12GB Data Pack",
      "Priority Support",
      "All Features Unlocked",
      "Free Updates",
    ],
    popular: false,
    bonus: false,
  },
  {
    name: "6 Months",
    price: "₹899",
    period: "",
    description: "Professional plan",
    features: [
      "Full Software Access",
      "12GB Data Pack",
      "Priority Support",
      "All Features Unlocked",
      "Free Updates",
      "Multi-Device Support",
    ],
    popular: true,
    bonus: false,
  },
  {
    name: "1 Year",
    price: "₹1,499",
    period: "",
    description: "Best value — loaded with bonuses",
    features: [
      "Full Software Access",
      "12GB Data Pack",
      "Dedicated Support",
      "All Features Unlocked",
      "Free Updates",
      "Multi-Device Support",
    ],
    popular: false,
    bonus: true,
    bonusItems: ["500GB Data Free", "5000 PSD Templates Free"],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/5 text-accent text-xs font-semibold mb-4">
            💰 Simple Pricing
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your <span className="text-gradient-gold">Plan</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Flexible subscription plans starting at just ₹200. All plans include the full software and free data pack.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl p-6 border flex flex-col ${
                plan.popular
                  ? "border-accent/40 bg-card shadow-gold lg:scale-105"
                  : plan.bonus
                  ? "border-accent/30 bg-card shadow-gold"
                  : "border-border bg-card shadow-card"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold flex items-center gap-1">
                  <Star size={12} /> Popular
                </div>
              )}
              {plan.bonus && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold flex items-center gap-1">
                  <Crown size={12} /> Best Value
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mb-5">
                <span className="font-display text-3xl md:text-4xl font-extrabold text-foreground">
                  {plan.price}
                </span>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={15} className="text-accent mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Bonus callout for year plan */}
              {plan.bonus && plan.bonusItems && (
                <div className="mb-5 p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-2">
                  <div className="text-xs font-bold text-accent uppercase tracking-wide">
                    🎁 Bonus Included
                  </div>
                  {plan.bonusItems.map((b) => (
                    <div key={b} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-accent shrink-0" />
                      <span className="text-foreground font-medium">{b}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className={`w-full h-12 rounded-xl font-semibold text-sm ${
                  plan.popular || plan.bonus
                    ? "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
                    : "border-border hover:border-accent/30 hover:text-accent"
                }`}
                variant={plan.popular || plan.bonus ? "default" : "outline"}
              >
                Buy Now
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices are managed by admin and may vary. All prices in INR (₹).
        </p>
      </div>
    </section>
  );
}
