import React, { useContext, useEffect, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Paragraph from "../../../components/ui/Paragraph";
import PaperComponent from "../../../components/ui/Paper";
import { Link } from "react-router-dom";
import APIEndPoints from "../../../api/APIEndPoints";
import { AuthContext } from "../../../context/AuthContext";
import { postResponse } from "../../../api/API";

function Employee() {
  // Create a URLSearchParams object with the current URL's query string
  const params = new URLSearchParams(window.location.search);

  // Access the value of employee id from query string
  const id = params.get("id");

  // create useState variables for manage role values
  const [role, setRole] = React.useState("admin");

  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [jobTitle, setJobTitle] = useState();
  const [empID, setEmpID] = useState();
  const [userRole, setUserRole] = useState();
  const [phone, setPhone] = useState();
  const [email, setEmail] = useState();

  const ctx = useContext(AuthContext);

  useEffect(() => {
    const getData = async () => {
      try {
        const endpoint = new APIEndPoints().viewEmployeeByID();
        const userID = { id };
        const data = await postResponse(endpoint, userID, ctx.token);
        console.log(data);
        if (
          !firstName ||
          !lastName ||
          !jobTitle ||
          !empID ||
          !userRole ||
          !phone ||
          !email
        ) {
          setFirstName(data.data.firstName);
          setLastName(data.data.lastName);
          setJobTitle(data.data.jobTitle);
          setEmpID(data.data.id);
          setUserRole(data.data.role);
          setPhone(data.data.phoneNumber);
          setEmail(data.data.email);
        }
      } catch (error) {
        console.log(error);
      }
    };
    getData();
  }, []);

  // handle change of checking role boxes
  const handleChange = (event) => {
    setRole(event.target.value);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <Grid container spacing={3}>
        {/* Employee details (overview) section */}
        <Grid item xs={12} sm={12} md={7} lg={7}>
          <Typography
            color="primary"
            fontFamily="Geologica"
            fontWeight="normal"
          >
            {"Employee details " + empID}
          </Typography>
          <div style={{ width: "85%" }}>
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
                <Paragraph text={firstName} fontWeight="normal" />
              </Grid>
            </Grid>
            <Grid container sx={{ paddingY: "6px" }}>
              {" "}
              {/* Employee Last Name */}
              <Grid item xs={5}>
                <Paragraph text={"Last Name"} fontWeight="bold" />
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
            <Grid container sx={{ paddingY: "6px" }}>
              {/* Employee ID */}
              <Grid item xs={5}>
                <Paragraph text="Employee ID" fontWeight="bold" />
              </Grid>
              <Grid item xs={7}>
                <Paragraph text={empID} fontWeight="normal" />
              </Grid>
            </Grid>
            <Grid container sx={{ paddingY: "6px" }}>
              <Grid item xs={5}>
                <Paragraph text="Role" fontWeight="bold" />
              </Grid>
              <Grid item xs={7}>
                <Paragraph text={userRole} fontWeight="normal" />
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
              <div style={{ width: "85%" }}>
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
                  <a href={phone} style={{ textDecoration: "none" }}>
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
                  <a href={email} style={{ textDecoration: "none" }}>
                    <Paragraph text={email} fontWeight="normal" />
                  </a>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Manage employee role sesction */}
        <Grid item xs={12} sm={12} md={5} lg={5}>
          <br />
          <PaperComponent>
            <Typography
              color="primary"
              fontFamily="Geologica"
              fontWeight="bold"
            >
              Manage Employee Role
            </Typography>
            <Divider />
            <br />
            <Grid container sx={{ paddingY: "6px" }}>
              <Grid item xs={5}>
                <Paragraph text="Change Role" fontWeight="bold" />
              </Grid>
              <Grid item xs={7}>
                <RadioGroup
                  name="manage-role"
                  value={role}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value="admin"
                    control={<Radio />}
                    label="Admin"
                  />
                  <FormControlLabel
                    value="user"
                    control={<Radio />}
                    label="User"
                  />
                </RadioGroup>
              </Grid>
              <Grid item xs={12} sx={{ paddingTop: "15px" }}>
                <Button variant="contained" fullWidth>
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </PaperComponent>

          <br />
          <PaperComponent>
            <Typography
              color="primary"
              fontFamily="Geologica"
              fontWeight="bold"
            >
              Leave Overview
            </Typography>
            <Divider />
            <br />
            <Grid container sx={{ paddingY: "6px" }}>
              <Grid item xs={6}>
                <Paragraph text="Pending Leave" fontWeight="bold" />
              </Grid>
              <Grid item xs={6}>
                <Paragraph text="0" fontWeight="normal" />
              </Grid>
            </Grid>
            <Grid container sx={{ paddingY: "6px" }}>
              <Grid item xs={6}>
                <Paragraph text="Active Leave" fontWeight="bold" />
              </Grid>
              <Grid item xs={6}>
                <Paragraph text="0" fontWeight="normal" />
              </Grid>
            </Grid>
            <Grid container sx={{ paddingY: "6px" }}>
              <Grid item xs={6}>
                <Paragraph text="Upcoming Leave" fontWeight="bold" />
              </Grid>
              <Grid item xs={6}>
                <Paragraph text="1" fontWeight="normal" />
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{ paddingTop: "15px" }}>
              <Button variant="contained" fullWidth>
                View Leave History
              </Button>
            </Grid>
          </PaperComponent>
        </Grid>
      </Grid>
    </Box>
  );
}

// bread crumps
function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" to="/home">
          Home
        </Link>
        <Link underline="hover" color="inherit" to="/manage-employees">
          Manage Employees
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Employee
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default Employee;
