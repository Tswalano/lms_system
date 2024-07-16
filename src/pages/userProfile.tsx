import { useState } from 'react';
import { useForm, Controller, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Container, Grid, Paper, Typography, TextField, Button, Box, Stack } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import FormInput from '../components/ui/FormInput';
import { useMutation } from '@tanstack/react-query';
import { changePasswordFn } from '../api/authAPI';

const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    occupation: z.string().min(1, "Occupation is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
});

const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, "Old password is required"),
    newPassword: z.string().min(1, "New password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
});

type ProfileInputs = z.infer<typeof profileSchema>;
type ChangePasswordInputs = z.infer<typeof changePasswordSchema>;

function UserProfile() {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [changePassword, setChangePassword] = useState<boolean>(false);

    const methods = useForm<ChangePasswordInputs>({
        resolver: zodResolver(changePasswordSchema),
    });

    const {
        reset: resetChangePassword,
        handleSubmit: handleSubmitChangePassword,
        formState: { isSubmitSuccessful },
    } = methods;

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
        if (!isSubmitting) {
            console.log(data);
            setUserData(data);
        }

        // TODO: Here you would also handle form submission logic, like updating the profile in your database
    };

    const handleCancelClick = () => {
        setEditMode(false);
    };

    const mutate = useMutation({
        mutationKey: ['changePassword'],
        mutationFn: (userData: ChangePasswordInputs) => changePasswordFn({
            oldPassword: userData.oldPassword,
            newPassword: userData.newPassword,
            accessToken: ""
        }),
        onSuccess: (data) => {
            if (data.error) {
                console.log('on recover passwoerd error', data);
                throw new Error(data.message);
            }
        },
        onError: (error: any) => {
            if (Array.isArray((error as any).response.data.error)) {
                (error as any).response.data.error.forEach((el: any) =>
                    console.error(el.message)
                );
            } else {
                console.error((error as any).response.data.message);
            }
        },
    });

    const onChangePassword: SubmitHandler<ChangePasswordInputs> = (values) => {
        //  if password doesn't match confirm
        if (values.newPassword !== values.confirmPassword) {
            methods.setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
        }

        mutate.mutate(values);
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
                        {changePassword ? (
                            <Box>
                                <FormProvider {...methods}>
                                    <Box
                                        component='form'
                                        onSubmit={handleSubmitChangePassword(onChangePassword)}
                                        noValidate
                                        autoComplete='off'
                                        sx={{
                                            p: {},
                                            borderRadius: 2,
                                        }}
                                    >
                                        <FormInput name='oldPassword' label='Old Password' type='password' />
                                        <FormInput name='newPassword' label='New Password' type='password' />
                                        <FormInput name='confirmPassword' label='Confirm Password' type='password' />

                                        <Typography
                                            sx={{ fontSize: '0.9rem', mb: '1rem', textAlign: 'right' }}
                                        >
                                        </Typography>

                                        <LoadingButton
                                            variant='contained'
                                            sx={{ mt: 1, borderRadius: '10px' }}
                                            fullWidth
                                            disableElevation
                                            type='submit'
                                        // loading={isPending}
                                        >
                                            Change Password
                                        </LoadingButton>
                                    </Box>
                                </FormProvider>
                            </Box>
                        ) : (
                            <Button
                                variant='contained'
                                onClick={() => setChangePassword(true)}
                            >
                                Change Password
                            </Button>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}

export default UserProfile;
