import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/admin/Home";
import ManageLeave from "../pages/admin/ManageLeave";
import ActOnLeave from "../pages/admin/ActOnLeave";
import AddEmployee from "../pages/admin/AddEmployee";
import App from "../App";
import { Grid } from "@mui/material";
import Dashboard from "../pages/user/Dashboard";
import ApplyForLeave from "../pages/user/ApplyForLeave";
import Signin from "../pages/onboarding/signin/Signin";
import Profile from "../pages/onboarding/profile/Profile";
import ForgotPassword from "../pages/onboarding/forgotpassword/ForgotPassword";
import ResetPassword from "../pages/onboarding/resetpassword/ResetPassword";
import VerifyCode from "../pages/onboarding/verificationcode/VerifyCode";
import Signup from "../pages/onboarding/signup/Signup";
import ManageEmployees from "../pages/admin/manageEmployees/ManageEmployees";
import Employee from "../pages/admin/manageEmployees/Employee";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="signin" element={<Signin />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-account" element={<VerifyCode />} />
        <Route path="signup" element={<Signup />} />
        <Route path="/" element={<PrivateRoute />}>
          <Route path="home" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manage-employees" element={<ManageEmployees />} />
          <Route path="employee" element={<Employee />} />
          <Route path="manage-leave" element={<ManageLeave />} />
          <Route path="manage-leave/act-on-leave" element={<ActOnLeave />} />
          <Route
            path="manage-employees/add-employee"
            element={<AddEmployee />}
          />
          <Route path="apply-for-leave" element={<ApplyForLeave />} />
        </Route>
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PrivateRoute() {
  const isAuthenticated = true;

  if (!isAuthenticated) {
    return <Navigate to="signin" replace />;
  }

  return (
    <Grid container>
      <App />
    </Grid>
  );
}
