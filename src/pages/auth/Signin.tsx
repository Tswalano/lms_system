import { useEffect, useState } from "react";
import { object, string, TypeOf } from 'zod';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Box, Typography, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { getMeFn, loginUserFn } from "../../api/authAPI";
import Logo from "../../components/ui/Logo";
import FormInput from "../../components/ui/FormInput";
import { useCookies } from "react-cookie";
import jwtDecode from "jwt-decode";
import { useUserQuery } from "../../hooks";

const loginSchema = object({
  username: string()
    .min(1, 'Email address is required')
    .email('Email Address is invalid'),
  password: string()
    .min(1, 'Password is required')
    .min(8, 'Password must be more than 8 characters')
    .max(32, 'Password must be less than 32 characters'),
});

export type LoginInput = TypeOf<typeof loginSchema>;

function Signin() {
  const [cookies, setCookie] = useCookies(['logged_in', 'token', 'accessToken', 'userId']);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const from = ((location.state as any)?.from?.pathname as string) || '/';

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });


  const { isLoading } = useUserQuery(cookies.userId, cookies.token);

  //  API Login Mutation
  const { mutate: loginUser, isPending, error, isError } = useMutation({
    mutationKey: ['loginUser'],
    mutationFn: (userData: LoginInput) => loginUserFn(userData),
    onSuccess: ({ body: { code, payload } }) => {

      if (code === "NEW_PASSWORD_REQUIRED") {
        console.log("payload", methods);
        navigate(`/new-password`, { state: { from, session: payload.Session, isChangePassword: true, email: methods.getValues('username') } });
      } else {
        // store the token in cookies

        console.log('payload', payload)

        const decodedValue = jwtDecode(payload.IdToken) as { sub: string, 'custom:userId': string };
        const uuid = decodedValue["custom:userId"];

        setCookie('logged_in', 'true', { secure: true, sameSite: 'strict' });
        setCookie('token', payload.IdToken, { secure: true, sameSite: 'strict' });
        setCookie('accessToken', payload.AccessToken, { secure: true, sameSite: 'strict' });
        setCookie('userId', uuid, { secure: true, sameSite: 'strict' });

        // Invalidate queries to refetch with the updated `userId`
        queryClient.invalidateQueries({ queryKey: ['authUser', uuid] });
        console.log('You successfully logged in');
        navigate(from);
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


  const {
    // reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods;

  useEffect(() => {
    if (isSubmitSuccessful) {
      // reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitSuccessful]);

  const onSubmitHandler: SubmitHandler<LoginInput> = (values) => {
    // 👇 Executing the loginUser Mutation
    loginUser(values)
  };

  function isValidJSON(message: string): boolean {
    try {
      JSON.parse(message);
      return true;
    } catch (error) {
      return false;
    }
  }

  if (isLoading) {
    return <>Getting User Details...</>
  }

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
            {isValidJSON(error.message) ? (
              <>
                <span style={{ fontWeight: 'bold' }}>{JSON.parse(error.message).code}: </span>
                {JSON.parse(error.message).message}
              </>
            ) : (
              <>
                <span style={{ fontWeight: 'bold' }}>UNKNOWN_ERROR: </span>
                Something went wrong. Please try again later.
              </>
            )}
          </Typography>
        )}

        {/* if redirects from password recovery state is true, show success message */}
        {location.state?.isRecovered && (
          <Typography
            variant="body2"
            sx={{
              mb: 2,
              width: 'auto',
              color: 'green',
              backgroundColor: 'rgba(0, 255, 0, 0.1)',
              p: 2,
              borderRadius: '10px',
            }}
          >
            <span style={{ fontWeight: 'bold' }}>SUCCESS: </span>
            Your password has been successfully changed.
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
            <FormInput name='username' label='Email Address' type='email' />
            <FormInput name='password' label='Password' type='password' />

            <Typography
              sx={{ fontSize: '0.9rem', mb: '1rem', textAlign: 'right' }}
            >
              <Link to='/forgot-password' style={{ color: '#333' }}>
                Forgot Password?
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
      </Paper>
    </Container>
  );
}

export default Signin;
