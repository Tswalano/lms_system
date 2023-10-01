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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
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
import { Link, useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

//Formats the date and removes string and '0' values
function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function ActOnLeave() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);

  //declaring navigation
  const navigate = useNavigate();

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

  const [navigationLoad, setNavigationLoad] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [statusCheck, setStatusCheck] = useState();

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
          if (
            !empName &&
            !leaveType &&
            !startDate &&
            !comments &&
            !attachments
          ) {
            setEmpName(data.User.firstName + " " + data.User.lastName);
            setLeaveType(data.leave_type);
            setStartDate(dateFormat(data.start_date));
            setEndDate(dateFormat(data.end_date));
            setLeaveLength(data.duration);
            setComments("Leave comment");
            setAttachments("https://disraptor.co.za/");
          }
        }
        setIsLoading(false);
      } catch (error) {
        // set error
        setAlertMessage(response.message);
        setAlertType("error");
        setProgress(false);
        setResponse(true);
        setOpen(true);
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
      setNavigationLoad(true);
      setAlertMessage(response.data.message);
      setAlertType("success");
      setResponse(true);
      setOpen(true);
      setTimeout(() => {
        setProgress(false);
        handleClose();
      }, 2000);

      setTimeout(() => {
        navigate("/manage-leave");
      }, 3000);
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
    } catch (error) {
      setAlertMessage(error);
      setAlertType("error");
      setProgress(false);
      setResponse(true);
      setOpen(true);
    }
  };

  const handleClickOpen = () => {
    if (formValues.approval === "approved") {
      setStatusCheck("Approve");
    } else {
      setStatusCheck("Reject");
    }

    setOpenModal(true);
  };

  const handleClose = () => {
    setOpenModal(false);
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
              {isLoading ? <LinearProgress /> : null}
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
                {navigationLoad && <LinearProgress />}
              </Grid>
            </Grid>
            <Grid container paddingY={"20px"}>
              <Grid item xs={12}>
                <form>
                  <Grid container>
                    {/* Maps the dropdown box and TextField  */}
                    <FormFieldMapper
                      formFields={ActOnLeaveConfig.formFields}
                      onChange={handleChange}
                      gridSizes={GridSizes.onbordingFieldSizes}
                    />
                  </Grid>
                  {/* Submit the approval of leave */}
                  {/* <SubmitButton
                    label={"Act on Leave"}
                    type="submit"
                    disabled={isError}
                    progress={progress}
                  /> */}
                  <Button
                    id="actOnLeaveBtn"
                    variant="contained"
                    onClick={handleClickOpen}
                    fullWidth
                    disabled={isError}
                  >
                    Act On Leave
                  </Button>
                </form>
              </Grid>
            </Grid>
          </Grid>
        </PaperComponent>
      </Box>

      {/* Propt to act on leave */}
      <Dialog open={openModal} maxWidth="sm" fullWidth onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Act on Leave
        </DialogTitle>
        <Divider />
        {progress && <LinearProgress />}
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
        <DialogContent>
          <Box
            sx={{
              textAlign: "center",
              flexDirection: "row",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ErrorOutlineIcon sx={{ color: "#FFA500", marginRight: "2%" }} />
            <Paragraph
              text={"Would you like to " + statusCheck + " The Leave Request?"}
              fontWeight={"bold"}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link className="breadCrumbLink" to="/home">
          Home
        </Link>
        <Link className="breadCrumbLink" to="/manage-leave">
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
