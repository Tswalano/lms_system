import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import FlakyIcon from "@mui/icons-material/Flaky";
import AccountCircle from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";

export const adminNavBarItems = [
  {
    id: 0,
    icon: <HomeIcon />,
    label: "Home",
    route: "home",
  },
  {
    id: 1,
    icon: <AccountCircle />,
    label: "Profile",
    route: "profile",
  },
  {
    id: 2,
    icon: <GroupsIcon />,
    label: "Manage Employees",
    route: "manage-employees",
  },
  {
    id: 3,
    icon: <FlakyIcon />,
    label: "Manage Leave",
    route: "manage-leave",
  },
  {
    id: 4,
    icon: <Logout />,
    label: "Log out",
    route: "logout",
  },
];
