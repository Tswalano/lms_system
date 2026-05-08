import { CalendarDays, FileText, Home, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import DisraptorMenuButton from "./DisraptorMenuButton";

interface BottomNavProps {
    role: "admin" | "user";
    activeKey: string;
    isMenuOpen: boolean;
    onOpenMenu: () => void;
    onSignOut: () => void;
}

const BottomNav = ({
    role,
    activeKey,
    isMenuOpen,
    onOpenMenu,
    onSignOut,
}: BottomNavProps) => {
    const requestItem =
        role === "admin"
            ? { key: "approvals", label: "Approvals", to: "/approve-leave" }
            : { key: "requests", label: "Requests", to: "/leave-history" };

    const navItems = [
        { key: "dashboard", label: "Dashboard", to: "/", icon: Home },
        { key: "availability", label: "Availability", to: "/calendar", icon: CalendarDays },
        requestItem,
    ] as const;

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#09111f]/92 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 backdrop-blur-2xl lg:hidden">
            <div className="mx-auto flex max-w-md items-end justify-between gap-1">
                {navItems.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeKey === item.key;

                    return (
                        <Link
                            key={item.key}
                            to={item.to}
                            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors ${
                                isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}

                <div className="flex flex-1 justify-center">
                    <DisraptorMenuButton active={isMenuOpen} onClick={onOpenMenu} />
                </div>

                <Link
                    to={requestItem.to}
                    className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors ${
                        activeKey === requestItem.key ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
                    }`}
                >
                    <FileText className="h-5 w-5" />
                    <span className="truncate">{requestItem.label}</span>
                </Link>

                <button
                    type="button"
                    onClick={onSignOut}
                    className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="truncate">Sign out</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
