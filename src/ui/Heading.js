import { Typography } from "@mui/material";
import React from "react";

function Heading({ text }) {
  return (
    <>
      <Typography
        variant="h5"
        sx={{
          fontFamily: "Geologica",
          fontWeight: "bold",
          paddingBottom: "30px",
          color: "#2196f3",
        }}
      >
        {text}
      </Typography>
    </>
  );
}

export default Heading;
