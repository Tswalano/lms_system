import React, { useState } from "react";
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
import { validateDropDown } from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
import ApplyForLeaveForm from "./ApplyForLeaveConfig";
import DatePicker from "../../../components/ui/DatePicker";
import { validateDate } from "../../../components/form/Validations";

function ApplyForLeave() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

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

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);
  };

  // render output
  return (
    <Grid container>
      <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
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
          </Grid>
        </Grid>
      </form>
    </Grid>
  );
}

export default ApplyForLeave;
