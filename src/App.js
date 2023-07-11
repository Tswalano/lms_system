import { adminNavBarItems } from "./components/Navbar/AdminSidenavItems";
import { userNavBarItems } from "./components/Navbar/UserSidenavItems";
import Sidenav from "./components/Navbar/Sidenav";
import Grid from "@mui/material/Grid";
import React, { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function App() {
  // set user role
  const ctx = useContext(AuthContext);
  return (
    <>
      <Grid container>
        <Sidenav menuItems={ctx.isAdmin ? adminNavBarItems : userNavBarItems} />
      </Grid>
    </>
  );
}

export default App;
