import React from "react";
import { Button } from "@mui/material";

const SubmitButton = ({ type, label, disabled }) => {
  return (
    <Button
      disabled={disabled}
      fullWidth
      type={type}
      variant="contained"
      color="primary"
      sx={{ color: "white" }}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;
