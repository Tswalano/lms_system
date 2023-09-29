import React, { createContext, useState, useEffect } from "react";

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
  // State to store the user token
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [email, setEmail] = useState(localStorage.getItem("email"));
  const [password, setPassword] = useState(localStorage.getItem("pass"));

  // State to store the user role
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem("role"));

  // state to store the user auth status
  const [isAuthenticated, setIsAuthenticated] = useState(
    token !== "" && token !== null ? true : false
  );

  const [isVerified, setVerification] = useState();

  // Function to handle user sign in and set token and role
  const logIn = (userToken, userRole) => {
    setToken(userToken);
    setIsAuthenticated(userToken);
    setIsAdmin(userRole);
    localStorage.setItem("token", userToken);
    localStorage.setItem("role", userRole);
  };

  // useEffect(() => {
  //   window.addEventListener("beforeunload", signOut);
  // });

  /*useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const email = localStorage.getItem("email");
    const password = localStorage.getItem("pass");

    setToken(token);
    setIsAdmin(role);
    setIsAuthenticated(token !== "" && token !== null);
    setEmail(email);
    setPassword(password);
  }, [token]);*/

  const signup = (verified) => {
    setVerification(verified);
  };

  const userEmail = (emailID) => {
    setEmail(emailID);
    localStorage.setItem("email", emailID);
  };

  const userPassword = (password) => {
    setPassword(password);
    localStorage.setItem("pass", password);
  };

  const removeLoginInfo = () => {
    setEmail(null);
    setPassword(null);
    localStorage.setItem("email", null);
    localStorage.setItem("pass", password);
  };

  // Function to handle user sign out
  const signOut = () => {
    setToken(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.clear();
  };

  // Value object to be provided to consuming components
  const authContextValue = {
    token,
    email,
    isAuthenticated,
    isAdmin,
    password,
    isVerified,
    logIn,
    signup,
    userEmail,
    userPassword,
    signOut,
    removeLoginInfo,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
