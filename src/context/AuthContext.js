import React, { createContext, useState } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState("");

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(false);

  // state to store the user auth status
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Function to handle user sign in and set token and role
  const logIn = (userToken, userRole) => {
    setToken(userToken);
    setIsAuthenticated(userToken !== "" && userToken !== null);
    if (userRole === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  // Function to handle user sign out
  const signOut = () => {
    setToken(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  // Value object to be provided to consuming components
  const authContextValue = {
    token,
    isAuthenticated,
    isAdmin,
    logIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
