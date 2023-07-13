import { Box, Grid, Typography } from "@mui/material";
import React from "react";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import { ActiveLeaveTable, LeaveRequestsTable } from "./ManageLeaveConfig";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";

function ManageLeave() {
  const leaevRequestsRowsData = [
    {
      name: "Phil Maitisa",
      leaveType: "Annual",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link href="/manage-leave/act-on-leave?id=1">open</Link>,
    },
    {
      name: "Rebaone Makgabo",
      leaveType: "Annual",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link href="/manage-leave/act-on-leave?id=2">open</Link>,
    },
    {
      name: "Mayur Mistry",
      leaveType: "Emergency",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Half Day",
      status: "Pending",
      open: <Link href="/manage-leave/act-on-leave?id=3">open</Link>,
    },
    {
      name: "Jino Rigney",
      leaveType: "Family Res",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link href="/manage-leave/act-on-leave?id=4">open</Link>,
    },
    {
      name: "Kgomotso Dungeni",
      leaveType: "Sick",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link href="/manage-leave/act-on-leave?id=5">open</Link>,
    },
  ];

  const activeLeaveRows = [
    {
      name: "Phil Maitisa",
      leaveType: "Annual",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Active",
      view: <Link href="manage-leave/view-leave?id=1">view</Link>,
    },
    {
      name: "Given Makofane",
      leaveType: "Emergency",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Active",
      view: <Link href="manage-leave/view-leave?id=2">view</Link>,
    },
    {
      name: "Thato Mamabolo",
      leaveType: "Sick",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Active",
      view: <Link href="manage-leave/view-leave?id=3">view</Link>,
    },
    {
      name: "Reba Makgabo",
      leaveType: "Sick",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Active",
      view: <Link href="manage-leave/view-leave?id=4">view</Link>,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <Paragraph text="Leave Requests" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={LeaveRequestsTable.columnsData}
        rowsData={leaevRequestsRowsData}
      />

      <br />
      <br />
      <Paragraph text="Active Leave" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={ActiveLeaveTable.columnsData}
        rowsData={activeLeaveRows}
      />
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" href="/home">
          Home
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          Manage Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default ManageLeave;
