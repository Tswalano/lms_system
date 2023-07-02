import React, { useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Box, Grid } from "@mui/material";
import CenteredBox from "../../../ui/CenteredBox";
import Heading from "../../../ui/Heading";
import Logo from "../../../ui/Logo";
import PaperComponent from "../../../ui/Paper";
import {
  validateCode,
  validatePassword,
  validateConfirmPassword,
} from "../../../components/form/Validations";
import ResetPasswordForm from "./ResetPasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import Paragraph from "../../../ui/Paragraph";

// get the email from the storage session
const email = sessionStorage.getItem("email");

function ResetPassword() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);

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
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);
    console.log(formValues);

    // remove email session from forgot password page on reset password success
    sessionStorage.removeItem("email");
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "center" }}>
            <Heading text="Reset Password" />
          </Box>
          <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
            <Paragraph
              text={
                "We have sent a password reset code by email to " +
                email +
                ". Enter it below to reset your password."
              }
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
              />
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default ResetPassword;
