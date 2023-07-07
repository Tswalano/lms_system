import React, { useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../ui/Button";
import SigninForm from "./FormConfig";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Box, Grid } from "@mui/material";
import CenteredBox from "../../../ui/CenteredBox";
import Heading from "../../../ui/Heading";
import Logo from "../../../ui/Logo";
import PaperComponent from "../../../ui/Paper";
import {
  validateEmail,
  validatePassword,
} from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
// import { login, postFormData } from "../../../api/API";
import { signIn } from "../../../api/API";
import APIEndPoints from "../../../api/APIEndPoints";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signin() {
  // create a useNavigate hook
  const navigate = useNavigate();
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
    //console.log(formValues);

    const endPoint = new APIEndPoints().signinAPI();
    await signIn(endPoint, formValues);

    // try {
    //   const endPoint = new APIEndPoints().signinAPI();

    //   //axios.post(endPoint, formValues).then((response) => {
    //   //return response;

    //   const response = await login(endPoint, formValues);
    //   console.log(response.data);

    //   if (response === 200) {
    //     //
    //     const token = response.data.token;
    //     sessionStorage.setItem("token", token);
    //     //
    //     sessionStorage.setItem("isAuthenticated", true);
    //     //
    //     if (response.data.user["role"] === "admin") {
    //       sessionStorage.setItem("isRoleAdmin", true);
    //     } else {
    //       sessionStorage.setItem("isRoleAdmin", false);
    //     }
    //     //
    //     if (response.data.userProfileStatus === false) {
    //       // route user to profile page
    //       navigate("/profile");
    //     } else {
    //       // route user to dashboard
    //       navigate("/");
    //     }
    //   } else if (response.status === 400) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(response.data.message);
    //   } else if (response.status === 401) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(response.data.message);
    //   } else if (response.status === 404) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(response.data.message);
    //   } else if (response.status === 400) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(response.data.message);
    //   }
    //   //});
    //   //
    // } catch (error) {
    //   //console.log(error + " gergnerjg j wnfjuwnf wefnew fbweub");
    //   if (error.response.status === 400) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(error.response.data.message);
    //   }
    //   if (error.response.status === 401) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(error.response.data.message);
    //   }
    //   if (error.response.status === 404) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(error.response.data.message);
    //   }
    //   if (error.response.status === 400) {
    //     //
    //     sessionStorage.setItem("isAuthenticated", false);
    //     alert(error.response.data.message);
    //   }
    // }
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
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default Signin;
