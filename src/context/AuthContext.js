import React, { createContext, useState } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState("");

  const [email, setEmail] = useState("");

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(true);

  // Function to handle user sign in and set token and role
  const logIn = (userToken, userRole) => {
    setToken(userToken);
    if (userRole === "admin") {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const userEmail = (emailID) => {
    setEmail(emailID);
  };

  // Function to handle user sign out
  const signOut = () => {
    setToken(null);
    setIsAdmin(false);
  };

  // Value object to be provided to consuming components
  const authContextValue = {
    token,
    email,
    isAdmin,
    logIn,
    userEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
