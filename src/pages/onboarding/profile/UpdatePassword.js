import React, { useState } from "react";
import UpdatePasswordForm from "./UpdatePasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import { Box, Grid } from "@mui/material";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  validatePassword,
  validateConfirmPassword,
  validateText,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import SubmitButton from "../../../components/ui/Button";

function UpdatePassword() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isCurrentPasswordValid = validateText(formValues.currentPassword);
    const isNewPasswordValid = validatePassword(formValues.newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(
      formValues.confirmPassword
    );

    // Set isError based on the validation results
    setIsError(
      isCurrentPasswordValid !== null ||
        isNewPasswordValid !== null ||
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
  };

  return (
    <Box sx={{ width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <Grid container>
          <FormFieldMapper
            formFields={UpdatePasswordForm.formFields}
            onChange={handleChange}
            gridSizes={GridSizes.onbordingFieldSizes}
          />
          <Grid item xs={12} sm={12} md={12}>
            <SubmitButton
              disabled={isError}
              label="Update Password"
              type="submit"
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default UpdatePassword;
