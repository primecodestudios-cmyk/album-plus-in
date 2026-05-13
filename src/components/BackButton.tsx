import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HIDDEN_ROUTES = ["/", "/adminfx2026lkjh"];

const BackButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (HIDDEN_ROUTES.includes(location.pathname)) return null;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <button
      onClick={handleBack}
      aria-label="Go back"
      className="fixed top-20 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-card/80 backdrop-blur-md border border-border text-foreground hover:bg-accent/10 hover:text-accent transition-colors shadow-card text-sm font-medium"
    >
      <ArrowLeft size={16} />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
};

export default BackButton;
