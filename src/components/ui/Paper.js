import React from "react";
import Paper from "@mui/material/Paper";
import PropTypes from "prop-types";

function PaperComponent({ children }) {
  return (
    <Paper
      elevation={2}
      sx={{
        padding: "25px",
      }}
    >
      {children}
    </Paper>
  );
}

PaperComponent.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PaperComponent;
