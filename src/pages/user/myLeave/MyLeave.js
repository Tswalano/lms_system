import { Box, Typography } from "@mui/material";
import React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import {
  MyLeaveHistoryTable,
  MyLeaveRequestsTable,
} from "./MyLeaveTableConfig";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";

function MyLeave() {
  // my leave requests rows data
  const myLeaveRequestsRowsData = [
    {
      leaveType: "Annual",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link to="/my-leave/my-leave-request?id=1">open</Link>,
    },
    {
      leaveType: "Emergency",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Half Day",
      status: "Pending",
      open: <Link to="/my-leave/my-leave-request?id=3">open</Link>,
    },
    {
      leaveType: "Family Res",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link to="/my-leave/my-leave-request?id=4">open</Link>,
    },
    {
      leaveType: "Sick",
      startDate: "21/07/2023",
      endDate: "25/07/2023",
      leaveLength: "Full Day",
      status: "Pending",
      open: <Link to="/my-leave/my-leave-request?id=5">open</Link>,
    },
  ];

  // my leave history rows data
  const myLeaveHistoryRowsData = [
    {
      leaveType: "Annual",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Complete",
      view: <Link to="/my-leave/view-leave?id=1">view</Link>,
    },
    {
      leaveType: "Emergency",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Complete",
      view: <Link to="/my-leave/view-leave?id=2">view</Link>,
    },
    {
      leaveType: "Sick",
      startDate: "22/07/2023",
      endDate: "25/07/2023",
      status: "Complete",
      view: <Link to="/my-leave/view-leave?id=3">view</Link>,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <Paragraph text="My Leave Requests" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={MyLeaveRequestsTable.columnsData}
        rowsData={myLeaveRequestsRowsData}
      />
      <br />
      <br />
      <Paragraph text="My Leave History" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={MyLeaveHistoryTable.columnsData}
        rowsData={myLeaveHistoryRowsData}
      />
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link underline="hover" color="inherit" to={"/dashboard"}>
          Home
        </Link>
        <Typography color="primary" fontFamily="Geologica" fontWeight="normal">
          My Leave
        </Typography>
      </Breadcrumbs>
    </div>
  );
}

export default MyLeave;
