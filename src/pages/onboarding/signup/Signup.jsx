import React, { useContext, useState } from "react";
import SubmitButton from "../../../components/ui/Button";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SignupForm from "./FormConfig";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import CenteredBox from "../../../components/ui/CenteredBox";
import PaperComponent from "../../../components/ui/Paper";
import { Box, Grid } from "@mui/material";
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

function Signup() {
  const [formValues, setFormValues] = useState({});

  const handleInputChange = handleFieldChange(setFormValues);

  const [isError, setIsError] = useState(true);

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
    // Run the validation when formValues state changes
  }, [formValues]);

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);
    console.log(formValues);
    userEmail(formValues.email);
    userPassword(formValues.password);
    console.log(ctx.email);

    const endPoint = new APIEndPoints().signupAPI();
    const signUpUser = await signUpAndVerify(endPoint, formValues);
    if (signUpUser) {
      nav("/verify-account");
    }
  };

  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
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
              <SubmitButton disabled={isError} label="Sign up" type="submit" />
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default Signup;
