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
        <aside className="fixed left-0 top-0 z-30 hidden h-full w-80 flex-col border-r border-white/10 bg-[#09111f]/96 px-4 py-5 shadow-2xl backdrop-blur-2xl lg:flex">
                <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/75">
                            Disraptor LMS
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-white">
                            Workspace
                        </h2>
                    </div>
                </div>

                <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-white/8 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                    <p className="text-sm text-slate-300">
                        {user?.firstName} {user?.lastName}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        {user?.jobTitle || user?.email}
                    </p>
                    <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-cyan-300">
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
                                        : "border border-white/0 bg-white/0 text-slate-300 hover:border-white/10 hover:bg-white/8 hover:text-white"
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
                    className="mt-5 flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20"
                >
                    <LogOut className="h-5 w-5" />
                    <span>Sign out</span>
                </button>
        </aside>
    );
};

export default DesktopSidebar;
