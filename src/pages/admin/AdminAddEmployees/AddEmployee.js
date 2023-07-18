import React, { useContext, useState } from "react";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { validateText } from "../../../components/form/Validations";
import { useEffect } from "react";
import { Box, Grid } from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import { GridSizes } from "../../../components/form/GridSizes";
import SubmitButton from "../../../components/ui/Button";
import AddEmployeeConfig from "./AddEmployeeConfig";
import APIEndPoints from "../../../api/APIEndPoints";
import { postData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";

function AddEmployee() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);

  const ctx = useContext(AuthContext);

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

    const endpoint = new APIEndPoints().addNewEmployee();

    const addEmployee = await postData(endpoint, formValues, ctx.token);

    if (addEmployee) {
      console.log("success");
    }
  };

  return (
    <Box width="100%">
      <form onSubmit={handleSubmit}>
        <Grid container>
          <FormFieldMapper
            formFields={AddEmployeeConfig.formFields}
            onChange={handleChange}
            gridSizes={GridSizes.onbordingFieldSizes}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={12}>
          <SubmitButton
            disabled={isError}
            label="Send Invitation"
            type="submit"
          />
        </Grid>
      </form>
    </Box>
  );
}

export default AddEmployee;
