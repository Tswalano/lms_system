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
            : "border border-white/8 bg-white/6 text-slate-200 hover:bg-white/10"
    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;

    const content = (
        <>
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                active ? "bg-white/18" : "bg-white/8"
            }`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium">{label}</p>
                {description ? <p className={`text-xs ${active ? "text-white/80" : "text-slate-400"}`}>{description}</p> : null}
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
