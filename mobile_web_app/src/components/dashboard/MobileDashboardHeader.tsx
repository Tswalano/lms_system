import { Bell, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";

interface MobileDashboardHeaderProps {
    userName: string;
    greeting: string;
    formattedDateTime: string;
    notificationCount: number;
    theme: string;
    onToggleTheme: () => void;
    onOpenNotifications: () => void;
    quote: {
        text: string;
        author: string;
    };
    leadingIcon?: ReactNode;
}

const MobileDashboardHeader = ({
    userName,
    greeting,
    formattedDateTime,
    notificationCount,
    theme,
    onToggleTheme,
    onOpenNotifications,
    quote,
    leadingIcon,
}: MobileDashboardHeaderProps) => {
    return (
        <header className="space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-300/80">
                        {greeting}
                    </p>
                    <h1 className="truncate text-xl font-semibold tracking-tight text-white">
                        {userName}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleTheme}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg backdrop-blur-xl"
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5 text-amber-300" /> : <Moon className="h-5 w-5 text-cyan-200" />}
                    </button>

                    <button
                        type="button"
                        onClick={onOpenNotifications}
                        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white shadow-lg backdrop-blur-xl"
                        aria-label="Open notifications"
                    >
                        <Bell className="h-5 w-5" />
                        {notificationCount > 0 && (
                            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                                {notificationCount > 9 ? "9+" : notificationCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-[1.6rem] border border-white/10 bg-white/10 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.24)] backdrop-blur-xl">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/70 to-cyan-500/70 text-white shadow-lg">
                        {leadingIcon}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/90">{quote.text}</p>
                        <p className="text-xs text-slate-300">{quote.author}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f1b30]/85 px-3 py-2 text-right shadow-inner">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Now
                    </p>
                    <p className="text-xs font-medium text-white">{formattedDateTime}</p>
                </div>
            </div>
        </header>
    );
};

export default MobileDashboardHeader;
