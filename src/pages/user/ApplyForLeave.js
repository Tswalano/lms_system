import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { TextField } from "@mui/material";
import Heading from "../../components/ui/Heading";
import Dropdown from "../../components/ui/Dropdown";
import SubmitButton from "../../components/ui/Button";

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

const handleSubmit = (event) => {
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
      setLeaveTypeErrorMessage("Please select a leave type");
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
    <Paper elevation={3} style={{ padding: "20px", height: "100%" }}>
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={4}>
          <Grid
            container
            item
            xs={6}
            sx={{ marginLeft: "auto", marginRight: "auto" }}
          >
            {/*Leave Application Heading*/}
            <Heading text="Leave Application" />
          </Grid>
        </Grid>
        <Grid item xs={12}>
          {/*Leave Type dropbox with leave type options*/}
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
        <Grid item xs={12}>
          {/*Calendar for Start and End date*/}
          <div>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <label>Start Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <label>End Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateSelect(e.target.value)}
                />
              </Grid>
            </Grid>
          </div>
        </Grid>
        <Grid item xs={3}>
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
        </Grid>
        <Grid item xs={12}>
          <div>
            <TextField
              label="Add comments here..."
              placeholder="Enter text here"
              variant="outlined"
              fullWidth
              multiline
              minRows={4}
            />
          </div>
        </Grid>
        <Grid item xs={12}>
          <div>
            <label>Upload documents:</label>

            <Grid item xs={12} style={{ textAlign: "right" }}>
              <Paper variant="outlined" style={{ padding: "10px" }}>
                <FileUploadIcon>
                  <input type="file" onChange={handleFileUpload} />
                </FileUploadIcon>
              </Paper>
            </Grid>
          </div>
        </Grid>
        <Grid item xs={18}>
          <Grid
            container
            item
            xs={3}
            sx={{ marginLeft: "auto", marginRight: "auto" }}
          >
            <SubmitButton
              id="loginButton"
              label="Apply For Leave"
              onClick={handleSubmit}
              style={{ width: "50%" }}
            />
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
}

export default ApplyForLeave;
