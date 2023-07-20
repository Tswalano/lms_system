import React, { useState, useEffect, useContext } from "react";
import {
  validateDropDown,
  validateDate,
} from "../../../components/form/Validations";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ApplyForLeaveForm from "../applyforleave/ApplyForLeaveConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import SubmitButton from "../../../components/ui/Button";
import CloseIcon from "@mui/icons-material/Close";
import APIEndPoints from "../../../api/APIEndPoints";
import { AuthContext } from "../../../context/AuthContext";
import { postData } from "../../../api/API";

function UpdateLeaveRequest() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isSelectValid = validateDropDown(
      formValues.leaveType,
      formValues.leaveLength
    );

    const isDate = validateDate(formValues.startDate);
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

    //progress
    setProgress(true);

    const formValues = GetFormValues(event);

    const leave_type = formValues.leaveType;
    const startDateFormat = new Date(formValues.startDate);
    const endDateFormat = new Date(formValues.endDate);
    //creating startDate Format
    const leave_start =
      startDateFormat.getFullYear() +
      "/" +
      (startDateFormat.getMonth() + 1) +
      "/" +
      startDateFormat.getDate();
    //Creating end Date format
    const leave_end =
      endDateFormat.getFullYear() +
      "/" +
      (startDateFormat.getMonth() + 1) +
      "/" +
      endDateFormat.getDate();
    //creating an array for data
    const arrData = { leave_type, leave_start, leave_end };
    const endpoint = new APIEndPoints().applyForLeave();

    const response = await postData(endpoint, arrData, ctx.token);

    if (response.status === 200) {
      setAlertMessage("Successful");
      setAlertType("success");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    } else {
      // set error
      setAlertMessage("Unsuccessful");
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

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
      <form onSubmit={handleSubmit}>
        <Grid container>
          <FormFieldMapper
            formFields={ApplyForLeaveForm.formFields}
            onChange={handleChange}
            gridSizes={GridSizes.onbordingFieldSizes}
          />
          <Grid item xs={12} sm={12} md={12}>
            <SubmitButton
              disabled={isError}
              label="Edit Leave Request"
              type="submit"
              progress={progress}
            />
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}

export default UpdateLeaveRequest;
