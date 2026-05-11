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
  const roleItem =
    role === "admin"
      ? { key: "approvals", label: "Approvals", to: "/approve-leave" }
      : { key: "history", label: "Leave History", to: "/leave-history" };

  const navItems = [
    { key: "dashboard", label: "Dashboard", to: "/", icon: Home },
    {
      key: "availability",
      label: "Availability",
      to: "/calendar",
      icon: CalendarDays,
    },
    roleItem,
  ] as const;

  const getNavItemClassName = (isActive: boolean) =>
    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-medium transition-colors ${
      isActive
        ? "bg-accent text-foreground"
        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-2xl lg:hidden dark:shadow-[0_-10px_30px_rgba(2,8,23,0.3)]">
      <div className="mx-auto flex max-w-md items-end justify-between gap-1">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;

          return (
            <Link
              key={item.key}
              to={item.to}
              className={getNavItemClassName(isActive)}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-x-4 top-0 h-0.5 rounded-full transition-opacity ${
                  isActive ? "bg-foreground opacity-100" : "opacity-0"
                }`}
              />
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="flex flex-1 justify-center">
          <DisraptorMenuButton active={isMenuOpen} onClick={onOpenMenu} />
        </div>

        <Link
          to={roleItem.to}
          className={getNavItemClassName(activeKey === roleItem.key)}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-x-4 top-0 h-0.5 rounded-full transition-opacity ${
              activeKey === roleItem.key
                ? "bg-foreground opacity-100"
                : "opacity-0"
            }`}
          />
          <FileText className="h-5 w-5" />
          <span className="truncate">{roleItem.label}</span>
        </Link>

        <button
          type="button"
          onClick={onSignOut}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <LogOut className="h-5 w-5" />
          <span className="truncate">Sign out</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
