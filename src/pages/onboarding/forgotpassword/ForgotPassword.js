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
import { validateEmail } from "../../../components/form/Validations";
import ForgotPasswordForm from "./ForgotPasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import Paragraph from "../../../ui/Paragraph";

function ForgotPassword() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isEmailValid = validateEmail(formValues.email);

    // Set isError based on the validation results
    setIsError(isEmailValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);

    // store session for email to be accessed on the next page
    sessionStorage.setItem("email", formValues.email);
    // continue integrating
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "center" }}>
            <Heading text="Forgot Password" />
          </Box>
          <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
            <Paragraph
              text="Enter your email below and a message will be sent to reset your password."
              fontWeight="normal"
            />
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container>
              <FormFieldMapper
                formFields={ForgotPasswordForm.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton
                disabled={isError}
                label="Forgot Password"
                type="submit"
              />
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default ForgotPassword;
