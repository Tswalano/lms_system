import { Suspense, lazy } from "react";
import { Outlet, type RouteObject } from "react-router-dom";
import Signin from "../pages/auth/Signin";
import RequireUser from "../utils/requireUser";
import Dashboard from "../pages/user/Dashboard";
import DashboardLayout from "../layouts";
import ApplyLeave from "../pages/applyLeave";
import Unauthorized from "../pages/error/unauthorized";
import ManageEmployees from "../pages/manageEmployees";
import ManageLeaveRequests from "../pages/manageLeaveRequests";
import ConfigureLeaves from "../pages/configureLeaves";
import LeaveHistory from "../pages/leaveHistory";
import UserProfile from "../pages/userProfile";
import ForgotPassword from "../pages/auth/forgotPassword";
import ChangePassword from "../pages/auth/ChangePassword";
import LoadingPage from "../pages/loadingPage";

const Loadable =
  (Component: React.ComponentType<any>) => (props: JSX.IntrinsicAttributes) =>
  (
    <Suspense fallback={<LoadingPage />}>
      <Component {...props} />
    </Suspense>
  );

const UnauthorizePage = Loadable(
  lazy(() => Promise.resolve({ default: () => <Unauthorized /> }))
);
const ApplyForLeavePage = Loadable(
  lazy(() => Promise.resolve({ default: () => <ApplyLeave /> }))
);
const ManageEmployeesPage = Loadable(
  lazy(() => Promise.resolve({ default: () => <ManageEmployees /> }))
);
const ManageLeaveRequestsPage = Loadable(
  lazy(() => Promise.resolve({ default: () => <ManageLeaveRequests /> }))
);
const ConfigureLeavesPage = Loadable(
  lazy(() => Promise.resolve({ default: () => <ConfigureLeaves /> }))
);
const LeaveHistoryPage = Loadable(
  lazy(() => Promise.resolve({ default: () => <LeaveHistory /> }))
);
const UserProfilePage = Loadable(
  lazy(() => Promise.resolve({ default: () => <UserProfile /> }))
);

const authRoutes: RouteObject = {
  path: "*",
  children: [
    {
      path: "signin",
      element: <Signin />,
    },
    {
      path: "new-password",
      element: <ChangePassword />,
    },
    {
      path: "forgot-password",
      element: <ForgotPassword />,
    },
    // TODO : Additional auth routes
  ],
};

const normalRoutes: RouteObject = {
  path: "*",
  element: (
    <DashboardLayout>
      <Suspense>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  ),
  children: [
    {
      path: "/*",
      element: <RequireUser allowedRoles={["user", "admin"]} />,
      children: [
        {
          path: "",
          element: <Dashboard />,
        },
      ],
    },
    {
      path: "apply-leave",
      element: <RequireUser allowedRoles={["user", "admin"]} />,
      children: [
        {
          path: "",
          element: <ApplyForLeavePage />,
        },
      ],
    },
    {
      path: "manage-employees",
      element: <RequireUser allowedRoles={["user", "admin"]} />,
      children: [
        {
          path: "",
          element: <ManageEmployeesPage />,
        },
      ],
    },
    {
      path: "configure-leaves",
      element: <RequireUser allowedRoles={["admin"]} />,
      children: [
        {
          path: "",
          element: <ConfigureLeavesPage />,
        },
      ],
    },
    {
      path: "manage-requests",
      element: <RequireUser allowedRoles={["admin"]} />,
      children: [
        {
          path: "",
          element: <ManageLeaveRequestsPage />,
        },
      ],
    },
    {
      path: "leave-history",
      element: <RequireUser allowedRoles={["user", "admin"]} />,
      children: [
        {
          path: "",
          element: <LeaveHistoryPage />,
        },
      ],
    },
    {
      path: "view-profile",
      element: <RequireUser allowedRoles={["user", "admin"]} />,
      children: [
        {
          path: "",
          element: <UserProfilePage />,
        },
      ],
    },
    {
      path: "unauthorized",
      element: <UnauthorizePage />,
    },
  ],
};

const routes: RouteObject[] = [authRoutes, normalRoutes];

export default routes;
