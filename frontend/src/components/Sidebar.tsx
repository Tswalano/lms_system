import { useState } from "react";
import { Home, FileText, Clock, LogOut, UserSearch, CheckCircle, Moon, Sun, History, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Sidebar = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth()
    const [userRole] = useState<'admin' | 'user'>(user?.role === 'admin' ? 'admin' : 'user');

    const employeeMenuItems = [
        { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
        { id: "apply", label: "Apply For Leave", icon: FileText, path: "/apply-leave" },
        { id: "history", label: "My Leave History", icon: Clock, path: "/leave-history" },
        { id: "team", label: "Team Availability", icon: UserSearch, path: "/team-availability" },
    ];

    const adminMenuItems = [
        ...employeeMenuItems,
        { id: "approve", label: "Approve Leave", icon: CheckCircle, path: "/approve-leave" },
        { id: "leave-history", label: "Team Leave History", icon: History, path: "/team-leave-history" },
        { id: "manage", label: "Manage Employees", icon: Users, path: "/manage-employees" }
    ];

    const menuItems = userRole === 'admin' ? adminMenuItems : employeeMenuItems;

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <div className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-lg z-10">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Replaced text logo with an image */}
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src='https://disraptor.co.za/wp-content/uploads/2023/05/AWS_Disraptor_Brand-Guidelines_V_031-1.svg' // Use .src if you're importing an image module
                                alt="Disruptor Logo"
                                className="h-14 w-auto" // Adjust height and width as needed
                            />
                        </Link>
                        {/* <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">Disruptor</span> */}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleTheme}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                        {theme === 'light' ? (
                            <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        ) : (
                            <Sun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                    </Button>
                </div>
            </div>

            <div className="p-4">
                <Link
                    to="/profile"
                    className={cn(
                        "flex items-center gap-3 mb-6 p-3 rounded-xl border transition-all duration-200 group cursor-pointer",
                        isActive('/profile')
                            ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 border-green-500 shadow-lg shadow-cyan-500/25"
                            : "bg-gradient-to-r from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-green-900/20 border-cyan-200 dark:border-cyan-800 hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        isActive('/profile')
                            ? "bg-white/20 text-white"
                            : "bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white"
                    )}>
                        <span className="font-semibold text-sm">
                            {getInitials(user?.firstName, user?.lastName)}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "font-semibold",
                            isActive('/profile')
                                ? "text-white"
                                : "bg-gradient-to-r from-blue-700 via-cyan-600 to-green-600 dark:from-blue-300 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent group-hover:from-blue-800 group-hover:via-cyan-700 group-hover:to-green-700 dark:group-hover:from-blue-200 dark:group-hover:via-cyan-200 dark:group-hover:to-green-200"
                        )}>
                            {`${user?.firstName} ${user?.lastName}`}
                        </p>
                        <p className={cn(
                            "text-sm truncate",
                            isActive('/profile')
                                ? "text-white/80"
                                : "text-gray-500 dark:text-gray-400 group-hover:bg-gradient-to-r group-hover:from-cyan-600 group-hover:to-green-600 dark:group-hover:from-cyan-400 dark:group-hover:to-green-400 group-hover:bg-clip-text group-hover:text-transparent"
                        )}>
                            {user?.jobTitle}
                        </p>
                    </div>
                </Link>


                <nav className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
                                isActive(item.path)
                                    ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/25"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30 hover:text-cyan-500 dark:hover:text-cyan-400"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive(item.path)
                                        ? "text-white"
                                        : "text-gray-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400"
                                )}
                            />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

            </div>

            <div className="absolute bottom-4 left-4 right-4 py-2">
                {/* Version */}
                <div className="mb-4 px-3 py-2 text-xs from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/30 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Version</span>
                        <div className="flex items-center gap-1">
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold tracking-wider">
                                {import.meta.env.VITE_VERSION || '1.0.0'}
                            </span>
                        </div>
                    </div>
                </div>
                {/* logout  should be a button */}
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400 hover:from-red-100 hover:to-rose-100 dark:hover:from-red-950/50 dark:hover:to-rose-950/40 hover:border-red-300/60 dark:hover:border-red-700/50 hover:shadow-lg hover:shadow-red-500/10 dark:hover:shadow-red-500/5 transition-all duration-300 group backdrop-blur-sm"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors duration-300">
                        <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300 transition-colors duration-300" />
                    </div>
                    <span className="font-semibold text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors duration-300">
                        Sign Out
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
