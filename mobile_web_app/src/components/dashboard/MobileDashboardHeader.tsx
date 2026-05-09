import type { ReactNode } from "react";
import MobilePageHeader from "@/components/layout/MobilePageHeader";

interface MobileDashboardHeaderProps {
    formattedDateTime: string;
    onOpenNotifications: () => void;
    quote: {
        text: string;
        author: string;
    };
    leadingIcon?: ReactNode;
}

const MobileDashboardHeader = ({
    formattedDateTime,
    onOpenNotifications,
    quote,
    leadingIcon,
}: MobileDashboardHeaderProps) => {
    return (
        <header className="space-y-4">
            <MobilePageHeader onNotificationClick={onOpenNotifications} />

            <div className="flex items-center justify-between gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/80 px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/70 to-cyan-500/70 text-white shadow-lg">
                        {leadingIcon}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-gray-100">{quote.text}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">{quote.author}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-100/90 px-3 py-2 text-right shadow-inner dark:border-slate-700 dark:bg-slate-900/80">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Now
                    </p>
                    <p className="text-xs font-medium text-slate-900 dark:text-gray-100">{formattedDateTime}</p>
                </div>
            </div>
        </header>
    );
};

export default MobileDashboardHeader;
