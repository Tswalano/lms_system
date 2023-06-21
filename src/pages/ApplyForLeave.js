import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import Heading from "../ui/Heading";
import SubmitButton from "../ui/Button";

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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleFileUpload = (file) => {};
  return (
    <>
      <Box sx={{ textAlign: "center" }}>
        <Heading text="Leave Application" />
      </Box>
      <div>
        <label>Leave Type:</label>
      </div>
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
        <Grid item xs={10} sm={10} md={6} lg={4} xl={3}>
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
