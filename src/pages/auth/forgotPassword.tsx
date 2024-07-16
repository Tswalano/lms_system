import { useEffect, useState } from "react";
import { object, string, TypeOf } from 'zod';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Box, Typography, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { confirmVerificationCodeFn, forgotPasswordFn } from "../../api/authAPI";
import Logo from "../../components/ui/Logo";
import FormInput from "../../components/ui/FormInput";

const forgotPasswordSchema = object({
    email: string()
        .min(1, 'Email address is required')
        .email('Email Address is invalid'),
});

const resetPasswordSchema = object({
    newPassword: string().min(1, 'Password is required').min(8, 'Password must be more than 8 characters'),
    verificationCode: string().min(1, 'Verification code is required'),
});

export type ForgotPasswordInput = TypeOf<typeof forgotPasswordSchema>;
export type ResetPasswordInput = TypeOf<typeof resetPasswordSchema>;

function ForgotPassword() {
    const [viewState, setViewState] = useState('forgotPassword');
    // set recover email to state
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const from = ((location.state as any)?.from.pathname as string) || '/';

    const methods = useForm<ForgotPasswordInput>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const resetMethods = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
    });


    const { mutate: recoverPassword, isPending, error, isError } = useMutation({
        mutationKey: ['forgotPassword'],
        mutationFn: (userData: ForgotPasswordInput) => forgotPasswordFn(userData),
        onSuccess: (data) => {
            if (data.error) {
                console.log('on recover passwoerd error', data);
                throw new Error(data.message);
            }

            setViewState('resetPassword');
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


    // For reset password
    const mutate = useMutation({
        mutationKey: ['resetPassword'],
        mutationFn: (userData: ResetPasswordInput) => confirmVerificationCodeFn({ ...userData, email: recoveryEmail }),
        onSuccess: (data) => {
            if (data.error) {
                console.log('on recover passwoerd error', data);
                throw new Error(data.message);
            }

            //  navogate to login
            navigate('/signin', { state: { from, isRecovered: true } });
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

    const {
        reset,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = methods;

    const {
        reset: resetForm,
        handleSubmit: handleResetSubmit,
        formState: { isSubmitSuccessful: isResetSubmitSuccessful },
    } = resetMethods;

    useEffect(() => {
        if (isSubmitSuccessful && viewState === 'forgotPassword') {
            console.log("useeffect")
            setRecoveryEmail(methods.getValues().email);
            reset();
        } else if (isResetSubmitSuccessful && viewState === 'resetPassword') {
            resetForm();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitSuccessful, isResetSubmitSuccessful]);

    const onSubmitHandler: SubmitHandler<ForgotPasswordInput> = (values) => {
        // 👇 Executing the loginUser Mutation
        recoverPassword(values)
    };

    const onResetSubmitHandler: SubmitHandler<ResetPasswordInput> = (values) => {
        // 👇 Executing the loginUser Mutation
        mutate.mutate(values)
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '600px',
                minHeight: '100vh',
            }}
        >
            <Box sx={{ width: '480px' }}>
                <Logo width="200px" />
                {/* center typography text to center */}
                {viewState === 'forgotPassword' && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            textAlign: 'center',
                            marginBottom: '2rem',
                        }}
                    >
                        Recover your Account
                    </Typography>
                )}

                {viewState === 'resetPassword' && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            textAlign: 'center',
                            marginBottom: '2rem',
                        }}
                    >
                        Enter the OTP code sent to your email and new password
                    </Typography>
                )}
                {(isError || mutate.isError) && (
                    <Typography
                        variant="body2"
                        sx={{
                            mb: 2,
                            width: 'auto',
                            color: 'red',
                            backgroundColor: 'rgba(255, 0, 0, 0.1)',
                            p: 2,
                            borderRadius: '10px',
                        }}
                    >
                        <span style={{ fontWeight: 'bold' }}>Ooopsie: </span>
                        {error?.message || mutate.error?.message}
                    </Typography>
                )}
            </Box>

            <Paper elevation={3} sx={{
                padding: "20px",
                maxWidth: '27rem',
                width: '100%',
                borderRadius: '15px',
            }}>
                {viewState === 'forgotPassword' && (
                    <FormProvider {...methods}>
                        <Box
                            component='form'
                            onSubmit={handleSubmit(onSubmitHandler)}
                            noValidate
                            autoComplete='off'
                            sx={{
                                p: {},
                                borderRadius: 2,
                            }}
                        >
                            <FormInput name='email' label='Email Address' type='email' />
                            {/* <FormInput name='password' label='Password' type='password' /> */}

                            <Typography
                                sx={{ fontSize: '0.9rem', mb: '1rem', textAlign: 'right' }}
                            >
                                <Link to='/signin' style={{ color: '#333' }}>
                                    Back to Login
                                </Link>
                            </Typography>

                            <LoadingButton
                                variant='contained'
                                sx={{ mt: 1, borderRadius: '10px' }}
                                fullWidth
                                disableElevation
                                type='submit'
                                loading={isPending}
                            >
                                Login
                            </LoadingButton>
                        </Box>
                    </FormProvider>
                )}

                {viewState === 'resetPassword' && (
                    <FormProvider {...resetMethods}>
                        <Box
                            component='form'
                            onSubmit={handleResetSubmit(onResetSubmitHandler)}
                            noValidate
                            autoComplete='off'
                            sx={{ borderRadius: 2, }}
                        >
                            <FormInput name='verificationCode' label='Confirmation Code' type='text' />
                            <FormInput name='newPassword' label='New Password' type='password' />

                            <Typography
                                sx={{ fontSize: '0.9rem', mb: '1rem', textAlign: 'right' }}
                            >
                                <Link to='/signin' style={{ color: '#333' }}>
                                    Back to Login
                                </Link>
                            </Typography>

                            <LoadingButton
                                variant='contained'
                                sx={{ mt: 1, borderRadius: '10px' }}
                                fullWidth
                                disableElevation
                                type='submit'
                                loading={isPending || mutate.isPending}
                            >
                                Recover Password
                            </LoadingButton>
                        </Box>
                    </FormProvider>
                )}
            </Paper>
        </Container>
    )
}

export default ForgotPassword