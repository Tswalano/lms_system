import React, { useContext, useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Box, Grid } from "@mui/material";
import CenteredBox from "../../../components/ui/CenteredBox";
import Heading from "../../../components/ui/Heading";
import Logo from "../../../components/ui/Logo";
import PaperComponent from "../../../components/ui/Paper";
import { validateCode } from "../../../components/form/Validations";
import VerifyCodeConfig from "./VerifyCodeConfig";
import Paragraph from "../../../components/ui/Paragraph";
import { GridSizes } from "../../../components/form/GridSizes";
import Link from "@mui/material/Link";
import APIEndPoints from "../../../api/APIEndPoints";
import { signUpAndVerify } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// get the email from the storage session

function VerifyCode() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

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
  const { userEmail } = useContext(AuthContext);
  const ctx = useContext(AuthContext);
  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);
    const email = ctx.email;
    const values = { email, formValues };

    console.log(values);

    const endPoint = new APIEndPoints().otpApi();
    const verified = await signUpAndVerify(endPoint, values);
    if (verified) {
      navigate("/profile");
    }
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
                ctx.email +
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
