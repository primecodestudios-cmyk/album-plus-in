import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      toast({ title: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-foreground">
            Album<span className="text-gradient-gold">Plus</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground mt-6 mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Get started with Album Plus today
          </p>
        </div>

        <form onSubmit={handleSignup} className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
            <input
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
              className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className="w-full h-12 px-4 pr-12 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-xl font-semibold text-base bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold gap-2"
          >
            {loading ? "Creating Account..." : "Sign Up"}
            {!loading && <ArrowRight size={18} />}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">
              Log In
            </Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
