import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import { styled } from "@mui/system";
import EmailInput from "../ui/EmailInputField";
import PasswordInput from "../ui/PasswordInputField";
import SubmitButton from "../ui/Button";
import Logo from "../ui/Logo";
import Link from "@mui/material/Link";
import Heading from "../ui/Heading";

// Styling for the vertically and horizontally centered container
const CenteredBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
}));

// Create a padding for the root element in the index page, this padding will only be applied when this page is rendered
const useStyles = styled((theme) => ({
  root: {
    padding: "20px",
  },
}));

const Signin = () => {
  // create the classes object of the style above
  const classes = useStyles();

  // set state for the email input and error messages
  const [email, setEmail] = useState("");
  const [isEmailError, setIsEmailError] = useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  // set state for the password input and error messages
  const [password, setPassword] = useState("");
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  const handleEmailChange = (value) => {
    setEmail(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
  };

  // handle the onclick event for the login button
  const handleLogin = (event) => {
    event.preventDefault();

    // reg ex (patterns / formats) for email, phone and password
    const emailRegex = /^[a-zA-Z0-9._%+-]+@disraptor\.co\.za$/;
    const passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

    if (emailRegex.test(email) && passwordRegex.test(password)) {
      alert("Passed");
      // continue integrating
    }
  };

  return (
    <>
      {/* create a container box to be vertically and horizontally centered on the center of the screen */}
      <CenteredBox className={classes.root}>
        {/* Grid to create a responsive container for input fields */}
        <Grid container justifyContent="center" alignItems="center" p={3}>
          <Grid item xs={12} sm={7} md={7} lg={4} xl={4}>
            {/* company logo (outside the shadowed box) */}
            <Box
              sx={{
                width: "45%",
                marginLeft: "auto",
                marginRight: "auto",
                paddingBottom: "20px",
              }}
            >
              <Logo />
            </Box>
            <Paper
              elevation={2}
              sx={{
                padding: (theme) => theme.spacing(2),
                width: "100%",
                p: "30px",
              }}
            >
              {/* Heading text */}
              <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
                <Heading text="Sign in to your account" />
              </Box>
              {/* Reusable email input field */}
              <EmailInput
                id="email"
                placeHolder="Enter your login email address"
                value={email}
                onChange={handleEmailChange}
                isError={isEmailError}
                errorMessage={emailErrorMessage}
              />
              {/* Reusable password input field */}
              <PasswordInput
                id="password"
                label="Password"
                placeHolder="Enter your login password"
                value={password}
                onChange={handlePasswordChange}
                isError={isPasswordError}
                errorMessage={passwordErrorMessage}
              />
              {/* Reusable submit button */}
              <SubmitButton
                id="loginButton"
                label="Sign in"
                onClick={handleLogin}
              />
              {/* forgort password link */}
              <Box sx={{ marginTop: "20px" }}>
                <Link href="./ForgotPassword.js" underline="none">
                  Forgot your password?
                </Link>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </CenteredBox>
    </>
  );
};

export default Signin;
