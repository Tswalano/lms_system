import React, { useState } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import {
  Button,
  ButtonGroup,
  Card,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getAllLeaveRequestsFn, updateLeaveStatusFn } from "../api/authAPI";
import { useCookies } from "react-cookie";
import { formatDateTimeToSAST } from "../utils/Util";
import { leaveStatus } from "../api/types";
import LoadingPage from "./loadingPage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Props = {};

export default function ManageLeaveRequests({}: Props) {
  const [cookies] = useCookies(["token"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tabValue, setTabValue] = useState("pending"); // default to 'pending'
  const [processingId, setProcessingId] = useState<string | null>(null); // to track the currently processing leave request ID

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ["listLeaveRequests"],
    queryFn: () => getAllLeaveRequestsFn(cookies.token),
    select: (data) => {
      if (data.status !== 200) {
        return [];
      }
      return data.data.leaveData;
    },
  });

  const mutate = useMutation({
    mutationKey: ["updateLeaveRequest"],
    mutationFn: (leaveData: leaveStatus) =>
      updateLeaveStatusFn(cookies.token, leaveData),

    onSuccess(data, variables) {
      refetch();
      setProcessingId(null); // reset processing ID
      variables.status === "Approved"
        ? toast.success("Leave Status Approved")
        : toast.warning("Leave request rejected.");
    },
    onError: (error) => {
      toast.error("Failed to Update Leave Request");
      setProcessingId(null); // reset processing ID
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

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !data) {
    return <Typography>Error loading leave requests.</Typography>;
  }

  const filteredData = data.filter(
    (leave) => leave.status.toLowerCase() === tabValue
  );
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
        <Typography variant="h4">Manage Leave Requests</Typography>
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

      <Grid>
        <Card>
          <TableContainer sx={{ overflow: "unset" }}>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="a dense table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Note</TableCell>
                    <TableCell align="center">No. of Days</TableCell>
                    <TableCell align="right">Status</TableCell>
                    <TableCell align="right">Start Date</TableCell>
                    <TableCell align="right">End Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((leave) => (
                    <TableRow
                      key={leave.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {leave.fullName}
                      </TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>{leave.leave_comment}</TableCell>
                      <TableCell align="center">{leave.duration}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={leave.status}
                          size="small"
                          color={getStatusColor(leave.status)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatDateTimeToSAST(leave.start_date)}
                      </TableCell>
                      <TableCell align="right">
                        {formatDateTimeToSAST(leave.end_date)}
                      </TableCell>
                      <TableCell align="right">
                        <ButtonGroup
                          disabled={
                            leave.status.toLowerCase() !== "pending" ||
                            processingId === leave.id.toString()
                          }
                          size="small"
                          aria-label="Small button group"
                        >
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() => {
                              setProcessingId(leave.id.toString());
                              mutate.mutate({
                                feedback: "Ok",
                                id: leave.id,
                                status: "Approved",
                              });
                            }}
                          >
                            {processingId === leave.id.toString() ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            onClick={() => {
                              setProcessingId(leave.id.toString());
                              mutate.mutate({
                                feedback: "Rejected",
                                id: leave.id,
                                status: "Rejected",
                              });
                            }}
                          >
                            {processingId === leave.id.toString() ? (
                              <CircularProgress size={24} />
                            ) : (
                              "Reject"
                            )}
                          </Button>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Card>
      </Grid>
    </Container>
  );
}
