import { useState, useEffect } from "react";
import { Home, FileText, Clock, LogOut, ArchiveRestore, CheckCircle, Moon, Sun, History, Users, Menu, X, ChevronsRight, ChevronsLeft, ChartSpline, FileCheck2, ChevronsDown, Calendar, BarChart3, Settings, Building2 } from "lucide-react";
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
    }, [location.pathname]);

    // Define menu sections with better organization
    const menuSections: MenuSection[] = [
        {
            id: 'workspace',
            label: 'Workspace',
            icon: Home,
            defaultOpen: true,
            items: [
                { id: "dashboard", label: "Dashboard", icon: BarChart3, path: "/" },
                { id: "team", label: "Team Calendar", icon: Calendar, path: "/team-availability" },
                { id: "apply", label: "Request Leave", icon: FileText, path: "/apply-leave" },
                { id: "history", label: "My Requests", icon: Clock, path: "/leave-history" },
                ...(userRole === 'admin' ? [
                    { id: "approve", label: "Pending Approvals", icon: CheckCircle, path: "/approve-leave", badge: "3" },
                    { id: "team-history", label: "Team History", icon: History, path: "/team-leave-history" },
                ] : [])
            ]
        },
        ...(userRole === 'admin' ? [{
            id: 'administration',
            label: 'Administration',
            icon: Settings,
            items: [
                { id: "manage", label: "Manage Team", icon: Users, path: "/manage-employees" },
                { id: "performance", label: "Performance Reviews", icon: ChartSpline, path: "/performance" },
            ]
        }] : []),
        ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev' ? [{
            id: 'company-resources',
            label: 'Resources',
            icon: Building2,
            items: [
                ...(userRole === 'admin' ? [
                    { id: "admin-docs", label: "Admin Documents", icon: ArchiveRestore, path: "/admin-document" }
                ] : []),
                { id: "employee-docs", label: "Employee Handbook", icon: FileCheck2, path: "/employee-document" },
            ]
        }] : [])
    ].filter(section => section.items.length > 0);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const isSectionActive = (section: MenuSection) => {
        return section.items.some(item => isActive(item.path));
    };

    // Changed: Toggle section logic - only one can be open at a time
    const toggleSection = (sectionId: string) => {
        const newActiveSection = activeSection === sectionId ? null : sectionId;
        setActiveSection(newActiveSection);

        // Save to localStorage
        if (newActiveSection) {
            localStorage.setItem('sidebarActiveSection', newActiveSection);
        } else {
            localStorage.removeItem('sidebarActiveSection');
        }
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

    const sidebarWidth = isCollapsed ? 'w-20' : 'w-72';

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
                `lg:${sidebarWidth}`,
                "w-72",
                "lg:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-100/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2" onClick={handleMenuItemClick}>
                            {!isCollapsed || !isLgUp ? (
                                <img
                                    src='https://disraptor.co.za/wp-content/uploads/2023/05/AWS_Disraptor_Brand-Guidelines_V_031-1.svg'
                                    alt="Disruptor Logo"
                                    className="h-14 w-auto transition-all duration-300"
                                />
                            ) : (
                                <div className="w-14 h-14 flex items-center justify-center">
                                    <img
                                        src='favicon.png'
                                        alt="Disruptor Logo"
                                        className="h-10 w-10 object-contain"
                                    />
                                </div>
                            )}
                        </Link>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleCollapse}
                            className="hidden lg:flex items-center justify-center w-10 h-10 p-2 rounded-xl bg-gray-100/80 dark:bg-slate-800/80 border border-gray-200/50 dark:border-slate-700/50 hover:bg-gray-200/80 dark:hover:bg-slate-700/80 hover:scale-105 transition-all duration-200"
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
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
                    <div className="p-4 space-y-6">
                        {/* User Profile */}
                        <Link
                            to="/profile"
                            onClick={handleMenuItemClick}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group cursor-pointer border",
                                isActive('/profile')
                                    ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 border-transparent shadow-lg shadow-cyan-500/25 scale-[1.02]"
                                    : "bg-gradient-to-r from-blue-50/80 via-cyan-50/80 to-green-50/80 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-green-900/20 border-cyan-200/50 dark:border-cyan-800/50 hover:from-blue-100/80 hover:via-cyan-100/80 hover:to-green-100/80 dark:hover:from-blue-900/30 dark:hover:via-cyan-900/30 dark:hover:to-green-900/30 hover:shadow-lg hover:scale-[1.02]",
                                isCollapsed && isLgUp ? "justify-center p-3" : ""
                            )}
                            title={isCollapsed ? `${user?.firstName} ${user?.lastName}` : undefined}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md",
                                isActive("/profile")
                                    ? "bg-white/20 text-white"
                                    : "bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500 text-white"
                            )}>
                                <span className="font-bold text-sm">
                                    {getInitials(user?.firstName, user?.lastName)}
                                </span>
                            </div>

                            {(!isCollapsed || !isLgUp) && (
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "font-bold text-sm",
                                        isActive('/profile')
                                            ? "text-white"
                                            : "bg-gradient-to-r from-blue-700 via-cyan-600 to-green-600 dark:from-blue-300 dark:via-cyan-300 dark:to-green-300 bg-clip-text text-transparent"
                                    )}>
                                        {`${user?.firstName} ${user?.lastName}`}
                                    </p>
                                    <p className={cn(
                                        "text-xs truncate mt-1",
                                        isActive('/profile')
                                            ? "text-white/80"
                                            : "text-gray-600 dark:text-gray-400"
                                    )}>
                                        {user?.jobTitle}
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Menu Sections */}
                        <nav className="space-y-2">
                            {isCollapsed && isLgUp ? (
                                // Collapsed view: Show only menu items without sections
                                <div className="space-y-1">
                                    {menuSections.flatMap(section => section.items).map((item) => (
                                        <Link
                                            key={item.id}
                                            to={item.path}
                                            onClick={handleMenuItemClick}
                                            title={item.label}
                                            className={cn(
                                                "flex items-center justify-center w-12 h-12 mx-auto rounded-xl transition-all duration-200 group relative",
                                                isActive(item.path)
                                                    ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/20 scale-[1.05]"
                                                    : "text-gray-500 dark:text-gray-400 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:via-cyan-900/20 dark:hover:to-green-900/20 hover:text-cyan-500 dark:hover:text-cyan-400 hover:shadow-md hover:scale-[1.05]"
                                            )}
                                        >
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-all duration-200",
                                                isActive(item.path)
                                                    ? "text-white"
                                                    : "text-gray-500 dark:text-gray-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400"
                                            )} />

                                            {item.badge && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                // Expanded view: Show sections with items
                                <>
                                    {menuSections.map((section) => {
                                        const isOpen = activeSection === section.id;
                                        const sectionActive = isSectionActive(section);

                                        return (
                                            <div key={section.id} className="space-y-1">
                                                {/* Section Header */}
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 group",
                                                        // Enhanced styling for active sections
                                                        isOpen && sectionActive
                                                            ? "bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-green-500/10 dark:from-blue-400/10 dark:via-cyan-400/10 dark:to-green-400/10 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-700/50 shadow-sm"
                                                            : isOpen
                                                                ? "bg-gray-100/80 dark:bg-slate-800/50 text-gray-700 dark:text-gray-200 font-semibold"
                                                                : sectionActive
                                                                    ? "bg-gradient-to-r from-blue-100/80 to-cyan-100/80 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm"
                                                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-slate-800/50"
                                                    )}
                                                >
                                                    <div className="relative">
                                                        <ChevronsDown className={cn(
                                                            "w-4 h-4 transition-all duration-300",
                                                            isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-70"
                                                        )} />
                                                    </div>
                                                    <section.icon className="w-4 h-4" />
                                                    <span className="font-medium text-xs uppercase tracking-wider">
                                                        {section.label}
                                                    </span>
                                                </button>

                                                {/* Section Items */}
                                                <div className={cn(
                                                    "transition-all duration-300 ease-out overflow-hidden",
                                                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                                )}>
                                                    <div className="space-y-1 pt-1">
                                                        {section.items.map((item) => (
                                                            <Link
                                                                key={item.id}
                                                                to={item.path}
                                                                onClick={handleMenuItemClick}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-4 py-3 ml-2 rounded-xl text-sm transition-all duration-200 group relative",
                                                                    isActive(item.path)
                                                                        ? "bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 text-white shadow-lg shadow-cyan-500/20 font-semibold scale-[1.02]"
                                                                        : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:via-cyan-50 hover:to-green-50 dark:hover:from-blue-900/20 dark:hover:via-cyan-900/20 dark:hover:to-green-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 hover:shadow-md hover:scale-[1.01]"
                                                                )}
                                                            >
                                                                <item.icon className={cn(
                                                                    "w-5 h-5 transition-all duration-200",
                                                                    isActive(item.path)
                                                                        ? "text-white"
                                                                        : "text-gray-500 dark:text-gray-400 group-hover:text-cyan-500 dark:group-hover:text-cyan-400"
                                                                )} />

                                                                <span className="font-medium flex-1">
                                                                    {item.label}
                                                                </span>
                                                                {item.badge && (
                                                                    <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </nav>
                    </div>
                </div>

                {/* Footer */}
                <div className={cn(
                    "flex-shrink-0 p-4 border-t border-gray-100/50 dark:border-slate-700/50 space-y-3",
                    isCollapsed && isLgUp ? "px-2" : ""
                )}>
                    {/* Theme Toggle */}
                    {isCollapsed && isLgUp ? (
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
                    {isCollapsed && isLgUp ? (
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
                    {(!isCollapsed || !isLgUp) && (
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