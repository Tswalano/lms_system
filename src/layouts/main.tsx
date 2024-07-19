import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { useResponsive } from '../hooks/useResponsive';
import { HEADER, NAV } from '../utils/configLayout';

type MainProps = {
    children: React.ReactElement;
};

const Main: React.FC<MainProps> = ({ children }) => {
    const lgUp = useResponsive('up', 'lg');

    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                minHeight: 1,
                display: 'flex',
                flexDirection: 'column',
                py: `${HEADER.H_MOBILE + 8}px`,
                ...(lgUp && {
                    px: 2,
                    py: `${HEADER.H_DESKTOP + 8}px`,
                    width: `calc(100% - ${NAV.WIDTH}px)`,
                }),
            }}
        >
            {children}
        </Box>
    );
}


export default Main