import { Typography } from "@mui/material";
import React from "react";

function Paragraph({ text }) {
  return (
    <>
      <Typography
        variant="body1"
        color={"dark"}
        sx={{
          fontFamily: "Geologica",
          fontWeight: "normal",
          color: "#263238",
        }}
      >
        {text}
      </Typography>
    </>
  );
}

export default Paragraph;
