import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/admin/Home";
import ManageEmployee from "../pages/admin/ManageEmployees";
import ManageLeave from "../pages/admin/ManageLeave";
import ActOnLeave from "../pages/admin/ActOnLeave";
import AddEmployee from "../pages/admin/AddEmployee";
import App from "../App";
import Signin from "../pages/Signin";
import { Grid } from "@mui/material";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="signin" element={<Signin />} />
        <Route path="/" element={<PrivateRoute />}>
          <Route path="home" element={<Home />} />
          <Route path="manage-employees" element={<ManageEmployee />} />
          <Route path="manage-leave" element={<ManageLeave />} />
          <Route path="manage-leave/act-on-leave" element={<ActOnLeave />} />
          <Route
            path="manage-employees/add-employee"
            element={<AddEmployee />}
          />
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
