import { useCookies } from 'react-cookie';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getMeFn } from '../api/authAPI';
import { useStateContext } from '../context';
import React from 'react';

const RequireUser = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const [cookies] = useCookies(['logged_in']);
    const location = useLocation();
    const stateContext = useStateContext();

    const { isLoading, isFetching, data: user, isSuccess } = useQuery({
        queryKey: ['authUser'],
        queryFn: (token) => getMeFn(`${token}`),
        select(data) {
            console.log("reqUser data", data)
            return data.body.payload;
        },
    })

    const loading = isLoading || isFetching;

    if (isSuccess) {
        stateContext?.dispatch({ type: 'SET_USER', payload: null });
    }

    if (loading) {
        return <div>Loadding...</div>;
    }

    return (cookies.logged_in || user) &&
        allowedRoles.includes(user?.AccessToken as string) ? (
        <Outlet />
    ) : cookies.logged_in && user ? (
        <Navigate to='/unauthorized' state={{ from: location }} replace />
    ) : (
        <Navigate to='/login' state={{ from: location }} replace />
    );
};

export default RequireUser;
