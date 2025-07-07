import { useState } from "react";
import { Home, FileText, Clock, LogOut, Users, CheckCircle, Moon, Sun, History } from "lucide-react";
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
        { id: "team", label: "Team Availability", icon: Users, path: "/team-availability" },
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
                        <img
                            src='https://disraptor.co.za/wp-content/uploads/2023/05/AWS_Disraptor_Brand-Guidelines_V_031-1.svg' // Use .src if you're importing an image module
                            alt="Disruptor Logo"
                            className="h-14 w-auto" // Adjust height and width as needed
                        />
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
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600 shadow-lg shadow-blue-500/25"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30"
                    )}
                >
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                        isActive('/profile')
                            ? "bg-white/20 text-white"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
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
                                : "text-gray-800 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                        )}>
                            {`${user?.firstName} ${user?.lastName}`}
                        </p>
                        <p className={cn(
                            "text-sm truncate",
                            isActive('/profile')
                                ? "text-white/80"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
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
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-colors",
                                    isActive(item.path) ? "text-white" : "text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                )}
                            />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 bg-red-50 dark:bg-red-900/20 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 group">
                    <LogOut className="w-5 h-5 text-red-600 group-hover:text-red-500 transition-colors" />
                    <span className="font-medium text-red-600">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
