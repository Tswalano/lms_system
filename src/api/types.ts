// Cognito Auth Results
export interface AuthenticationResult {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
}

export interface IAuthUserResults {
    email: string;
    firstName: string;
    role: string;
    department?: string;
    username: string;
    userId: string;

}

export interface IErrorResponse {
    code: string;
    message: string;
    errorStack?: string;
}


// export interface IUser extends IAuthUserResults { //TODO change to IAuthUserResults
// }

export interface GenericResponse {
    status: string;
    message: string;
}

export interface ILoginResponse {
    status: string;
    access_token: string;
}

export type AuthAPIResponse = {
    statusCode: number;
    headers: any;
    body: {
        message: string;
        code: string;
        error: boolean;
        payload: AuthenticationResult;
    };
};

export type AuthUserAPIResponse = {
    statusCode: number;
    headers: any;
    body: {
        message: string;
        code: string;
        error: boolean;
        payload: IAuthUserResults;
    };
};


// export interface IUserResponse {
//     status: string;
//     data: {
//         user: IUser;
//     };
// }

