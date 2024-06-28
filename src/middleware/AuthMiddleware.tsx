import { useCookies } from 'react-cookie';
import { useQuery } from '@tanstack/react-query';
import { getMeFn } from '../api/authAPI';
import { useStateContext } from '../context';
import React from 'react';

type AuthMiddlewareProps = {
    children: React.ReactElement;
};

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
    const [cookies] = useCookies(['logged_in']);
    const stateContext = useStateContext();

    const { isLoading, data: user, isSuccess } = useQuery({
        queryKey: ['authUser'],
        queryFn: (token) => getMeFn(`${token}`),
        enabled: !!cookies.logged_in,
        select: (data) => data
    });

    if (isSuccess) {
        // stateContext.dispatch({ type: 'SET_USER', payload: user });
    }

    if (isLoading && cookies.logged_in) {
        return <div>Loading...</div>;
    }

    return children;
};

export default AuthMiddleware;
