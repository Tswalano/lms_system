import { Box, Typography } from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import Paragraph from "../../../components/ui/Paragraph";
import TableComponent from "../../../components/table/TableComponent";
import { ActiveLeaveTable, LeaveRequestsTable } from "./ManageLeaveConfig";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import { Link } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import LaunchIcon from "@mui/icons-material/Launch";

function ManageLeave() {
  const [leaveRequestData, setLeaveRequestData] = useState([]);
  const [activeLeaveData, setActiveLeaveData] = useState([]);

  //Declaring usContext use stored values
  const ctx = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = new APIEndPoints().getAllLeavesData();
        const data = await getData(endpoint, ctx.token);
        //checks the response
        if (data) {
          const leaveRequests = [];
          const activeLeaves = [];
          //For loop to check each object on whether the status is pending or approved.
          for (let i = 0; i < data.length; i++) {
            if (data[i].status === "pending") {
              //psuhing data into the array
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
                    <LaunchIcon sx={{ color: "black" }} />
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
        <Link underline="hover" color="inherit" to="/home">
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
