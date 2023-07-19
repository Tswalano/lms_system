import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import React from "react";
import Heading from "../../../components/ui/Heading";
import TableComponent from "../../../components/table/TableComponent";
import EmployeesTableConfig from "./EmployeesTableConfig";
import PaperComponent from "../../../components/ui/Paper";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Paragraph from "../../../components/ui/Paragraph";
// modal dialog
import { Link } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import AddEmployee from "../AdminAddEmployees/AddEmployee";

function ManageEmployees() {
  // create / retrieve employee data
  const rowsData = [
    {
      id: "1",
      firstName: "Phil",
      lastName: "Maitisa",
      email: "philemon.maitisa@disraptor.co.za",
      phone: "0791119292",
      jobTitle: "Cloud & DevOps Engineer",
      view: <Link to="/manage-employees/employee?id=1">open</Link>,
    },
    {
      id: "2",
      firstName: "Mayur",
      lastName: "Mistry",
      email: "mayur.mistry@disraptor.co.za",
      phone: "0668857412",
      jobTitle: "Cloud & DevOps Engineer",
      view: <Link to="/manage-employees/employee?id=2">open</Link>,
    },
    {
      id: "3",
      firstName: "Jino",
      lastName: "Rigney",
      email: "jino.rigney@disraptor.co.za",
      phone: "0784453698",
      jobTitle: "Cloud & DevOps Engineer",
      view: <Link to="/manage-employees/employee?id=3">open</Link>,
    },
    {
      id: "4",
      firstName: "Kgomotso",
      lastName: "Dungeni",
      email: "kgomotso.dungeni@disraptor.co.za",
      phone: "0187523369",
      jobTitle: "Cloud & DevOps Engineer",
      view: <Link to="/manage-employees/employee?id=4">open</Link>,
    },
    {
      id: "5",
      firstName: "Given",
      lastName: "Makofane",
      email: "given.makofane@disraptor.co.za",
      phone: "0791228585",
      jobTitle: "Cloud & DevOps Engineer",
      view: <Link to="/manage-employees/employee?id=5">open</Link>,
    },
  ];

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
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            <PaperComponent>
              <Grid container>
                <Grid item xs={2}>
                  <Heading text="10" />
                </Grid>
                <Grid item xs={10}>
                  <Paragraph text={"Total number"} fontWeight="bold" />
                  <Paragraph text={"of employees"} fontWeight="bold" />
                  <Box sx={{ color: "#9e9e9e" }}>
                    <span style={{ fontWeight: "bold" }}>2</span> incomplete
                    profiles
                  </Box>
                </Grid>
              </Grid>
            </PaperComponent>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            <PaperComponent>
              <Grid container>
                <Grid item xs={2}>
                  <Heading text="5" />
                </Grid>
                <Grid item xs={10}>
                  <Paragraph text={"Total number of"} fontWeight="bold" />
                  <Paragraph text={"pending invitations"} fontWeight="bold" />
                  <Link underline="hover" href="#">
                    Manage
                  </Link>
                </Grid>
              </Grid>
            </PaperComponent>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            <PaperComponent>
              <Paragraph text="Onboard new employees" fontWeight="normal" />
              <Button
                fullWidth
                color="primary"
                variant="contained"
                sx={{ color: "#fff", marginTop: "15px" }}
                onClick={handleClickOpen}
              >
                Invite New Employee
              </Button>
            </PaperComponent>
          </Grid>
        </Grid>
        <br />
        <br />
        <Paragraph text="Employees Table" fontWeight="bold" />
        <div style={{ height: "8px" }}></div>
        <TableComponent
          columnsData={EmployeesTableConfig.columnsData}
          rowsData={rowsData}
        />
      </Box>

      {/* add employee modal dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle sx={{ color: "#2196f3", fontWeight: "bold" }}>
          Invite New Employee
        </DialogTitle>
        <Divider />
        <DialogContent>
          <DialogContentText>
            Provide the new employee's fisrt and last names to send them an
            invitation to sign up on the system as part of their onboarding
            process.
          </DialogContentText>
          <br />
          <AddEmployee />
        </DialogContent>
        <Divider />
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
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
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Manage employees
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ManageEmployees;
