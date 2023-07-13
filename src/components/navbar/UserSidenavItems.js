import HomeIcon from "@mui/icons-material/Home";
import AccountCircle from "@mui/icons-material/AccountCircle";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import Logout from "@mui/icons-material/Logout";

export const userNavBarItems = [
  {
    id: 0,
    icon: <HomeIcon />,
    label: "Dashboard",
    route: "dashboard",
  },
  {
    id: 1,
    icon: <AccountCircle />,
    label: "Profile",
    route: "profile",
  },
  {
    id: 2,
    icon: <EditCalendarIcon />,
    label: "Apply for Leave",
    route: "apply-for-leave",
  },
  {
    id: 3,
    icon: <EventAvailableIcon />,
    label: "My Leave",
    route: "my-leave",
  },
  {
    id: 4,
    icon: <Logout />,
    label: "Log out",
    route: "logout",
  },
];
