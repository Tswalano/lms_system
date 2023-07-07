import React, { useState } from "react";
import PaperComponent from "../../../ui/Paper";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { validateText } from "../../../components/form/Validations";
import { useEffect } from "react";
import { Box, Grid } from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import { GridSizes } from "../../../components/form/GridSizes";
import SubmitButton from "../../../ui/Button";
import Heading from "../../../ui/Heading";
import AddEmployeeConfig from "./AddEmployeeConfig";
import Paragraph from "../../../ui/Paragraph";

function AddEmployee() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isFirstNameValid = validateText(formValues.firstName);
    const isLastNameValid = validateText(formValues.lastName);

    // Set isError based on the validation results
    setIsError(isFirstNameValid !== null || isLastNameValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    const formValues = GetFormValues(event);
    console.log(formValues);
  };

  return (
    <Grid
      container
      alignItems="center"
      justifyContent="center"
      style={{ height: "100vh" }}
    >
      <Box width="100%">
        <PaperComponent>
          <Box>
            <Heading text="Add Employee" />
            <Paragraph text="To add an employee, enter their details below." />
            <Box sx={{ textAlign: "right", marginBottom: "60px" }}></Box>
          </Box>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <FormFieldMapper
                formFields={AddEmployeeConfig.formFields}
                onChange={handleChange}
                gridSizes={GridSizes.onbordingFieldSizes}
              />
              </Grid>
              <SubmitButton
                disabled={isError}
                label="Add Employee"
                type="submit"
              />     
          </form>
        </PaperComponent>
      </Box>
    </Grid>
  );
}

export default AddEmployee;
