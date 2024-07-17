// Cognito Auth Results
export interface AuthenticationResult {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
    ExpiresIn: number;
    TokenType: string;
    Session?: string;
}

export interface IAuthUserResults {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    occupation?: string;
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

export interface CognitoUser extends IAuthUserResults {
    createdAt: string;
    updatedAt: string;
    userStatus: string;
    enabled: boolean;
}

export type CognitoAPIResponse = {
    statusCode: number;
    headers: any;
    body: {
        message: string;
        code: string;
        error: boolean;
        payload: CognitoUser[];
    };
};

export interface LeaveRequest {
    id: number;
    uid: string;
    leave_type: string;
    status: string;
    duration: number;
    start_date: string; // Assuming date strings are in ISO 8601 format
    end_date: string;   // Assuming date strings are in ISO 8601 format
    feedback: string;
    document: string;
    leave_length: number;
    leave_comment: string;
    createdAt: string;  // Assuming date strings are in ISO 8601 format
    updatedAt: string;  // Assuming date strings are in ISO 8601 format
}

export type LeaveAPIResponse = {
    statusCode: number;
    message: string;
    leaveData: LeaveRequest[];

};

// export interface IUserResponse {
//     status: string;
//     data: {
//         user: IUser;
//     };
// }

