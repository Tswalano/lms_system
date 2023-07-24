import {
  Box,
  Breadcrumbs,
  Typography,
  Grid,
  Divider,
  LinearProgress,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import PaperComponent from "../../../components/ui/Paper";
import Paragraph from "../../../components/ui/Paragraph";
import { Link } from "react-router-dom";
import APIEndPoints from "../../../api/APIEndPoints";
import { getDataByID } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";

//Formats the date and removes string and '0' values
function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function ViewLeave() {
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
  const [approval, setApproval] = useState("");
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  const ctx = useContext(AuthContext);

  useEffect(() => {
    const fetchLeaveData = async () => {
      const endpoint = new APIEndPoints().getLeaveByID();
      const leaveId = { id };
      const data = await getDataByID(endpoint, leaveId, ctx.token);
      if (data) {
        if (!empName) {
          setEmpName(data.User.firstName + " " + data.User.lastName);
          setLeaveType(data.leave_type);
          setStartDate(dateFormat(data.start_date));
          setEndDate(dateFormat(data.end_date));
          setLeaveLength(data.duration);
          setComments("Require Days off (Not Implemented)");
          setAttachments(
            "https://www.dexform.com/download/sample-letter-from-your-doctor-or-other-service-provider"
          );
          setApproval("Approved");
          setStatus(data.status);
          setFeedback(data.feedback);
        }
      }
      setIsLoading(false);
    };
    fetchLeaveData();
  }, []);

  return (
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
          <Grid container paddingY={"20px"}>
            <Grid item xs={12}>
              <Typography
                color="primary"
                fontFamily="Geologica"
                fontWeight="normal"
              >
                Leave Feedback
              </Typography>
              <Divider />
              {isLoading ? <LinearProgress /> : null}
            </Grid>
          </Grid>
          {/* Shows Leave approval status */}
          <Grid container paddingTop={"10px"}>
            <Grid item xs={4}>
              <Paragraph text="Leave Approved / Rejected" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={8}>
              <Paragraph text={approval} fontWeight={"normal"} />
            </Grid>
          </Grid>
          {/* Shows Leave overall status */}
          <Grid container paddingY={"6px"}>
            <Grid item xs={4}>
              <Paragraph text="Leave Status" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={8}>
              <Paragraph text={status} fontWeight={"normal"} />
            </Grid>
          </Grid>
          {/* Shows feedback comments */}
          <Grid container paddingY={"6px"}>
            <Grid item xs={4}>
              <Paragraph text="Leave Feedback Comment" fontWeight={"bold"} />
            </Grid>
            {/* Shows employees comments from GET on axios */}
            <Grid item xs={8}>
              {/* sets a scroll box if it exceeds a certain height */}
              <Box sx={{ maxHeight: "120px", overflow: "auto" }}>
                <Paragraph text={feedback} fontWeight={"normal"} />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </PaperComponent>
    </Box>
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
          View Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ViewLeave;
