import React, { useContext, useState } from "react";
import SubmitButton from "../../../components/ui/Button";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SignupForm from "./FormConfig";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import CenteredBox from "../../../components/ui/CenteredBox";
import PaperComponent from "../../../components/ui/Paper";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import Logo from "../../../components/ui/Logo";
import Heading from "../../../components/ui/Heading";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import { GridSizes } from "../../../components/form/GridSizes";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import APIEndPoints from "../../../api/APIEndPoints";
import { signUpAndVerify } from "../../../api/API";
import CloseIcon from "@mui/icons-material/Close";

function Signup() {
  const [formValues, setFormValues] = useState({});

  const handleInputChange = handleFieldChange(setFormValues);

  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  const { userEmail } = useContext(AuthContext);
  const { userPassword } = useContext(AuthContext);
  const ctx = useContext(AuthContext);
  const nav = useNavigate();

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isEmailValid = validateEmail(formValues.email);
    const isPasswordValid = validatePassword(formValues.password);
    const isConfirmPasswordValid = validateConfirmPassword(
      formValues.password,
      formValues.confirmPassword
    );

    // Set isError based on the validation results
    setIsError(
      isEmailValid !== null ||
        isPasswordValid !== null ||
        isConfirmPasswordValid !== null
    );
  };

  useEffect(() => {
    handleValidation();
    if (ctx.isVerified === true) {
      nav("/verify-account");
    }
    // Run the validation when formValues state changes
  }, [formValues, ctx.isVerified]);

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);

    const formValues = GetFormValues(event);
    console.log(formValues);
    userEmail(formValues.email);
    userPassword(formValues.password);
    console.log(ctx.email);

    const endPoint = new APIEndPoints().signupAPI();
    const response = await signUpAndVerify(endPoint, formValues);
    if (response.status === 200) {
      ctx.signup(true);
    } else {
      // set error
      setAlertMessage(response.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

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
          <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
            <Heading text="Create a new account" />
          </Box>
          <form onSubmit={handleSignupSubmit}>
            <Grid container>
              <FormFieldMapper
                formFields={SignupForm.formFields}
                onChange={handleInputChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton
                disabled={isError}
                label="Sign up"
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

export default Signup;
