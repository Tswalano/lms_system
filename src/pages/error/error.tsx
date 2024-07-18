import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const ErrorPage: React.FC = () => {
    const handleRetry = () => {
        // Logic for retry action
        window.location.reload();
    };

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
                textAlign="center"
            >
                <ErrorOutlineIcon color="error" style={{ fontSize: 100 }} />
                <Typography variant="h4" component="h1" gutterBottom>
                    Something went wrong
                </Typography>
                <Typography variant="body1" gutterBottom>
                    We encountered an error while processing your request.
                </Typography>
                <Button variant="contained" color="primary" onClick={handleRetry}>
                    Retry
                </Button>
            </Box>
        </Container>
    );
};

export default ErrorPage;
