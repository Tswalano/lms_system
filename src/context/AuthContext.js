import React, { createContext, useState, useEffect } from "react";
import jwtDecode from "jwt-decode";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Paragraph from "../components/ui/Paragraph";
import LoginIcon from "@mui/icons-material/Login";
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

  const [open, setOpen] = useState(false);

  // Function to handle user sign in and set token and role
  const logIn = (userToken, userRole) => {
    setToken(userToken);
    setIsAuthenticated(userToken);
    setIsAdmin(userRole);
    localStorage.setItem("token", userToken);
    localStorage.setItem("role", userRole);
  };
  const handleSessionModal = () => {
    signOut();
    window.location.reload();
  };

  const isTokenExpired = (tokenExp) => {
    const decode = jwtDecode(tokenExp);
    const expTime = decode.exp * 1000;
    const currentTime = Date.now();
    return expTime <= currentTime;
  };

  const checkExpiration = () => {
    if (token && isTokenExpired(token)) {
      setOpen(true);
    }
  };

  useEffect(() => {
    if (token) {
      const interval = setInterval(() => {
        checkExpiration();
      }, 1000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [token, open, checkExpiration]);

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
    setOpen(false);
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
      <Dialog open={open} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Session Expired
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box sx={{ textAlign: "center" }}>
            <ExitToAppIcon
              sx={{
                color: "#ef6266",
                height: "100px",
                width: "100px",
              }}
            />
            <Paragraph
              text={
                "Oops! Your session has expired. Please log back in to continue."
              }
              fontWeight={"bold"}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button
            variant="contained"
            onClick={handleSessionModal}
            endIcon={<LoginIcon />}
          >
            GO TO LOGIN
          </Button>
        </DialogActions>
      </Dialog>
    </AuthContext.Provider>
  );
};
