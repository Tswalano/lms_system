import React, { createContext, useState } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(true);

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

  const userEmail = (emailID) => {
    setEmail(emailID);
  };

  const userPassword = (password) => {
    setPassword(password);
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
    email,
    isAuthenticated,
    isAdmin,
    password,
    logIn,
    userEmail,
    userPassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
