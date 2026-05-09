import type { ReactNode } from "react";

interface MobileStatCardProps {
    icon: ReactNode;
    title: string;
    value: string;
    description: string;
    progress?: number;
    accentClassName?: string;
}

const MobileStatCard = ({
    icon,
    title,
    value,
    description,
    progress,
    accentClassName = "from-emerald-500/25 to-cyan-500/25",
}: MobileStatCardProps) => {
    return (
        <article className="flex h-[170px] w-[144px] min-w-[144px] shrink-0 flex-col rounded-[1.35rem] border border-slate-200/80 bg-white/80 p-3.5 shadow-[0_14px_36px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_16px_40px_rgba(2,6,23,0.22)]">
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${accentClassName} text-white shadow-md`}>
                    {icon}
                </div>
                {typeof progress === "number" && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {progress}%
                    </span>
                )}
            </div>

            <div className="space-y-0.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {title}
                </p>
                <p className="text-2xl font-semibold leading-none tracking-tight text-slate-950 dark:text-gray-100">
                    {value}
                </p>
            </div>

            <p className="mt-auto pt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {description}
            </p>

            {typeof progress === "number" && (
                <div className="mt-3 h-1.5 rounded-full bg-slate-200/80 dark:bg-slate-700/80">
                    <div
                        className={`h-1.5 rounded-full bg-gradient-to-r ${accentClassName} opacity-90`}
                        style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
                    />
                </div>
            )}
        </article>
    );
};

export default MobileStatCard;
