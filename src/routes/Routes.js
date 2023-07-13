import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/admin/Home";
import ManageLeave from "../pages/admin/ManageLeave/ManageLeave";
import ActOnLeave from "../pages/admin/ActOnLeave/ActOnLeave";
import App from "../App";
import { Grid } from "@mui/material";
import Dashboard from "../pages/user/Dashboard";
import ApplyForLeave from "../pages/user/applyforleave/ApplyForLeave";
import Signin from "../pages/onboarding/signin/Signin";
import Profile from "../pages/onboarding/profile/Profile";
import ForgotPassword from "../pages/onboarding/forgotpassword/ForgotPassword";
import ResetPassword from "../pages/onboarding/resetpassword/ResetPassword";
import VerifyCode from "../pages/onboarding/verificationcode/VerifyCode";
import Signup from "../pages/onboarding/signup/Signup";
import ManageEmployees from "../pages/admin/manageEmployees/ManageEmployees";
import Employee from "../pages/admin/manageEmployees/Employee";
import AddEmployee from "../pages/admin/AdminAddEmployees/AddEmployee";
import { RouteGuard, UserRouteGuard } from "./RouteGuard";
// import { RouteGuard } from "./RouteGuard";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="signin" element={<Signin />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-account" element={<VerifyCode />} />
        <Route path="signup" element={<Signup />} />
        {/* Private routes */}
        <Route path="/" element={<PrivateRoute />}>
          <Route
            path="home"
            element={
              <RouteGuard>
                <Home />
              </RouteGuard>
            }
          />
          <Route
            path="manage-leave"
            element={
              <RouteGuard>
                <ManageLeave />
              </RouteGuard>
            }
          />
          <Route
            path="manage-employees"
            element={
              <RouteGuard>
                <ManageEmployees />
              </RouteGuard>
            }
          />
          <Route
            path="manage-employees/employee"
            element={
              <RouteGuard>
                <Employee />
              </RouteGuard>
            }
          />
          <Route
            path="add-employee"
            element={
              <RouteGuard>
                <AddEmployee />
              </RouteGuard>
            }
          />
          <Route
            path="manage-leave/act-on-leave"
            element={
              <RouteGuard>
                <ActOnLeave />
              </RouteGuard>
            }
          />
          {/* user pages */}
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="apply-for-leave" element={<ApplyForLeave />} />
        </Route>
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PrivateRoute() {
  const ctx = useContext(AuthContext);
  const isAuthenticated = ctx.isAuthenticated;

  if (!isAuthenticated) {
    return <Navigate to="signin" replace />;
  }

  return (
    <Grid container>
      <App />
    </Grid>
  );
}
