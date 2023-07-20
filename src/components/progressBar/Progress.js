import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import CenteredBox from "../ui/CenteredBox";
import { Alert, Collapse, IconButton } from "@mui/material";
import { green } from "@mui/material/colors";

export default function ProgressLoader() {
  const timerRef = useRef();
  const [open, setOpen] = useState(true);
  const [alertMessage, setAlertMessage] = useState();
  const [alertType, setAlertType] = useState();
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  /*
    Error Types: error, warning, info, success
  */

  React.useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    []
  );

  const handleClickQuery = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(true);
      timerRef.current = window.setTimeout(() => {
        setSuccess(true);
        setLoading(false);
        setAlertMessage("This was successful");
        setAlertType("error");
        setOpen(true);
      }, 2000);
    }
  };

  return (
    <CenteredBox>
      {success === true ? (
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
                <CloseIcon
                  fontSize="inherit"
                  onClick={() => {
                    setLoading(false);
                    setSuccess(false);
                  }}
                />
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
      <Box sx={{ m: 1, position: "relative" }}>
        <Button
          variant="contained"
          sx={{
            ...(success && {
              bgcolor: green[500],
              "&:hover": {
                bgcolor: green[700],
              },
            }),
          }}
          disabled={loading}
          onClick={handleClickQuery}
        >
          {loading === false
            ? "Start"
            : loading === true
            ? "Loading"
            : "Successfully loaded"}
        </Button>
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              color: "primary",
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-12px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>
    </CenteredBox>
  );
}
