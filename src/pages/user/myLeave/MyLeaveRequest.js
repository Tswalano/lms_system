import { React, useContext, useState } from "react";
import PaperComponent from "../../../components/ui/Paper";
import {
  Box,
  Grid,
  Breadcrumbs,
  Typography,
  Divider,
  Button,
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import { handleFieldChange } from "../../../components/form/HandleFieldChange";
import { GetFormValues } from "../../../components/form/GetFormValues";
import { validateDropDown } from "../../../components/form/Validations";
import { useEffect } from "react";
import { Link } from "react-router-dom";

// modal dialog
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import UpdateLeaveRequest from "./UpdateLeaveRequest";
import APIEndPoints from "../../../api/APIEndPoints";
import { getDataByID } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import UploadDocument from "../applyforleave/UploadDocument";

function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function MyLeaveRequest() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);
  const [modalOpen, setModalOpen] = useState(false);

  // Access the value of employee id from query string
  const id = params.get("id");
  const [leaveData, setLeaveData] = useState({
    leave_type: "",
    start_date: "",
    end_date: "",
    leave_length: "",
    leave_comment: "",
    id: "",
  });

  // declare useState variables
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveLength, setLeaveLength] = useState("");
  const [leaveStatus, setLeaveStatus] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");

  const [isLoading, setISLoading] = useState(true);

  // form values for act on leave form
  const [formValues, setFormValues] = useState({});
  const [isError, setIsError] = useState(false);

  const ctx = useContext(AuthContext);

  // handle form field values on change
  const handleChange = handleFieldChange(setFormValues);

  const handleValidation = () => {
    // use your existing validation functions to approval
    const isOptionValid = validateDropDown(formValues.approval);

    // Set isError based on the validation results
    setIsError(isOptionValid !== null);
  };

  useEffect(() => {
    handleValidation();
    // Run the validation when formValues state changes
  }, [formValues]);

  const fetchLeaveData = async () => {
    const endpoint = new APIEndPoints().getLeaveByID();
    const leaveID = { id };
    const data = await getDataByID(endpoint, leaveID, ctx.token);

    //checks if response is valid
    if (data) {
      if (!leaveType && !startDate && !comments && !attachments) {
        setLeaveType(data.leave_type);
        setStartDate(dateFormat(data.start_date));
        setEndDate(dateFormat(data.end_date));
        setLeaveLength(data.duration + " day(s)");
        setLeaveStatus(data.status);
        setComments(data.leave_comment);
        setAttachments(data.document);

        setLeaveData({
          id: data.id,
          leave_type: data.leave_type,
          leave_start: data.start_date,
          leave_end: data.end_date,
          leave_length: data.leave_length,
          leave_comment: data.leave_comment,
        });
      }
      setISLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, []);

  // edit request modal
  // add employee modal
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const OpenUploadDocModal = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    fetchLeaveData();
    setISLoading(true);
    setModalOpen(false);
  };

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb />
        <br />
        <PaperComponent>
          <Box sx={{ textAlign: "right" }}>
            <Button variant="contained" onClick={handleClickOpen}>
              Edit Leave Request
            </Button>
          </Box>
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
            {/* Shows Leave status */}
            <Grid container paddingY={"6px"}>
              <Grid item xs={4}>
                <Paragraph text="Leave Status" fontWeight={"bold"} />
              </Grid>
              {/* Shows the date from GET on axios */}
              <Grid item xs={8}>
                <Paragraph text={leaveStatus} fontWeight={"normal"} />
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
                {attachments !== "no supporting documents" ? (
                  <a
                    href={attachments}
                    style={{ textDecoration: "underline" }}
                    target="_blank"
                  >
                    <Paragraph text={attachments} fontWeight={"normal"} />
                  </a>
                ) : (
                  <Button
                    id="uploadDocument"
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    onClick={OpenUploadDocModal}
                  >
                    Upload Document
                  </Button>
                )}
              </Grid>
            </Grid>
          </Grid>
        </PaperComponent>
      </Box>

      {/* edit leave modal dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Edit Leave Request
        </DialogTitle>
        <Divider />
        <DialogContent>
          <UpdateLeaveRequest
            handleModalClose={handleClose}
            leaveData={leaveData}
          />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* add upload doc modal dialog */}
      <Dialog open={modalOpen} maxWidth="sm" fullWidth onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Upload Leave Document
        </DialogTitle>
        <Divider />
        <DialogContent>
          <UploadDocument leaveId={id} />
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
    </>
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
        <Link className="breadCrumbLink" to="/my-leave">
          My Leave
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          My Leave Request
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default MyLeaveRequest;
