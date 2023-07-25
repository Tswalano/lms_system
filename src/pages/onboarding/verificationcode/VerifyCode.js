import React, { useContext, useState } from "react";
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
import { validateCode } from "../../../components/form/Validations";
import VerifyCodeConfig from "./VerifyCodeConfig";
import Paragraph from "../../../components/ui/Paragraph";
import { GridSizes } from "../../../components/form/GridSizes";
import Link from "@mui/material/Link";
import APIEndPoints from "../../../api/APIEndPoints";
import { signIn, signUpAndVerify } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";

// get the email from the storage session

function VerifyCode() {
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

  const navigate = useNavigate();

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isCodeValid = validateCode(formValues.code);

    // Set isError based on the validation results
    setIsError(isCodeValid !== null);
  };
  const { logIn } = useContext(AuthContext);

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes

    if (ctx.isAdmin === "admin") {
      navigate("/profile");
      ctx.removeLoginInfo();
    } else if (ctx.isAdmin === "user") {
      navigate("/profile");
      ctx.removeLoginInfo();
    }
  }, [formValues, ctx]);
  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);
    //Getting the Email and Password set in SignUp from AuthContext
    const email = ctx.email;
    const password = ctx.password;
    //setting the otp to a varible to take values of otpfrom formValues
    const otp = formValues.code;
    //setting the values
    const values = { email, otp };

    // setting the login details for email and password
    const log_in = { email, password };

    //getting Endpoints for optAPI and signIn API
    const endPoint = new APIEndPoints().otpApi();
    const logInEndPoint = new APIEndPoints().signinAPI();
    //Parsing the values for endPoint and values to verify user
    const response = await signUpAndVerify(endPoint, values);
    //Checks if user is verified

    if (response.status === 200) {
      const login = await signIn(logInEndPoint, log_in);
      logIn(login.token, login.user.role);
    } else {
      // set error
      setAlertMessage(response.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
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
          <form onSubmit={handleSubmit}>
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
                progress={progress}
              />
              <Grid container sx={{ paddingTop: "20px" }}>
                <Paragraph text="Didn't receive a code? &nbsp;" />
                <Link onClick={sendNewCode} href="" underline="hover">
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
