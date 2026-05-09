import {
  CalendarDays,
  LayoutGrid,
  LifeBuoy,
  Settings,
  UserCircle2,
  Users,
  X,
  History,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import type { User } from "@/contexts/AuthContext";
import NavItem from "./NavItem";

interface MobileMenuSheetProps {
  user: User | null;
  isOpen: boolean;
  role: "admin" | "user";
  onClose: () => void;
}

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

const MobileMenuSheet = ({
  user,
  isOpen,
  role,
  onClose,
}: MobileMenuSheetProps) => {
  const location = useLocation();

  const items = [
    {
      label: "Profile",
      description: "Your account and personal details",
      to: "/profile",
      icon: UserCircle2,
    },
    {
      label: "Apply Leave",
      description: "Create a new leave request",
      to: "/apply-leave",
      icon: LayoutGrid,
    },
    {
      label: "Leave History",
      description: "Review past and current leave requests",
      to: "/leave-history",
      icon: History,
    },
    {
      label: "Team Availability",
      description: "View team schedules and calendar",
      to: "/calendar",
      icon: CalendarDays,
    },
    ...(role === "admin"
      ? [
          {
            label: "Manage Employees",
            description: "Admin employee and team management",
            to: "/manage-employees",
            icon: Users,
          },
          {
            label: "Leave Approvals",
            description: "Review and approve leave requests",
            to: "/approve-leave",
            icon: CheckCircle2,
          },
        ]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity dark:bg-slate-950/70 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <section
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border-t border-slate-200/80 bg-white/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3 shadow-[0_-24px_80px_rgba(15,23,42,0.2)] backdrop-blur-2xl transition-transform duration-300 dark:border-slate-700 dark:bg-slate-900/96 dark:shadow-[0_-24px_80px_rgba(2,8,23,0.65)] lg:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-300 dark:bg-slate-600" />
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-base font-semibold text-white">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {role === "admin" ? "Admin" : "Employee"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[62vh] space-y-2 overflow-y-auto pb-2">
          {items.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              description={item.description}
              to={item.to}
              disabled={item.disabled}
              active={Boolean(
                item.to &&
                (location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/")),
              )}
              onClick={onClose}
            />
          ))}
        </div>
      </section>
    </>
  );
};

export default MobileMenuSheet;
