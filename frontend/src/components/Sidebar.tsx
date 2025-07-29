import { useState, useEffect } from "react";
import { Home, FileText, Clock, LogOut, UserSearch, ArchiveRestore, CheckCircle, Moon, Sun, History, Users, Menu, X, ChevronsRight, ChevronsLeft, ChartSpline, FileCheck2, ChevronsDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Separator } from "@/components/ui/separator"

interface SidebarProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isCollapsed,
    setIsCollapsed
}) => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const isLgUp = useMediaQuery('(min-width: 1024px)');
    const [userRole] = useState<'admin' | 'user'>(user?.role === 'admin' ? 'admin' : 'user');
    const [isCollapsibleMenuOpen, setIsCollapsibleMenuOpen] = useState(false);

    // Load collapse state from localStorage on component mount
    useEffect(() => {
        const savedCollapseState = localStorage.getItem('sidebarCollapsed');
        if (savedCollapseState !== null) {
            setIsCollapsed(savedCollapseState === 'true');
        }
    }, [setIsCollapsed]);

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

    // Collapsible menu items
    const collapsibleMenuItems: MenuItem[] = [
        userRole === 'admin'
            ? {
                id: "adminDocument",
                label: "Admin Document",
                icon: ArchiveRestore,
                path: "/admin-document",
            }
            : null,
        {
            id: "employeeDocument",
            label: "Employee Document",
            icon: FileCheck2,
            path: "/employee-document",
        },
        {
            id: "performance",
            label: "Performance Review",
            icon: ChartSpline,
            path: "/performance-review",
        }
    ].filter(Boolean) as MenuItem[];


    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const isAnyItemActive = collapsibleMenuItems.some(item => isActive(item.path));
    const shouldHighlightHeader = !isCollapsibleMenuOpen && isAnyItemActive;


    const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const handleMenuItemClick = () => {
        // Close mobile menu when item is clicked
        setIsMobileMenuOpen(false);
    };

    const toggleCollapse = () => {
        const newCollapseState = !isCollapsed;
        // Save collapse state to localStorage
        localStorage.setItem('sidebarCollapsed', String(newCollapseState));
        setIsCollapsed(newCollapseState);
    };

    // Dynamic width based on collapse state
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';

    return (
        <>
            {/* Mobile Menu Button - Fixed at top */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-slate-900 shadow-lg border border-gray-200 dark:border-slate-700"
            >
                {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                )}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 shadow-lg z-50 transition-all duration-300 ease-in-out flex flex-col",
                // Desktop: Dynamic width based on collapse state
                `lg:${sidebarWidth}`,
                // Mobile: Always full width when open
                "w-72",
                // Desktop: Always visible
                "lg:translate-x-0",
                // Mobile: Hidden by default, shown when menu is open
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Header - Fixed */}
                <div className="flex-shrink-0 p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-2" onClick={handleMenuItemClick}>
                                {!isCollapsed || !window.matchMedia('(min-width: 1024px)').matches ? (
                                    <img
                                        src='https://disraptor.co.za/wp-content/uploads/2023/05/AWS_Disraptor_Brand-Guidelines_V_031-1.svg'
                                        alt="Disruptor Logo"
                                        className="h-14 w-auto"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
                                        <img
                                            src='favicon.png'
                                            alt="Disruptor Logo"
                                            className="h-10 w-10 object-contain mx-auto"
                                        />
                                    </div>
                                )}
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Desktop Collapse Toggle Button - Improved with Background */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={toggleCollapse}
                                className="hidden lg:flex items-center justify-center w-8 h-8 p-0 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 hover:shadow-sm transition-all duration-300"
                            >
                                {isCollapsed ? (
                                    <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                ) : (
                                    <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {/* User Profile */}
                    <div className={cn("p-4", isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? "" : "")}>
                        <Link
                            to="/profile"
                            onClick={handleMenuItemClick}
                            className={cn(
                                "flex items-center gap-3 mb-6 p-3 rounded-xl transition-all duration-200 group cursor-pointer",
                                isActive('/profile')
                                    ? isCollapsed ? "" : "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 border border-green-500 shadow-lg shadow-cyan-500/25"
                                    : isCollapsed && window.matchMedia('(min-width: 1024px)').matches
                                        ? "bg-transparent border-transparent hover:bg-transparent"
                                        : "bg-gradient-to-r from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-green-900/20 border border-cyan-200 dark:border-cyan-800 hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30",
                                isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? "justify-center" : ""
                            )}
                            title={isCollapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
                        >
                            <div
                                className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                    isCollapsed
                                        ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white"
                                        : isActive("/profile")
                                            ? "bg-white/20 text-white"
                                            : "bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white"
                                )}
                            >
                                <span className="font-semibold text-sm">
                                    {getInitials(user?.firstName, user?.lastName)}
                                </span>
                            </div>

                            {(!isCollapsed || !window.matchMedia('(min-width: 1024px)').matches) && (
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
                            )}
                        </Link>

                        {/* Navigation */}
                        <nav className="space-y-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.id}
                                    to={item.path}
                                    onClick={handleMenuItemClick}
                                    title={isCollapsed ? item.label : undefined}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
                                        isActive(item.path)
                                            ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/25"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30 hover:text-cyan-500 dark:hover:text-cyan-400",
                                        isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? "justify-center px-2" : ""
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
                                    {(!isCollapsed || !window.matchMedia('(min-width: 1024px)').matches) && (
                                        <span className="font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap">
                                            {item.label}
                                        </span>
                                    )}
                                </Link>
                            ))}
                        </nav>

                        {process.env.NODE_ENV === 'development' && (
                            <div>
                                <Separator className="my-4" />
                                {/* Collapsible Header */}
                                <button
                                    onClick={() => setIsCollapsibleMenuOpen(!isCollapsibleMenuOpen)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left transition-all duration-200 group",
                                        shouldHighlightHeader ? "text-cyan-500 dark:text-cyan-400 font-semibold" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                                        isCollapsed && isLgUp ? "justify-center px-2" : ""
                                    )}
                                    title={isCollapsed ? "Company Menu" : undefined}
                                >
                                    {isCollapsed && isLgUp ? (
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <span className="text-xs font-bold">-</span>
                                        </div>
                                    ) : (
                                        <>
                                            {isCollapsibleMenuOpen ? (
                                                <ChevronsDown className="w-4 h-4" />
                                            ) : (
                                                <ChevronsRight className="w-4 h-4" />
                                            )}
                                            <span className="transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap">
                                                Company Menu
                                            </span>
                                        </>
                                    )}
                                </button>

                                {/* Collapsible Items */}
                                {(isCollapsibleMenuOpen || (isCollapsed && isLgUp)) && (
                                    <div className="space-y-2">
                                        {collapsibleMenuItems.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                onClick={handleMenuItemClick}
                                                title={isCollapsed ? item.label : undefined}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
                                                    isActive(item.path)
                                                        ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/25"
                                                        : "text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30 hover:text-cyan-500 dark:hover:text-cyan-400",
                                                    isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? "justify-center px-2" : ""
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
                                                {(!isCollapsed || !window.matchMedia('(min-width: 1024px)').matches) && (
                                                    <span className="font-medium transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap">
                                                        {item.label}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Fixed at bottom */}
                <div className={cn("flex-shrink-0 py-4 border-t border-gray-100 dark:border-slate-700 transition-all duration-300",
                    isCollapsed && window.matchMedia('(min-width: 1024px)').matches
                        ? "px-2"
                        : "px-4"
                )}>

                    {/* Dark Mode Toggle */}
                    {isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? (
                        <button
                            onClick={toggleTheme}
                            className="w-10 h-10 mx-auto flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 shadow-inner border border-slate-300 dark:border-slate-700 hover:shadow-md hover:bg-slate-300/70 dark:hover:bg-slate-700/90 transition-all duration-300"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? (
                                <Sun className="w-5 h-5 text-yellow-500 hover:text-yellow-600" />
                            ) : (
                                <Moon className="w-5 h-5 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300" />
                            )}
                        </button>
                    ) : (
                        <div className="w-full">
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "w-full p-1 flex items-center rounded-full transition-all duration-300",
                                    theme === 'dark'
                                        ? "bg-slate-800 dark:bg-slate-900 border border-slate-700"
                                        : "bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700",
                                    "shadow-inner hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-sm font-medium transition-all duration-300",
                                        theme === 'light'
                                            ? "bg-white dark:bg-slate-700 text-yellow-500 shadow-md"
                                            : "text-slate-500 dark:text-slate-400 hover:text-yellow-500 dark:hover:text-yellow-400"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    <span>Light</span>
                                </div>
                                <div
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-1 py-1 rounded-full text-sm font-medium transition-all duration-300",
                                        theme === 'dark'
                                            ? "bg-slate-700 text-blue-500 dark:text-blue-400 shadow-md"
                                            : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    <span>Dark</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Logout Button */}
                    {isCollapsed && window.matchMedia('(min-width: 1024px)').matches ? (
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="w-10 h-10 mx-auto mt-3 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800/50 transition-all duration-300"
                        >
                            <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </button>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 mt-3 rounded-xl transition-all duration-300 group bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/30 hover:border-red-300/60 dark:hover:border-red-700/50 hover:shadow-lg hover:shadow-red-500/10 dark:hover:shadow-red-500/5"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors duration-300">
                                <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" />
                            </div>
                            <span className="font-semibold text-red-700 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300">
                                Sign Out
                            </span>
                        </button>
                    )}

                    {/* Version */}
                    {(!isCollapsed || !window.matchMedia('(min-width: 1024px)').matches) && (
                        <div className="mt-4 px-3 py-2 text-xs text-center">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                                {import.meta.env.VITE_VERSION || '1.0.0'}
                            </span>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
};

export default Sidebar;