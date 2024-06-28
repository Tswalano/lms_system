// Cognito Auth Results
interface AuthenticationResult {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
    user?: IUser;
}

export interface IErrorResponse {
    code: string;
    message: string;
    errorStack?: string;
}


export interface IUser { //TODO
    name: string;
    email: string;
    role: string;
    _id: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

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


export interface IUserResponse {
    status: string;
    data: {
        user: IUser;
    };
}

