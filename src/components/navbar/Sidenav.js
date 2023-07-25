/*import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Logo from "../ui/Logo";
import { Grid, Tooltip } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 280;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": {
      ...openedMixin(theme),
      backgroundColor: theme.palette.primary.main,
    },
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": {
      ...closedMixin(theme),
      backgroundColor: theme.palette.primary.main,
    },
  }),
}));

export default function Sidenav({ menuItems }) {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  // navigation hook
  const navigate = useNavigate();

  // Create a URLSearchParams object with the current URL's query string
  const urlPathObj = new URL(window.location.href);
  const urlPath = urlPathObj.href;

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <Box id="sideNav" sx={{ display: "flex", flex: "100%" }}>
      <CssBaseline />
      <AppBar position="fixed" open={open} sx={{ background: "white" }}>
        <Toolbar>
          <Tooltip title="Open">
            <IconButton
              color="primary"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              sx={{
                marginRight: 5,
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <Grid item xs={10} md={6} lg={3}>
            <Box sx={{ width: "30%", height: "auto" }}>
              <Logo />
            </Box>
          </Grid>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Tooltip title="Close">
            <IconButton
              onClick={handleDrawerClose}
              color="default"
              sx={{
                background: "#E3F2FD",
                left: theme.spacing(2),
                position: "absolute",
                ":hover": {
                  backgroundColor: "#E3F2FD",
                  boxShadow:
                    "0px 2px 4px rgba(0, 0, 0, 0.12), 0px 2px 3px rgba(0, 0, 0, 0.24)",
                },
              }}
            >
              {theme.direction === "rtl" ? <MenuIcon /> : <MenuIcon />}
            </IconButton>
          </Tooltip>
        </DrawerHeader>

        <List>
          {menuItems.map((item) => (
            <ListItem
              key={item.id}
              disablePadding
              sx={{
                display: "block",
                backgroundColor: urlPath.includes(item.route) ? "#2196f3" : "",
                opacity: urlPath.includes(item.route) ? "0.9" : "",
              }}
              onClick={() => navigate(item.route)}
            >
              <ListItemButton
                selected={urlPath.includes(item.route)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? "initial" : "center",
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : "auto",
                    justifyContent: "center",
                    color: "white",
                    //color: urlPath.includes(item.route) ? "white" : "#2196f3",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: "white",
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          background: "#f6f9ff",
          height: "100vh",
          overflow: "auto",
        }}
      >
        <DrawerHeader />
        <Outlet />
        <br />
      </Box>
    </Box>
  );
}*/

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 240;

function Sidenav({ menuItems }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navigate = useNavigate();

  // Create a URLSearchParams object with the current URL's query string
  const urlPathObj = new URL(window.location.href);
  const urlPath = urlPathObj.href;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.id}
            disablePadding
            onClick={() => navigate(item.route)}
            sx={{
              backgroundColor: urlPath.includes(item.route) ? "#2196f3" : "",
              opacity: urlPath.includes(item.route) ? "0.5" : "",
            }}
          >
            <ListItemButton>
              <ListItemIcon sx={{ color: "#fff" }}>{item.icon}</ListItemIcon>
              <ListItemText sx={{ color: "#fff" }} primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box
      id="sideNav"
      sx={{ display: "flex", flex: "100%", overflow: "hidden" }}
    >
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: "#fff",
        }}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" }, color: "#263238" }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ color: "#263238" }}
          >
            E-Commerce Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* The implementation can be swapped with js to avoid SEO duplication of links. */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#2196f3",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#2196f3",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          overflow: "auto",
          height: "100vh",
          background: "#f6f9ff",
          width: {
            xs: "100vw",
            sm: `calc(100vw - ${drawerWidth}px)`,
          },
        }}
      >
        <Toolbar />
        <Outlet />
        <br />
      </Box>
    </Box>
  );
}

export default Sidenav;
