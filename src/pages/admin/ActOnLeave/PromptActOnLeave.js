import { Alert, Box, Button, Collapse, Grid, IconButton } from "@mui/material";
import React, { useState } from "react";
import SubmitButton from "../../../components/ui/Button";
import CloseIcon from "@mui/icons-material/Close";

function PromptActOnLeave({ dataArray, handleModalClose }) {
  const [open, setOpen] = useState(true);
  const [response, setResponse] = useState(false);
  const [alertType, setAlertType] = useState();
  const [alertMessage, setAlertMessage] = useState();

  const handleSubmit = () => {};

  const HandleYesMethod = () => {
    console.log(dataArray);
    setResponse(true);
    setAlertType("success");
    setAlertMessage("You have successfully acted on leave.");
  };
  const HandleNoMethod = () => {
    handleModalClose();
  };

  return (
    <Box sx={{ width: "100%" }}>
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
      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              id="actOnLeaveBtn"
              variant="contained"
              onClick={HandleYesMethod}
              fullWidth
            >
              Yes
            </Button>
          </Grid>

          <Grid item xs={6}>
            <Button
              id="actOnLeaveBtn"
              variant="contained"
              onClick={HandleNoMethod}
              fullWidth
            >
              No
            </Button>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
}
export default PromptActOnLeave;
