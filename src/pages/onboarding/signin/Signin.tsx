import { useEffect, useMemo, useState } from "react";
import { object, string, TypeOf } from 'zod';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Box, Typography, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useCredentials, useStateContext } from "../../../context";
import { getMeFn, loginUserFn } from "../../../api/authAPI";
import Logo from "../../../components/ui/Logo";
import FormInput from "../../../components/ui/FormInput";
import { useCookies } from "react-cookie";

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
  const [cookies, setCookie] = useCookies(['logged_in', 'token', 'accessToken']);
  const navigate = useNavigate();
  const location = useLocation();

  const from = ((location.state as any)?.from.pathname as string) || '/';

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const stateContext = useStateContext();
  const creds = useCredentials();

  const query = useQuery({
    queryKey: ['authUser'],
    queryFn: () => getMeFn(cookies.token, cookies.accessToken),
    enabled: false,
    select: (data) => data.body.payload,
    retry: 1
  });

  //  API Login Mutation
  const { mutate: loginUser, isPending, error, isError } = useMutation({
    mutationKey: ['loginUser'],
    mutationFn: (userData: LoginInput) => loginUserFn(userData),
    onSuccess: ({ body: { payload: { IdToken, AccessToken } } }) => {

      // store the token in cookies

      setCookie('logged_in', 'true', { secure: true, sameSite: 'strict' });
      setCookie('token', IdToken, { secure: true, sameSite: 'strict' });
      setCookie('accessToken', AccessToken, { secure: true, sameSite: 'strict' });

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
    },
  });


  const {
    reset,
    handleSubmit,
    formState: { isSubmitSuccessful },
  } = methods;

  useEffect(() => {
    if (isSubmitSuccessful) {
      console.log("we here", { token: creds.token })
      reset();
    } else {
      console.log("we here x2", { token: creds.token })
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
              <Link to='/' style={{ color: '#333' }}>
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
