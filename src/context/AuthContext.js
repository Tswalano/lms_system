import React, { createContext, useState } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState(null);

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to handle user sign in and set token and role
  const signIn = (userToken, userRole) => {
    setToken(userToken);
    setIsAdmin(userRole === "admin");
  };

  // Function to handle user sign out
  const signOut = () => {
    setToken(null);
    setIsAdmin(false);
  };

  // Value object to be provided to consuming components
  const authContextValue = {
    token,
    isAdmin,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
