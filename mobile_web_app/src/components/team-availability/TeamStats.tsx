import type { ReactNode } from "react";

interface TeamStat {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
    iconBadgeClassName: string;
}

const TeamStats = ({ stats }: { stats: TeamStat[] }) => {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                {stats.map((stat) => (
                    <article
                        key={stat.title}
                        className="rounded-[1.1rem] border border-slate-200/80 bg-white/85 px-3 py-2.5 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    {stat.title}
                                </p>
                                <p className="mt-1 text-xl font-bold leading-none text-slate-950 dark:text-gray-100 md:text-2xl">
                                    {stat.value}
                                </p>
                                <p className="mt-1 truncate text-[11px] text-slate-600 dark:text-slate-300 md:text-xs">
                                    {stat.description}
                                </p>
                            </div>
                            <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconBadgeClassName}`}>
                                <div className="scale-[0.8]">
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    </article>
                ))}
        </div>
    );
};

export default TeamStats;
