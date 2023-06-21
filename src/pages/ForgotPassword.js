import React, { useState } from 'react';
import { styled } from '@mui/system';
import { Grid, Paper, Box } from '@mui/material';
import EmailInput from '../ui/EmailInputField';
import SubmitButton from '../ui/Button';
import Logo from '../ui/Logo';
import Heading from '../ui/Heading';
import Paragraph from '../ui/Paragraph';

// Styling for the vertically and horizontally centered container 
const CenteredBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
}));
  
  // Create a padding for the root element in the index page, this padding will only be applied when this page is rendered 
const useStyles = styled((theme) => ({
    root: {
        padding:'20px',
    }
}));

function ForgotPassword() {

    // set state for the email inputs
    const [email, setEmail] = useState('');

    // handle email input from user
    const handleEmailChange = (value) => {
        setEmail(value);
    };

    // handle the onclick event for the login button
    const handleSubmitEmail = (event) => {
        
        event.preventDefault();

        // reg ex (patterns / formats) for email, phone and password
        const emailFormat = /^[a-zA-Z0-9._%+-]+@disraptor\.co\.za$/;

        if(emailFormat.test(email)){
            alert("Passed");
            // continue integrating
        }

    }

    return (  
        <>
            {/* create a container box to be vertically and horizontally centered on the center of the screen */}
            <CenteredBox>
                {/* Grid to create a responsive container for input fields */}
                <Grid container justifyContent="center" alignItems="center" p={3}>
                    <Grid item xs={12} sm={12} md={7} lg={4} xl={4}>
                        {/* company logo (outside the shadowed box) */}
                        <Box sx={{width:"45%", marginLeft:'auto', marginRight:'auto', paddingBottom:'20px'}}><Logo /></Box>
                        <Paper elevation={2} sx={{ padding: theme => theme.spacing(2), width: '100%', p: '30px' }}>
                            {/* Heading text */}
                            <Box sx={{textAlign:'center'}}>
                                <Heading text="Forgot your password?" />
                            </Box>
                            {/* Paragraph text */}
                            <Box sx={{textAlign:'left'}}>
                                <Paragraph text="Enter your email below and a message will be sent to reset your password." />
                            </Box>

                            {/* Reusable email input field */}
                            <EmailInput id="email" placeHolder="Enter your Disraptor email address" value={email} onChange={handleEmailChange} />
                            
                            {/* Reusable submit button */}
                            <SubmitButton id="sendEmail" label="Reset my password" onClick={handleSubmitEmail} />
                                              
                        </Paper>
                    </Grid>
                </Grid>
            </CenteredBox>
        </>
    );
}

export default ForgotPassword;