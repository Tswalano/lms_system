import { object, string, TypeOf } from 'zod';
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Box, Typography, Paper, FormControl } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import Logo from "../../components/ui/Logo";
import { forcePasswordChangeFn, getMeFn } from "../../api/authAPI";
import FormInput from "../../components/ui/FormInput";
import { useEffect } from 'react';
import { useCookies } from 'react-cookie';

const PasswordSchema = object({
    newPassword: string().min(1, 'Password is required').min(8, 'Password must be more than 8 characters')
});

export type PasswordInput = TypeOf<typeof PasswordSchema>;

function ChangePassword() {
    const [cookies, setCookie] = useCookies(['logged_in', 'token', 'accessToken']);
    const navigate = useNavigate();
    const location = useLocation();

    const from = ((location.state as any)?.from.pathname as string) || '/';

    const methods = useForm<PasswordInput>({
        resolver: zodResolver(PasswordSchema),
    });

    const query = useQuery({
        queryKey: ['authUser'],
        queryFn: () => getMeFn(cookies.token, cookies.accessToken),
        enabled: false,
        select: (data) => data.body.payload,
        retry: 1
    });


    const {
        reset,
        handleSubmit,
        formState: { isSubmitSuccessful },
    } = methods;

    const { mutate: forcePasswordChange, error, isPending, isError } = useMutation({
        mutationKey: ['changePassword', location.state?.email],
        mutationFn: (userData: PasswordInput) => forcePasswordChangeFn({ ...userData, email: location.state?.email as string, session: location.state?.session as string }),
        onSuccess: (data) => {
            if (data.error) {
                console.log('on change password error', data);
                throw new Error(data.message);
            }

            const { payload } = data

            setCookie('logged_in', 'true', { secure: true, sameSite: 'strict' });
            setCookie('token', payload.IdToken, { secure: true, sameSite: 'strict' });
            setCookie('accessToken', payload.AccessToken, { secure: true, sameSite: 'strict' });

            query.refetch();
            console.log('You successfully logged in');
            navigate(from);
        },
        onError: (error: any) => {
            if (Array.isArray((error as any).response.data.error)) {
                (error as any).response.data.error.forEach((el: any) =>
                    console.error(el.message)
                );
            } else {
                console.error((error as any).response.data.message);
            }
        }
    });


    useEffect(() => {
        console.log('location.state', (location.state?.isChangePassword));
        // if we did not initiate the change password - redirect to home
        if (!location.state?.isChangePassword || null) {
            navigate('/signin', { state: { from } });
        }

        if (isSubmitSuccessful) {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSubmitSuccessful]);

    const onSubmitHandler: SubmitHandler<PasswordInput> = (values) => {
        // 👇 Executing the loginUser Mutation
        forcePasswordChange(values)
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
                {isError && (
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
                        {error?.message}
                    </Typography>
                )}
            </Box>

            <Paper elevation={3} sx={{
                padding: "20px",
                maxWidth: '27rem',
                width: '100%',
                borderRadius: '15px',
            }}>
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
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <Typography
                                variant='subtitle2'
                                sx={{ color: '#FA0F00', textAlign: 'center', mb: 1, fontWeight: 500 }}
                            >
                                New Password is Required
                            </Typography>
                        </FormControl>
                        {/* <FormInput name='email' label='Email Address' type='email' /> */}
                        <FormInput name='newPassword' label='New Password' type='password' />

                        <LoadingButton
                            variant='contained'
                            sx={{ mt: 1, borderRadius: '10px' }}
                            fullWidth
                            disableElevation
                            type='submit'
                            loading={isPending}
                        >
                            Change Password
                        </LoadingButton>
                    </Box>
                </FormProvider>
            </Paper>
        </Container>
    )
}

export default ChangePassword