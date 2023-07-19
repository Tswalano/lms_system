import React, { useContext, useState } from "react";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  validateEmail,
  validatePhone,
  validateText,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import { Box, Grid, Typography } from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ProfileConfig from "./ProfileConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import SubmitButton from "../../../components/ui/Button";
import APIEndPoints from "../../../api/APIEndPoints";
import { postData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";

function ProfileUpdate() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  const ctx = useContext(AuthContext);

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
    const endpoint = new APIEndPoints().profileAPI();

    const updateProfile = await postData(endpoint, formValues, ctx.token);
    console.log(formValues);
    console.log(ctx.token);
    if (updateProfile) {
      console.log("Success");
    }
  };
  return (
    <Box sx={{ width: "100%" }}>
      <form onSubmit={handleSubmit}>
        <Grid container>
          <FormFieldMapper
            formFields={ProfileConfig.formFields}
            onChange={handleChange}
            gridSizes={GridSizes.onbordingFieldSizes}
          />
          <Grid item xs={12} sm={12} md={12}>
            <SubmitButton
              disabled={isError}
              label="Save Profile"
              type="submit"
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default ProfileUpdate;
