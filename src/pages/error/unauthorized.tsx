import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    const handleGoBack = () => {
        navigate(-1); // Navigate back to the previous page
    };

    return (
        <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
            <Box display="flex" flexDirection="column" alignItems="center">
                <LockIcon style={{ fontSize: 60, marginBottom: '20px' }} color="error" />
                <Typography variant="h4" component="h1" gutterBottom>
                    Unauthorized
                </Typography>
                <Typography variant="body1" paragraph>
                    You do not have permission to view this page.
                </Typography>
                <Button variant="contained" color="primary" onClick={handleGoBack}>
                    Go Back
                </Button>
            </Box>
        </Container>
    );
};

export default Unauthorized;
