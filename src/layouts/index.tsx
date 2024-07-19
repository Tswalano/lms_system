import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Main from './main';
import Header from './header';
import Nav from './nav';


// type DashboardProps = {
//     children: ReactPropTypes.Required<ReactElement<JSXElementConstructor<any>>>;,
// }

// export default function DashboardLayout({ children }: DashboardProps) {

type DashboardProps = {
    children: React.ReactElement;
};

const DashboardLayout: React.FC<DashboardProps> = ({ children }) => {

    const [openNav, setOpenNav] = useState(false);

    return (
        <>
            {/* Header */}

            <Box
                sx={{
                    minHeight: 1,
                    display: 'flex',
                    flexDirection: { xs: 'column', lg: 'row' },
                }}
            >
                <Nav
                    openNav={openNav}
                    onCloseNav={() => setOpenNav(false)}
                    onOpenNav={() => setOpenNav(true)} />

                <Main>{children}</Main>
            </Box>
        </>
    );
}

export default DashboardLayout