import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatsTone = "yellow" | "green" | "blue" | "red" | "violet" | "emerald" | "amber" | "indigo" | "pink" | "cyan";

interface StatsCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    tone: StatsTone;
    icon: ReactNode;
    className?: string;
}

const TONE_MAP: Record<StatsTone, {
    border: string;
    hover: string;
    blob: string;
    iconGradient: string;
    valueColor: string;
}> = {
    yellow: {
        border: "border-l-yellow-500 dark:border-l-yellow-400",
        hover: "hover:bg-yellow-50/30 dark:hover:bg-yellow-900/10",
        blob: "bg-yellow-500/10 group-hover:bg-yellow-500/20",
        iconGradient: "from-yellow-500 to-orange-500",
        valueColor: "text-gray-900 dark:text-gray-100",
    },
    green: {
        border: "border-l-green-500 dark:border-l-green-400",
        hover: "hover:bg-green-50/30 dark:hover:bg-green-900/10",
        blob: "bg-green-500/10 group-hover:bg-green-500/20",
        iconGradient: "from-green-500 to-emerald-600",
        valueColor: "text-green-600 dark:text-green-400",
    },
    blue: {
        border: "border-l-blue-500 dark:border-l-blue-400",
        hover: "hover:bg-blue-50/30 dark:hover:bg-blue-900/10",
        blob: "bg-blue-500/10 group-hover:bg-blue-500/20",
        iconGradient: "from-blue-500 to-blue-600",
        valueColor: "text-gray-900 dark:text-gray-100",
    },
    red: {
        border: "border-l-red-500 dark:border-l-red-400",
        hover: "hover:bg-red-50/30 dark:hover:bg-red-900/10",
        blob: "bg-red-500/10 group-hover:bg-red-500/20",
        iconGradient: "from-red-500 to-rose-600",
        valueColor: "text-red-600 dark:text-red-400",
    },
    violet: {
        border: "border-l-violet-500 dark:border-l-violet-400",
        hover: "hover:bg-violet-50/30 dark:hover:bg-violet-900/10",
        blob: "bg-violet-500/10 group-hover:bg-violet-500/20",
        iconGradient: "from-violet-500 to-purple-600",
        valueColor: "text-gray-900 dark:text-gray-100",
    },
    emerald: {
        border: "border-l-emerald-500 dark:border-l-emerald-400",
        hover: "hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10",
        blob: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
        iconGradient: "from-emerald-500 to-teal-600",
        valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        border: "border-l-amber-500 dark:border-l-amber-400",
        hover: "hover:bg-amber-50/30 dark:hover:bg-amber-900/10",
        blob: "bg-amber-500/10 group-hover:bg-amber-500/20",
        iconGradient: "from-amber-500 to-orange-500",
        valueColor: "text-amber-600 dark:text-amber-400",
    },
    indigo: {
        border: "border-l-indigo-500 dark:border-l-indigo-400",
        hover: "hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10",
        blob: "bg-indigo-500/10 group-hover:bg-indigo-500/20",
        iconGradient: "from-indigo-500 to-blue-600",
        valueColor: "text-gray-900 dark:text-gray-100",
    },
    pink: {
        border: "border-l-pink-500 dark:border-l-pink-400",
        hover: "hover:bg-pink-50/30 dark:hover:bg-pink-900/10",
        blob: "bg-pink-500/10 group-hover:bg-pink-500/20",
        iconGradient: "from-pink-500 to-rose-500",
        valueColor: "text-pink-600 dark:text-pink-400",
    },
    cyan: {
        border: "border-l-cyan-500 dark:border-l-cyan-400",
        hover: "hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10",
        blob: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
        iconGradient: "from-cyan-500 to-blue-500",
        valueColor: "text-cyan-600 dark:text-cyan-400",
    },
};

const StatsCard = ({ label, value, subtitle, tone, icon, className }: StatsCardProps) => {
    const t = TONE_MAP[tone];
    return (
        <div className={cn(
            "group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700",
            "overflow-hidden border-l-4",
            "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default",
            t.border,
            t.hover,
            className
        )}>
            <div className={cn(
                "absolute -top-6 -right-6 w-24 h-24 rounded-full transition-all duration-500 group-hover:scale-[2]",
                t.blob
            )} />
            <div className="p-5 relative">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className={cn("text-3xl font-bold", t.valueColor)}>{value}</p>
                        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                    </div>
                    <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br",
                        "group-hover:scale-110 transition-transform duration-300 text-white",
                        t.iconGradient
                    )}>
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
export type { StatsTone };
