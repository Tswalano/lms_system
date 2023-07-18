import {
  Box,
  Breadcrumbs,
  Typography,
  Link,
  Grid,
  Divider,
} from "@mui/material";
import React, { useState } from "react";
import PaperComponent from "../../../components/ui/Paper";
import Paragraph from "../../../components/ui/Paragraph";

function ViewMyLeave() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);

  // Access the value of employee id from query string
  const employee_id = params.get("id");
  // declare useState variables
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveLength, setLeaveLength] = useState("");
  const [comments, setComments] = useState("");
  const [attachments, setAttachments] = useState("");
  const [approval, setApproval] = useState("");
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");

  //change to axios
  if (!leaveType) {
    setLeaveType("Annual Leave");
    setStartDate("22/07/2023");
    setEndDate("22/07/2023");
    setLeaveLength("Full Day");
    setComments(
      "For writers looking for a way to get their creative writing juices flowing, using a random paragraph can be a great way to do this. One of the great benefits of this tool is that nobody knows what is going to appear in the paragraph. This can be leveraged in a few different ways to force the writer to use creativity. For example, the random paragraph can be used as the beginning paragraph of a story that the writer must finish. I can also be used as a paragraph somewhere inside a short story, or for a more difficult creative challenge, it can be used as the ending paragraph. In every case, the writer is forced to use creativity to incorporate the random paragraph into the story."
    );
    setAttachments(
      "https://www.dexform.com/download/sample-letter-from-your-doctor-or-other-service-provider"
    );
    setApproval("Approved");
    setStatus("Active");
    setFeedback("None");
  }

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
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Link underline="hover" color="inherit" href="/my-leave">
          My Leave
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          View Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ViewMyLeave;
