// import React, { useContext } from "react";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { Grid } from "@mui/material";
// import App from "../App";
// import Dashboard from "../pages/user/Dashboard";
// import ApplyForLeave from "../pages/user/applyforleave/ApplyForLeave";
// import Signin from "../pages/onboarding/signin/Signin";
// import Profile from "../pages/onboarding/profile/Profile";
// import ForgotPassword from "../pages/onboarding/forgotpassword/ForgotPassword";
// import ResetPassword from "../pages/onboarding/resetpassword/ResetPassword";
// import VerifyCode from "../pages/onboarding/verificationcode/VerifyCode";
// import Signup from "../pages/onboarding/signup/Signup";
// import SignOut from "../pages/onboarding/signout/SignOut";
// import Home from "../pages/admin/Home";
// import ManageLeave from "../pages/admin/ManageLeave/ManageLeave";
// import ActOnLeave from "../pages/admin/ActOnLeave/ActOnLeave";
// import ManageEmployees from "../pages/admin/manageEmployees/ManageEmployees";
// import Employee from "../pages/admin/manageEmployees/Employee";
// import AddEmployee from "../pages/admin/AdminAddEmployees/AddEmployee";
// import ViewLeave from "../pages/admin/ManageLeave/ViewLeave";
// import MyLeave from "../pages/user/myLeave/MyLeave";
// import ViewMyLeave from "../pages/user/myLeave/ViewMyLeave";
// import MyLeaveRequest from "../pages/user/myLeave/MyLeaveRequest";
// import { RouteGuard } from "./RouteGuard"; // Assuming RouteGuard handles authentication logic
// import { AuthContext } from "../context/AuthContext";
// import DashboardLayout from "../layout";

// export default function AppRoutes() {
//   const ctx = useContext(AuthContext);
//   const isAuthenticated = ctx.isAuthenticated;

//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="signin" element={<Signin />} />
//         <Route path="forgot-password" element={<ForgotPassword />} />
//         <Route path="reset-password" element={<ResetPassword />} />
//         <Route path="verify-account" element={<VerifyCode />} />
//         <Route path="signup" element={<Signup />} />
//         <Route path="signout" element={<SignOut />} />

//         {/* Private routes */}
//         <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
//           <Route path="/" element={<Navigate to="/dashboard" />} />
//           <Route path="/home" element={<RouteGuard><Home /></RouteGuard>} />
//           <Route path="manage-leave" element={<RouteGuard><ManageLeave /></RouteGuard>} />
//           <Route path="manage-employees" element={<RouteGuard><ManageEmployees /></RouteGuard>} />
//           <Route path="manage-employees/employee" element={<RouteGuard><Employee /></RouteGuard>} />
//           <Route path="add-employee" element={<RouteGuard><AddEmployee /></RouteGuard>} />
//           <Route path="manage-leave/act-on-leave" element={<RouteGuard><ActOnLeave /></RouteGuard>} />
//           <Route path="manage-leave/view-leave" element={<RouteGuard><ViewLeave /></RouteGuard>} />

//           {/* User pages */}
//           <Route path="/profile" element={<Profile />} />
//           <Route path="dashboard" element={<Dashboard />} />
//           <Route path="apply-for-leave" element={<ApplyForLeave />} />
//           <Route path="my-leave" element={<MyLeave />} />
//           <Route path="my-leave/view-leave" element={<ViewMyLeave />} />
//           <Route path="my-leave/my-leave-request" element={<MyLeaveRequest />} />
//         </Route>

//         {/* Fallback route */}
//         <Route path="*" element={<Navigate to="/signin" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// function PrivateRoute({ isAuthenticated }) {
//   if (!isAuthenticated) {
//     return <Navigate to="signin" replace />;
//   }

//   return (
//     <DashboardLayout>
//       <App />
//     </DashboardLayout>
//   );
// }
