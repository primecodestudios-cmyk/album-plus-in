import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/1234567890"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-[hsl(0,0%,100%)] flex items-center justify-center shadow-elevated transition-all duration-200 hover:scale-110 active:scale-95"
    >
      <MessageCircle size={26} fill="currentColor" />
    </a>
  );
}
