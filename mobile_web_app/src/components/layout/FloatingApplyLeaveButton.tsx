import { LayoutGrid } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const FLOATING_APPLY_PATHS = new Set([
  "/",
  "/calendar",
  "/team-availability",
  "/leave-history",
  "/profile",
]);

interface FloatingApplyLeaveButtonProps {
  hidden?: boolean;
}

const FloatingApplyLeaveButton = ({
  hidden = false,
}: FloatingApplyLeaveButtonProps) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  const shouldRender = useMemo(() => {
    if (hidden) return false;
    return FLOATING_APPLY_PATHS.has(location.pathname);
  }, [hidden, location.pathname]);

  useEffect(() => {
    if (!shouldRender) {
      setIsVisible(false);
      return;
    }

    lastScrollY.current = window.scrollY;
    setIsVisible(true);

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollY.current;

      if (nextScrollY < 32) {
        setIsVisible(true);
      } else if (delta > 12) {
        setIsVisible(false);
      } else if (delta < -8) {
        setIsVisible(true);
      }

      lastScrollY.current = nextScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [shouldRender]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] z-30 px-4">
      <div className="mx-auto flex w-full max-w-2xl justify-end">
        <Link
          to="/apply-leave"
          aria-label="Apply Leave"
          className={`pointer-events-auto inline-flex h-12 items-center gap-2 rounded-full border border-emerald-200/35 bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(16,185,129,0.22)] transition-all duration-200 hover:from-emerald-600 hover:to-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-cyan-300/12 dark:shadow-[0_18px_36px_rgba(8,145,178,0.28)] ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
          }`}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" />
          <span className="max-[360px]:hidden">Apply Leave</span>
        </Link>
      </div>
    </div>
  );
};

export default FloatingApplyLeaveButton;
