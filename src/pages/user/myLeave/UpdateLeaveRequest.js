import React, { useContext, useState } from "react";
import {
  validateDropDown,
  validateLeaveLength,
  validateDate,
  validateEndDate,
  validateText,
} from "../../../components/form/Validations";
import { useEffect } from "react";
import { Alert, Box, Collapse, Grid, IconButton } from "@mui/material";
import SubmitButton from "../../../components/ui/Button";
import APIEndPoints from "../../../api/APIEndPoints";
import { putData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import CloseIcon from "@mui/icons-material/Close";
import EditField from "../../../components/ui/EditField";
import Paragraph from "../../../components/ui/Paragraph";

function UpdateLeaveRequest({ handleModalClose, leaveData }) {
  // declare the useState formValues object
  const [leave_type, setLeaveType] = useState(leaveData.leave_type);
  const [leave_length, setLeaveLength] = useState(leaveData.leave_length);
  const [leave_start, setStartDate] = useState(
    leaveData.leave_start.split("T")[0]
  );
  const [leave_end, setEndDate] = useState(leaveData.leave_end.split("T")[0]);
  const [leave_comment, setLeaveComment] = useState(leaveData.leave_comment);

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
    const isLeaveTypeValid = validateDropDown(leave_type);
    const isLeaveLengthValid = validateLeaveLength(leave_length);
    const isStartDateValid = validateDate(leave_start);
    const isEndDateValid = validateDate(leave_end);
    const endDateValidation = validateEndDate(leave_start, leave_end);
    const isHalfDay = validateLeaveLength(leave_length, leave_start, leave_end);
    //const isLeaveCommentValid = validateText(leave_comment);

    // Set isError based on the validation results
    setIsError(
      isLeaveTypeValid !== null ||
        isLeaveLengthValid !== null ||
        isStartDateValid !== null ||
        isEndDateValid !== null ||
        isHalfDay !== null ||
        endDateValidation !== null
    );

    if (isHalfDay !== null || endDateValidation !== null) {
      var errorMessage = "";
      if (isHalfDay !== null) {
        errorMessage = isHalfDay;
      } else if (endDateValidation !== null) {
        errorMessage = endDateValidation;
      }
      setAlertMessage(errorMessage);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  useEffect(() => {
    handleValidation();
    // declare the useState formValues object
    // Run the validation when formValues state changes
  }, [
    leave_type,
    leave_length,
    leave_start,
    leave_end,
    leave_comment,
    leaveData,
  ]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);

    const endpoint = new APIEndPoints().editLeave();
    const id = leaveData.id;

    var startDateFormat = new Date(leave_start);
    var endDateFormat = new Date(leave_end);
    console.log(endDateFormat);

    var newStartDateString =
      startDateFormat.getFullYear() +
      "-" +
      (startDateFormat.getMonth() + 1) +
      "-" +
      startDateFormat.getDate();

    var newEndDateString =
      endDateFormat.getFullYear() +
      "-" +
      (endDateFormat.getMonth() + 1) +
      "-" +
      endDateFormat.getDate();

    const arrData = {
      id,
      leave_type,
      leave_start: newStartDateString,
      leave_end: newEndDateString,
      leave_length,
      leave_comment,
    };
    console.log(arrData);

    const response = await putData(endpoint, arrData, ctx.token);
    if (response.status === 200) {
      setAlertMessage(response.data.message);
      setAlertType("success");
      setResponse(true);
      setOpen(true);
      setTimeout(() => {
        setProgress(false);
        handleModalClose();
        window.location.reload();
      }, 2000);
    } else {
      // set error
      setAlertMessage(response.data.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

  // formfields
  const formFields = [
    {
      label: "Leave Type",
      name: "leave_type",
      type: "select",
      value: leave_type,
      options: [
        { value: "Sick Leave", labelText: "Sick Leave" },
        { value: "Annual Leave", labelText: "Annual Leave" },
        { value: "Maternity Leave", labelText: "Maternity Leave" },
        { value: "Bereavement", labelText: "Bereavement" },
        { value: "Family Responsibility", labelText: "Family Responsibility" },
        { value: "Paternity Leave", labelText: "Paternity Leave" },
      ],
      onChange: setLeaveType,
    },
    {
      label: "Leave Length",
      name: "leave_length",
      type: "select",
      value: leave_length,
      options: [
        { value: "Half Day", labelText: "Half Day" },
        { value: "Full Day", labelText: "Full Day" },
      ],
      onChange: setLeaveLength,
    },
    {
      label: "Start Date",
      name: "start_date",
      type: "date",
      value: leave_start,
      onChange: setStartDate,
    },
    {
      label: "End Date",
      name: "end_date",
      type: "date",
      value: leave_end,
      onChange: setEndDate,
    },
    {
      label: "Leave Comment",
      name: "leave_comment",
      type: "text",
      value: leave_comment,
      onChange: setLeaveComment,
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
            label="Save Changes"
            type="submit"
            progress={progress}
          />
        </Grid>
      </form>
    </Box>
  );
}

export default UpdateLeaveRequest;
