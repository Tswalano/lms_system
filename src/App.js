import { adminNavBarItems } from "./components/navbar/AdminSidenavItems";
import { userNavBarItems } from "./components/navbar/UserSidenavItems";
import Sidenav from "./components/navbar/Sidenav";
import Grid from "@mui/material/Grid";
import React, { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function App() {
  // set user role
  const ctx = useContext(AuthContext);
  return (
    <>
      <Grid container>
        <Sidenav
          menuItems={
            ctx.isAdmin === "admin" ? adminNavBarItems : userNavBarItems
          }
        />
      </Grid>
    </>
  );
}

export default App;
