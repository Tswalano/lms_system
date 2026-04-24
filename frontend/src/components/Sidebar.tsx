import { useState, useEffect } from "react";
import { Home, FileText, Clock, LogOut, ArchiveRestore, CheckCircle, Moon, Sun, Users, Menu, X, ChevronsRight, ChevronsLeft, FileCheck2, Calendar, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
    badge?: string;
    children?: MenuItem[];
}

interface MenuSection {
    id: string;
    label: string;
    icon: React.ElementType;
    items: MenuItem[];
    defaultOpen?: boolean;
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

    // Changed: Only store a single active section ID instead of a Set
    const [activeSection, setActiveSection] = useState<string | null>('workspace');

    // Define menu sections with better organization - MOVED BEFORE useEffect
    const menuSections: MenuSection[] = [
        {
            id: 'workspace',
            label: 'Workspace',
            icon: Home,
            defaultOpen: true,
            items: [
                { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
                { id: "team", label: "Team Calendar", icon: Calendar, path: "/team-availability" },
                { id: "apply", label: "Apply for Leave", icon: FileText, path: "/apply-leave" },
                { id: "history", label: "My Leave Requests", icon: Clock, path: "/leave-history" },
                { id: "employee-docs", label: "Employee Handbook", icon: FileCheck2, path: "/employee-document" },
            ]
        },
        ...(userRole === 'admin' ? [{
            id: 'administration',
            label: 'Administration',
            icon: Settings,
            items: [
                { id: "approve", label: "Pending Approvals", icon: CheckCircle, path: "/approve-leave" },
                { id: "manage", label: "Manage Employees", icon: Users, path: "/manage-employees" },
                { id: "admin-docs", label: "Admin Documents", icon: ArchiveRestore, path: "/admin-document" },
            ]
        }] : []),
    ].filter(section => section.items.length > 0);

    // Load collapse state from localStorage on component mount
    useEffect(() => {
        const savedCollapseState = localStorage.getItem('sidebarCollapsed');
        if (savedCollapseState !== null) {
            setIsCollapsed(savedCollapseState === 'true');
        }
    }, [setIsCollapsed]);

    // Load active section from localStorage and determine default based on current route
    useEffect(() => {
        const savedActiveSection = localStorage.getItem('sidebarActiveSection');

        // If there's a saved section, use it
        if (savedActiveSection && menuSections.some(section => section.id === savedActiveSection)) {
            setActiveSection(savedActiveSection);
        } else {
            // Otherwise, determine which section should be active based on current route
            const currentSection = menuSections.find(section =>
                section.items.some(item => item.path === location.pathname)
            );

            if (currentSection) {
                setActiveSection(currentSection.id);
                localStorage.setItem('sidebarActiveSection', currentSection.id);
            }
        }
    }, [location.pathname, menuSections]);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const getInitials = (firstName: string | undefined, lastName: string | undefined) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const handleMenuItemClick = () => {
        setIsMobileMenuOpen(false);
    };

    const toggleCollapse = () => {
        const newCollapseState = !isCollapsed;
        localStorage.setItem('sidebarCollapsed', String(newCollapseState));
        setIsCollapsed(newCollapseState);

        // When expanding from collapsed state, ensure at least one section is open
        if (!newCollapseState && !activeSection) {
            const currentSection = menuSections.find(section =>
                section.items.some(item => item.path === location.pathname)
            ) || menuSections[0];

            if (currentSection) {
                setActiveSection(currentSection.id);
                localStorage.setItem('sidebarActiveSection', currentSection.id);
            }
        }
    };

    const isDesktopCollapsed = isCollapsed && isLgUp;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-lg border border-gray-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-200"
            >
                <div className="relative w-6 h-6">
                    <Menu className={cn(
                        "w-6 h-6 text-gray-600 dark:text-gray-400 absolute inset-0 transition-all duration-300",
                        isMobileMenuOpen ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
                    )} />
                    <X className={cn(
                        "w-6 h-6 text-gray-600 dark:text-gray-400 absolute inset-0 transition-all duration-300",
                        isMobileMenuOpen ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
                    )} />
                </div>
            </button>

            {/* Mobile Overlay */}
            <div className={cn(
                "fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300",
                isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsMobileMenuOpen(false)} />

            {/* Sidebar */}
            <div className={cn(
                "fixed left-0 top-0 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-gray-200/50 dark:border-slate-700/50 shadow-xl z-50 transition-all duration-300 ease-out flex flex-col",
                isCollapsed ? "lg:w-20" : "lg:w-72",
                "w-72",
                "lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-100/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center" onClick={handleMenuItemClick}>
                            {!isDesktopCollapsed ? (
                                <img
                                    src='https://disraptor.co.za/wp-content/uploads/2023/05/AWS_Disraptor_Brand-Guidelines_V_031-1.svg'
                                    alt="Disruptor Logo"
                                    className="h-14 w-auto transition-all duration-300"
                                />
                            ) : (
                                <div className="w-14 h-14 flex items-center justify-center pr-5">
                                    <img
                                        src="favicon.png"
                                        alt="Disruptor Logo"
                                        className="max-h-full max-w-full object-contain transition-all duration-300"
                                    />
                                </div>
                            )}
                        </Link>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className={cn(
                        "hidden lg:flex absolute top-6 -right-4 z-10 items-center justify-center w-9 h-9 p-0 rounded-full bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-200",
                        isDesktopCollapsed && "top-7"
                    )}
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <div className="relative w-4 h-4">
                        <ChevronsLeft className={cn(
                            "w-4 h-4 text-gray-600 dark:text-gray-400 absolute inset-0 transition-all duration-300",
                            isCollapsed ? "rotate-180 opacity-0" : "rotate-0 opacity-100"
                        )} />
                        <ChevronsRight className={cn(
                            "w-4 h-4 text-gray-600 dark:text-gray-400 absolute inset-0 transition-all duration-300",
                            isCollapsed ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
                        )} />
                    </div>
                </Button>

                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className={cn("p-4", isCollapsed && "px-2")}>
                        {/* User Profile */}
                        <Link
                            to="/profile"
                            onClick={handleMenuItemClick}
                            title={isCollapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
                            className={cn(
                                "flex items-center gap-3 mb-6 p-3 rounded-xl transition-all duration-200 group cursor-pointer",
                                isCollapsed && "justify-center",
                                isActive('/profile')
                                    ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 border border-green-500 shadow-lg shadow-cyan-500/25"
                                    : "bg-gradient-to-r from-blue-50 via-cyan-50 to-green-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-green-900/20 border border-cyan-200 dark:border-cyan-800 hover:from-blue-100 hover:via-cyan-100 hover:to-green-100 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30"
                            )}
                        >
                            <div className={cn(
                                "rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md",
                                isCollapsed ? "w-10 h-10" : "w-12 h-12",
                                isActive('/profile')
                                    ? "bg-white/20 text-white"
                                    : "bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white"
                            )}>
                                <span className="font-semibold text-sm">
                                    {getInitials(user?.firstName, user?.lastName)}
                                </span>
                            </div>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "font-semibold",
                                        isActive('/profile')
                                            ? "text-white"
                                            : "bg-gradient-to-r from-blue-700 via-cyan-600 to-green-600 dark:from-blue-300 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent"
                                    )}>
                                        {`${user?.firstName} ${user?.lastName}`}
                                    </p>
                                    <p className={cn(
                                        "text-sm truncate",
                                        isActive('/profile')
                                            ? "text-white/80"
                                            : "text-gray-500 dark:text-gray-400"
                                    )}>
                                        {user?.jobTitle}
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Menu Sections */}
                        <nav className="space-y-6">
                            {menuSections.map((section) => (
                                <div key={section.id}>
                                    {/* Section Label / Divider */}
                                    {isCollapsed ? (
                                        <div className="h-px bg-gray-200 dark:bg-slate-700 mb-2 mx-1" />
                                    ) : (
                                        <div className="flex items-center gap-2 px-1 mb-2">
                                            <section.icon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                                {section.label}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700 ml-1" />
                                        </div>
                                    )}

                                    {/* Section Items */}
                                    <div className="space-y-1">
                                        {section.items.map((item) => (
                                            <Link
                                                key={item.id}
                                                to={item.path}
                                                onClick={handleMenuItemClick}
                                                title={isCollapsed ? item.label : undefined}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative",
                                                    isCollapsed && "justify-center px-2",
                                                    isActive(item.path)
                                                        ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/20 font-semibold"
                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:via-cyan-900/20 dark:hover:to-green-900/20 hover:text-cyan-600 dark:hover:text-cyan-400"
                                                )}
                                            >
                                                <item.icon className={cn(
                                                    "w-4.5 h-4.5 flex-shrink-0 transition-all duration-200",
                                                    isActive(item.path)
                                                        ? "text-white"
                                                        : "text-gray-400 dark:text-gray-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400"
                                                )} />
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="flex-1">{item.label}</span>
                                                        {item.badge && (
                                                            <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                                                {item.badge}
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Footer */}
                <div className={cn(
                    "flex-shrink-0 p-4 border-t border-gray-100/50 dark:border-slate-700/50 space-y-3",
                    isDesktopCollapsed ? "px-2" : ""
                )}>
                    {/* Theme Toggle */}
                    {isDesktopCollapsed ? (
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 shadow-lg border border-gray-200 dark:border-slate-600 hover:shadow-xl hover:scale-105 transition-all duration-300"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            <div className="relative w-5 h-5">
                                <Sun className={cn(
                                    "w-5 h-5 text-yellow-500 dark:text-yellow-400 absolute inset-0 transition-all duration-500",
                                    theme === 'light' ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
                                )} />
                                <Moon className={cn(
                                    "w-5 h-5 text-blue-500 dark:text-blue-400 absolute inset-0 transition-all duration-500",
                                    theme === 'dark' ? "rotate-0 opacity-100" : "rotate-180 opacity-0"
                                )} />
                            </div>
                        </button>
                    ) : (
                        <div className="relative bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-2xl shadow-inner border border-gray-200 dark:border-slate-600">
                            <div className={cn(
                                "absolute top-1 bottom-1 bg-white dark:bg-slate-600 rounded-xl shadow-lg transition-all duration-300 ease-out",
                                theme === 'light' ? "left-1 right-1/2" : "left-1/2 right-1"
                            )} />
                            <div className="relative grid grid-cols-2">
                                <button
                                    onClick={() => theme !== 'light' && toggleTheme()}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300",
                                        theme === 'light'
                                            ? "text-yellow-600 dark:text-yellow-400"
                                            : "text-gray-500 dark:text-gray-400 hover:text-yellow-500"
                                    )}
                                >
                                    <Sun className="w-4 h-4" />
                                    Light
                                </button>
                                <button
                                    onClick={() => theme !== 'dark' && toggleTheme()}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300",
                                        theme === 'dark'
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 dark:text-gray-400 hover:text-blue-500"
                                    )}
                                >
                                    <Moon className="w-4 h-4" />
                                    Dark
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    {isDesktopCollapsed ? (
                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="w-12 h-12 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border border-red-200 dark:border-red-700/50 hover:from-red-200 hover:to-red-300 dark:hover:from-red-900/50 dark:hover:to-red-800/50 hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                            <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </button>
                    ) : (
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400 hover:from-red-100 hover:to-red-200 dark:hover:from-red-950/30 dark:hover:to-red-900/30 hover:shadow-lg hover:scale-[1.02]"
                        >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-all duration-300 shadow-sm">
                                <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="font-semibold">Sign Out</span>
                        </button>
                    )}

                    {/* Version */}
                    {!isDesktopCollapsed && (
                        <div className="text-center py-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                v{import.meta.env.VITE_VERSION || '1.0.0'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Sidebar;
