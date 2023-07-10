import { adminNavBarItems } from "./components/navbar/AdminSidenavItems";
import { userNavBarItems } from "./components/navbar/UserSidenavItems";
import Sidenav from "./components/navbar/Sidenav";
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
