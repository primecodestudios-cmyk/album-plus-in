import { useState } from "react";
import { motion } from "framer-motion";
import { Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUBJECT_OPTIONS = [
  "License Issue",
  "Technical Support",
  "Sales Enquiry",
  "Feature Request",
  "Other",
];

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      subject: formData.subject,
      message: formData.message.trim(),
    };

    if (!trimmed.name || !trimmed.email || !trimmed.subject || !trimmed.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (trimmed.name.length > 100 || trimmed.email.length > 255 || trimmed.message.length > 2000) {
      toast.error("One or more fields exceed the maximum length.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("contact_enquiries").insert(trimmed);
    setSubmitting(false);

    if (error) {
      toast.error("Failed to send your message. Please try again.");
      return;
    }

    setSubmitted(true);
    toast.success("Your message has been sent!");
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border p-8 shadow-card text-center"
      >
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-accent" />
        </div>
        <h3 className="font-display font-bold text-foreground text-lg mb-2">Message Sent!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We'll get back to you within 24 hours. You can also reach us on WhatsApp for faster support.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitted(false);
            setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
          }}
        >
          Send Another
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-card"
    >
      <h2 className="font-display text-base font-bold text-foreground mb-1 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        Send Us a Message
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Fill out the form and we'll respond within 24 hours.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              maxLength={100}
              required
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              maxLength={255}
              required
              className="bg-background"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Phone</label>
            <Input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              maxLength={20}
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Subject <span className="text-destructive">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a subject</option>
              {SUBJECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            Message <span className="text-destructive">*</span>
          </label>
          <Textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Describe your issue or question..."
            maxLength={2000}
            rows={4}
            required
            className="bg-background resize-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {formData.message.length}/2000
          </p>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-gold text-accent-foreground font-semibold hover:opacity-90 transition-opacity gap-2"
        >
          {submitting ? "Sending..." : <><Send size={16} /> Send Message</>}
        </Button>
      </form>
    </motion.div>
  );
}
