
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Umbrella, Baby, Users, type LucideIcon } from "lucide-react";

export interface LeaveType {
    title: string;
    days: string; // You can make this a number if you plan to format later
    icon: LucideIcon;
    gradient: string;
    bgGradient: string;
}

const LeaveBalanceCards = () => {
    const { user } = useAuth();


    // Leave type configuration with icons and styling
    const leaveTypeConfig = {
        'Sick Leave': {
            title: 'Sick Leave',
            icon: Heart,
            gradient: 'from-cyan-400 to-blue-500',
            bgGradient: 'from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20',
        },
        'Annual Leave': {
            title: 'Annual Leave',
            icon: Umbrella,
            gradient: 'from-pink-400 to-rose-500',
            bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
        },
        'Maternity Leave': {
            title: 'Maternity Leave',
            icon: Baby,
            gradient: 'from-yellow-400 to-amber-500',
            bgGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
        },
        'Family Responsibility': {
            title: 'Family Responsibility',
            icon: Users,
            gradient: 'from-emerald-400 to-green-500',
            bgGradient: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
        },
    };

    // Transform API data into display format
    const getLeaveData = () => {
        if (!user?.leaveData) return [];

        // Create a map of leave types from API data
        const leaveMap = new Map(
            user.leaveData.map(leave => [leave.leave_type, leave.leave_count])
        );

        // Map all configured leave types
        return Object.entries(leaveTypeConfig).map(([type, config]) => ({
            ...config,
            days: `${leaveMap.get(type) || 0} day(s)`,
            count: leaveMap.get(type) || 0,
        }));
    };

    const leaveData = getLeaveData();

    return (
        <div className="mb-8">
            {/* {user && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Welcome back, {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Here's your leave balance overview</p>
                </div>
            )} */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {leaveData.map((leave, index) => (
                    <div
                        key={index}
                        className={`bg-gradient-to-br ${leave.bgGradient} px-5 py-4 rounded-2xl border border-white/20 dark:border-gray-700/20 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer flex items-center gap-4`}
                    >
                        <div
                            className={`w-14 h-14 flex-shrink-0 bg-gradient-to-br ${leave.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}
                        >
                            <leave.icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">{leave.title}</p>
                            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-tight">{leave.count}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveBalanceCards;