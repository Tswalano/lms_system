// import { useContext } from "react";
// import { adminNavBarItems } from "./components/navbar/AdminSidenavItems";
// import { userNavBarItems } from "./components/navbar/UserSidenavItems";
// import Sidenav from "./components/navbar/Sidenav";
// import { AuthContext } from "./context/AuthContext";

// function App() {
//   // set user role
//   const ctx = useContext(AuthContext);
//   return (
//     <>
//       <Sidenav
//         menuItems={
//           ctx.isAdmin === "admin" ? adminNavBarItems : userNavBarItems
//         }
//       />
//     </>
//   );
// }

// export default App;

import { CssBaseline } from "@mui/material";
import { useRoutes } from "react-router-dom";
import routes from "./routes";

function App() {
  const content = useRoutes(routes);
  return (
    <>
      <CssBaseline />
      {content}
    </>
  );
}

export default App;
