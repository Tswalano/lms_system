import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import {
  Box,
  Button,
  Card,
  Paper,
  Stack,
  TablePagination,
} from "@mui/material";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useStateContext } from "../../context";
import { capitalizeName } from "../../utils/Util";
import { leaveHistoryTable } from "../leaveHistory";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import {
  getAllLeaveRequestByUID,
  getTotalNumberOfLeaveDays,
} from "../../api/authAPI";
import LoadingPage from "../loadingPage";
import { useNavigate } from "react-router-dom";
import {
  FaSyringe,
  FaBook,
  FaBaby,
  FaUserTie,
  FaPeopleArrows,
} from "react-icons/fa";

// Updated Dashboard Component
function Dashboard() {
  const ctx = useContext(AuthContext);
  const stateContext = useStateContext();
  const user = stateContext.state.authUser;

  const [cookies] = useCookies(["token"]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const navigate = useNavigate();

  const handleNewRequest = () => {
    navigate("/apply-leave");
  };

  const { data, isError, isLoading } = useQuery({
    queryKey: ["totalLeaveDays"],
    queryFn: () => getTotalNumberOfLeaveDays(cookies.token),
    select: (data) => {
      const leaveData = [data.data.leaveCounts];
      return leaveData;
    },
  });

  const {
    data: leaveData,
    isError: leaveError,
    isLoading: leaveLoading,
  } = useQuery({
    queryKey: ["listLeaveRequests"],
    queryFn: () => getAllLeaveRequestByUID(cookies.token),
    select: (data) => {
      if (data.statusCode !== 200) {
        return [];
      }
      return data.body;
    },
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading || leaveLoading) {
    return <LoadingPage />;
  }

  if (isError || leaveError || !data) {
    return <Typography>Error loading data.</Typography>;
  }

  const paginatedData = leaveData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Update the leaveBalance to match the new data format
  const leaveBalance = [
    {
      id: 1,
      title: "Sick Leave",
      value: Number(data[0]["Sick Leave"]) + " day(s)" || 0,
      icon: <FaSyringe size={32} />,
    },
    {
      id: 2,
      title: "Annual Leave",
      value: Number(data[0]["Annual Leave"]) + " day(s)" || 0,
      icon: <FaBook size={32} />,
    },
    {
      id: 3,
      title: "Maternity Leave",
      value: Number(data[0]["Maternity Leave"]) + " day(s)" || 0,
      icon: <FaBaby size={32} />,
    },
    {
      id: 4,
      title: "Paternity Leave",
      value: Number(data[0]["Paternity Leave"]) + " day(s)" || 0,
      icon: <FaUserTie size={32} />,
    },
    {
      id: 5,
      title: "Family Responsibility",
      value: Number(data[0]["Family Responsibility"]) + " day(s)" || 0,
      icon: <FaPeopleArrows size={32} />,
    },
  ];

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>
        Hello{" "}
        <span style={{ color: "#04A1EA", fontWeight: "bold" }}>
          {capitalizeName(`${user?.firstName} ${user?.lastName}`)}
        </span>
        , Welcome back 👋
      </Typography>

      <Paper sx={{ p: 4, mb: 5 }} elevation={3}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Total Leave Taken
        </Typography>
        <Grid container spacing={2}>
          {leaveBalance.map((item) => (
            <Grid key={item.id} xs={12} sm={6} md={4} lg={3} xl={2}>
              <Card
                component={Stack}
                spacing={2}
                direction="row"
                alignItems="center"
                justifyContent="center"
                sx={{
                  px: 2,
                  py: 3,
                  borderRadius: 2,
                }}
              >
                <Box sx={{ width: 32, height: 32 }}>
                  <Typography variant="h5">{item.icon}</Typography>
                </Box>

                <Stack spacing={0.5} alignItems="center">
                  <Typography variant="h6">{item.value}</Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.disabled" }}
                  >
                    {item.title}
                  </Typography>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ my: 5 }}
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
        <Card>
          {leaveHistoryTable(paginatedData)}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={leaveData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Grid>
    </Container>
  );
}

export default Dashboard;
