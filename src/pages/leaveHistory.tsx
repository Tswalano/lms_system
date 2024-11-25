import React, { useState } from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TablePagination from "@mui/material/TablePagination";
import Stack from "@mui/material/Stack";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useQuery } from "@tanstack/react-query";
import { useCookies } from "react-cookie";
import { getAllLeaveRequestByUID } from "../api/authAPI";
import { LeaveRequest } from "../api/types";
import { formatDateTimeToSAST } from "../utils/Util";
import ErrorPage from "./error/error";
import LoadingPage from "./loadingPage";
import { Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";

type Props = {};

function LeaveHistory({}: Props) {
  const [cookies] = useCookies(["token"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tabValue, setTabValue] = useState("pending"); // default to 'pending'

  const navigate = useNavigate();

  const handleNewRequest = () => {
    navigate("/apply-leave");
  };

  const handleEditRequest = (leaveData: LeaveRequest) => {
    console.log("Editing leave data:", leaveData); 
    navigate("/edit-leave", { state: leaveData }); // Passing leaveData as state
  };

  const { data, isError, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["listLeaveRequests"],
    queryFn: () => getAllLeaveRequestByUID(cookies.token),
    select: (data) => {
      if (data.statusCode !== 200) {
        return [];
      }
      return data.body;
    },
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
    setPage(0); // Reset page when tab changes
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !data) {
    return <ErrorPage />;
  }

  const filteredData = data
  .filter((leave) => leave.status.toLowerCase() === tabValue)
  .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Container maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4">Leave History</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<>➕</>}
          onClick={handleNewRequest}
        >
          New Request
        </Button>
      </Stack>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="leave request tabs"
      >
        <Tab label="Pending" value="pending" />
        <Tab label="Approved" value="approved" />
        <Tab label="Rejected" value="rejected" />
      </Tabs>

      <Card>
        {filteredData.length === 0 ? (
          <Typography variant="h6" align="center" sx={{ padding: 2 }}>
            No {tabValue} leave requests.
          </Typography>
        ) : (
          leaveHistoryTable(paginatedData, handleEditRequest)
        )}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "success";
    case "rejected":
      return "error";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

export const leaveHistoryTable = (
  leaveHistory: LeaveRequest[],
  handleEditRequest: (leaveData: LeaveRequest) => void
) => (
  <TableContainer sx={{ overflow: "unset" }}>
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Leave Type</TableCell>
            <TableCell>Note</TableCell>
            <TableCell align="right">Duration</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">Start Date</TableCell>
            <TableCell align="right">End Date</TableCell>
            <TableCell align="right">Action</TableCell> {/* New Action Column */}
          </TableRow>
        </TableHead>
        <TableBody>
          {leaveHistory &&
            leaveHistory.map((lh) => (
              <TableRow
                key={lh.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {lh.leave_type}
                </TableCell>
                <TableCell>{lh.leave_comment}</TableCell>
                <TableCell align="right">{lh.duration}</TableCell>
                <TableCell align="right">
                  <Chip
                    label={lh.status}
                    size="small"
                    color={getStatusColor(lh.status)}
                  />
                </TableCell>
                <TableCell align="right">
                  {formatDateTimeToSAST(lh.start_date)}
                </TableCell>
                <TableCell align="right">
                  {formatDateTimeToSAST(lh.end_date)}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleEditRequest(lh)} // Pass leave data to edit
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  </TableContainer>
);

export default LeaveHistory;
