import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    description?: string;
    to?: string;
    active?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

const NavItem = ({
    icon: Icon,
    label,
    description,
    to,
    active = false,
    onClick,
    disabled = false,
}: NavItemProps) => {
    const className = `flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
        active
            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
            : "border border-slate-200 bg-slate-50/90 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;

    const content = (
        <>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                active ? "bg-white/18" : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
            }`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {description ? <p className={`text-xs ${active ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>{description}</p> : null}
            </div>
        </>
    );

    if (disabled || !to) {
        return (
            <button type="button" onClick={onClick} disabled={disabled} className={className}>
                {content}
            </button>
        );
    }

    return (
        <Link to={to} onClick={onClick} className={className}>
            {content}
        </Link>
    );
};

export default NavItem;
