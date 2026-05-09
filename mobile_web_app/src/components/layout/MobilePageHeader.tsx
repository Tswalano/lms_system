import { useMemo } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotificationCounts } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

interface MobilePageHeaderProps {
  className?: string;
  onNotificationClick?: () => void;
}

const MobilePageHeader = ({
  className,
  onNotificationClick,
}: MobilePageHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: countsResponse } = useNotificationCounts();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = `${user?.firstName ?? "Team"} ${user?.lastName ?? ""}`.trim();
  const unreadCount = Number(countsResponse?.data?.totalUnread) || 0;

  return (
    <header className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300/80">
          {greeting}
        </p>
        <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-gray-100">
          {userName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-300" />
          ) : (
            <Moon className="h-5 w-5 text-cyan-200" />
          )}
        </button>

        <button
          type="button"
          onClick={onNotificationClick ?? (() => navigate("/notifications"))}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 text-slate-700 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

export default MobilePageHeader;
