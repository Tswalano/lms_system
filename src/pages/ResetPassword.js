import React, { useState } from "react";
import { styled } from "@mui/system";
import { Grid, Paper, Box } from "@mui/material";
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
  paddingLeft: "20px",
  paddingRight: "20px",
}));

// get the email from the storage session
const email = sessionStorage.getItem("email");

function ResetPassword() {
  // set state for the code and passwords inputs and error messages
  const [password, setPassword] = useState("");
  const [isPasswordError, setIsPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");
  const [isConfirmPasswordError, setIsConfirmPasswordError] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] =
    useState("");

  const [code, setCode] = useState("");
  const [isCodeError, setIsCodeError] = useState(false);
  const [codeErrorMessage, setCodeErrorMessage] = useState("");

  // reg ex (patterns / formats) for  otp code
  const codePattern = /^[0-9]+$/;

  // OTP code input field
  const handleOTPCode = (value) => {
    setCode(value);
    // handle OTP code input field errors
    setIsCodeError(false);
    setCodeErrorMessage("");

    if (value === "") {
      setIsCodeError(true);
      setCodeErrorMessage("OTP Code cannot be empty");
    } else if (!codePattern.test(code)) {
      setIsCodeError(true);
      setCodeErrorMessage("OTP Code cannot may only contain numbers");
    } else {
      setIsCodeError(false);
      setCodeErrorMessage("");
    }
  };

  // password input field change
  const handlePasswordChange = (value) => {
    setPassword(value);

    if (value !== confirmPassword) {
      setIsConfirmPasswordError(true);
      setConfirmPasswordErrorMessage("Passwords don't match!");
    } else {
      setIsConfirmPasswordError(false);
      setConfirmPasswordErrorMessage("");
    }
  };

  // confirm password input field change
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    setIsConfirmPasswordError(false);
    setConfirmPasswordErrorMessage("");

    if (value !== password) {
      setIsConfirmPasswordError(true);
      setConfirmPasswordErrorMessage("Passwords don't match!");
    }
  };

  // handle the submit button onclick event for the reset password button
  const handleResetPassword = (event) => {
    event.preventDefault();

    // reg ex (patterns / formats) for  password
    const passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,15}$/;

    if (
      codePattern.test(code) &&
      passwordRegex.test(password) &&
      password === confirmPassword
    ) {
      // set code error to false
      setIsCodeError(false);
      setCodeErrorMessage("");
      // delete the session storage
      sessionStorage.removeItem("email");
      alert("Passed");
      // continue integration
    } else {
      if (code === "") {
        setIsCodeError(true);
        setCodeErrorMessage("OTP Code cannot be empty");
      } else if (!codePattern.test(code)) {
        setIsCodeError(true);
        setCodeErrorMessage("OTP Code cannot may only contain numbers");
      } else {
        setIsCodeError(false);
        setCodeErrorMessage("");
      }
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
                overflow: "hidden",
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
                label="OTP Code"
                placeHolder="Enter verification code"
                value={code}
                isError={isCodeError}
                errorMessage={codeErrorMessage}
                onChange={handleOTPCode}
              />

              {/* Reusable password input field */}
              <PasswordInput
                id="newpassword"
                label="New Password"
                placeHolder="Enter your new password"
                value={password}
                onChange={handlePasswordChange}
                isError={isPasswordError}
                errorMessage={passwordErrorMessage}
              />

              {/* Reusable password input field */}
              <PasswordInput
                id="confirmpassword"
                label="Confirm Password"
                placeHolder="Enter new password again"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                isError={isConfirmPasswordError}
                errorMessage={confirmPasswordErrorMessage}
              />

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
