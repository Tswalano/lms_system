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
import { useLocation, useNavigate } from "react-router-dom";
import features from "@/config/features";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "./BottomNav";
import MobileMenuSheet from "./MobileMenuSheet";

export interface AppNavItem {
  key: string;
  label: string;
  description?: string;
  shortLabel?: string;
  to: string;
  icon: LucideIcon;
  mobile: boolean;
  desktop: boolean;
  roles: Array<"admin" | "user">;
  matchPaths?: string[];
}

export type MobileActiveKey = "dashboard" | "availability" | "history" | "approvals" | "";

const allNavItems: AppNavItem[] = [
  {
    key: "home",
    label: "Dashboard",
    description: "Overview, balances, and calendar",
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
    description: "View team schedules and calendar",
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
    description: "Review past and current leave requests",
    shortLabel: "History",
    to: "/leave-history",
    icon: FileText,
    mobile: false,
    desktop: false,
    roles: ["user"],
    matchPaths: ["/apply-leave"],
  },
  {
    key: "requests-admin",
    label: "Leave Approvals",
    description: "Review and approve leave requests",
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
    description: "Admin employee and team management",
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
    description: "Your account and personal details",
    to: "/profile",
    icon: UserCircle2,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "apply",
    label: "Apply Leave",
    description: "Create a new leave request",
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
    description: "Review past and current leave requests",
    to: "/leave-history",
    icon: History,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "support",
    label: "Support",
    description: "Help, contacts, and support resources",
    to: "/support",
    icon: LifeBuoy,
    mobile: true,
    desktop: true,
    roles: ["admin", "user"],
  },
  {
    key: "employee-docs",
    label: "Documents",
    description: "Access employee documents",
    to: "/employee-document",
    icon: Archive,
    mobile: true,
    desktop: true,
    roles: ["user"],
  },
  {
    key: "my-reviews",
    label: "My Reviews",
    description: "View and complete your reviews",
    to: "/performance-review",
    icon: Sparkles,
    mobile: true,
    desktop: true,
    roles: ["user"],
  },
  {
    key: "admin-reviews",
    label: "Performance Reviews",
    description: "Manage employee review cycles",
    to: "/performance-review-admin",
    icon: ClipboardCheck,
    mobile: true,
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
    description: "Manage company documents",
    to: "/admin-document",
    icon: Archive,
    mobile: true,
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

const MOBILE_MENU_ORDER = [
  "profile",
  "history",
  "calendar",
  "support",
  "employee-docs",
  "my-reviews",
  "employees-admin",
  "requests-admin",
  "admin-reviews",
  "admin-docs",
] as const;

export const getMobileMenuItems = (items: AppNavItem[]) => {
  const mobileItems = items.filter(
    (item) => item.mobile && item.key !== "home" && item.key !== "apply" && item.key !== "requests-user",
  );

  return [...mobileItems].sort((left, right) => {
    const leftIndex = MOBILE_MENU_ORDER.indexOf(left.key as (typeof MOBILE_MENU_ORDER)[number]);
    const rightIndex = MOBILE_MENU_ORDER.indexOf(right.key as (typeof MOBILE_MENU_ORDER)[number]);
    const normalizedLeft = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const normalizedRight = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return normalizedLeft - normalizedRight;
  });
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
  const navigate = useNavigate();
  const items = useNavigationItems();
  const applyItem = items.find((item) => item.key === "apply");
  const mobileMenuItems = getMobileMenuItems(items);
  const activeKey = useActiveNavigationKey(items);
  const role = user?.role === "admin" ? "admin" : "user";
  const bottomNavActiveKey: MobileActiveKey =
    activeKey === "home"
      ? "dashboard"
      : activeKey === "calendar"
        ? "availability"
        : activeKey === "requests-admin"
          ? "approvals"
          : activeKey === "requests-user"
            ? "history"
            : "";

  const handleSignOut = async () => {
    await logout();
    onCloseMobileMenu();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <BottomNav
        role={role}
        activeKey={bottomNavActiveKey}
        isMenuOpen={isMobileMenuOpen}
        onOpenMenu={onOpenMobileMenu}
        onSignOut={handleSignOut}
      />
      <MobileMenuSheet
        user={user}
        isOpen={isMobileMenuOpen}
        role={role}
        applyItem={applyItem}
        items={mobileMenuItems}
        onClose={onCloseMobileMenu}
      />
    </>
  );
};

export default AppNavigation;
