import React from "react";
import Box from "@mui/material/Box";
import PropTypes from "prop-types";

function CenteredBox({ children }) {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      height="100vh"
      sx={{
        marginLeft: "auto",
        marginRight: "auto",
        width: "100%",
      }}
    >
      <Box
        display={"flex"}
        flexDirection={"column"}
        justifyContent="center"
        alignItems="center"
        sx={{
          width: "100%",
          padding: "20px",
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

CenteredBox.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CenteredBox;
