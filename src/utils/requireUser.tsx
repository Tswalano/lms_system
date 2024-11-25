import { useCookies } from 'react-cookie';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStateContext } from '../context';
import { getMeFn } from '../api/authAPI';
import { useEffect } from 'react';

const RequireUser = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const [cookies] = useCookies(['logged_in', 'accessToken', 'token', "userId"]);
    const location = useLocation();
    const stateContext = useStateContext();
    const user = stateContext.state.authUser;

    return (cookies.logged_in || user) &&
        allowedRoles.includes(user?.role as string) ? (
        <Outlet />
    ) : cookies.logged_in && user ? (
        <Navigate to='/unauthorized' state={{ from: location }} replace />
    ) : (
        <Navigate to='/signin' state={{ from: location }} replace />
    );
};

export default RequireUser;
