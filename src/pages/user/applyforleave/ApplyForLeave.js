import React, { useContext, useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { Alert, AlertTitle, Box, Grid } from "@mui/material";
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

  const ctx = useContext(AuthContext);
  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);

    const leave_type = formValues.LeaveType;
    const leave_start = formValues.date;
    const leave_end = formValues.leave_end;
    const arrData = { leave_type, leave_start, leave_end };
    const endpoint = new APIEndPoints().applyForLeave();
    const postLeave = await postData(endpoint, arrData, ctx.token);
    //Checks if leave submited is valid
    if (postLeave) {
      setLeaveValid("success");
    } else {
      setLeaveValid("error");
    }
  };

  // render output
  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <PaperComponent>
        <Box sx={{ textAlign: "left", paddingBottom: "20px" }}>
          <Heading text="Apply For Leave" />
        </Box>

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
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Paragraph text="Apply For Leave" fontWeight="normal" />
      </Breadcrumbs>
    </div>
  );
}

export default ApplyForLeave;
