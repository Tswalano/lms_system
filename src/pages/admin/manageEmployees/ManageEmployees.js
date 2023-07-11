import { Box, Button, Grid, Link } from "@mui/material";
import React from "react";
import Heading from "../../../components/ui/Heading";
import TableComponent from "../../../components/table/TableComponent";
import EmployeesTableConfig from "./EmployeesTableConfig";
import { useNavigate } from "react-router-dom";
import PaperComponent from "../../../components/ui/Paper";
import Paragraph from "../../../components/ui/Paragraph";

function ManageEmployees() {
  // create a navigate hook
  const navigate = useNavigate("");

  const viewUser = (id) => {
    navigate("/manage-employee?id=" + id);
  };

  const handleAddEmp = () => {
    navigate("/add-employee");
  };

  // create / retrieve employee data
  const rowsData = [
    {
      id: "1",
      firstName: "Phil",
      lastName: "Maitisa",
      email: "philemon.maitisa@disraptor.co.za",
      phone: "0791119292",
      jobTitle: "Cloud & DevOps Engineer",
      view: (
        <Link href="" onClick={viewUser(1)}>
          open
        </Link>
      ),
    },
    {
      id: "2",
      firstName: "Mayur",
      lastName: "Mistry",
      email: "mayur.mistry@disraptor.co.za",
      phone: "0668857412",
      jobTitle: "Cloud & DevOps Engineer",
      view: (
        <Link href="" onClick={viewUser(2)}>
          open
        </Link>
      ),
    },
    {
      id: "3",
      firstName: "Jino",
      lastName: "Rigney",
      email: "jino.rigney@disraptor.co.za",
      phone: "0784453698",
      jobTitle: "Cloud & DevOps Engineer",
      view: (
        <Link href="" onClick={viewUser(3)}>
          open
        </Link>
      ),
    },
    {
      id: "4",
      firstName: "Kgomotso",
      lastName: "Dungeni",
      email: "kgomotso.dungeni@disraptor.co.za",
      phone: "0187523369",
      jobTitle: "Cloud & DevOps Engineer",
      view: (
        <Link onClick={viewUser(4)} href="">
          open
        </Link>
      ),
    },
    {
      id: "5",
      firstName: "Given",
      lastName: "Makofane",
      email: "given.makofane@disraptor.co.za",
      phone: "0791228585",
      jobTitle: "Cloud & DevOps Engineer",
      view: (
        <Link onClick={viewUser(5)} href="">
          open
        </Link>
      ),
    },
  ];

  return (
    <Grid container>
      <Heading text="Manage employees" />
      <Grid item xs={12}>
        <PaperComponent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <Box
                sx={{
                  border: "3px solid #000",
                  borderRadius: "10px",
                  padding: "15px",
                }}
              >
                <Grid container>
                  <Grid item xs={2}>
                    <Heading text="10" />
                  </Grid>
                  <Grid item xs={10}>
                    <Paragraph text={"Total"} fontWeight="bold" />
                    <Paragraph text={"Employees"} fontWeight="bold" />
                    <br />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <Box
                sx={{
                  border: "3px solid #000",
                  borderRadius: "10px",
                  padding: "15px",
                }}
              >
                <Grid container>
                  <Grid item xs={2}>
                    <Heading text="5" />
                  </Grid>
                  <Grid item xs={10}>
                    <Paragraph text={"Incomple"} fontWeight="bold" />
                    <Paragraph text={"Profiles"} fontWeight="bold" />
                    <Link href="#">MANAGE</Link>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              <Box
                sx={{
                  padding: "15px",
                }}
              >
                <Grid container>
                  <Grid item xs={10}>
                    <Button
                      fullWidth
                      color="primary"
                      variant="contained"
                      sx={{ color: "#fff" }}
                      onClick={handleAddEmp}
                    >
                      Add Employee
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </PaperComponent>
      </Grid>

      <Grid item xs={12}>
        <br />
        <br />
        <Paragraph text="Employees Table" fontWeight="bold" />
        <br />
        <TableComponent
          columnsData={EmployeesTableConfig.columnsData}
          rowsData={rowsData}
        />
      </Grid>
    </Grid>
  );
}

export default ManageEmployees;
