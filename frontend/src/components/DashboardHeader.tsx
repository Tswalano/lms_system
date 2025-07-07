import { useAuth } from "@/contexts/AuthContext";

const DashboardHeader = () => {
    const { user } = useAuth();

    const currentTime = new Date().toLocaleString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getTimeEmoji = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) return "☀️"; // Morning sun
        if (hour >= 12 && hour < 20) return "🌙"; // Afternoon moon
        return "😴"; // Late night
    };

    return (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-8 py-6">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
                {/* Main Greeting */}
                <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">{getTimeEmoji()}</span>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                            {getGreeting()}, <span className="text-blue-600 dark:text-blue-400">{`${user?.firstName} ${user?.lastName}`}</span>
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-1">{currentTime}</p>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;