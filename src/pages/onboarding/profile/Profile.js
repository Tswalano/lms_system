import React, { useState, useContext, useEffect } from "react";
import PaperComponent from "../../../components/ui/Paper";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import {
  Box,
  Grid,
  Divider,
  Typography,
  Button,
  LinearProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
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
import APIEndPoints from "../../../api/APIEndPoints";
import { postResponse } from "../../../api/API";
import jwtDecode from "jwt-decode";

function Profile() {
  // add employee modal
  const [open, setOpen] = React.useState(false);

  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [jobTitle, setJobTitle] = useState();
  const [phone, setPhone] = useState();
  const [email, setEmail] = useState();
  const [profileData, setProfileData] = useState({});

  const [isValuesEmpty, setIsValuesEmpty] = useState(false);

  const [getDataCount, setGetDataCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const ctx = useContext(AuthContext);
  const sideNav = document.getElementById("sideNav");
  const editProfile = document.getElementById("editProfile");

  //FetchData Method to fetch data for employee to view their information
  const getData = async () => {
    try {
      const endpoint = new APIEndPoints().viewEmployeeByID();
      const id = jwtDecode(ctx.token).user.id;
      const getID = { id };

      const anyFieldIsEmpty =
        !firstName || !lastName || !jobTitle || !phone || !email;
      const anyFieldIsFilled =
        firstName || lastName || jobTitle || phone || email;

      const response = await postResponse(endpoint, getID, ctx.token);
      if (anyFieldIsEmpty || anyFieldIsFilled) {
        setFirstName(response.data.firstName);
        setLastName(response.data.lastName);
        setJobTitle(response.data.jobTitle);
        setPhone(response.data.phoneNumber);
        setEmail(response.data.email);
      }

      setProfileData({
        firstName: firstName,
        lastName: lastName,
        jobTitle: jobTitle,
        phone: phone,
      });
      setIsLoading(false);
    } catch (error) {
      return error;
    }
  };

  useEffect(() => {
    if (sideNav && editProfile) {
      if (
        firstName === null ||
        lastName === null ||
        jobTitle === null ||
        phone === null ||
        email === null
      ) {
        sideNav.style.pointerEvents = "none";
        editProfile.style.pointerEvents = "auto";
        setIsValuesEmpty(true);
      } else {
        sideNav.style.pointerEvents = "auto";
        setIsValuesEmpty(false);
      }
    }
    setProfileData({
      firstName: firstName,
      lastName: lastName,
      jobTitle: jobTitle,
      phone: phone,
    });
    if (getDataCount < 2) {
      getData();
      setGetDataCount((prevCount) => prevCount + 1);
    }
  }, [profileData, getDataCount]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsLoading(true);
    getData();
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
                id="editProfile"
                variant="contained"
                endIcon={<EditNoteIcon />}
                onClick={handleClickOpen}
              >
                Edit Profile
              </Button>
              <br />
              <br />
            </Box>
            {isValuesEmpty ? (
              <Alert severity="info">
                <AlertTitle>Profile not updated</AlertTitle>
                Please update your profile —{" "}
                <strong>Edit Profile {<EditNoteIcon />}</strong>
              </Alert>
            ) : null}
            <Typography
              color="primary"
              fontFamily="Geologica"
              fontWeight="normal"
            >
              {"Profile Overview"}
            </Typography>
            <div style={{ width: "95%" }}>
              <Divider />
              {isLoading ? <LinearProgress /> : null}
            </div>

            <Grid container sx={{ padding: "15px", overflow: "hidden" }}>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee First Name */}
                <Grid item xs={5}>
                  <Paragraph text="First Name" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph text={firstName} fontWeight="normal" />
                </Grid>
              </Grid>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee Last Name */}
                <Grid item xs={5}>
                  <Paragraph text="Last Name" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph text={lastName} fontWeight="normal" />
                </Grid>
              </Grid>
              <Grid container sx={{ paddingY: "6px" }}>
                {" "}
                {/* Employee Job Title */}
                <Grid item xs={5}>
                  <Paragraph text="Job Title" fontWeight="bold" />
                </Grid>
                <Grid item xs={7}>
                  <Paragraph text={jobTitle} fontWeight="normal" />
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
                  {isLoading ? <LinearProgress /> : null}
                </div>
              </Grid>
              <Grid container sx={{ padding: "15px", overflow: "hidden" }}>
                <Grid container sx={{ paddingY: "6px" }}>
                  {/* Employee Phone Number */}
                  <Grid item xs={5}>
                    <Paragraph text="Phone" fontWeight="bold" />
                  </Grid>
                  <Grid item xs={7}>
                    <a href={`tel:${phone}`} style={{ textDecoration: "none" }}>
                      <Paragraph text={phone} fontWeight="normal" />
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
                      href={`mailto:${email}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Paragraph text={email} fontWeight="normal" />
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
      <Dialog open={open} maxWidth="sm" fullWidth onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Edit Profile
        </DialogTitle>
        <Divider />
        <DialogContent>
          <ProfileUpdate
            handleModalClose={handleClose}
            profileData={profileData}
          />
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
  useEffect(() => {}, [ctx.isAdmin]);
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          to={ctx.isAdmin === "admin" ? "/home" : "/dashboard"}
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
