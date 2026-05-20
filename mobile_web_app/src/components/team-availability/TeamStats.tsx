import type { ReactNode } from "react";

interface TeamStat {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
    iconBadgeClassName: string;
}

const getShortLabel = (title: string) => {
    switch (title) {
        case "Team Members":
            return "Members";
        case "On Leave":
            return "Away";
        case "Upcoming":
            return "Soon";
        default:
            return title;
    }
};

const TeamStats = ({ stats }: { stats: TeamStat[] }) => {
    return (
        <div className="grid grid-cols-2 gap-3 min-[390px]:grid-cols-3">
                {stats.map((stat) => (
                    <article
                        key={stat.title}
                        className="min-w-0 rounded-[1rem] border border-slate-200/80 bg-white/85 px-2.5 py-2 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                                    {stat.title}
                                </p>
                                <p className="mt-1 text-lg font-bold leading-none text-slate-950 dark:text-gray-100 min-[390px]:text-xl">
                                    {stat.value}
                                </p>
                                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">
                                    {getShortLabel(stat.title)}
                                </p>
                            </div>
                            <div className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${stat.iconBadgeClassName}`}>
                                <div className="scale-[0.72]">
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
