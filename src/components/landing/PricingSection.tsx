import { Button } from "@/components/ui/button";
import { Check, Star, Crown, HardDrive, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PricingPlan {
  id: string;
  plan_name: string;
  price: number;
  duration_days: number;
  duration_type: string;
  max_pcs: number;
  data_pack: string;
  is_active: boolean;
}

export function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from("pricing_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        console.error("Error fetching plans:", error);
      } else {
        setPlans(data || []);
      }
      setLoading(false);
    }

    fetchPlans();
  }, []);

  const formatDuration = (days: number, type: string) => {
    if (type === "days") return `${days} Days`;
    if (type === "months") return `${Math.floor(days / 30)} Months`;
    if (type === "years") return `${Math.floor(days / 365)} Year`;
    return `${days} Days`;
  };

  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const isPopular = (plan: PricingPlan, index: number, total: number) => {
    // Middle plan is popular for 3+ plans
    return total >= 3 && index === Math.floor(total / 2);
  };

  const isBestValue = (plan: PricingPlan) => {
    return plan.duration_days >= 365;
  };

  if (loading) {
    return (
      <section id="pricing" className="py-20 md:py-28 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl p-4 md:p-6 border flex flex-col ${
                isPopular(plan, i, plans.length)
                  ? "border-accent/40 bg-card shadow-gold lg:scale-105"
                  : isBestValue(plan)
                  ? "border-accent/30 bg-card shadow-gold"
                  : "border-border bg-card shadow-card"
              }`}
            >
              {isPopular(plan, i, plans.length) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold flex items-center gap-1">
                  <Star size={12} /> Popular
                </div>
              )}
              {isBestValue(plan) && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold flex items-center gap-1">
                  <Crown size={12} /> Best Value
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {plan.plan_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDuration(plan.duration_days, plan.duration_type)} access
                </p>
              </div>

              <div className="mb-5">
                <span className="font-display text-2xl md:text-4xl font-extrabold text-foreground">
                  {formatPrice(plan.price)}
                </span>
              </div>

              {/* Data Pack & Max PCs Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/10">
                  <HardDrive size={16} className="text-accent shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {plan.data_pack || "12GB Data"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Free Included</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                  <Monitor size={16} className="text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">
                      {plan.max_pcs} PC{plan.max_pcs > 1 ? "s" : ""}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Device Support</div>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                <li className="flex items-start gap-2 text-xs md:text-sm">
                  <Check size={14} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Full Software Access</span>
                </li>
                <li className="flex items-start gap-2 text-xs md:text-sm">
                  <Check size={14} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    {plan.max_pcs > 1 ? "Multi-Device Support" : "Single Device"}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs md:text-sm">
                  <Check size={14} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    {isBestValue(plan) ? "Priority Support" : "Email Support"}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs md:text-sm">
                  <Check size={14} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Free Updates</span>
                </li>
              </ul>

              {/* Bonus callout for year plan */}
              {isBestValue(plan) && (
                <div className="mb-5 p-3 rounded-xl bg-accent/5 border border-accent/20 space-y-2">
                  <div className="text-xs font-bold text-accent uppercase tracking-wide">
                    🎁 Bonus Included
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-accent shrink-0" />
                    <span className="text-foreground font-medium">500GB Data Free</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check size={14} className="text-accent shrink-0" />
                    <span className="text-foreground font-medium">5000 PSD Templates Free</span>
                  </div>
                </div>
              )}

              <Button
                className={`w-full h-11 md:h-12 rounded-xl font-semibold text-xs md:text-sm ${
                  isPopular(plan, i, plans.length) || isBestValue(plan)
                    ? "bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold"
                    : "border-border hover:border-accent/30 hover:text-accent"
                }`}
                variant={isPopular(plan, i, plans.length) || isBestValue(plan) ? "default" : "outline"}
              >
                Buy Now
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          This is a digital software product. Due to the nature of digital downloads, refunds are not available after purchase. Prices are managed by admin and may vary. All prices in INR (₹).
        </p>
      </div>
    </section>
  );
}
