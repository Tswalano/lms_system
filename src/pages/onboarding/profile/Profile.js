import React, { useState } from "react";
import PaperComponent from "../../../ui/Paper";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  validateEmail,
  validatePhone,
  validateText,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import { Box, Button, Grid } from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ProfileForm from "./ProfileConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import SubmitButton from "../../../ui/Button";
import Heading from "../../../ui/Heading";

function Profile() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isFirstNameValid = validateText(formValues.firstName);
    const isLastNameValid = validateText(formValues.lastName);
    const isEmailValid = validateEmail(formValues.email);
    const isPhoneValid = validatePhone(formValues.phone);
    const isJobTitleValid = validateText(formValues.jobTitle);

    // Set isError based on the validation results
    setIsError(
      isFirstNameValid !== null ||
        isLastNameValid !== null ||
        isEmailValid !== null ||
        isPhoneValid !== null ||
        isJobTitleValid !== null
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
  };

  return (
    <Grid container>
      <PaperComponent>
        <Box sx={{ textAlign: "left" }}>
          <Heading text="Profile" />
        </Box>
        <Box sx={{ textAlign: "right", marginBottom: "20px" }}>
          <Button color="primary" variant="contained" sx={{ color: "#fff" }}>
            Change Password
          </Button>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <FormFieldMapper
              formFields={ProfileForm.formFields}
              onChange={handleChange}
              gridSizes={GridSizes.dashboardFieldSizes}
            />
            <Grid item xs={12} sm={12} md={6} lg={6} xl={6}></Grid>
            <Grid item xs={12} sm={12} md={6} lg={6} xl={6}></Grid>
            <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
              <SubmitButton
                disabled={isError}
                label="Save Profile"
                type="submit"
              />
            </Grid>
          </Grid>
        </form>
      </PaperComponent>
    </Grid>
  );
}

export default Profile;
