import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Camera, Plus, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import alplumLogo from "@/assets/alplum-plus-logo.png";

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia",
  "United Arab Emirates", "Saudi Arabia", "Singapore", "Malaysia",
  "Sri Lanka", "Bangladesh", "Nepal", "Pakistan", "South Africa",
  "Germany", "France", "Japan", "South Korea", "Thailand", "Indonesia",
  "Philippines", "Vietnam", "Brazil", "Mexico", "Nigeria", "Kenya", "Other"
];

const LANGUAGES = [
  { value: "Tamil", label: "Tamil (தமிழ்)" },
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi (हिन्दी)" },
  { value: "Telugu", label: "Telugu (తెలుగు)" },
  { value: "Kannada", label: "Kannada (ಕನ್ನಡ)" },
  { value: "Malayalam", label: "Malayalam (മലയാളം)" },
];

const STEPS = ["Personal", "Contact", "Professional", "Security"];

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(0);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "India",
    whatsappNumbers: [""],
    studioName: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    languages: [] as string[],
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Image too large", description: "Max 2MB allowed", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleWhatsAppChange = (index: number, value: string) => {
    const nums = [...form.whatsappNumbers];
    // Only allow digits
    nums[index] = value.replace(/\D/g, "");
    setForm({ ...form, whatsappNumbers: nums });
  };

  const addWhatsAppNumber = () => {
    if (form.whatsappNumbers.length < 3) {
      setForm({ ...form, whatsappNumbers: [...form.whatsappNumbers, ""] });
    }
  };

  const removeWhatsAppNumber = (index: number) => {
    if (form.whatsappNumbers.length > 1) {
      setForm({ ...form, whatsappNumbers: form.whatsappNumbers.filter((_, i) => i !== index) });
    }
  };

  const toggleLanguage = (lang: string) => {
    setForm({
      ...form,
      languages: form.languages.includes(lang)
        ? form.languages.filter((l) => l !== lang)
        : [...form.languages, lang],
    });
  };

  const getPhoneMaxLength = () => (form.country === "India" ? 10 : 15);
  const getPhonePattern = () => (form.country === "India" ? /^\d{10}$/ : /^\d{1,15}$/);

  const validateStep = (s: number): string | null => {
    if (s === 0) {
      if (!form.fullName.trim()) return "Name is required";
      if (!form.email.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email format";
    }
    if (s === 1) {
      if (!form.country) return "Country is required";
      if (form.phone && !getPhonePattern().test(form.phone)) {
        return form.country === "India" ? "Phone must be exactly 10 digits" : "Phone must be 1-15 digits";
      }
      const validNums = form.whatsappNumbers.filter((n) => n.trim());
      for (const n of validNums) {
        if (form.country === "India" && !/^\d{10}$/.test(n)) return "WhatsApp number must be 10 digits (India)";
        if (form.country !== "India" && !/^\d{1,15}$/.test(n)) return "WhatsApp number must be 1-15 digits";
      }
    }
    if (s === 3) {
      if (!form.password) return "Password is required";
      if (form.password.length < 8) return "Password must be at least 8 characters";
      if (!/[A-Za-z]/.test(form.password)) return "Password must contain letters";
      if (!/\d/.test(form.password)) return "Password must contain numbers";
      if (!/[^A-Za-z0-9]/.test(form.password)) return "Password must contain a symbol";
      if (form.password !== form.confirmPassword) return "Passwords do not match";
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep(step);
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const passwordStrength = (): { score: number; label: string; color: string } => {
    const p = form.password;
    if (!p) return { score: 0, label: "", color: "" };
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    if (s <= 2) return { score: s, label: "Weak", color: "bg-destructive" };
    if (s <= 3) return { score: s, label: "Fair", color: "bg-[hsl(45,100%,51%)]" };
    if (s <= 4) return { score: s, label: "Good", color: "bg-primary" };
    return { score: s, label: "Strong", color: "bg-green-500" };
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(3);
    if (err) {
      toast({ title: err, variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const whatsappNums = form.whatsappNumbers.filter((n) => n.trim());

      const { data: signUpData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            studio_name: form.studioName,
            city: form.city,
            state: form.state,
            country: form.country,
            languages: form.languages,
            pincode: form.pincode,
            address: form.address,
            whatsapp_numbers: whatsappNums,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Upload avatar if selected
      if (avatarFile && signUpData.user) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${signUpData.user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        if (urlData?.publicUrl) {
          // Update profile with avatar URL — will be set after email verification
          // Store in user metadata for now
          await supabase.auth.updateUser({
            data: { avatar_url: urlData.publicUrl },
          });
        }
      }

      toast({
        title: "Account created! 🎉",
        description: "Please check your email to verify your account.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({ title: error.message || "Signup failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const pw = passwordStrength();

  const inputClass = "w-full h-12 px-4 rounded-xl bg-secondary border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 relative">
      <Link to="/" className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors z-10">
        <ArrowLeft size={18} /> Back to Home
      </Link>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <img src={alplumLogo} alt="Alplum Plus" className="h-10 w-10" />
            Alplum <span className="text-gradient-gold">Plus</span>
          </Link>
          <h1 className="font-display text-xl font-bold text-foreground mt-4 mb-1">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all ${i <= step ? "bg-accent" : "bg-border"}`} />
              <span className={`text-[10px] mt-1 block text-center ${i <= step ? "text-accent" : "text-muted-foreground"}`}>{s}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSignup} className="bg-card rounded-2xl border border-border p-6 shadow-card">
          <AnimatePresence mode="wait">
            {/* Step 0: Personal */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-accent/50 transition-colors"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera size={24} className="text-muted-foreground" />
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    <span className="text-[10px] text-muted-foreground mt-1 block text-center">Optional</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name *</label>
                  <input name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" className={inputClass} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} required />
                </div>
              </motion.div>
            )}

            {/* Step 1: Contact */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Country *</label>
                  <select name="country" value={form.country} onChange={handleChange} className={inputClass}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder={form.country === "India" ? "10 digit number" : "Up to 15 digits"}
                    maxLength={getPhoneMaxLength()}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    WhatsApp Numbers <span className="text-muted-foreground text-xs">(max 3)</span>
                  </label>
                  {form.whatsappNumbers.map((num, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input
                        type="tel"
                        value={num}
                        onChange={(e) => handleWhatsAppChange(i, e.target.value)}
                        placeholder={form.country === "India" ? "10 digit number" : "Up to 15 digits"}
                        maxLength={getPhoneMaxLength()}
                        className={`${inputClass} flex-1`}
                      />
                      {form.whatsappNumbers.length > 1 && (
                        <button type="button" onClick={() => removeWhatsAppNumber(i)} className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {form.whatsappNumbers.length < 3 && (
                    <button type="button" onClick={addWhatsAppNumber} className="flex items-center gap-1 text-xs text-accent hover:underline">
                      <Plus size={14} /> Add another number
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Professional */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Studio Name</label>
                  <input name="studioName" type="text" value={form.studioName} onChange={handleChange} placeholder="Your studio name" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">City</label>
                    <input name="city" type="text" value={form.city} onChange={handleChange} placeholder="City" className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">State</label>
                    <input name="state" type="text" value={form.state} onChange={handleChange} placeholder="State" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Pincode</label>
                    <input name="pincode" type="text" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} placeholder="6 digit pincode" maxLength={6} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                    <input name="address" type="text" value={form.address} onChange={handleChange} placeholder="Short address" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Preferred Languages</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => toggleLanguage(lang.value)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                          form.languages.includes(lang.value)
                            ? "bg-accent/20 border-accent text-accent"
                            : "bg-secondary border-border text-muted-foreground hover:border-accent/30"
                        }`}
                      >
                        {form.languages.includes(lang.value) && <Check size={12} className="inline mr-1" />}
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Password *</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Min 8 chars, letters + numbers + symbols"
                      className={`${inputClass} pr-12`}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= pw.score ? pw.color : "bg-border"}`} />
                        ))}
                      </div>
                      <span className={`text-xs ${pw.score <= 2 ? "text-destructive" : pw.score <= 3 ? "text-[hsl(45,100%,51%)]" : "text-green-500"}`}>
                        {pw.label}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password *</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className={inputClass}
                    required
                  />
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <span className="text-xs text-destructive mt-1 block">Passwords do not match</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground mb-1">Password requirements:</p>
                  <p className={form.password.length >= 8 ? "text-green-500" : ""}>✓ At least 8 characters</p>
                  <p className={/[A-Za-z]/.test(form.password) ? "text-green-500" : ""}>✓ Contains letters</p>
                  <p className={/\d/.test(form.password) ? "text-green-500" : ""}>✓ Contains numbers</p>
                  <p className={/[^A-Za-z0-9]/.test(form.password) ? "text-green-500" : ""}>✓ Contains symbols (!@#$...)</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12 rounded-xl gap-2">
                <ArrowLeft size={16} /> Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep} className="flex-1 h-12 rounded-xl bg-gradient-gold text-accent-foreground font-semibold gap-2 hover:opacity-90 shadow-gold">
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="flex-1 h-14 rounded-xl font-semibold text-base bg-gradient-gold text-accent-foreground hover:opacity-90 shadow-gold gap-2">
                {loading ? "Creating Account..." : "Sign Up"}
                {!loading && <ArrowRight size={18} />}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-medium hover:underline">Log In</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
