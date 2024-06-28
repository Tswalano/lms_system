import { Suspense, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import RequireUser from '../components/requireUser';
import Layout from '../components/layout';
import HomePage from '../pages/HomePage';

const Loadable =
    (Component: React.ComponentType<any>) => (props: JSX.IntrinsicAttributes) =>
    (
        <Suspense fallback={"Loading....."}>
            <Component {...props} />
        </Suspense>
    );

const LoginPage = Loadable(lazy(() => import('../pages/onboarding/signin/Signin')));


const authRoutes: RouteObject = {
    path: '*',
    children: [
        {
            path: 'signin',
            element: <LoginPage />,
        },
        // {
        //     path: 'register',
        //     element: <RegisterPage />,
        // },
        // {
        //     path: 'verifyemail',
        //     element: <EmailVerificationPage />,
        //     children: [
        //         {
        //             path: ':verificationCode',
        //             element: <EmailVerificationPage />,
        //         },
        //     ],
        // },
    ],
};

const normalRoutes: RouteObject = {
    path: '*',
    element: <Layout />,
    children: [
        {
            index: true,
            element: <HomePage />,
        }
    ],
};

const routes: RouteObject[] = [authRoutes, normalRoutes];

export default routes;