import { adminNavBarItems } from "./components/Navbar/AdminSidenavItems";
import { userNavBarItems } from "./components/Navbar/UserSidenavItems";
import Sidenav from "./components/Navbar/Sidenav";
import Grid from "@mui/material/Grid";

function App() {
  // set user role
  const isRoleAdmin = true; //sessionStorage.getItem("isRoleAdmin");

  return (
    <>
      <Grid container>
        <Sidenav menuItems={isRoleAdmin ? adminNavBarItems : userNavBarItems} />
      </Grid>
    </>
  );
}

export default App;
