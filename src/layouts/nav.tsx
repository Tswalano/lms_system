import React, { useState, useEffect, forwardRef } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Drawer from "@mui/material/Drawer";
import Avatar from "@mui/material/Avatar";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { HiLogout } from "react-icons/hi";
import Logo from "../components/ui/Logo";
import Scrollbar from "./scrollbar";
import navConfig from "../utils/navConfig";
import { NAV } from "../utils/configLayout";
import { useStateContext } from "../context";
import { capitalizeName } from "../utils/Util";

function Nav() {
  const [openNav, setOpenNav] = useState(false);
  const [, setCookie] = useCookies(["logged_in", "token", "accessToken"]);
  const stateContext = useStateContext();
  const user = stateContext.state.authUser;
  const authorizedRoutes = navConfig.filter((route) =>
    route.permissions?.includes(user?.role || "user")
  );
  const navigate = useNavigate();
  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  useEffect(() => {
    if (isLgUp && openNav) {
      setOpenNav(false);
    }
  }, [isLgUp, openNav]);

  const handleOpenNav = () => {
    setOpenNav(true);
  };

  const handleCloseNav = () => {
    setOpenNav(false);
  };

  const renderAccount = (
    <Box
      sx={{
        my: 3,
        mx: 2.5,
        py: 2,
        px: 2.5,
        display: "flex",
        borderRadius: 1.5,
        alignItems: "center",
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
      }}
    >
      <Avatar src={""} alt="photoURL" />
      <Box sx={{ ml: 2 }}>
        <Typography variant="subtitle2">
          <Link
            style={{
              textDecoration: "none",
              color: "#fff",
              fontWeight: "bold",
            }}
            to="/view-profile"
          >
            {capitalizeName(user?.firstName)} {capitalizeName(user?.lastName)}
          </Link>
        </Typography>
        <Typography variant="body2" sx={{ color: "#BDBDBD" }}>
          {user?.jobTitle}
        </Typography>
      </Box>
    </Box>
  );

  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
      {authorizedRoutes.map((item) => (
        <NavItem key={item.title} item={item} />
      ))}
      <ListItemButton
        sx={{
          minHeight: 44,
          borderRadius: 0.75,
          typography: "body2",
          color: "#fff",
          textTransform: "capitalize",
          fontWeight: "fontWeightMedium",
        }}
        onClick={() => {
          setCookie("logged_in", null, { path: "/" });
          setCookie("token", null, { path: "/" });
          setCookie("accessToken", null, { path: "/" });
          navigate("/signin");
          window.location.reload();
        }}
      >
        <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
          <HiLogout size={22} />
        </Box>
        <Box component="span">Logout</Box>
      </ListItemButton>
    </Stack>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        "& .simplebar-content": {
          height: 1,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Logo width="250px" />
      {renderAccount}
      {renderMenu}
      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.WIDTH },
      }}
    >
      {isLgUp ? (
        <Box
          sx={{
            backgroundImage: "linear-gradient(to right, #006699, #004477)",
            height: 1,
            position: "fixed",
            width: NAV.WIDTH,
            borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
          }}
        >
          {renderContent}
        </Box>
      ) : (
        <>
          <IconButton
            onClick={openNav ? handleCloseNav : handleOpenNav}
            sx={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: theme.zIndex.drawer + 1,
            }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            open={openNav}
            onClose={handleCloseNav}
            PaperProps={{
              sx: {
                width: NAV.WIDTH,
                backgroundImage: "linear-gradient(to right, #006699, #004477)",
              },
            }}
          >
            {renderContent}
          </Drawer>
        </>
      )}
    </Box>
  );
}

export default Nav;

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
  onOpenNav: PropTypes.func,
};

// ----------------------------------------------------------------------

function NavItem({ item }: any) {
  const RouterLink = forwardRef(({ href, ...other }: any, ref) => (
    <Link ref={ref} to={href} {...other} />
  ));
  const { pathname } = useLocation();
  const active = pathname === item.path;

  return (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: "body2",
        color: "#fff",
        textTransform: "capitalize",
        fontWeight: "fontWeightMedium",
        ...(active && {
          color: "#fff",
          fontWeight: "fontWeightSemiBold",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.5),
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
        {item.icon}
      </Box>
      <Box component="span">{item.title}</Box>
    </ListItemButton>
  );
}

NavItem.propTypes = {
  item: PropTypes.object,
};
