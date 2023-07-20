import { React, useState, useEffect, useContext } from "react";
import PaperComponent from "../../../components/ui/Paper";
import {
  Box,
  Grid,
  Breadcrumbs,
  Typography,
  Divider,
  Collapse,
  Alert,
  IconButton,
} from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import SubmitButton from "../../../components/ui/Button";
import FormFieldMapper from "../../../components/form/FormFieldMapper";
import ActOnLeaveConfig from "./ActOnLeaveConfig";
import { GridSizes } from "../../../components/form/GridSizes";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { validateDropDown } from "../../../components/form/Validations";
// import { useEffect } from "react";
import APIEndPoints from "../../../api/APIEndPoints";
import { getDataByID, postData, putData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";

function ActOnLeave() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);

  // Access the value of employee id from query string
  const id = params.get("id");
  // declare useState variables
  const [empName, setEmpName] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveLength, setLeaveLength] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");

  // form values for act on leave form
  const [formValues, setFormValues] = useState({});
  const [isError, setIsError] = useState(false);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [response, setResponse] = useState(false);

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  const handleValidation = () => {
    // use your existing validation functions to approval
    const isOptionValid = validateDropDown(formValues.approval);

    // Set isError based on the validation results
    setIsError(isOptionValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes

    const fetchLeaveData = async () => {
      try {
        const endpoint = new APIEndPoints().getLeaveByID();
        const leaveId = { id };
        const data = await getDataByID(endpoint, leaveId, ctx.token);
        //Checks if response is valid
        if (data) {
          console.log(data);
          if (
            !empName &&
            !leaveType &&
            !startDate &&
            !comments &&
            !attachments
          ) {
            setEmpName(data.User.firstName);
            setLeaveType(data.leave_type);
            setStartDate(data.start_date);
            setEndDate(data.end_date);
            setLeaveLength(data.duration);
            setComments("Leave comment");
            setAttachments("https://disraptor.co.za/");
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchLeaveData();
  }, [formValues]);

  //hardcoded values (temporary)
  //Set values from the object
  //change to axios
  // handle form submition
  const handleSubmit = async (event) => {
    event.preventDefault();
    //progress
    setProgress(true);
    const status = formValues.approval;
    const feedback = formValues.feedback;
    //Feedback value is captured on values that is null
    const endpoint = new APIEndPoints().approveLeave();
    const dataArr = { id, status, feedback };
    const response = await putData(endpoint, dataArr, ctx.token);
    if (response.status === 200) {
      setAlertMessage(response.data.message);
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
    //try and catch error to do the integration and capture the form values.
    try {
    } catch (error) {}
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb />
        <br />
        <PaperComponent>
          <Grid container>
            <Grid item xs={12}>
              <Typography
                color="primary"
                fontFamily="Geologica"
                fontWeight="normal"
              >
                Leave Request Details
              </Typography>
              <Divider />
              <Box paddingTop={"20px"}></Box>
            </Grid>
            {/* Shows Employee name */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Employee Name" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees name from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={empName} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Leave Type */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Type" fontWeight={"bold"} />
              </Grid>
              {/* Shows the type of leave from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveType} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Date */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Start Date" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={startDate} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Date */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="End Date" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={endDate} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Leave length */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Length" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveLength} fontWeight={"normal"} />
              </Grid>
            </Grid>
            {/* Shows Comments */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Comment" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees comments from GET on axios */}
              <Grid item xs={8}>
                {/* sets a scroll box if it exceeds a certain height */}
                <Box sx={{ maxHeight: "120px", overflow: "auto" }}>
                  <Paragraph text={comments} fontWeight={"normal"} />
                </Box>
              </Grid>
            </Grid>
            {/* Shows Attachments */}
            <Grid container paddingY={"20px"}>
              <Grid item xs={4}>
                <Paragraph text="Attachments" fontWeight={"bold"} />
              </Grid>
              {/* Shows employees file attached from GET on axios */}
              {/* overflowwrap to wrap text */}
              <Grid item xs={8} sx={{ overflowWrap: "break-word" }}>
                <a
                  href={attachments}
                  style={{ textDecoration: "none" }}
                  target="_blank"
                >
                  <Paragraph text={attachments} fontWeight={"normal"} />
                </a>
              </Grid>
            </Grid>
            <Grid container paddingY={"6px"}>
              <Grid item xs={12}>
                <Typography
                  color="primary"
                  fontFamily="Geologica"
                  fontWeight="normal"
                >
                  Act On Leave
                </Typography>
                <Divider />
              </Grid>
            </Grid>
            <Grid container paddingY={"20px"}>
              <Grid item xs={12}>
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
                    {/* Maps the dropdown box and TextField  */}
                    <FormFieldMapper
                      formFields={ActOnLeaveConfig.formFields}
                      onChange={handleChange}
                      gridSizes={GridSizes.onbordingFieldSizes}
                    />
                  </Grid>
                  {/* Submit the approval of leave */}
                  <SubmitButton
                    label={"Act on Leave"}
                    type="submit"
                    disabled={isError}
                    progress={progress}
                  />
                </form>
              </Grid>
            </Grid>
          </Grid>
        </PaperComponent>
      </Box>
    </>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" to="/home">
          Home
        </Link>
        <Link underline="hover" color="inherit" to="/manage-leave">
          Manage Leave
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Act on Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ActOnLeave;
