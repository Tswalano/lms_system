import React, { useState } from "react";
import { styled } from "@mui/system";
import { Grid, Paper, Box, FormHelperText } from "@mui/material";
import EmailInput from "../ui/EmailInputField";
import SubmitButton from "../ui/Button";
import Logo from "../ui/Logo";
import Heading from "../ui/Heading";
import Paragraph from "../ui/Paragraph";
import PasswordInput from "../ui/PasswordInputField";
import TextInput from "../ui/TextInputField";

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

// get the email from the storage session
const email = sessionStorage.getItem("email");
var errorMessage = "";

function ResetPassword() {
  // create the classes object of the style above
  const classes = useStyles();

  // set state for the code and passwords inputs
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value !== confirmPassword) {
      errorMessage = "Passwords don't match!";
    } else {
      errorMessage = "";
    }
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    if (value !== password) {
      errorMessage = "Passwords don't match!";
    } else {
      errorMessage = "";
    }
  };

  // handle the onclick event for the login button
  const handleResetPassword = (event) => {
    event.preventDefault();

    // grab OTP code
    var code = document.getElementById("code").value;

    // reg ex (patterns / formats) for email, phone and password
    const passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

    if (
      code !== "" &&
      passwordRegex.test(password) &&
      password === confirmPassword
    ) {
      // delete the session storage
      sessionStorage.removeItem("email");
      alert("Passed");
      // continue integrating
    }
  };

  return (
    <>
      {/* create a container box to be vertically and horizontally centered on the center of the screen */}
      <CenteredBox>
        {/* Grid to create a responsive container for input fields */}
        <Grid container justifyContent="center" alignItems="center" p={3}>
          <Grid item xs={12} sm={12} md={7} lg={4} xl={4}>
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
              <Box sx={{ textAlign: "center" }}>
                <Heading text="Reset your password?" />
              </Box>
              {/* Heading text */}
              <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
                <Paragraph
                  text={
                    "We have sent a password reset code by email to " +
                    email +
                    " Enter it below to reset your password."
                  }
                />
              </Box>

              <TextInput
                id="code"
                label="Code"
                placeHolder="Enter verification code"
                //value={code}
              />

              {/* Reusable password input field */}
              <PasswordInput
                id="newpassword"
                label="New Password"
                placeHolder="Enter your new password"
                value={password}
                onChange={handlePasswordChange}
              />

              {/* Reusable password input field */}
              <PasswordInput
                id="confirmpassword"
                label="Confirm Password"
                placeHolder="Enter new password again"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
              <FormHelperText
                id="helper-text"
                sx={{ color: "red", marginY: "0", marginX: "10px" }}
              >
                {errorMessage}
              </FormHelperText>

              {/* Reusable submit button */}
              <SubmitButton
                id="sendEmail"
                label="Reset password"
                onClick={handleResetPassword}
              />
            </Paper>
          </Grid>
        </Grid>
      </CenteredBox>
    </>
  );
}

export default ResetPassword;
