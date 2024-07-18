import { useCookies } from 'react-cookie';
import { useQuery } from '@tanstack/react-query';
import { useStateContext } from '../context';
import React, { useEffect } from 'react';
import { getMeFn } from '../api/authAPI';
import LoadingPage from '../pages/loadingPage';


type AuthMiddlewareProps = {
    children: React.ReactElement;
};

const AuthMiddleware: React.FC<AuthMiddlewareProps> = ({ children }) => {
    const [cookies] = useCookies(['logged_in', 'accessToken', 'token']);
    const stateContext = useStateContext();

    const query = useQuery({
        queryKey: ['authUser'],
        queryFn: () => getMeFn(cookies.token, cookies.accessToken),
        enabled: !!cookies.logged_in,
        select: (data) => data.body.payload
    });

    useEffect(() => {

        console.log("Here....", cookies.logged_in, query.data);

        if (cookies.logged_in && query.data) {
            console.log('query.data', query.data);
            stateContext.dispatch({ type: 'SET_USER', payload: query.data });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookies.logged_in, query.data]);

    if (query.isLoading && cookies.logged_in) {
        return <LoadingPage/>
    }

    return (
        <React.Fragment>
            {children}
        </React.Fragment>
    );
};

export default AuthMiddleware;
