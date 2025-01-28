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
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { Chip, Divider } from "@mui/material";
import { getAllLeaveRequestByUID } from "../api/authAPI";
import { LeaveRequest } from "../api/types";
import { formatDateTimeToSAST } from "../utils/Util";
import ErrorPage from "./error/error";
import LoadingPage from "./loadingPage";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import { deleteLeaveRequest } from "../api/authAPI";
import { toast } from "react-toastify";

type Props = {};

function LeaveHistory({ }: Props) {
  const [cookies] = useCookies(["token"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [tabValue, setTabValue] = useState("pending"); // default to 'pending'
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // For delete loading state

  const navigate = useNavigate();

  const handleNewRequest = () => {
    navigate("/apply-leave");
  };

  const handleEditRequest = (leaveData: LeaveRequest) => {
    navigate("/edit-leave", { state: { leaveData } });
  };

  const handleDeleteLeaveRequest = (leaveData: LeaveRequest) => {
    setSelectedLeave(leaveData);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedLeave(null);
  };

  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ["listLeaveRequests"],
    queryFn: () => getAllLeaveRequestByUID(cookies.token),
    select: (data) => {
      if (data.statusCode !== 200) {
        return [];
      }
      return data.body;
    },
  });

  const confirmDelete = async () => {
    if (!selectedLeave) return;

    setIsDeleting(true);

    try {
      await deleteLeaveRequest(cookies.token, selectedLeave.id); // Call the API
      toast.success("Leave request deleted successfully!");
      refetch(); // Refresh the leave history data
      handleCloseModal(); // Close the modal
    } catch (error: any) {
      toast.error("Failed to delete leave request");
    } finally {
      setIsDeleting(false);
    }
  };

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
    setPage(0);
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
          leaveHistoryTable(paginatedData, handleEditRequest, handleDeleteLeaveRequest)
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

      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 450,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="text"
              color="inherit"
              sx={{ position: "absolute" }}
              onClick={handleCloseModal}
            >
              <CloseIcon />
            </Button>
          </Box>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Confirm Deletion
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {selectedLeave && (
            <>
              <Typography sx={{ mb: 1 }}>
                <strong>Leave Type:</strong> {selectedLeave.leave_type}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Start Date:</strong>{" "}
                {formatDateTimeToSAST(selectedLeave.start_date)}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>End Date:</strong>{" "}
                {formatDateTimeToSAST(selectedLeave.end_date)}
              </Typography>
              <Typography sx={{ mb: 2 }}>
                <strong>Note:</strong> {selectedLeave.leave_comment}
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>

                <Button
                  variant="contained"
                  color="warning"
                  onClick={confirmDelete}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

    </Container>
  );
}

export const leaveHistoryTable = (
  leaveHistory: LeaveRequest[],
  handleEditRequest: (leaveData: LeaveRequest) => void,
  handleDeleteLeaveRequest: (leaveData: LeaveRequest) => void
) => (
  <TableContainer sx={{ overflow: "unset" }}>
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="a dense table">
        <TableHead>
          <TableRow>
            <TableCell>Leave Type</TableCell>
            <TableCell>Note</TableCell>
            <TableCell align="right">Days Taken</TableCell>
            <TableCell align="right">Status</TableCell>
            <TableCell align="right">Start Date</TableCell>
            <TableCell align="right">End Date</TableCell>
            {/* Conditionally render Update and Withdraw columns */}
            {leaveHistory.some((lh) => lh.status.toLowerCase() === "pending") && (
              <>
                <TableCell align="right">Update</TableCell>
                <TableCell align="right">Withdraw</TableCell>
              </>
            )}
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
                  {lh.status.toLowerCase() === "pending" && (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => handleEditRequest(lh)}
                    >
                      <EditIcon />
                    </Button>
                  )}
                </TableCell>
                <TableCell align="right">
                  {lh.status.toLowerCase() === "pending" && (
                    <Button
                      variant="text"
                      color="error"
                      onClick={() => handleDeleteLeaveRequest(lh)}
                    >
                      <DeleteIcon />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  </TableContainer>
);

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

export default LeaveHistory;
