import { Grid } from "@mui/material";
import React from "react";
import Paragraph from "../../../components/ui/Paragraph";
import { Link, useNavigate } from "react-router-dom";
import TableComponent from "../../../components/table/TableComponent";
import { ManageActiveLeave, ManageLeaveConfig } from "./ManageLeaveConfig";
import PaperComponent from "../../../components/ui/Paper";

function ManageLeave() {
  const navigate = useNavigate("");

  const viewUser = (id) => {
    navigate("/manage-employee?id=" + id);
  };
  const rowsData = [
    {
      Employee_ID: "1",
      name: "Phil",
      surname: "Maitisa",
      email: "philemon.maitisa@disraptor.co.za",
      phone: "0791119292",
      leaveType: "Annual",
      view: (
        <Link href="" onClick={viewUser(1)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "2",
      name: "Rebaone",
      surname: "Makgabo",
      email: "rebaone.makgabo@disraptor.co.za",
      phone: "0818140244",
      leaveType: "Maternity",
      view: (
        <Link href="" onClick={viewUser(2)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "3",
      name: "Mayur",
      surname: "Mistry",
      email: "mayur.mistry@disraptor.co.za",
      phone: "0668857412",
      leaveType: "Emergency",
      view: (
        <Link href="" onClick={viewUser(3)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "4",
      name: "Jino",
      surname: "Rigney",
      email: "jin.rigney@disraptor.co.za",
      phone: "0784453698",
      leaveType: "Family Res",
      view: (
        <Link onClick={viewUser(4)} href="">
          open
        </Link>
      ),
    },
    {
      Employee_ID: "5",
      name: "Kgomotso",
      surname: "Dungeni",
      email: "kgomotso.dungeni@disraptor.co.za",
      phone: "0834567283",
      leaveType: "Sick",
      view: (
        <Link onClick={viewUser(5)} href="">
          open
        </Link>
      ),
    },
  ];

  const activeRows = [
    {
      Employee_ID: "1",
      name: "Phil",
      surname: "Maitisa",
      email: "philemon.maitisa@disraptor.co.za",
      phone: "0791119292",
      jobTitle: "Software Engineer",
      view: (
        <Link href="" onClick={viewUser(1)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "2",
      name: "Given",
      surname: "Makofane",
      email: "given.makofane@disraptor.co.za",
      phone: "0791228585",
      jobTitle: "Software Engineer",
      view: (
        <Link href="" onClick={viewUser(2)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "3",
      name: "Thato",
      surname: "Mamabolo",
      email: "thato.mamabolo@disraptor.co.za",
      phone: "0797292765",
      jobTitle: "Software Engineer",
      view: (
        <Link href="" onClick={viewUser(3)}>
          open
        </Link>
      ),
    },
    {
      Employee_ID: "4",
      name: "Reolebogile",
      surname: "Koji",
      email: "reolebogile.koji@disraptor.co.za",
      phone: "0897162826",
      jobTitle: "Software Engineer",
      view: (
        <Link onClick={viewUser(4)} href="">
          open
        </Link>
      ),
    },
  ];

  return (
    <Grid container>
      <Grid item xs={12}>
        <PaperComponent>
          <Paragraph text="Leave Requests" fontWeight="bold" />
          <br />
          <TableComponent
            columnsData={ManageLeaveConfig.columnsData}
            rowsData={rowsData}
          />
        </PaperComponent>
      </Grid>

      <Grid item xs={12}>
        <br />
        <br />
        <Paragraph text="Active Leave" fontWeight="bold" />
        <br />
        <TableComponent
          columnsData={ManageActiveLeave.columnsData}
          rowsData={activeRows}
        />
      </Grid>
    </Grid>
  );
}

export default ManageLeave;
