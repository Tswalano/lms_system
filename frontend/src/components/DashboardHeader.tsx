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
        <div className="relative px-8 pt-16 overflow-hidden">
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-6">
                {/* Main Greeting Card */}
                <div className="backdrop-blur-sm max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                    {/* Emoji and Time Section */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="text-5xl animate-bounce" style={{ animationDuration: '2s' }}>
                            {getTimeEmoji()}
                        </div>
                        <div className="h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent"></div>
                        <div className="text-lg font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/60 dark:to-green-900/60 px-4 py-2 rounded-full backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30">
                            {currentTime}
                        </div>
                    </div>

                    {/* Main Greeting Text - Disraptor Brand Gradient */}
                    <div className="space-y-3">
                        <div className="text-3xl md:text-4xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-400 dark:to-green-400 bg-clip-text text-transparent" style={{ animationDuration: '3s' }}>
                                {getGreeting()}, {`${user?.firstName} ${user?.lastName}`}
                            </span>
                        </div>
                    </div>

                    {/* Subtitle with Brand Accent */}
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-4 font-medium">
                        Welcome back to your dashboard
                    </p>
                </div>
            </div>

        </div>
    );
};

export default DashboardHeader;