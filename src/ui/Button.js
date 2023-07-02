import React from "react";
import { Button } from "@mui/material";

const SubmitButton = ({ id, label, disabled }) => {
  return (
    <Button
      disabled={disabled}
      fullWidth
      id={id}
      type="submit"
      variant="contained"
      color="primary"
      sx={{ color: "white" }}
    >
      {label}
    </Button>
  );
};

export default SubmitButton;
