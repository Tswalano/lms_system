import React, { useState } from "react";
import { Grid, Paper, Box } from "@mui/material";
import Heading from "../ui/Heading";
import SubmitButton from "../ui/Button";
import TextInput from "../ui/TextInputField";


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

function ApplyForLeave() {
  return (
    <>
      <Box sx={{ textAlign: "center" }}>
        <Heading text="Leave Application" />
      </Box>
      <SubmitButton
        id="loginButton"
        label="Apply For Leave"
      />
       <div>
          <label>Select a date:</label>
          <input type="date" value={selectedDate} onChange={(e) => handleDateSelect(e.target.value)} />
        </div>
        <div>
          <label>Upload documents:</label>
          <input type="file" onChange={handleFileUpload} />
        </div>
    </>
  );
}

export default ApplyForLeave;
