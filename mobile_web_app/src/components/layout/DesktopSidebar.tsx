import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import type { AppNavItem } from "./AppNavigation";
import { useAuth } from "@/contexts/AuthContext";

interface DesktopSidebarProps {
    items: AppNavItem[];
    activeKey: string;
}

const DesktopSidebar = ({
    items,
    activeKey,
}: DesktopSidebarProps) => {
    const { user, logout } = useAuth();

    return (
        <aside className="fixed left-0 top-0 z-30 hidden h-full w-80 flex-col border-r border-slate-200/80 bg-white/90 px-4 py-5 shadow-2xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95 lg:flex">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300/75">
                            Disraptor LMS
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-gray-100">
                            Workspace
                        </h2>
                    </div>
                </div>

                <div className="mb-5 rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)]">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {user?.jobTitle || user?.email}
                    </p>
                    <p className="mt-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300">
                        {user?.role === "admin" ? "Admin" : "Employee"}
                    </p>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.key === activeKey;

                        return (
                            <Link
                                key={item.key}
                                to={item.to}
                                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                                        : "border border-transparent bg-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-gray-100"
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <button
                    type="button"
                    onClick={logout}
                    className="mt-5 flex items-center gap-3 rounded-2xl border border-red-200/50 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3 text-sm font-semibold text-red-700 transition-all duration-300 hover:scale-[1.02] hover:from-red-100 hover:to-red-200 hover:shadow-lg dark:border-red-800/30 dark:from-red-950/20 dark:to-red-900/20 dark:text-red-400 dark:hover:from-red-950/30 dark:hover:to-red-900/30"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 shadow-sm transition-all duration-300 dark:bg-red-900/40">
                        <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span>Sign out</span>
                </button>
        </aside>
    );
};

export default DesktopSidebar;
