import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import TeamAvailability from "./pages/TeamAvailabilityPage";
import ApplyLeave from "./pages/ApplyLeavePage";
import LeaveHistory from "./pages/LeaveHistoryPage";
import ApproveLeave from "./pages/ApproveLeavePage";
import ProcessedLeaveRequestsPage from "./pages/ProcessedLeaveRequestsPage";
import ManageEmployees from "./pages/ManageEmployeesPage";
import Login from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPasswordPage";
import NotFound from "./components/NotFound";
import type { ReactNode } from "react";
import ChangePassword from "./pages/ChangePasswordPage";
import TeamListLeaveHistory from "./pages/TeamLeaveHistoryPage";
import UserProfile from "./pages/UserProfilePage";
import PermissionDenied from "./components/PermissionDenied";
import AdminDocumentsPage from "./pages/AdminDocumentsPage";
import EmployeeDocumentsPage from "./pages/EmployeeDocumentsPage";
import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";
// Import Performance Review Components
import PerformanceReviewAdminPage from "./pages/PerformanceReviewAdminPage";
import PerformanceReviewEmployeePage from "./pages/PerformanceReviewEmployeePage";
import PerformanceReviewPeerPage from "./pages/PerformanceReviewPeerPage";
import PerformanceReviewSubmissionsPage from "./pages/PerformanceReviewSubmissionsPage";
import PerformanceReviewManagerAppraisalPage from "./pages/PerformanceReviewManagerAppraisalPage";
import PerformanceReviewHistoryPage from "./pages/PerformanceReviewHistoryPage";
// end of Performance Review imports
import NotificationCenterPage from "./pages/NotificationCenterPage";
import SupportPage from "./pages/SupportPage";
import features from "./config/features";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import BackendDownPage from "./pages/BackendDownPage";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

interface RouteProps {
  children: ReactNode;
}

interface ProtectedRouteProps extends RouteProps {
  allowedRoles?: Array<'admin' | 'user'>;
}

const RouteLoadingScreen = ({ authSurface = false }: { authSurface?: boolean }) => (
  <div
    className={
      authSurface
        ? "relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#0f172a_0%,#111827_46%,#0b1220_100%)] text-slate-100"
        : "flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_28%),linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(236,253,245,1)_40%,rgba(236,254,255,1)_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_46%,#0b1220_100%)] dark:text-slate-100"
    }
  >
    {authSurface ? (
      <>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.14),_transparent_24%)]" />
        <div className="absolute -top-8 left-0 h-40 w-40 rounded-full bg-green-800/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-44 w-44 rounded-full bg-cyan-800/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-36 w-36 rounded-full bg-emerald-800/20 blur-3xl" />
      </>
    ) : null}

    <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
      <p className={`mt-4 text-sm ${authSurface ? "text-slate-300" : "text-slate-600 dark:text-slate-300"}`}>
        Loading, fetching your profile...
      </p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role as 'admin' | 'user'))) {
    return <Navigate to="/permission-denied" replace />;
  }

  return (
    <AppLayout>{children}</AppLayout>
  )
};

// Public Route Component
const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoadingScreen authSurface />;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const PublicAuthLayout = () => (
  <PublicRoute>
    <AuthLayout />
  </PublicRoute>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/team-availability" element={
                <ProtectedRoute>
                  <TeamAvailability />
                </ProtectedRoute>
              } />
              <Route path="/calendar" element={
                <ProtectedRoute>
                  <TeamAvailability />
                </ProtectedRoute>
              } />
              <Route path="/apply-leave" element={
                <ProtectedRoute>
                  <ApplyLeave />
                </ProtectedRoute>
              } />
              <Route path="/leave-history" element={
                <ProtectedRoute>
                  <LeaveHistory />
                </ProtectedRoute>
              } />
              <Route path="/support" element={
                <ProtectedRoute>
                  <SupportPage />
                </ProtectedRoute>
              } />
              <Route path="/terms-of-service" element={
                <ProtectedRoute>
                  <TermsOfServicePage />
                </ProtectedRoute>
              } />

              {/* Performance Review Routes */}
              <Route path="/performance-review" element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <PerformanceReviewEmployeePage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review/peer/:assignmentId" element={
                <ProtectedRoute allowedRoles={['user', 'admin']}>
                  <PerformanceReviewPeerPage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review-admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PerformanceReviewAdminPage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review-admin/submissions/:employeeId" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PerformanceReviewSubmissionsPage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review/appraisal/:reviewId" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PerformanceReviewManagerAppraisalPage />
                </ProtectedRoute>
              } />
              <Route path="/performance-review-history" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <PerformanceReviewHistoryPage />
                </ProtectedRoute>
              } />
              {/* End of Performance Review Routes */}

              {/* Notification Center */}
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationCenterPage />
                </ProtectedRoute>
              } />

              {features.employeeDocuments && (
                <Route path="/employee-document" element={
                  <ProtectedRoute>
                    <EmployeeDocumentsPage />
                  </ProtectedRoute>
                } />
              )}
              {features.adminDocuments && (
                <Route path="/admin-document" element={
                  <ProtectedRoute>
                    <AdminDocumentsPage />
                  </ProtectedRoute>
                } />
              )}
              <Route path="/approve-leave" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApproveLeave />
                </ProtectedRoute>
              } />
              <Route path="/approve-leave/processed" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ProcessedLeaveRequestsPage />
                </ProtectedRoute>
              } />
              <Route path="/manage-employees" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageEmployees />
                </ProtectedRoute>
              } />
              <Route path="/team-leave-history" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <TeamListLeaveHistory />
                </ProtectedRoute>
              } />

              {/* Public Routes */}
              <Route element={<PublicAuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              <Route path="/change-password" element={
                <PublicRoute>
                  <ChangePassword />
                </PublicRoute>
              } />

              {/* Status Route */}
              <Route path="/status" element={<BackendDownPage />} />

              {/* Lnding Route */}
              <Route path="/welcome" element={<LandingPage />} />

              {/* Permission Denied Route */}
              <Route path="/permission-denied" element={<PermissionDenied />} />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
