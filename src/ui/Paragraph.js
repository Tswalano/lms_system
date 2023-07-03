import { Typography } from "@mui/material";
import React from "react";

function Paragraph({ text, fontWeight }) {
  return (
    <>
      <Typography
        variant="body1"
        color={"dark"}
        sx={{
          fontFamily: "Geologica",
          fontWeight: { fontWeight },
          color: "#263238",
        }}
      >
        {text}
      </Typography>
    </>
  );
}

export default Paragraph;
