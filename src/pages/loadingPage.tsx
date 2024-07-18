import React from 'react';
import { Container, Box, CircularProgress, Typography } from '@mui/material';

type LoadingPageProps = {
    message?: string;
};

const LoadingPage: React.FC<LoadingPageProps> = ({ message = "Loading..." }) => {
    return (
        <Container maxWidth="sm" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Box display="flex" flexDirection="column" alignItems="center">
                <CircularProgress size={60} />
                <Typography variant="h6" style={{ marginTop: '20px' }}>
                    {message}
                </Typography>
            </Box>
        </Container>
    );
};

export default LoadingPage;
