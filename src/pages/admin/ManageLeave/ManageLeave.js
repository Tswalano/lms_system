import { Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import Paragraph from "../../../components/ui/Paragraph";
import { Link, useNavigate } from "react-router-dom";
import TableComponent from "../../../components/table/TableComponent";
import { ManageActiveLeave, ManageLeaveConfig } from "./ManageLeaveConfig";
import PaperComponent from "../../../components/ui/Paper";
import APIEndPoints from "../../../api/APIEndPoints";
import { getData } from "../../../api/API";
import axios from "axios";

function ManageLeave() {
  const [rowsData, setRowsData] = useState([]);
  const [ID, setID] = useState();
  const navigate = useNavigate("");

  // const viewUser = (id) => {
  //   navigate("/manage-leave/act-on-leave?id=" + id);
  // };
  const endpoint = new APIEndPoints().getAllLeavesData();
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImdpdmVuLm1ha29mYW5lQGRpc3JhcHRvci5jby56YSIsInJvbGUiOiJ1c2VyIiwidXNlciI6eyJpZCI6NCwiZmlyc3ROYW1lIjpudWxsLCJsYXN0TmFtZSI6bnVsbCwiZW1haWwiOiJnaXZlbi5tYWtvZmFuZUBkaXNyYXB0b3IuY28uemEiLCJyb2xlIjoidXNlciJ9LCJpYXQiOjE2ODkyMzY1NjcsImV4cCI6MTY4OTMyMjk2N30.-nNQLVL1bQsTa9O1gkfI5vikKUfLQtcgmlD2S5jeaXo";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = new APIEndPoints().getAllLeavesData();
        const token =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImdpdmVuLm1ha29mYW5lQGRpc3JhcHRvci5jby56YSIsInJvbGUiOiJ1c2VyIiwidXNlciI6eyJpZCI6NCwiZmlyc3ROYW1lIjpudWxsLCJsYXN0TmFtZSI6bnVsbCwiZW1haWwiOiJnaXZlbi5tYWtvZmFuZUBkaXNyYXB0b3IuY28uemEiLCJyb2xlIjoidXNlciJ9LCJpYXQiOjE2ODkyMzY1NjcsImV4cCI6MTY4OTMyMjk2N30.-nNQLVL1bQsTa9O1gkfI5vikKUfLQtcgmlD2S5jeaXo";

        const response = await axios.get(endpoint, {
          headers: { Authorization: "Bearer " + token },
        });

        if (response.status === 200) {
          setRowsData(response.data);
          console.log(response.data);
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
      }
    };

    fetchData();
  }, []);

  // const activeRows = [
  //   {
  //     Employee_ID: "1",
  //     name: "Phil",
  //     surname: "Maitisa",
  //     email: "philemon.maitisa@disraptor.co.za",
  //     phone: "0791119292",
  //     jobTitle: "Software Engineer",
  //     view: (
  //       <Link href="" onClick={viewUser(1)}>
  //         open
  //       </Link>
  //     ),
  //   },
  //   {
  //     Employee_ID: "2",
  //     name: "Given",
  //     surname: "Makofane",
  //     email: "given.makofane@disraptor.co.za",
  //     phone: "0791228585",
  //     jobTitle: "Software Engineer",
  //     view: (
  //       <Link href="" onClick={viewUser(2)}>
  //         open
  //       </Link>
  //     ),
  //   },
  //   {
  //     Employee_ID: "3",
  //     name: "Thato",
  //     surname: "Mamabolo",
  //     email: "thato.mamabolo@disraptor.co.za",
  //     phone: "0797292765",
  //     jobTitle: "Software Engineer",
  //     view: (
  //       <Link href="" onClick={viewUser(3)}>
  //         open
  //       </Link>
  //     ),
  //   },
  //   {
  //     Employee_ID: "4",
  //     name: "Reolebogile",
  //     surname: "Koji",
  //     email: "reolebogile.koji@disraptor.co.za",
  //     phone: "0897162826",
  //     jobTitle: "Software Engineer",
  //     view: (
  //       <Link onClick={viewUser(4)} href="">
  //         open
  //       </Link>
  //     ),
  //   },
  // ];

  return (
    <Grid container>
      <Grid item xs={12}>
        <PaperComponent>
          <Paragraph text="Leave Requests" fontWeight="bold" />
          <br />
          <TableComponent
            columnsData={ManageLeaveConfig.columnsData}
            rowsData={rowsData.map((row) => ({
              Employee_ID: row.User.id || "",
              name: row.User.firstName || "",
              surname: row.User.lastName || "",
              email: row.User.email || "",
              phone: row.User.phoneNumber || "",
              leaveType: row.leave_type || "",
              view: (
                <Link to={"/manage-leave/act-on-leave?id=" + row.id}>View</Link>
              ),
            }))}
          />
        </PaperComponent>
      </Grid>

      <Grid item xs={12}>
        <br />
        <br />
        <PaperComponent>
          <Paragraph text="Active Leave" fontWeight="bold" />
          <br />
          <TableComponent
            columnsData={ManageActiveLeave.columnsData}
            rowsData={rowsData.map((row) => ({
              Employee_ID: row.User.id || "",
              name: row.User.firstName || "",
              surname: row.User.lastName || "",
              email: row.User.email || "",
              phone: row.User.phoneNumber || "",
              jobTitle: row.User.jobTitle || "",
              view: (
                <Link to={"/manage-leave/act-on-leave?id=" + row.id}>View</Link>
              ),
            }))}
          />
        </PaperComponent>
      </Grid>
    </Grid>
  );
}

export default ManageLeave;
