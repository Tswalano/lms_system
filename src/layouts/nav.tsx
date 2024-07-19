import { forwardRef, useEffect } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';
import { useResponsive } from '../hooks/useResponsive';
import Logo from '../components/ui/Logo';
import Scrollbar from './scrollbar';
import navConfig from '../utils/navConfig';
import { NAV } from '../utils/configLayout';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { useStateContext } from '../context';
import { capitalizeName } from '../utils/Util';
import { useCookies } from 'react-cookie';

type Props = {
    openNav: boolean;
    onCloseNav: () => void;
    onOpenNav: () => void;
}

function Nav({ openNav, onCloseNav, onOpenNav }: Props) {
    // const pathname = usePathname();]

    const [, setCookie] = useCookies(['logged_in', 'token', 'accessToken']);
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;

    const authorizedRoutes = navConfig.filter((route) => route.permissions?.includes(user?.role || 'user'));
    const navigate = useNavigate();

    const upLg = useResponsive('up', 'lg');
    const lgUp = useResponsive('up', 'lg');

    useEffect(() => {
        if (openNav) {
            onCloseNav();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const renderAccount = (
        <Box
            sx={{
                my: 3,
                mx: 2.5,
                py: 2,
                px: 2.5,
                display: 'flex',
                borderRadius: 1.5,
                alignItems: 'center',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.10),
                // bgcolor: (theme) => alpha(theme.palette.grey[900], 0.15),
            }}
        >
            <Avatar src={''} alt="photoURL" />

            <Box sx={{ ml: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#fff' }}>
                    {capitalizeName(`${user?.firstName} ${user?.lastName}`)}
                </Typography>

                <Typography variant="body2" sx={{ color: '#BDBDBD' }}>
                    {user?.occupation}
                </Typography>
            </Box>
        </Box>
    );

    const renderMenu = (
        <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
            {authorizedRoutes.map((item) => (
                <NavItem key={item.title} item={item} />
            ))}
            {/* logout */}
            <ListItemButton
                sx={{
                    minHeight: 44,
                    borderRadius: 0.75,
                    typography: 'body2',
                    color: '#fff',
                    textTransform: 'capitalize',
                    fontWeight: 'fontWeightMedium'
                }}
                onClick={() => {
                    setCookie('logged_in', null, { path: '/' });
                    setCookie('token', null, { path: '/' });
                    setCookie('accessToken', null, { path: '/' });

                    navigate('/signin');
                    window.location.reload();
                }}
            >
                <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
                    👋
                </Box>

                <Box component="span">Logout</Box>
            </ListItemButton>
        </Stack>
    );

    const renderContent = (
        <Scrollbar
            sx={{
                height: 1,
                '& .simplebar-content': {
                    height: 1,
                    display: 'flex',
                    flexDirection: 'column',
                },
            }}
        >
            <Logo width="250px" />

            {!lgUp && (
                <IconButton onClick={onOpenNav} sx={{ mr: 1 }}>
                    OPEN ICON bbb
                </IconButton>
            )}

            {renderAccount}

            {renderMenu}

            <Box sx={{ flexGrow: 1 }} />
        </Scrollbar>
    );

    return (
        <Box
            sx={{
                flexShrink: { lg: 0 },
                width: { lg: NAV.WIDTH },
            }}
        >
            {upLg ? (
                <Box
                    sx={{
                        backgroundImage: 'linear-gradient(to right, #006699, #004477)',
                        height: 1,
                        position: 'fixed',
                        width: NAV.WIDTH,
                        borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
                    }}
                >
                    {renderContent}
                </Box>
            ) : (
                <Drawer
                    open={openNav}
                    onClose={onCloseNav}
                    PaperProps={{
                        sx: {
                            width: NAV.WIDTH,
                        },
                    }}
                >
                    {renderContent}
                </Drawer>
            )}
        </Box>
    );
}

export default Nav

Nav.propTypes = {
    openNav: PropTypes.bool,
    onCloseNav: PropTypes.func,
};

// ----------------------------------------------------------------------

function NavItem({ item }: any) {
    // const pathname = usePathname();

    // const active = item.path === pathname;
    // get active path

    const RouterLink = forwardRef(({ href, ...other }: any, ref) => <Link ref={ref} to={href} {...other} />);


    const { pathname } = useLocation();
    const active = pathname === item.path;

    return (
        <ListItemButton
            component={RouterLink}
            href={item.path}
            sx={{
                minHeight: 44,
                borderRadius: 0.75,
                typography: 'body2',
                color: '#fff',
                textTransform: 'capitalize',
                fontWeight: 'fontWeightMedium',
                ...(active && {
                    color: '#fff',
                    fontWeight: 'fontWeightSemiBold',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.50),
                    '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                    },
                }),
            }}
        >
            <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
                {item.icon}
            </Box>

            <Box component="span">{item.title} </Box>
        </ListItemButton>
    );
}

NavItem.propTypes = {
    item: PropTypes.object,
};
