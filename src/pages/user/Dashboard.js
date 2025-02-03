import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Stack, Box, Card, CardContent } from "@mui/material";
import { useState } from "react";
import { useStateContext } from "../../context";
import { capitalizeName, sysColors } from "../../utils/Util";
import { useCookies } from "react-cookie";
import { useQuery } from "@tanstack/react-query";
import {
  getAllLeaveRequestByUID,
  getTotalNumberOfLeaveDays,
} from "../../api/authAPI";
import LoadingPage from "../loadingPage";
import { useNavigate } from "react-router-dom";
import {
  FaHeartbeat,
  FaUmbrellaBeach,
  FaChild,
  FaHandsHelping,
} from "react-icons/fa";
import CalenderView from "../calenderView";
import Greeting from "../../layouts/Greetings";
import { motion } from "framer-motion";

function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [cookies] = useCookies(["token"]);

  const { data, isError, isLoading } = useQuery({
    queryKey: ["totalLeaveDays"],
    queryFn: () => getTotalNumberOfLeaveDays(cookies.token),
    select: (data) => [data.data.leaveCounts],
  });

  const {
    data: leaveData,
    isError: leaveError,
    isLoading: leaveLoading,
  } = useQuery({
    queryKey: ["listLeaveRequests"],
    queryFn: () => getAllLeaveRequestByUID(cookies.token),
    select: (data) => (data.statusCode !== 200 ? [] : data.body),
  });

  if (isLoading || leaveLoading) return <LoadingPage />;
  if (isError || leaveError || !data)
    return <Typography>Error loading data.</Typography>;

  const leaveBalance = [
    {
      id: 1,
      title: "Sick Leave",
      value: `${Number(data[0]["Sick Leave"]) || 0} day(s)`,
      gradient: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
      icon: <FaHeartbeat size={32} color="#fff" />,
    },
    {
      id: 2,
      title: "Annual Leave",
      value: `${Number(data[0]["Annual Leave"]) || 0} day(s)`,
      gradient: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)",
      icon: <FaUmbrellaBeach size={32} color="#fff" />,
    },
    {
      id: 3,
      title: "Parental Leave",
      value: `${
        (Number(data[0]["Maternity Leave"]) || 0) +
        (Number(data[0]["Paternity Leave"]) || 0)
      } day(s)`,
      gradient: "linear-gradient(135deg, #a1c4fd 0%,rgb(214, 194, 251) 100%)",
      icon: <FaChild size={32} color="#fff" />,
    },
    {
      id: 4,
      title: "Family Responsibility",
      value: `${Number(data[0]["Family Responsibility"]) || 0} day(s)`,
      gradient:
        "linear-gradient(135deg,rgb(244, 157, 247) 0%,rgb(233, 238, 166) 150%)",
      icon: <FaHandsHelping size={32} color="#fff" />,
    },
  ];

  return (
    <Container maxWidth="xl">
      <Greeting />
      <Grid container spacing={4}>
        {leaveBalance.map((item) => (
          <Grid xs={12} sm={6} md={3} key={item.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: item.id * 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card
                sx={{
                  background: item.gradient,
                  borderRadius: "20px",
                  boxShadow: 3,
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="center" mb={2} mt={2}>
                    {item.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    align="center"
                    fontWeight="bold"
                    color="#fff"
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="h5" align="center" color="#fff">
                    {item.value}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ my: 5 }}
      >
        <Typography variant="h4" fontWeight="bold" sx={{ color: "#04A1EA" }}>
          Leave It to the Calendar!
        </Typography>
      </Stack>

      <CalenderView />
    </Container>
  );
}

export default Dashboard;
