import { AppBar, Box, Container, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { LoadingButton as _LoadingButton } from '@mui/lab';
import { useStateContext } from '../context';
import { useMutation } from '@tanstack/react-query';
import { logoutUserFn } from '../api/authAPI';

const LoadingButton = styled(_LoadingButton)`
  padding: 0.4rem;
  color: #222;
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
  }
`;

const Header = () => {
    const navigate = useNavigate();
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;

    const { mutate: logoutUser, isPending: isLoading } = useMutation({
        mutationFn: logoutUserFn,
        onSuccess: (data: any) => {
            window.location.href = '/login';
        },
        onError: (error: any) => {
            if (Array.isArray(error.response.data.error)) {
                error.data.error.forEach((el: any) => console.error(el.message));
            } else {
                console.error(error.response.data.error.message);
            }
        },
    });

    const onLogoutHandler = async () => {
        logoutUser();
    };

    return (
        <>
            <AppBar position='static' sx={{ backgroundColor: '#fff' }}>
                <Container maxWidth='lg'>
                    <Toolbar>
                        <Typography
                            variant='h6'
                            onClick={() => navigate('/')}
                            sx={{ cursor: 'pointer', color: '#222' }}
                        >
                            CodevoWeb
                        </Typography>
                        <Box display='flex' sx={{ ml: 'auto' }}>
                            {!user && (
                                <>
                                    <LoadingButton
                                        sx={{ mr: 2 }}
                                        onClick={() => navigate('/register')}
                                    >
                                        SignUp
                                    </LoadingButton>
                                    <LoadingButton onClick={() => navigate('/login')}>
                                        Login
                                    </LoadingButton>
                                </>
                            )}
                            {user && (
                                <>
                                    <LoadingButton
                                        loading={isLoading}
                                        onClick={() => navigate('/profile')}
                                    >
                                        Profile
                                    </LoadingButton>
                                    <LoadingButton onClick={onLogoutHandler} loading={isLoading}>
                                        Logout
                                    </LoadingButton>
                                </>
                            )}
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
        </>
    );
};

export default Header;