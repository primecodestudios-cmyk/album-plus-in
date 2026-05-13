import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import BackButton from "@/components/BackButton";
import Index from "./pages/Index.tsx";
import PsdStore from "./pages/PsdStore.tsx";
import Signup from "./pages/Signup.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import DownloadCenter from "./pages/DownloadCenter.tsx";
import AdminPanel from "./pages/AdminPanel.tsx";

import TermsAndConditions from "./pages/TermsAndConditions.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import RefundPolicy from "./pages/RefundPolicy.tsx";
import Support from "./pages/Support.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
import Videos from "./pages/Videos.tsx";
import Changelogs from "./pages/Changelogs.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/store" element={<PageTransition><PsdStore /></PageTransition>} />
        <Route path="/signup" element={<PageTransition><Signup /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
        <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/downloads" element={<PageTransition><DownloadCenter /></PageTransition>} />
        <Route path="/adminfx2026lkjh" element={<PageTransition><AdminPanel /></PageTransition>} />
        
        <Route path="/terms" element={<PageTransition><TermsAndConditions /></PageTransition>} />
        <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/refund-policy" element={<PageTransition><RefundPolicy /></PageTransition>} />
        <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
        <Route path="/api/docs" element={<PageTransition><ApiDocs /></PageTransition>} />
        <Route path="/api/test" element={<PageTransition><ApiDocs /></PageTransition>} />
        <Route path="/videos" element={<PageTransition><Videos /></PageTransition>} />
        <Route path="/changelog" element={<PageTransition><Changelogs /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
