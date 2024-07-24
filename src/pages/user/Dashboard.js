import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Box, Button, Card, Stack, TablePagination } from "@mui/material";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useStateContext } from "../../context";
import { capitalizeName } from "../../utils/Util";
import { leaveHistoryTable } from "../leaveHistory";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import { getAllLeaveRequestByUID } from "../../api/authAPI";
import LoadingPage from "../loadingPage";
import { useNavigate } from "react-router-dom";

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !data) {
    return <Typography>Error loading leave requests.</Typography>;
  }

  const paginatedData = data.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const leaveBalance = [
    {
      id: 1,
      title: "Sick Leave",
      value: 12,
      icon: "🤒",
    },
    {
      id: 2,
      title: "Study Leave",
      value: 15,
      icon: "📚",
    },
    {
      id: 3,
      title: "Maternity Leave",
      value: 14,
      icon: "🍼",
    },
    {
      id: 4,
      title: "Annual Leave",
      value: 21,
      icon: "🎉",
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

      <Grid container spacing={3}>
        {leaveBalance.map((item) => (
          <Grid key={item.id} xs={12} sm={6} md={3}>
            <Card
              component={Stack}
              spacing={3}
              direction="row"
              sx={{
                px: 3,
                py: 5,
                borderRadius: 2,
              }}
            >
              <Box sx={{ width: 64, height: 64 }}>
                <Typography variant="h2">{item.icon}</Typography>
              </Box>

              <Stack spacing={0.5}>
                <Typography variant="h4">{item.value}</Typography>

                <Typography variant="subtitle2" sx={{ color: "text.disabled" }}>
                  {item.title}
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

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
            count={data.length}
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
