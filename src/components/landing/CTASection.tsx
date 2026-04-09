import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl md:rounded-3xl bg-gradient-blue p-8 md:p-16 text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]" />

          <div className="relative z-10">
            <h2 className="font-display text-2xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
              Ready to Create <span className="text-gradient-gold">Beautiful</span> Albums?
            </h2>
            <p className="text-primary-foreground/70 text-base md:text-lg max-w-xl mx-auto mb-8">
              Join thousands of photographers who trust Alplum Plus. Start your free
              14-day trial — no credit card required.
            </p>
            <Button
              size="lg"
              className="bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90 transition-opacity gap-2 text-base px-8 h-14 rounded-xl shadow-gold"
            >
              Start Free Trial
              <ArrowRight size={18} />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
