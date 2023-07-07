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
import { validateCode } from "../../../components/form/Validations";
import VerifyCodeConfig from "./VerifyCodeConfig";
import Paragraph from "../../../ui/Paragraph";
import { GridSizes } from "../../../components/form/GridSizes";
import Link from "@mui/material/Link";

// get the email from the storage session
const email = sessionStorage.getItem("email");

function VerifyCode() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isCodeValid = validateCode(formValues.code);

    // Set isError based on the validation results
    setIsError(isCodeValid !== null);
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

    // remove email session from forgot password page on reset password success
    sessionStorage.removeItem("email");
  };

  // handle send new code request
  const sendNewCode = () => {
    alert("request");
    //
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "center" }}>
            <Heading text="Confirm your account" />
          </Box>
          <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
            <Paragraph
              text={
                "We have sent a code by email to " +
                email +
                ". Enter it below to confirm your account."
              }
              fontWeight="normal"
            />
          </Box>
          <form onSubmit={handleSubmit} autocomplete="off">
            <Grid container>
              <FormFieldMapper
                formFields={VerifyCodeConfig.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton
                disabled={isError}
                label="Confirm account"
                type="submit"
              />
              <Grid container sx={{ paddingTop: "20px" }}>
                <Paragraph text="Didn't receive a code? &nbsp;" />
                <Link onClick={sendNewCode} href="" underline="none">
                  Send a new code
                </Link>
              </Grid>
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default VerifyCode;
