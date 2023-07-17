import HomeIcon from "@mui/icons-material/Home";
import GroupsIcon from "@mui/icons-material/Groups";
import FlakyIcon from "@mui/icons-material/Flaky";
import AccountCircle from "@mui/icons-material/AccountCircle";
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
    icon: <GroupsIcon />,
    label: "Apply for Leave",
    route: "apply-for-leave",
  },
  {
    id: 3,
    icon: <FlakyIcon />,
    label: "My Leave",
    // route: "my-leave",
  },
  {
    id: 4,
    icon: <FlakyIcon />,
    label: "My Leave Documents",
    // route: "my-leave-documents",
  },
  {
    id: 5,
    icon: <FlakyIcon />,
    label: "My Leave History",
    // route: "my-leave-history",
  },
  {
    id: 6,
    icon: <Logout />,
    label: "Log out",
    route: "signout",
  },
];
