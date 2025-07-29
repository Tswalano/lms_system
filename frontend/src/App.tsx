import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import TeamAvailability from "./pages/TeamAvailability";
import ApplyLeave from "./pages/ApplyLeave";
import LeaveHistory from "./pages/LeaveHistory";
import ApproveLeave from "./pages/ApproveLeave";
import ManageEmployees from "./pages/ManageEmployees";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import type { ReactNode } from "react";
import ChangePassword from "./pages/ChangePassword";
import TeamListLeaveHistory from "./pages/TeamLeaveHistory";
import UserProfile from "./pages/UserProfile";
import PermissionDenied from "./pages/PermissionDenied";
import DashboardLayout from "./components/DashboardLayout";
import ProjectManagement from "./pages/ProjectManagement";
import PerformanceReview from "./pages/PerformanceRiview";
import AdminDocumentsPage from "./pages/AdminDocumentsPage";
import EmployeeDocumentsPage from "./pages/EmployeeDocumentsPage";

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

  // Role-based access control
  if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role as 'admin' | 'user'))) {
    return <Navigate to="/permission-denied" replace />;
  }

  return (
    <DashboardLayout>{children}</DashboardLayout>
  )
};

// Public Route Component (redirects to dashboard if already authenticated)
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
              <Route path="/project-management" element={
                <ProtectedRoute>
                  <ProjectManagement />
                </ProtectedRoute>
              } />
              <Route path="/performance-review" element={
                <ProtectedRoute>
                  <PerformanceReview />
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