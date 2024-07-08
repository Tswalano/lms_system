import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container, Grid, Paper, Typography, TextField, Button, Box, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    occupation: z.string().min(1, "Occupation is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
});

type ProfileInputs = z.infer<typeof profileSchema>;

function UserProfile() {
    const [editMode, setEditMode] = useState(false);
    const [userData, setUserData] = useState({
        firstName: 'Lucas',
        lastName: 'Hood',
        occupation: 'Engineering Operator',
        email: 'lucas.hood@disraptor.co.za',
        phone: '+27 123 456 789'
    })
    const { handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: userData
    });

    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleSaveClick = (data: any) => {

        // delay
        setTimeout(() => {
            setEditMode(false);
        }, 1000);

        if (!isSubmitting) {
            console.log(data);
            setUserData(data);
        }

        // TODO: Here you would also handle form submission logic, like updating the profile in your database
    };

    const handleCancelClick = () => {
        setEditMode(false);
    };

    return (
        <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
                <Typography variant="h4">User Profile</Typography>
            </Stack>

            <Grid container spacing={4} sx={{ mt: 4 }}>
                <Grid item xs={12} md={8}>
                    {!editMode ? (
                        <>
                            <Paper sx={{ p: 3, mb: 4 }}>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>
                                <Typography variant="body1">
                                    <strong>First Name:</strong> {userData.firstName}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Last Name:</strong> {userData.lastName}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Occupation:</strong> {userData.occupation}
                                </Typography>
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Contact Details
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Email Address:</strong> {userData.email}
                                </Typography>
                                <Typography variant="body1">
                                    <strong>Phone Number:</strong> {userData.phone}
                                </Typography>
                            </Paper>

                            <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleEditClick}>
                                Update Profile
                            </Button>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit(handleSaveClick)}>
                            <Paper sx={{ p: 3, mb: 4 }}>
                                <Typography variant="h6" gutterBottom>
                                    Personal Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="firstName"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    required
                                                    fullWidth
                                                    label="First Name"
                                                    autoComplete="given-name"
                                                    error={!!errors.firstName}
                                                    helperText={errors.firstName?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Controller
                                            name="lastName"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    required
                                                    fullWidth
                                                    label="Last Name"
                                                    autoComplete="family-name"
                                                    error={!!errors.lastName}
                                                    helperText={errors.lastName?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="occupation"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    required
                                                    fullWidth
                                                    label="Occupation"
                                                    error={!!errors.occupation}
                                                    helperText={errors.occupation?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Contact Details
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    required
                                                    fullWidth
                                                    label="Email Address"
                                                    autoComplete="email"
                                                    error={!!errors.email}
                                                    helperText={errors.email?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    required
                                                    fullWidth
                                                    label="Phone Number"
                                                    autoComplete="tel"
                                                    error={!!errors.phone}
                                                    helperText={errors.phone?.message}
                                                />
                                            )}
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>

                            <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
                                <LoadingButton loading={isSubmitting} variant="contained" color="primary" type="submit">
                                    Save
                                </LoadingButton>
                                <Button variant="outlined" color="secondary" onClick={handleCancelClick}>
                                    Cancel
                                </Button>
                            </Box>
                        </form>
                    )}
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Security Settings
                        </Typography>
                        <Box>
                            <Button variant="contained" color="primary" sx={{ mb: 2 }}>
                                Change Password
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}

const editUserProfile = (userData: any) => {
    return <>Hello World</>;
}

export default UserProfile;
