import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
    isCollapsed?: boolean;
    showSidebar?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    isCollapsed = false,
    showSidebar = true
}) => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleString("en-US", {
            weekday: "short",   // Thu
            month: "short",     // Jul
            day: "numeric",     // 10
            hour: "2-digit",    // 14
            minute: "2-digit",  // 00
            hour12: false,      // 24-hour format
        }).replace(",", "");
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getTimeEmoji = () => {
        const hour = currentTime.getHours();

        if (hour >= 5 && hour < 12) return "☀️"; // Morning sun
        if (hour >= 12 && hour < 20) return "🌙"; // Afternoon moon
        return "😴"; // Late night
    };

    // Calculate responsive padding based on sidebar state
    const getResponsivePadding = () => {
        if (!showSidebar) {
            return "px-4 lg:px-8";
        }

        // When sidebar is present, adjust padding for collapsed state
        if (isCollapsed) {
            return "px-4 lg:px-8"; // Less padding when collapsed
        } else {
            return "px-4 lg:px-8"; // Standard padding when expanded
        }
    };

    return (
        <div className={`relative ${getResponsivePadding()} pt-8 lg:pt-16 overflow-hidden transition-all duration-300`}>
            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 lg:space-y-6">
                {/* Main Greeting Card */}
                <div className="backdrop-blur-sm max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                    {/* Emoji and Time Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 lg:mb-4">
                        <div className="text-4xl lg:text-5xl animate-bounce" style={{ animationDuration: '2s' }}>
                            {getTimeEmoji()}
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent"></div>
                        <div className="text-sm lg:text-lg font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/60 dark:to-green-900/60 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 transition-all duration-300">
                            <span className="font-mono">
                                {formatTime(currentTime)}
                            </span>
                        </div>
                    </div>

                    {/* Main Greeting Text - Disraptor Brand Gradient */}
                    <div className="space-y-2 lg:space-y-3">
                        <div className="text-xl sm:text-2xl lg:text-4xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-400 dark:to-green-400 bg-clip-text text-transparent" style={{ animationDuration: '3s' }}>
                                {getGreeting()}, {`${user?.firstName} ${user?.lastName}`}
                            </span>
                        </div>
                    </div>

                    {/* Subtitle with Brand Accent */}
                    <p className="text-sm lg:text-lg text-gray-600 dark:text-gray-300 mt-3 lg:mt-4 font-medium">
                        Welcome back to your dashboard
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;