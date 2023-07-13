import React, { useState, useContext } from "react";
import PaperComponent from "../../../components/ui/Paper";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import { Box, Grid, Divider, Typography, Button } from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import UpdatePassword from "./UpdatePassword";
import EditNoteIcon from "@mui/icons-material/EditNote";
// modal dialog
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import ProfileUpdate from "./ProfileUpdate";
import { AuthContext } from "../../../context/AuthContext";

function Profile() {
  // add employee modal
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Box sx={{ width: "100%" }}>
        <Breadcrumb />
        <br />
        <Grid container spacing={3}>
          {/* Employee details (overview) section */}
          <Grid item xs={12} sm={12} md={7} lg={7}>
            <Box
              sx={{
                textAlign: "right",
                paddingRight: "5%",
                paddingBottom: "0px",
              }}
            >
              <Button
                variant="contained"
                endIcon={<EditNoteIcon />}
                onClick={handleClickOpen}
              >
                Edit Profile
              </Button>
              <br />
              <br />
            </Box>
            <Typography
              color="primary"
              fontFamily="Geologica"
              fontWeight="normal"
            >
              {"Profile Overview"}
            </Typography>
            <div style={{ width: "95%" }}>
              <Divider />
            </div>
            <Grid container sx={{ padding: "15px", overflow: "hidden" }}>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee First Name */}
                <Grid item xs={5}>
                  <Paragraph text="First Name" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph text="Philemon" fontWeight="normal" />
                </Grid>
              </Grid>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee Last Name */}
                <Grid item xs={5}>
                  <Paragraph text="Last Name" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph text="Maitisa" fontWeight="normal" />
                </Grid>
              </Grid>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee Job Title */}
                <Grid item xs={5}>
                  <Paragraph text="Job Title" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph
                    text="Cloud and DevOps Engineer"
                    fontWeight="normal"
                  />
                </Grid>
              </Grid>
            </Grid>
            {/* Contact details section */}
            <Grid container sx={{ paddingY: "15px" }}>
              <Grid item xs={12}>
                <Typography
                  color="primary"
                  fontFamily="Geologica"
                  fontWeight="normal"
                >
                  {"Contact details"}
                </Typography>
                <div style={{ width: "95%" }}>
                  <Divider />
                </div>
              </Grid>
              <Grid container sx={{ padding: "15px", overflow: "hidden" }}>
                <Grid container sx={{ paddingY: "6px" }}>
                  {/* Employee Phone Number */}
                  <Grid item xs={5}>
                    <Paragraph text="Phone" fontWeight="bold" />
                  </Grid>
                  <Grid item xs={7}>
                    <a href="tel:0791119292" style={{ textDecoration: "none" }}>
                      <Paragraph text="0791119292" fontWeight="normal" />
                    </a>
                  </Grid>
                </Grid>
                <Grid container sx={{ paddingY: "6px" }}>
                  {/* Employee Email Address */}
                  <Grid item xs={5}>
                    <Paragraph text="Email Address" fontWeight="bold" />
                  </Grid>
                  <Grid item xs={7}>
                    <a
                      href="mailto:philemon.maitisa@disraptor.co.za"
                      style={{ textDecoration: "none" }}
                    >
                      <Paragraph
                        text="philemon.maitisa@disraptor.co.za"
                        fontWeight="normal"
                      />
                    </a>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* Manage employee role sesction */}
          <Grid item xs={12} sm={12} md={5} lg={5}>
            <PaperComponent>
              <Typography
                color="primary"
                fontFamily="Geologica"
                fontWeight="bold"
              >
                Update Password
              </Typography>
              <Divider />
              <br />
              <UpdatePassword />
            </PaperComponent>
          </Grid>
        </Grid>
      </Box>

      {/* add employee modal dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Edit Profile
        </DialogTitle>
        <Divider />
        <DialogContent>
          <ProfileUpdate />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Breadcrumb() {
  const ctx = useContext(AuthContext);
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          href={ctx.isAdmin ? "/home" : "/dashboard"}
        >
          Home
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Profile
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default Profile;
