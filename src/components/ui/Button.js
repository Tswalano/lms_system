import React from "react";
import { Box, Button, CircularProgress } from "@mui/material";

const SubmitButton = ({ type, label, disabled, progress }) => {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Button
        disabled={disabled || progress}
        fullWidth
        type={type}
        variant="contained"
        color="primary"
        sx={{ color: "white" }}
      >
        {label}
      </Button>
      {progress && (
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
  );
};

export default SubmitButton;
