import { Box, Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import { ActiveLeaveTable, LeaveRequestsTable } from "./ManageLeaveConfig";
import Breadcrumbs from "@mui/material/Breadcrumbs";
// import Link from "@mui/material/Link";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import axios from "axios";
import { Link } from "react-router-dom";

function ManageLeave() {
  const [rowsData, setRowsData] = useState([]);
  const [leaveRequestData, setLeaveRequestData] = useState([]);
  const [activeLeaveData, setActiveLeaveData] = useState([]);
  const [ID, setID] = useState();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = new APIEndPoints().getAllLeavesData();
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImdpdmVuLm1ha29mYW5lQGRpc3JhcHRvci5jby56YSIsInJvbGUiOiJ1c2VyIiwidXNlciI6eyJpZCI6NCwiZmlyc3ROYW1lIjoidGVzdCIsImxhc3ROYW1lIjoia29maSIsImVtYWlsIjoiZ2l2ZW4ubWFrb2ZhbmVAZGlzcmFwdG9yLmNvLnphIiwicm9sZSI6InVzZXIifSwiaWF0IjoxNjg5NTc4MzgwLCJleHAiOjE2ODk2NjQ3ODB9.MlGwUuZ56b_qF2GphCSM5J4N9xI0w5v-AXamz3_JWUg";
        const data = await getData(endpoint, token);
        if (data) {
          const leaveRequests = [];
          const activeLeaves = [];
          for (let i = 0; i < data.length; i++) {
            if (data[i].status === "pending") {
              //leaveRequests.push(data[i]);
              leaveRequests.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: data[i].start_date || "",
                endDate: data[i].end_date || "",
                leaveLength: data[i].duration,
                status: data[i].status || "",
                open: (
                  <Link to={"/manage-leave/act-on-leave?id=" + data[i].id}>
                    View
                  </Link>
                ),
              });
            } else if (data[i].status === "approved") {
              activeLeaves.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: data[i].start_date || "",
                endDate: data[i].end_date || "",
                status: data[i].status || "",
                view: (
                  <Link to={"/manage-leave/act-on-leave?id=" + data[i].id}>
                    View
                  </Link>
                ),
              });
            }
          }
          setLeaveRequestData(leaveRequests);
          setActiveLeaveData(activeLeaves);
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
      }
    };

    fetchData();
  }, []);
  console.log(leaveRequestData);

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <Paragraph text="Leave Requests" fontWeight="bold" />
      <br />
      <TableComponent
        columnsData={LeaveRequestsTable.columnsData}
        rowsData={leaveRequestData}
      />

      <br />
      <br />
      <Paragraph text="Active Leave" fontWeight="bold" />
      <br />
      <TableComponent
        columnsData={ActiveLeaveTable.columnsData}
        rowsData={activeLeaveData}
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
