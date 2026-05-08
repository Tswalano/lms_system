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
        <article className="flex h-full min-h-[164px] flex-col rounded-[1.5rem] border border-white/10 bg-white/8 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.24)] backdrop-blur-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClassName} text-white shadow-lg`}>
                    {icon}
                </div>
                {typeof progress === "number" && (
                    <span className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                        {progress}%
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/55">
                    {title}
                </p>
                <p className="text-2xl font-semibold tracking-tight text-white">
                    {value}
                </p>
            </div>

            <p className="mt-auto pt-4 text-sm leading-5 text-slate-300">
                {description}
            </p>

            {typeof progress === "number" && (
                <div className="mt-4 h-2 rounded-full bg-white/10">
                    <div
                        className={`h-2 rounded-full bg-gradient-to-r ${accentClassName}`}
                        style={{ width: `${Math.max(6, Math.min(progress, 100))}%` }}
                    />
                </div>
            )}
        </article>
    );
};

export default MobileStatCard;
