import React, { useState, useContext } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import SigninForm from "./FormConfig";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Box, Grid } from "@mui/material";
import CenteredBox from "../../../components/ui/CenteredBox";
import Heading from "../../../components/ui/Heading";
import Logo from "../../../components/ui/Logo";
import PaperComponent from "../../../components/ui/Paper";
import {
  validateEmail,
  validatePassword,
} from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
// import { login, postFormData } from "../../../api/API";
import { signIn } from "../../../api/API";
import APIEndPoints from "../../../api/APIEndPoints";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

function Signin() {
  // create a useNavigate hook
  const navigate = useNavigate();
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  const { logIn } = useContext(AuthContext);

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isEmailValid = validateEmail(formValues.email);
    const isPasswordValid = validatePassword(formValues.password);

    // Set isError based on the validation results
    setIsError(isEmailValid !== null || isPasswordValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formValues = GetFormValues(event);

    const endPoint = new APIEndPoints().signinAPI();
    const isLoggedIn = await signIn(endPoint, formValues, logIn);
    if (isLoggedIn) {
      navigate("/home");
    }
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
            <Heading text="Sign in to your account" />
          </Box>
          <form onSubmit={handleSubmit} autocomplete="off">
            <Grid container>
              <FormFieldMapper
                formFields={SigninForm.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton disabled={isError} label="Sign in" type="submit" />
              <Link to={"/forgot-password"}>Forgot your password?</Link>
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default Signin;
