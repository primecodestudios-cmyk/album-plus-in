import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, MessageCircle, LifeBuoy, X, Clock, HeadphonesIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";

export const USAGE_LIMIT_DAYS = 90;

export function calcDaysUsed(startIso?: string | null, resetIso?: string | null): number {
  const reference = resetIso || startIso;
  if (!reference) return 0;
  const start = new Date(reference).getTime();
  if (isNaN(start)) return 0;
  return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60 * 60 * 24)));
}

interface UsageNoticeProps {
  /** ISO date string for account creation / start */
  startDate?: string | null;
  /** ISO date string for last admin reset (overrides startDate when present) */
  resetDate?: string | null;
  /** Storage key suffix to track per-user once-per-session popup */
  sessionKey?: string;
}

const NOTICE_BODY = `Your features usage period has reached 90 days. For security reasons, access may be restricted.

Please contact support to continue using the software. You can connect with us via AnyDesk or UltraViewer for remote support.

Important:
• Support is available only during working hours
• Please contact us in advance for quick assistance

Kindly keep track of your 90-day usage to avoid interruption.`;

/**
 * 90-Day Usage Security Notice.
 * Renders a clean warning banner once usage exceeds 90 days,
 * and shows a popup once per browser session.
 */
export const UsageNotice = ({ startDate, resetDate, sessionKey = "default" }: UsageNoticeProps) => {
  const { settings } = useAppSettings();
  const daysUsed = useMemo(() => calcDaysUsed(startDate, resetDate), [startDate, resetDate]);
  const reached = daysUsed >= USAGE_LIMIT_DAYS;
  const approaching = daysUsed >= USAGE_LIMIT_DAYS - 7 && daysUsed < USAGE_LIMIT_DAYS;

  const [popupOpen, setPopupOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!reached) return;
    const key = `usage_notice_shown_${sessionKey}`;
    if (!sessionStorage.getItem(key)) {
      setPopupOpen(true);
      sessionStorage.setItem(key, "1");
    }
  }, [reached, sessionKey]);

  if (!reached && !approaching) return null;

  const phone = (settings.support_phone || "").replace(/\D/g, "");
  const waMessage = encodeURIComponent(
    `Hello AlbumPlus Support, my software has reached the 90-day usage notice. Please assist me with continued access.`
  );
  const waUrl = phone ? `https://wa.me/${phone}?text=${waMessage}` : "#";

  return (
    <>
      {/* Banner */}
      {!bannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-2xl border p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center ${
            reached
              ? "border-amber-500/40 bg-amber-500/5"
              : "border-primary/30 bg-primary/5"
          }`}
        >
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              reached ? "bg-amber-500/15 text-amber-500" : "bg-primary/15 text-primary"
            }`}>
              <ShieldAlert size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-foreground text-sm md:text-base">
                {reached ? "90 Days Security Notice" : `Usage approaching limit (${daysUsed}/${USAGE_LIMIT_DAYS} days)`}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                {reached
                  ? "For security reasons, access may be restricted. Please contact support to continue using the software."
                  : "You're approaching the 90-day usage window. Plan ahead and contact support for a smooth renewal."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPopupOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-xs font-semibold text-foreground transition-colors"
            >
              <LifeBuoy size={14} /> Read details
            </button>
            {phone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#25D366]/90 text-white text-xs font-semibold transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
            <button
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss banner"
              className="p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Popup */}
      <AnimatePresence>
        {popupOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPopupOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border bg-amber-500/5 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">90 Days Security Notice</h2>
                  <p className="text-xs text-muted-foreground">Usage: {daysUsed} days</p>
                </div>
                <button
                  onClick={() => setPopupOpen(false)}
                  className="ml-auto p-2 rounded-lg hover:bg-foreground/5 text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                  {NOTICE_BODY}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {phone ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-[#25D366] hover:bg-[#25D366]/90 text-white text-sm font-semibold transition-colors"
                    >
                      <MessageCircle size={16} /> WhatsApp Support
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-semibold">
                      <MessageCircle size={16} /> WhatsApp
                    </div>
                  )}
                  <Link
                    to="/support"
                    onClick={() => setPopupOpen(false)}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors"
                  >
                    <HeadphonesIcon size={16} /> Request Support
                  </Link>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Clock size={12} />
                  Working hours support only — contact in advance for quick assistance.
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default UsageNotice;
