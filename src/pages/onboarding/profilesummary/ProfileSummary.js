import { Box, Grid } from "@mui/material";
import React, { useState } from "react";
import PaperComponent from "../../../components/ui/Paper";
import Paragraph from "../../../components/ui/Paragraph";
import SubmitButton from "../../../components/ui/Button";
import Heading from "../../../components/ui/Heading";
import CenteredBox from "../../../components/ui/CenteredBox";

const ProfileSummary = () => {
  const [firstName, setFirstName] = useState("1");
  const [lastName, setLastName] = useState("2");
  const [email, setEmail] = useState("3");
  const [phoneNumber, setPhoneNumber] = useState("4");
  const [jobTitle, setJobTitle] = useState("5");

  if (!firstName && !lastName && !email && !phoneNumber && jobTitle) {
    setFirstName("abcde");
    setLastName("abcde");
    setEmail("@something.co.za");
    setPhoneNumber("0111111111");
    setJobTitle("Chef");
  }

  return (
    <CenteredBox>
      <Box sx={{ width: "100%" }}>
        <PaperComponent>
          <Box sx={{ textAlign: "center", paddingBottom: "20px" }}>
            <Heading text="Profile" />
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={2}>
              <Paragraph text="Full Name:" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={10}>
              <Paragraph
                text={`${firstName} ${lastName}`}
                fontWeight="normal"
              />
            </Grid>
            <Grid item xs={2}>
              <Paragraph text="Email:" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={10}>
              <Paragraph text={email} fontWeight={"normal"} />
            </Grid>
            <Grid item xs={2}>
              <Paragraph text="Phone Number:" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={10}>
              <Paragraph text={phoneNumber} fontWeight={"normal"} />
            </Grid>
            <Grid item xs={2}>
              <Paragraph text="Job Title:" fontWeight={"bold"} />
            </Grid>
            <Grid item xs={10}>
              <Paragraph text={jobTitle} fontWeight={"normal"} />
            </Grid>
          </Grid>
          <Box sx={{ marginTop: 2 }}>
            <SubmitButton label="Update Profile " type="button" />
          </Box>
          <Box sx={{ marginTop: 2 }}>
            <SubmitButton label="Change Password" type="button" />
          </Box>
        </PaperComponent>
      </Box>
    </CenteredBox>
  );
};
export default ProfileSummary;
