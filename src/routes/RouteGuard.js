import { AuthContext } from "../context/AuthContext";
import React, { useContext } from "react";

export const RouteGuard = ({ children }) => {
  const ctx = useContext(AuthContext);

  if (ctx.isAdmin === true) {
    return children;
  }

  return (
    <AuthContext.Provider>
      {/* Render a fallback UI or redirect the user to a different route */}
      <div>Access denied for non-admin users.</div>
    </AuthContext.Provider>
  );
};

export const UserRouteGuard = ({ children }) => {
  const ctx = useContext(AuthContext);

  if (ctx.isAdmin === false) {
    return children;
  }

  return (
    <AuthContext.Provider>
      {/* Render a fallback UI or redirect the user to a different route */}
      <div>Access denied for non-employee users.</div>
    </AuthContext.Provider>
  );
};
