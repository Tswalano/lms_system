import React from "react";
import Heading from "../../components/ui/Heading";
import { Paper } from "@mui/material";

function Home() {
  return (
    <>
      <Paper sx={{ maxWidth: "100%", padding: "20px" }}>
        <Heading text="Welcome to Disraptor" />
      </Paper>
    </>
  );
}

export default Home;
