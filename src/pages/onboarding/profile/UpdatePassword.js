import React, { useState } from "react";
import UpdatePasswordForm from "./UpdatePasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  validatePassword,
  validateConfirmPassword,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import SubmitButton from "../../../components/ui/Button";
import CloseIcon from "@mui/icons-material/Close";

function UpdatePassword() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isCurrentPasswordValid = validatePassword(formValues.currentPassword);
    const isNewPasswordValid = validatePassword(formValues.password);
    const isConfirmPasswordValid = validateConfirmPassword(
      formValues.password,
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

    //progress
    setProgress(true);

    const formValues = GetFormValues(event);

    if (formValues.password === "Rigney@123") {
      setAlertMessage("Successful");
      setAlertType("success");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    } else {
      // set error
      setAlertMessage("Unsuccessful");
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
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
              progress={progress}
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default UpdatePassword;
