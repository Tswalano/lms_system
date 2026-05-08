import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Home,
  LayoutGrid,
  LifeBuoy,
  Sparkles,
  UserCircle2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import features from "@/config/features";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "./BottomNav";
import DesktopSidebar from "./DesktopSidebar";
import MobileMenuSheet from "./MobileMenuSheet";

export interface AppNavItem {
  key: string;
  label: string;
  shortLabel?: string;
  to: string;
  icon: LucideIcon;
  mobile: boolean;
  desktop: boolean;
  roles: Array<"admin" | "user">;
  matchPaths?: string[];
}

export type MobileActiveKey = "dashboard" | "availability" | "requests" | "approvals" | "";

const allNavItems: AppNavItem[] = [
  {
    key: "home",
    label: "Dashboard",
    shortLabel: "Dashboard",
    to: "/",
    icon: Home,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "calendar",
    label: "Team Availability",
    shortLabel: "Availability",
    to: "/calendar",
    icon: CalendarDays,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
    matchPaths: ["/team-availability"],
  },
  {
    key: "requests-user",
    label: "Leave History",
    shortLabel: "History",
    to: "/leave-history",
    icon: FileText,
    mobile: true,
    desktop: false,
    roles: ["user"],
    matchPaths: ["/apply-leave"],
  },
  {
    key: "requests-admin",
    label: "Leave Approvals",
    shortLabel: "Approvals",
    to: "/approve-leave",
    icon: CheckCircle2,
    mobile: true,
    desktop: true,
    roles: ["admin"],
  },
  {
    key: "employees-admin",
    label: "Manage Employees",
    shortLabel: "Employees",
    to: "/manage-employees",
    icon: Users,
    mobile: true,
    desktop: true,
    roles: ["admin"],
    matchPaths: ["/team-leave-history"],
  },
  {
    key: "profile",
    label: "Profile",
    to: "/profile",
    icon: UserCircle2,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "apply",
    label: "Apply Leave",
    shortLabel: "Apply",
    to: "/apply-leave",
    icon: LayoutGrid,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "history",
    label: "Leave History",
    to: "/leave-history",
    icon: History,
    mobile: false,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "support",
    label: "Support",
    to: "/support",
    icon: LifeBuoy,
    mobile: false,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "employee-docs",
    label: "Documents",
    to: "/employee-document",
    icon: Archive,
    mobile: false,
    desktop: true,
    roles: ["user"],
  },
  {
    key: "my-reviews",
    label: "My Reviews",
    to: "/performance-review",
    icon: Sparkles,
    mobile: false,
    desktop: true,
    roles: ["user"],
  },
  {
    key: "admin-reviews",
    label: "Performance Reviews",
    to: "/performance-review-admin",
    icon: ClipboardCheck,
    mobile: false,
    desktop: true,
    roles: ["admin"],
    matchPaths: [
      "/performance-review-admin/submissions",
      "/performance-review/appraisal",
      "/performance-review-history",
    ],
  },
  {
    key: "admin-docs",
    label: "Document Library",
    to: "/admin-document",
    icon: Archive,
    mobile: false,
    desktop: true,
    roles: ["admin"],
  },
];

export const useNavigationItems = () => {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "admin" : "user";

  return useMemo(() => {
    return allNavItems.filter((item) => {
      if (!item.roles.includes(role)) {
        return false;
      }

      if (item.key === "employee-docs") {
        return features.employeeDocuments;
      }

      if (item.key === "admin-docs" || item.key === "admin-reviews") {
        return features.adminDocuments;
      }

      return true;
    });
  }, [role]);
};

export const useActiveNavigationKey = (items: AppNavItem[]) => {
  const location = useLocation();

  return useMemo(() => {
    const pathname = location.pathname;
    const exactMatch = items.find((item) => item.to === pathname);
    if (exactMatch) {
      return exactMatch.key;
    }

    const matchedByAlias = items.find((item) =>
      item.matchPaths?.some((path) => pathname.startsWith(path)),
    );
    if (matchedByAlias) {
      return matchedByAlias.key;
    }

    const partialMatch = items.find(
      (item) => item.to !== "/" && pathname.startsWith(item.to),
    );
    return partialMatch?.key ?? "home";
  }, [items, location.pathname]);
};

const AppNavigation = ({
  isMobileMenuOpen,
  onOpenMobileMenu,
  onCloseMobileMenu,
}: {
  isMobileMenuOpen: boolean;
  onOpenMobileMenu: () => void;
  onCloseMobileMenu: () => void;
}) => {
  const { user, logout } = useAuth();
  const items = useNavigationItems();
  const activeKey = useActiveNavigationKey(items);
  const role = user?.role === "admin" ? "admin" : "user";
  const bottomNavActiveKey: MobileActiveKey =
    activeKey === "home"
      ? "dashboard"
      : activeKey === "calendar"
        ? "availability"
        : activeKey === "requests-admin"
          ? "approvals"
          : activeKey === "requests-user" || activeKey === "apply" || activeKey === "history"
            ? "requests"
            : "";

  return (
    <>
      <DesktopSidebar
        items={items.filter((item) => item.desktop)}
        activeKey={activeKey}
      />
      <BottomNav
        role={role}
        activeKey={bottomNavActiveKey}
        isMenuOpen={isMobileMenuOpen}
        onOpenMenu={onOpenMobileMenu}
        onSignOut={logout}
      />
      <MobileMenuSheet user={user} isOpen={isMobileMenuOpen} role={role} onClose={onCloseMobileMenu} />
    </>
  );
};

export default AppNavigation;
