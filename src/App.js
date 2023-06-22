import { adminNavBarItems } from "./components/Navbar/AdminSidenavItems";
import Sidenav from "./components/Navbar/Sidenav";
import Grid from "@mui/material/Grid";

function App() {
  return (
    <Grid container>
      <Sidenav menuItems={adminNavBarItems} />
    </Grid>
  );
}

export default App;
