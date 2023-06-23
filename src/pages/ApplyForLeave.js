import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import Heading from "../ui/Heading";
import SubmitButton from "../ui/Button";
import Paragraph from "../ui/Paragraph";
import Dropdown from "../ui/DropBox";

const LeaveForm = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [documents, setDocuments] = useState([]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    setDocuments([...documents, uploadedFile]);
  };
  setSelectedDate(null);
  setDocuments([]);
};

const handleLogin = (event) => {
  event.preventDefault();
};

function ApplyForLeave() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [leaveType, setLeaveType] = useState("");
  const [isLeaveTypeError, setIsLeaveTypeError] = useState(false);
  const [leaveTypeErrorMessage, setLeaveTypeErrorMessage] = useState("");

  const handleDropdownChange = (event) => {
    const { value } = event.target || "";
    setLeaveType(value);
    setIsLeaveTypeError(false);

    if (value === "No value" || value === "") {
      setIsLeaveTypeError(true);
      setLeaveTypeErrorMessage("Please select a valid leave type");
    } else {
      setIsLeaveTypeError(false);
      setLeaveTypeErrorMessage("");
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleFileUpload = (file) => {};

  // leave type options object
  const leaveTypeOptions = [
    { value: "Sick Leave", labelText: "Sick Leave" },
    { value: "Annual Leave", labelText: "Annual Leave" },
    { value: "Efgfg Leave", labelText: "JJhhh Leave" },
  ];

  return (
    <>
      <Box container={"div"} sx={{ textAlign: "center" }}>
        <Heading text="Leave Application" />
      </Box>

      <Grid item xs={12}>
        <Dropdown
          id="leaveType"
          label="Leave Type"
          options={leaveTypeOptions}
          value={leaveType}
          onChange={handleDropdownChange}
          isError={isLeaveTypeError}
          errorMessage={leaveTypeErrorMessage}
        />
      </Grid>
      <div>
        <label>Select a date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateSelect(e.target.value)}
        />
      </div>
      <div>
        <label>Upload documents:</label>
        <input type="file" onChange={handleFileUpload} />
      </div>
      <Grid container>
        <Grid item xs={10} sm={10} md={6} lg={4} xl={4}>
          <Grid container></Grid>

          <SubmitButton
            id="loginButton"
            label="Apply For Leave"
            onClick={handleLogin}
          />
        </Grid>
      </Grid>
    </>
  );
}

export default ApplyForLeave;
