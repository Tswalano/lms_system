import React, { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [token, setToken] = useState("");

  return (
    <AuthContext.Provider value={{ loggedIn, setLoggedIn, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
};
