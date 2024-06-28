import { useContext, useEffect } from "react";
import { object, string, TypeOf } from 'zod';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Container, Box, Typography, Paper } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useStateContext } from "../../../context";
import { getMeFn, loginUserFn } from "../../../api/authAPI";
import { AuthAPIResponse } from "../../../api/types";
import Logo from "../../../components/ui/Logo";
import FormInput from "../../../components/ui/FormInput";
import { AuthContext } from "../../../context/AuthContext";

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
  const navigate = useNavigate();
  const location = useLocation();
  const stateContext = useStateContext();

  const ctx = useContext(AuthContext);

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // const query = useQuery({
  //   queryKey: ['authUser'],
  //   queryFn: () => getMeFn(localStorage.getItem('token') as string, localStorage.getItem('accessToken') as string),
  //   enabled: false,
  //   select: (data: AuthAPIResponse) => {
  //     console.log("authUser", data);
  //     if (!data.body.error) {
  //       stateContext.dispatch({ type: 'SET_USER', payload: null });
  //       ctx.logIn(data.body.payload.IdToken, "user"); //TODO get the user types
  //     } else {
  //       throw new Error("Login Failed");
  //     }

  //     return data.body.payload;
  //   },
  //   retry: 1,
  // });

  const { mutate: loginUser, isPending, error, isError } = useMutation({
    mutationKey: ['loginUser'],
    mutationFn: ({ username, password }: LoginInput) => loginUserFn({ username, password }),
    onSuccess: (data: AuthAPIResponse) => {
      const { payload } = data.body;

      getMeFn(payload.IdToken, payload.AccessToken).then((data: AuthAPIResponse) => {
        if (!data.body.error) {
          stateContext.dispatch({ type: 'SET_USER', payload: null });
          ctx.logIn(payload.IdToken, "user"); //TODO get the user types

          console.log("Login Successful", data);
          navigate(((location.state as any)?.from.pathname as string) || '/');

        } else {
          console.log("Login Failed", data);
          throw new Error("Login Failed");
        }
      })

    },
    onError: (error: any) => {
      if (Array.isArray((error as any).response.data.error)) {
        (error as any).response.data.error.forEach((el: any) => (
          console.error(el.message)
        ));
      } else {
        console.error(error);
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
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitSuccessful]);

  const onSubmitHandler = handleSubmit((values: LoginInput) => {
    loginUser(values);
  });

  const isValidJSON = (str: string) => {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
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
            onSubmit={onSubmitHandler}
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
