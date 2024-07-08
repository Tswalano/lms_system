import { useCookies } from 'react-cookie';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStateContext } from '../context';
import { getMeFn } from '../api/authAPI';
import { useEffect } from 'react';

const RequireUser = ({ allowedRoles }: { allowedRoles: string[] }) => {
    const [cookies] = useCookies(['logged_in', 'accessToken', 'token']);
    const location = useLocation();
    const stateContext = useStateContext();

    const {
        isLoading,
        isFetching,
        data: user,
        isFetched, isSuccess
    } = useQuery({
        queryKey: ['authUser 1'],
        queryFn: () => getMeFn(cookies.token, cookies.accessToken),
        select: (data) => data.body.payload
    });

    useEffect(() => {
        if (isFetched && isSuccess) {
            stateContext.dispatch({ type: "SET_USER", payload: user });
        }
    }, [isFetched, isSuccess, user]);

    if (isLoading || isFetching) {
        return <>Loading xxx...</>;
    }

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
