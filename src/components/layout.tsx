import { Outlet } from 'react-router-dom';
import Header from './Header';
import { Grid } from '@mui/material';

const Layout = () => {
    return (
        <Grid>
            <Header />
            <Outlet />
        </Grid>
    );
};

export default Layout;