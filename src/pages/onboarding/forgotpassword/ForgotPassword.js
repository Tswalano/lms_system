import React, { useState, useContext } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import CenteredBox from "../../../components/ui/CenteredBox";
import Heading from "../../../components/ui/Heading";
import Logo from "../../../components/ui/Logo";
import PaperComponent from "../../../components/ui/Paper";
import { validateEmail } from "../../../components/form/Validations";
import ForgotPasswordForm from "./ForgotPasswordConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import Paragraph from "../../../components/ui/Paragraph";
import CloseIcon from "@mui/icons-material/Close";
import APIEndPoints from "../../../api/APIEndPoints";
import { signIn } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";

function ForgotPassword() {
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

    //progress
    setProgress(true);

    const formValues = GetFormValues(event);

    const endPoint = new APIEndPoints().forgotPasswordAPI();

    const isLoggedIn = await signIn(endPoint, formValues);

    if (formValues.email === "jdjjdj") {
      ctx.userEmail(formValues.email);
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
                progress={progress}
              />
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default ForgotPassword;
