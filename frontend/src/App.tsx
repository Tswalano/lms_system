import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import TeamAvailability from "./pages/TeamAvailabilityPage";
import ApplyLeave from "./pages/ApplyLeavePage";
import LeaveHistory from "./pages/LeaveHistoryPage";
import ApproveLeave from "./pages/ApproveLeavePage";
import ManageEmployees from "./pages/ManageEmployeesPage";
import Login from "./pages/LoginPage";
import ForgotPassword from "./pages/ForgotPasswordPage";
import NotFound from "./components/NotFound";
import type { ReactNode } from "react";
import ChangePassword from "./pages/ChangePasswordPage";
import TeamListLeaveHistory from "./pages/TeamLeaveHistoryPage";
import UserProfile from "./pages/UserProfilePage";
import PermissionDenied from "./components/PermissionDenied";
import DashboardLayout from "./components/DashboardLayout";
import AdminDocumentsPage from "./pages/AdminDocumentsPage";
import EmployeeDocumentsPage from "./pages/EmployeeDocumentsPage";
// Import Performance Review Components
import DashboardPage from "./pages/performance-review/pages/DashboardPage";
import RequestReviewPage from "./pages/performance-review/pages/RequestReviewPage";
import SelfReviewPage from "./pages/performance-review/pages/SelfReviewPage";
import ReviewRequestsPage from "./pages/performance-review/pages/ReviewRequestsPage";
import PendingReviewsPage from "./pages/performance-review/pages/PendingReviewsPage";
import ConductReviewPage from "./pages/performance-review/pages/ConductReviewPage";
import AdminApp from "./pages/performance-review/pages/AdminApp";
import NotificationCenterPage from "./pages/NotificationCenterPage";
import SupportPage from "./pages/SupportPage";
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

// Protected Route Component
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-center mt-4 text-gray-600 dark:text-gray-300">
          Loading, fetching your profile...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role as 'admin' | 'user'))) {
    return <Navigate to="/permission-denied" replace />;
  }

  return (
    <DashboardLayout>{children}</DashboardLayout>
  )
};

// Public Route Component
const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

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
                  <Index />
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
              <Route path="/performance" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/request-review" element={
                <ProtectedRoute>
                  <RequestReviewPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/self-review" element={
                <ProtectedRoute>
                  <SelfReviewPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/review-requests" element={
                <ProtectedRoute>
                  <ReviewRequestsPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/pending-reviews" element={
                <ProtectedRoute>
                  <PendingReviewsPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/conduct-review/:requestId" element={
                <ProtectedRoute>
                  <ConductReviewPage />
                </ProtectedRoute>
              } />
              <Route path="/performance/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminApp />
                </ProtectedRoute>
              } />
              {/* End of Performance Review Routes */}

              {/* Notification Center */}
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationCenterPage />
                </ProtectedRoute>
              } />

              <Route path="/employee-document" element={
                <ProtectedRoute>
                  <EmployeeDocumentsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin-document" element={
                <ProtectedRoute>
                  <AdminDocumentsPage />
                </ProtectedRoute>
              } />
              <Route path="/approve-leave" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ApproveLeave />
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
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
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