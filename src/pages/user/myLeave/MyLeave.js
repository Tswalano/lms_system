import { Box, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import {
  MyLeaveHistoryTable,
  MyLeaveRequestsTable,
} from "./MyLeaveTableConfig";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import jwtDecode from "jwt-decode";
import LaunchIcon from "@mui/icons-material/Launch";

function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function MyLeave() {
  const [myLeaveRequestsRowsData, setMyLeaveRequestsRowsData] = useState([]);
  const [myLeaveHistoryRowsData, setMyLeaveHistoryRowsData] = useState([]);
  const [isLoading, setISLoading] = useState(true);

  const ctx = useContext(AuthContext);

  useEffect(() => {
    const userID = jwtDecode(ctx.token)?.user?.id;
    const fetchData = async () => {
      const endpoint = new APIEndPoints().getAllLeavesData();
      const data = await getData(endpoint, ctx.token);
      if (data) {
        const leaveRequest = [];
        const leaveHistory = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i]?.User?.id === userID) {
            if (data[i].status === "pending") {
              leaveRequest.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                leaveLength: data[i].duration,
                status: data[i].status,
                open: (
                  <Link to={"/my-leave/my-leave-request?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if ((data[i].status = "approved")) {
              leaveHistory.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                leaveLength: data[i].duration,
                status: "Complete",
                view: (
                  <Link to={"/my-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            }
          }
        }
        setMyLeaveRequestsRowsData(leaveRequest);
        setMyLeaveHistoryRowsData(leaveHistory);
        setISLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />
      <Paragraph text="My Leave Requests" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={MyLeaveRequestsTable.columnsData}
        rowsData={myLeaveRequestsRowsData}
        isLoading={isLoading}
      />
      <br />
      <br />
      <Paragraph text="My Leave History" fontWeight="bold" />
      <div style={{ height: "8px" }}></div>
      <TableComponent
        columnsData={MyLeaveHistoryTable.columnsData}
        rowsData={myLeaveHistoryRowsData}
        isLoading={isLoading}
      />
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link className="breadCrumbLink" to={"/dashboard"}>
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
