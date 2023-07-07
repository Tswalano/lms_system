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
import { validateDropDown } from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
import ApplyForLeaveForm from "./ApplyForLeaveConfig";
import { validateStartDate } from "../../../components/form/Validations";
import { validateEndDate } from "../../../components/form/Validations";


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
    const isStartDate = validateStartDate(formValues.startDate);
    const isEndDate = validateEndDate(formValues.endDate);

    // Set isError based on the validation results
    setIsError(isSelectValid !== null ||isStartDate !==null||isEndDate !==null);
    
    
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
  };

  // render output
  return (
    <CenteredBox>
      <Box sx={{ maxWidth: "600px" }}>
        <Logo width="35%" />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
            <Heading text="Apply For Leave" />
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container>
              <FormFieldMapper
                formFields={ApplyForLeaveForm.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              <SubmitButton
                disabled={isError}
                label="Apply For Leave"
                type="submit"
              />
            </Grid>
          </form>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
}

export default ApplyForLeave;
