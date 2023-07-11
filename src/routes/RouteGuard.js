import { AuthContext } from "../context/AuthContext";
import React, { useContext, useEffect } from "react";

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
