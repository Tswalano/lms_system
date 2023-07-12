import React, { createContext, useState } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState("");

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(false);

  // Function to handle user sign in and set token and role
  const logIn = (userToken, userRole) => {
    setToken(userToken);

    setIsAdmin(userRole === userRole);
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
    logIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
