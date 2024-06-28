import axios from 'axios';
// import { LoginInput } from '../pages/login.page';
// import { RegisterInput } from '../pages/register.page';
import { GenericResponse, ILoginResponse, IUserResponse, AuthAPIResponse } from './types';

const BASE_URL = 'https://07onrf75zh.execute-api.af-south-1.amazonaws.com/dev';

const authApi = axios.create({
    baseURL: BASE_URL,
    // headers: {
    //     "Access-Control-Allow-Origin": "*",
    //     "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS"
    // }
});

// authApi.defaults.headers.common['Content-Type'] = 'application/json';
// // add cors
// authApi.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

export const refreshAccessTokenFn = async () => {
    const response = await authApi.get<ILoginResponse>('auth/refresh');
    return response.data;
};

authApi.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        const errMessage = error.response.data.message as string;
        if (errMessage.includes('not logged in') && !originalRequest._retry) {
            originalRequest._retry = true;
            await refreshAccessTokenFn();
            return authApi(originalRequest);
        }
        return Promise.reject(error);
    }
);

export const signUpUserFn = async (user: any) => {
    const response = await authApi.post<GenericResponse>('auth/register', user);
    const { status } = response.data
    console.log('status', status);

    if (status === 'success') {
        return response.data
    }
    return response.data;
};

export const loginUserFn = async (user: { username: string; password: string }) => {
    const response = await authApi.post<AuthAPIResponse>('sign-in', user);
    const { statusCode, body } = response.data

    console.log('body', response);


    if (statusCode !== 200) {
        throw new Error(JSON.stringify({
            message: body.message,
            code: body.code,
        }));
    }

    return response.data;
};

export const verifyEmailFn = async (verificationCode: string) => {
    const response = await authApi.get<GenericResponse>(
        `auth/verifyemail/${verificationCode}`
    );
    return response.data;
};

export const logoutUserFn = async () => {
    const response = await authApi.get<GenericResponse>('auth/logout');
    return response.data;
};

export const getMeFn = async (token: string, accessToken?: string) => {
    console.log('token from getMe', token);
    console.log('accessToken from getMe', accessToken);
    const response = await authApi.post<AuthAPIResponse>('get-user', {
        accessToken,
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
    });
    return response.data;
};
