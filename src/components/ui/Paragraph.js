import { Typography } from "@mui/material";
import React from "react";

function Paragraph({ text, fontWeight }) {
  return (
    <>
      <Typography
        variant="body1"
        sx={{
          fontFamily: "Geologica",
          fontWeight: { fontWeight },
          color: "#455a64",
        }}
      >
        {text}
      </Typography>
    </>
  );
}

export default Paragraph;
