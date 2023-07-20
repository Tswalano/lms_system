import React, { useState, useContext } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Alert, Box, Collapse, Grid, IconButton, Link } from "@mui/material";
import CenteredBox from "../../../components/ui/CenteredBox";
import Heading from "../../../components/ui/Heading";
import Logo from "../../../components/ui/Logo";
import PaperComponent from "../../../components/ui/Paper";
import {
  validateCode,
  validatePassword,
  validateConfirmPassword,
} from "../../../components/form/Validations";
import ResetPasswordForm from "./ResetPasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import Paragraph from "../../../components/ui/Paragraph";
import { AuthContext } from "../../../context/AuthContext";
import CloseIcon from "@mui/icons-material/Close";
import { AuthContext } from "../../../context/AuthContext";
import APIEndPoints from "../../../api/APIEndPoints";
import { signUpAndVerify } from "../../../api/API";
import { useNavigate } from "react-router-dom";
import APIEndPoints from "../../../api/APIEndPoints";
import { postData } from "../../../api/API";

function ResetPassword() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  const ctx = useContext(AuthContext);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isCodeValid = validateCode(formValues.code);
    const isPasswordValid = validatePassword(formValues.password);
    const isConfirmPasswordValid = validateConfirmPassword(
      formValues.password,
      formValues.confirmPassword
    );

    // Set isError based on the validation results
    setIsError(
      isCodeValid !== null ||
        isPasswordValid !== null ||
        isConfirmPasswordValid !== null
    );
  };

  useEffect(() => {
    handleValidation();
    console.log(ctx.email);
    // Run the validation when formValues state changes
  }, [formValues, ctx.email]);

  // handle send new code request
  const sendNewCode = () => {
    alert("request");
    //
  };

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();
    const endpoint = new APIEndPoints().resetPassword();
    const email = ctx.email;
    const verificationCode = formValues.code;
    const newPassword = formValues.password;
    const arrData = { email, verificationCode, newPassword };

    //progress
    setProgress(true);

    const response = await postData(endpoint, arrData, ctx.token);
    if (response.status === 200) {
      setAlertMessage(response.message);
      setAlertType("success");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    } else {
      // set error
      setAlertMessage(response.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }

    // remove email session from forgot password page on reset password success
    sessionStorage.removeItem("email");
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        {response ? (
          <Collapse in={open}>
            <Alert
              severity={alertType}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOpen(false);
                  }}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              {alertMessage}
            </Alert>
          </Collapse>
        ) : (
          <Box></Box>
        )}
        <PaperComponent>
          <Box sx={{ textAlign: "center" }}>
            <Heading text="Reset Password" />
          </Box>
          <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
            <Paragraph
              text={
                "We have sent a password reset code by email to " +
                ctx.ctx.email +
                ". Enter it below to reset your password."
              }
              fontWeight="normal"
            />
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container>
              <FormFieldMapper
                formFields={ResetPasswordForm.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton
                disabled={isError}
                label="Reset Password"
                type="submit"
                progress={progress}
              />
            </Grid>
          </form>
          <Grid container sx={{ paddingTop: "20px" }}>
            <Paragraph text="Didn't receive a code? &nbsp;" />
            <Link onClick={sendNewCode} href="" underline="hover">
              Send a new code
            </Link>
          </Grid>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default ResetPassword;
