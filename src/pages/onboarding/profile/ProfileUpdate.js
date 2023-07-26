import React, { useContext, useState } from "react";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  validatePhone,
  validateText,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import {
  Alert,
  Box,
  Collapse,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ProfileConfig from "./ProfileConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import SubmitButton from "../../../components/ui/Button";
import APIEndPoints from "../../../api/APIEndPoints";
import { postData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";
import EditField from "../../../components/ui/EditField";

function ProfileUpdate({ profileData }) {
  // declare the useState formValues object
  const [firstName, setFirstName] = useState(profileData.firstName);
  const [lastName, setLastName] = useState(profileData.lastName);
  const [jobTitle, setJobTitle] = useState(profileData.jobTitle);
  const [phone, setPhone] = useState(profileData.phone);

  // State to track form field error
  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  const ctx = useContext(AuthContext);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isFirstNameValid = validateText(firstName);
    const isLastNameValid = validateText(lastName);
    const isPhoneValid = validatePhone(phone);
    const isJobTitleValid = validateText(jobTitle);

    // Set isError based on the validation results
    setIsError(
      isFirstNameValid !== null ||
        isLastNameValid !== null ||
        isPhoneValid !== null ||
        isJobTitleValid !== null
    );
  };

  useEffect(() => {
    handleValidation();
    // declare the useState formValues object
    setFirstName(profileData.firstName);
    setLastName(profileData.lastName);
    setJobTitle(profileData.jobTitle);
    setPhone(profileData.phone);
    //console.log(jwtDecode(ctx.token));
    // Run the validation when formValues state changes
  }, [firstName, lastName, phone, jobTitle, profileData]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);

    const endpoint = new APIEndPoints().profileAPI();

    const email = jwtDecode(ctx.token).email;
    const arrData = { firstName, lastName, email, phone, jobTitle };

    const response = await postData(endpoint, arrData, ctx.token);
    if (response.status === 200) {
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

  // formfields
  const formFields = [
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      value: firstName,
      onChange: setFirstName,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      value: lastName,
      onChange: setLastName,
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "phone",
      value: phone,
      onChange: setPhone,
    },
    {
      name: "jobTitle",
      label: "Job Title",
      type: "text",
      value: jobTitle,
      onChange: setJobTitle,
    },
  ];
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
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <Grid item xs={12} sm={12} md={12}>
          {formFields.map((field, index) => {
            return <EditField key={index} field={field} />;
          })}
          <SubmitButton
            disabled={isError}
            label="Save Profile"
            type="submit"
            progress={progress}
          />
        </Grid>
      </form>
    </Box>
  );
}

export default ProfileUpdate;
