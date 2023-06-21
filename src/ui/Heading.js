import { Typography } from '@mui/material';
import React from 'react';

function Heading({ text }) {
    return (  
        <>
            <Typography 
                variant='h5'
                color={'primary'}
                sx={{
                    fontFamily:'Geologica',
                    fontWeight:'bold',
                    paddingBottom:'30px',
                }}
              >
                {text}
            </Typography>
        </>
    );
}

export default Heading;