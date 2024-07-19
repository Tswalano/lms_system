import { Box, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import {
  LeaveHistoryTable,
  ApprovedLeaveTable,
  LeaveRequestsTable,
  RejectedLeaveTable,
} from "./ManageLeaveConfig";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import LaunchIcon from "@mui/icons-material/Launch";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Tab from "@mui/material/Tab";

function dateFormat(dateValue) {
  const date = new Date(dateValue);
  return date.toISOString().split("T")[0];
}

function ManageLeave() {
  const [leaveRequestData, setLeaveRequestData] = useState([]);
  const [approvedLeaveData, setApprovedLeaveData] = useState([]);
  const [rejectedLeaveData, setRejectedLeaveData] = useState([]);
  const [historyLeaveData, setHistoryLeaveData] = useState([]);
  const [activeLeaveData, setActiveLeaveData] = useState([]);

  const [isLoading, setISLoading] = useState(false);

  const [value, setValue] = React.useState("1");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setISLoading(true);
      try {
        const endpoint = new APIEndPoints().getAllLeavesData();
        const data = await getData(endpoint, ctx.token);
        //checks the response
        if (data) {
          const leaveRequests = [];
          const approvedLeaves = [];
          const rejectedLeaves = [];
          const activeLeaves = [];
          const leaveHistory = [];
          //For loop to check each object on whether the status is pending or approved.
          for (let i = 0; i < data.length; i++) {
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
              //psuhing data into the array
              leaveRequests.push({
                id: data[i].id,
                name: data[i]?.User?.firstName + " " + data[i]?.User?.lastName,
                leaveType: data[i].leave_type,
                startDate: dateFormat(data[i].start_date),
                endDate: dateFormat(data[i].end_date),
                duration: data[i].duration,
                status: status,
                open: (
                  <Link to={"/manage-leave/act-on-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Approved") {
              approvedLeaves.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: dateFormat(data[i].start_date) || "",
                endDate: dateFormat(data[i].end_date) || "",
                duration: data[i].duration + " day(s)",
                status: status,
                view: (
                  <Link to={"/manage-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Active") {
              activeLeaves.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: dateFormat(data[i].start_date) || "",
                endDate: dateFormat(data[i].end_date) || "",
                duration: data[i].duration + " day(s)",
                status: status,
                view: (
                  <Link to={"/manage-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Reject") {
              rejectedLeaves.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: dateFormat(data[i].start_date) || "",
                endDate: dateFormat(data[i].end_date) || "",
                duration: data[i].duration + " day(s)",
                status: status,
                view: (
                  <Link to={"/manage-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            } else if (status === "Completed") {
              leaveHistory.push({
                id: data[i].id,
                name: data[i].User.firstName + " " + data[i].User.lastName,
                leaveType: data[i].leave_type || "",
                startDate: dateFormat(data[i].start_date) || "",
                endDate: dateFormat(data[i].end_date) || "",
                duration: data[i].duration + " day(s)",
                status: status,
                view: (
                  <Link to={"/manage-leave/view-leave?id=" + data[i].id}>
                    <LaunchIcon sx={{ color: "#0BADDE" }} />
                  </Link>
                ),
              });
            }
          }
          setLeaveRequestData(leaveRequests);
          setApprovedLeaveData(approvedLeaves);
          setRejectedLeaveData(rejectedLeaves);
          setHistoryLeaveData(leaveHistory);
          setActiveLeaveData(activeLeaves);

          setISLoading(false);
        }
      } catch (error) {
        return "Error fetching leave data:", error;
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
            <Tab label="Rejected Leave" value="2" />
            <Tab label="Approved Leave" value="3" />
            <Tab label="Active Leave" value="4" />
            <Tab label="Leave History" value="5" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <TableComponent
            columnsData={LeaveRequestsTable.columnsData}
            rowsData={leaveRequestData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="2">
          <TableComponent
            columnsData={RejectedLeaveTable.columnsData}
            rowsData={rejectedLeaveData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="3">
          <TableComponent
            columnsData={ApprovedLeaveTable.columnsData}
            rowsData={approvedLeaveData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="4">
          <TableComponent
            columnsData={LeaveHistoryTable.columnsData}
            rowsData={activeLeaveData}
            isLoading={isLoading}
          />
        </TabPanel>
        <TabPanel value="5">
          <TableComponent
            columnsData={LeaveHistoryTable.columnsData}
            rowsData={historyLeaveData}
            isLoading={isLoading}
          />
        </TabPanel>
      </TabContext>
    </Box>
  );
}

function Breadcrumb() {
  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb">
        <Link className="breadCrumbLink" to="/home">
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
