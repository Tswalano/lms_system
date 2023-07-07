import { adminNavBarItems } from "./components/Navbar/AdminSidenavItems";
import { userNavBarItems } from "./components/Navbar/UserSidenavItems";
import Sidenav from "./components/Navbar/Sidenav";
import Grid from "@mui/material/Grid";
import ApplyForLeave from "./pages/onboarding/applyforleave/ApplyForLeave";

function App() {
  // set user role

  const isRoleAdmin = false; //sessionStorage.getItem("isRoleAdmin");

  return (
    <>
      {/*}
      <Grid container>
        <Sidenav menuItems={isRoleAdmin ? adminNavBarItems : userNavBarItems} />
      </Grid>
      */}
      <ApplyForLeave></ApplyForLeave>
    </>
  );
}

export default App;
