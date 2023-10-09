import React, { useContext, useState } from "react";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import SubmitButton from "../../../components/ui/Button";
import { useEffect } from "react";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import {
  Alert,
  Box,
  Collapse,
  Grid,
  IconButton,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import PaperComponent from "../../../components/ui/Paper";
import {
  validateDropDown,
  validateLeaveLength,
  validateDate,
  validateEndDate,
} from "../../../components/form/Validations";
import { GridSizes } from "../../../components/form/GridSizes";
import ApplyForLeaveForm from "./ApplyForLeaveConfig";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import APIEndPoints from "../../../api/APIEndPoints";
import { AuthContext } from "../../../context/AuthContext";
import { postData } from "../../../api/API";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import UploadDocument from "./UploadDocument";

function ApplyForLeave() {
  // declare the useState formValues object
  const [formValues, setFormValues] = useState({});
  const [leaveId, setLeaveId] = useState("");

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  // State to track form field error
  const [isError, setIsError] = useState(true);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
    setModalOpen(false);
  };

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  // Update the isError state based on the validation results
  const handleValidation = () => {
    // use your existing validation functions to validate email and password.
    const isLeaveTypeSelected = validateDropDown(formValues.leaveType);
    const isLeaveLengthSelected = validateDropDown(formValues.leaveLength);
    const isStartDate = validateDate(formValues.startDate);
    const isEndDate = validateDate(formValues.endDate);
    const endDateValidation = validateEndDate(
      formValues.startDate,
      formValues.endDate
    );
    const isHalfDay = validateLeaveLength(
      formValues.leaveLength,
      formValues.startDate,
      formValues.endDate
    );

    // Set isError based on the validation results
    setIsError(
      isLeaveTypeSelected !== null ||
        isLeaveLengthSelected !== null ||
        isStartDate !== null ||
        isEndDate !== null ||
        isHalfDay !== null ||
        endDateValidation !== null
    );
    //
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

    // Run the validation when formValues state changes
  }, [formValues]);

  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();

    //progress
    setProgress(true);

    const leave_type = formValues.leaveType;
    const leave_length = formValues.leaveLength;
    var leave_comment = "n/a";
    if (formValues.leaveComment !== "") {
      leave_comment = formValues.leaveComment;
    }
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

    const arrData = {
      leave_type,
      leave_start,
      leave_end,
      leave_length,
      leave_comment,
    };
    const endpoint = new APIEndPoints().applyForLeave();

    const response = await postData(endpoint, arrData, ctx.token);
    //  Checks if leave submited is valid

    if (response.status === 200) {
      setAlertMessage(response.message);
      setAlertType("success");
      setProgress(false);
      setResponse(true);
      setOpen(true);
      // open upload doc modal
      setLeaveId(response.leaveData.id);
      setModalOpen(true);
    } else {
      // set error
      setAlertMessage(response.message);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

  // render output
  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <PaperComponent>
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
                progress={progress}
              />
            </Grid>
          </Grid>
        </form>
      </PaperComponent>

      {/* add upload doc modal dialog */}
      <Dialog open={modalOpen} maxWidth="sm" fullWidth onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Upload Leave Document
        </DialogTitle>
        <Divider />
        <DialogContent>
          <UploadDocument leaveId={leaveId} />
          <br />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose} sx={{ color: "grey" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "grey" }}
            onClick={handleClose}
          >
            Not now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function Breadcrumb() {
  const ctx = useContext(AuthContext);
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          className="breadCrumbLink"
          to={ctx.isAdmin === "admin" ? "/home" : "/dashboard"}
        >
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
