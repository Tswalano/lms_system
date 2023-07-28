import React from "react";
import Heading from "../../components/ui/Heading";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import PaperComponent from "../../components/ui/Paper";
import { Box, Typography } from "@mui/material";

function Home() {
  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <PaperComponent>
        <Heading text="Welcome to Disraptor" />
      </PaperComponent>
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Dashboard
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default Home;
