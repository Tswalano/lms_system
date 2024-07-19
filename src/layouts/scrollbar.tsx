import PropTypes from 'prop-types';
import { memo, forwardRef } from 'react';

import Box from '@mui/material/Box';
import { StyledRootScrollbar } from './styles';


type ScrollbarProps = {
    children: React.ReactNode,
    sx: any,
};

const Scrollbar = forwardRef(({ children, sx, ...other }: ScrollbarProps, ref) => {
    const userAgent = typeof navigator === 'undefined' ? 'SSR' : navigator.userAgent;

    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (mobile) {
        return (
            <Box ref={ref} sx={{ overflow: 'auto', ...sx }} {...other}>
                {children}
            </Box>
        );
    }

    return (
        <StyledRootScrollbar>
            {children}
        </StyledRootScrollbar>
    );
});

export default memo(Scrollbar);
