import { Context } from 'hono';
export interface DecodedToken {
    sub: string;
    email: string;
    username?: string;
    family_name?: string;
    given_name?: string;
    name?: string;
    preferred_username?: string;
    exp: number;
    iat: number;
    token_use: string;
    'custom:role'?: string;
    'custom:occupation'?: string;
    'custom:userId': string;
    'cognito:username'?: string;
}
export declare const getToken: (c: any) => string | null;
export declare const validateToken: (token: string) => DecodedToken;
export declare const getDecodedToken: (c: Context) => DecodedToken;
export declare const getAccessToken: (c: Context) => string;
export declare const getUserId: (c: Context) => string;
export declare const getCognitoSub: (c: Context) => string;
export declare const getUserEmail: (c: Context) => string;
export declare const getUserFirstName: (c: Context) => string;
export declare const getUserLastName: (c: Context) => string;
export declare const getUserFullName: (c: Context) => string;
export declare const getUserRole: (c: Context) => string;
export declare const getUserOccupation: (c: Context) => string;
export declare const getCustomUserId: (c: Context) => string;
export declare const getCognitoUser: (c: Context) => any;
export declare const authMiddleware: (options?: {
    fetchCognitoUser?: boolean;
}) => (c: any, next: any) => Promise<any>;
export declare const optionalAuthMiddleware: () => (c: any, next: any) => Promise<void>;
