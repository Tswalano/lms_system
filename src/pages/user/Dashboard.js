import Container from "@mui/material/Container";
import Grid from "@mui/material/Unstable_Grid2";
import Typography from "@mui/material/Typography";
import { Stack } from "@mui/material";
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
import { FaSyringe, FaBaby, FaPeopleArrows, FaCalendar } from "react-icons/fa";
import AppWidgetSummary from "../../components/AppWidgetSummary";
import styled from "@emotion/styled";
import CalenderView from "../calenderView";
import Greeting from "../../layouts/Greetings";

function Dashboard() {
  const currentYear = new Date().getFullYear();

  const [cookies] = useCookies(["token"]);

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

  if (isLoading || leaveLoading) {
    return <LoadingPage />;
  }

  if (isError || leaveError || !data) {
    return <Typography>Error loading data.</Typography>;
  }

  const IconContainer = styled("div")(({ theme, bgcolor, size, padding }) => ({
    backgroundColor: bgcolor || theme.palette.grey[200],
    borderRadius: "50%",
    padding: padding || "8px",
    width: size || "40px",
    height: size || "40px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  }));

  // Update leaveBalance to group Maternity and Paternity Leave
  const leaveBalance = [
    {
      id: 1,
      title: "Sick Leave",
      value: `${Number(data[0]["Sick Leave"]) || 0} day(s)`,
      gradient: sysColors.primarylight,
      color: sysColors.primary,
      icon: (
        <IconContainer bgcolor={sysColors.primary} size="60px" padding="12px">
          <FaSyringe color={sysColors.primarylight} size={32} />
        </IconContainer>
      ),
    },
    {
      id: 2,
      title: "Annual Leave",
      value: `${Number(data[0]["Annual Leave"]) || 0} day(s)`,
      gradient: sysColors.secondarylight,
      color: sysColors.secondary,
      icon: (
        <IconContainer bgcolor={sysColors.secondary} size="60px" padding="12px">
          <FaCalendar size={32} color={sysColors.secondarylight} />
        </IconContainer>
      ),
    },
    {
      id: 3,
      title: "Parental Leave",
      value: `${
        (Number(data[0]["Maternity Leave"]) || 0) +
        (Number(data[0]["Paternity Leave"]) || 0)
      } day(s)`,
      gradient: sysColors.warninglight,
      color: sysColors.warning,
      icon: (
        <IconContainer bgcolor={sysColors.warning} size="60px" padding="12px">
          <FaBaby color={sysColors.warninglight} size={32} />
        </IconContainer>
      ),
    },
    {
      id: 4,
      title: "Family Responsibility",
      value: `${Number(data[0]["Family Responsibility"]) || 0} day(s)`,
      gradient: sysColors.errorlight,
      color: sysColors.error,
      icon: (
        <IconContainer bgcolor={sysColors.error} size="60px" padding="12px">
          <FaPeopleArrows color={sysColors.errorlight} size={32} />
        </IconContainer>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Greeting />
      <Grid container spacing={3}>
        {leaveBalance.map((item) => (
          <Grid xs={12} sm={6} md={3} key={item.id}>
            <AppWidgetSummary
              title={item.title}
              total={item.value}
              icon={item.icon}
              // color={item.color}
              sx={{ background: item.gradient, color: item.color }}
            />
          </Grid>
        ))}
      </Grid>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ my: 5 }}
      >
        <Typography variant="h4">
          <span style={{ color: "#04A1EA", fontWeight: "bold" }}>
            Leave It to the Calendar!
          </span>
        </Typography>
      </Stack>
      <CalenderView />
    </Container>
  );
}

export default Dashboard;
