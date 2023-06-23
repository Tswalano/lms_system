import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { TextField } from "@mui/material";
import Heading from "../../ui/Heading";
import Dropdown from "../../ui/DropBox";
import SubmitButton from "../../ui/Button";

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
    { value: "Maternity Leave", labelText: "Maternity Leave" },
    { value: "Bereavement", labelText: "Bereavement" },
    { value: "Family Responsibility", labelText: "Family Responsibility" },
    { value: "Paternity Leave", labelText: "Paternity Leave" },
  ];

  return (
    <>
      {/*Leave Application Heading*/}
      <Box container={"div"} sx={{ textAlign: "center" }}>
        <Heading text="Leave Application" />
      </Box>
      {/*Leave Type dropbox with leave type options*/}
      <Grid>
        <Grid item xs={3}>
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
      </Grid>
      {/*Calendar for Start and End date*/}
      <div>
        <label>Start Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateSelect(e.target.value)}
        />
      </div>
      {/*Radiogroup for Half day and Full day*/}
      <div>
        <FormControl>
          <RadioGroup
            row
            aria-labelledby="demo-row-radio-buttons-group-label"
            name="row-radio-buttons-group"
          >
            <FormControlLabel
              value="Half Day"
              control={<Radio />}
              label="Half Day"
            />
            <FormControlLabel
              value="Full Day"
              control={<Radio />}
              label="Full Day"
            />
          </RadioGroup>
        </FormControl>
      </div>
      <div>
        <TextField
          label="Add comments here..."
          placeholder="Enter text here"
          variant="outlined"
        />
      </div>
      <div>
        <label>Upload documents:</label>
        <FileUploadIcon>
          {" "}
          <input type="file" onChange={handleFileUpload} />
        </FileUploadIcon>
      </div>
      <Grid container justify="center" alignItems="center">
        <Grid item xs={12} sm={6} md={4} lg={3} xl={2}>
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
