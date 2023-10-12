import { Box, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import { Link } from "react-router-dom";
import {
  MyAcceptedLeaveRequestsTable,
  MyLeaveHistoryTable,
  MyLeaveRequestsTable,
  MyRejectedLeaveRequestsTable,
} from "./MyLeaveTableConfig";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import { AuthContext } from "../../../context/AuthContext";
import jwtDecode from "jwt-decode";
import LaunchIcon from "@mui/icons-material/Launch";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";

function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function MyLeave() {
  const [myLeaveRequestsRowsData, setMyLeaveRequestsRowsData] = useState([]);
  const [myAcceptedLeaveRequestsRowsData, setMyAcceptedLeaveRequestsRowsData] =
    useState([]);
  const [myLeaveHistoryRowsData, setMyLeaveHistoryRowsData] = useState([]);
  const [myRejectedLeaveRowsData, setRejectedLeaveRowsData] = useState([]);
  const [isLoading, setISLoading] = useState(true);

  const [value, setValue] = React.useState("1");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const ctx = useContext(AuthContext);

  useEffect(() => {
    const userID = jwtDecode(ctx.token)?.user?.id;
    const fetchData = async () => {
      const endpoint = new APIEndPoints().getAllLeavesData();
      const data = await getData(endpoint, ctx.token);
      if (data) {
        const leaveRequest = [];
        const rejectedLeave = [];
        const acceptedLeave = [];
        const leaveHistory = [];
        for (let i = 0; i < data.length; i++) {
          if (data[i]?.User?.id === userID) {
            // set leave status
            const now = new Date();
            const start_date = new Date(data[i].start_date);
            const end_date = new Date(data[i].end_date);

            var status =
              data[i].status.toUpperCase().charAt(0) +
              "" +
              data[i].status.slice(1);

            if (
              status !== "Pending" &&
              status !== "Reject" &&
              status === "Approved"
            ) {
              if (now < start_date && now < end_date) {
                status = "Approved";
              } else if (now >= start_date && now <= end_date) {
                status = "Active";
              } else if (now > end_date) {
                status = "Completed";
              }
            }

            if (status === "Pending") {
              leaveRequest.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                duration: data[i].duration + " day(s)",
                status: status,
                open: (
                  <Link to={"/my-leave/my-leave-request?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Reject") {
              rejectedLeave.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                duration: data[i].duration + " day(s)",
                status:
                  data[i].status.toUpperCase().charAt(0) +
                  "" +
                  data[i].status.slice(1),
                view: (
                  <Link to={"/my-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Approved" || status === "Active") {
              acceptedLeave.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                duration: data[i].duration + " day(s)",
                status: status,
                view: (
                  <Link to={"/my-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if ((status = "Completed")) {
              leaveHistory.push({
                id: data[i].id,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                duration: data[i].duration + " day(s)",
                status: status,
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
        setRejectedLeaveRowsData(rejectedLeave);
        setMyAcceptedLeaveRequestsRowsData(acceptedLeave);
        setISLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <Breadcrumb />
      <br />

      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList
            onChange={handleChange}
            aria-label="lab API tabs example"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Leave Requests" value="1" />
            <Tab label="Approved Leave" value="2" />
            <Tab label="Rejected Leave" value="3" />
            <Tab label="Leave History" value="4" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <TableComponent
            columnsData={MyLeaveRequestsTable.columnsData}
            rowsData={myLeaveRequestsRowsData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="2">
          <TableComponent
            columnsData={MyAcceptedLeaveRequestsTable.columnsData}
            rowsData={myAcceptedLeaveRequestsRowsData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="3">
          <TableComponent
            columnsData={MyRejectedLeaveRequestsTable.columnsData}
            rowsData={myRejectedLeaveRowsData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="4">
          <TableComponent
            columnsData={MyLeaveHistoryTable.columnsData}
            rowsData={myLeaveHistoryRowsData}
            isLoading={isLoading}
          />
        </TabPanel>
      </TabContext>

      <br />
    </Box>
  );
}

function Breadcrumb() {
  const ctx = useContext(AuthContext);
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          className="breadCrumbLink"
          to={ctx.isAdmin === "admin" ? "/home" : "/dashboard"}
        >
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
