import React, { useContext, useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Alert, AlertTitle, Box, Grid, Typography } from "@mui/material";
import Heading from "../../../components/ui/Heading";
import PaperComponent from "../../../components/ui/Paper";
import { validateDropDown } from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
import ApplyForLeaveForm from "./ApplyForLeaveConfig";
import { validateDate } from "../../../components/form/Validations";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Paragraph from "../../../components/ui/Paragraph";
import APIEndPoints from "../../../api/APIEndPoints";
import { postData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";

function ApplyForLeave() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});
  const [leaveValid, setLeaveValid] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isSelectValid = validateDropDown(
      formValues.LeaveType,
      formValues.leaveLength
    );

    const isDate = validateDate(formValues.date);
    const isEndDate = validateDate(formValues.endDate);
    // const isDate = validateDate(formValues.Date)

    // Set isError based on the validation results
    setIsError(isSelectValid !== null || isDate !== null || isEndDate !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();
    //const formValues = GetFormValues(event);
    const leave_type = formValues.LeaveType;
    const startDateFormat = new Date(formValues.date);
    const endDateFormat = new Date(formValues.endDate);
    //creating startDate Format
    const leave_start =
      startDateFormat.getDate() +
      "/" +
      startDateFormat.getMonth() +
      "/" +
      startDateFormat.getFullYear();
    //Creating end Date format
    const leave_end =
      endDateFormat.getDate() +
      "/" +
      endDateFormat.getMonth() +
      "/" +
      endDateFormat.getFullYear();
    //creating an array for data
    const arrData = { leave_type, leave_start, leave_end };
    const endpoint = new APIEndPoints().applyForLeave();

    const postLeave = await postData(endpoint, arrData, ctx.token);
    //  Checks if leave submited is valid
    if (postLeave) {
      setLeaveValid("success");
    }
  };

  // render output
  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <PaperComponent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <FormFieldMapper
              formFields={ApplyForLeaveForm.formFields}
              onChange={handleChange}
              gridSizes={GridSizes.dashboardFieldSizes}
            />
            <Grid item xs={12} sm={12} md={12}>
              <SubmitButton
                disabled={isError}
                label="Apply For Leave"
                type="submit"
              />
              {/* Grid to create spacing on top so that there is space between the button and Success/Error Alert */}
              <Grid marginTop={"2%"}>
                {/* Showing Success/Error Message when applying for leave */}
                {leaveValid === "success" && (
                  <Alert severity="success">
                    <AlertTitle>Success</AlertTitle>You have successfully
                    applied for leave.
                  </Alert>
                )}
                {leaveValid === "error" && (
                  <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    Error in Applying for leave. Please try again
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Grid>
        </form>
      </PaperComponent>
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href={"/dashboard"}>
          Home
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Apply For Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ApplyForLeave;
