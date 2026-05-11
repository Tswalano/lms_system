import { useAuth } from "@/contexts/AuthContext";
import { Heart, Umbrella, Baby, Users, type LucideIcon } from "lucide-react";

export interface LeaveType {
    title: string;
    days: string;
    count: number;
    icon: LucideIcon;
    gradient: string;
    bgGradient: string;
}

const LeaveBalanceCards = () => {
    const { user } = useAuth();

    const leaveTypeConfig: Record<string, Omit<LeaveType, "days" | "count">> = {
        "Annual Leave": {
            title: "Annual Leave",
            icon: Umbrella,
            gradient: "from-pink-400 to-rose-500",
            bgGradient:
                "from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20",
        },
        "Sick Leave": {
            title: "Sick Leave",
            icon: Heart,
            gradient: "from-cyan-400 to-blue-500",
            bgGradient:
                "from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20",
        },
        "Paternity Leave": {
            title: "Paternity Leave",
            icon: Baby,
            gradient: "from-yellow-400 to-amber-500",
            bgGradient:
                "from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20",
        },
        "Family Responsibility Leave": {
            title: "Family Responsibility",
            icon: Users,
            gradient: "from-emerald-400 to-green-500",
            bgGradient:
                "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
        },
    };

    const normalize = (str: string) => str.trim().toLowerCase();

    // Aliases that should count toward the same card
    const aliases: Record<string, string> = {
        "family responsibility": "family responsibility leave",
    };

    const getLeaveData = (): LeaveType[] => {
        if (!user?.leaveData) return [];

        const leaveMap = new Map<string, number>();
        for (const leave of user.leaveData) {
            const key = aliases[normalize(leave.leave_type)] ?? normalize(leave.leave_type);
            leaveMap.set(key, (leaveMap.get(key) ?? 0) + leave.leave_count);
        }

        return Object.entries(leaveTypeConfig).map(([type, config]) => {
            const count = leaveMap.get(normalize(type)) ?? 0;

            return {
                ...config,
                count,
                days: `${count} day(s)`,
            };
        });
    };

    const leaveData = getLeaveData();

    return (
        <div className="mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {leaveData.map((leave) => {
                    const Icon = leave.icon;

                    return (
                        <div
                            key={leave.title}
                            className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4  bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/40 dark:border-gray-700/40 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                        >
                            {/* Subtle gradient accent */}
                            <div
                                className={`absolute inset-0 opacity-10 bg-gradient-to-br ${leave.gradient}`}
                            />

                            {/* Icon */}
                            <div
                                className={`relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br ${leave.gradient} shadow-md group-hover:scale-105 transition-transform`}
                            >
                                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                            </div>

                            {/* Text */}
                            <div className="flex flex-col min-w-0">
                                <span className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 leading-tight">
                                    {leave.title}
                                </span>

                                <span className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
                                    {leave.count}
                                </span>

                                <span className="text-[10px] sm:text-xs text-gray-400">
                                    days taken
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeaveBalanceCards;