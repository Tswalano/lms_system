import { getCookie } from 'hono/cookie';
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import jwt from 'jsonwebtoken';
import { Context } from 'hono';

const client = new CognitoIdentityProviderClient({});

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

// Type-safe context variables interface
interface AuthVariables {
    accessToken: string;
    decodedToken: DecodedToken;
    cognitoUser?: any;
}

// Get token from cookie or Authorization header
export const getToken = (c: any): string | null => {
    // First try to get from cookie
    let accessToken = getCookie(c, 'sessionId');

    // If not in cookie, try Authorization header
    if (!accessToken) {
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }
    }

    return accessToken ?? null;
};

// Simple token validation (decode only, no signature verification)
export const validateToken = (token: string): DecodedToken | null => {
    try {
        const decoded = jwt.decode(token) as DecodedToken;

        if (!decoded) return null;

        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            console.log('[Auth] Token expired. Exp:', decoded.exp, 'Now:', now);
            throw new Error("Token expired");
        }

        if (!decoded['sub']) return null;
        if (decoded.token_use !== 'access' && decoded.token_use !== 'id') return null;

        return decoded;

    } catch (error) {
        console.error('Token validation error:', error);
        return null;
    }
};


// Type-safe function to get decoded token from context
export const getDecodedToken = (c: Context): DecodedToken => {
    const decodedToken = c.get('decodedToken') as DecodedToken;

    if (!decodedToken) {
        throw new Error('No decoded token found in context. Make sure auth middleware is applied.');
    }

    return decodedToken;
};

// Type-safe function to get access token from context
export const getAccessToken = (c: Context): string => {
    const accessToken = c.get('accessToken') as string;

    if (!accessToken) {
        throw new Error('No access token found in context. Make sure auth middleware is applied.');
    }

    return accessToken;
};

// Type-safe function to get user ID
export const getUserId = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken['custom:userId'];
};

// Type-safe function to get Cognito sub
export const getCognitoSub = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken.sub;
};

// Type-safe function to get user email
export const getUserEmail = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken.email;
};

// Type-safe function to get user's first name
export const getUserFirstName = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken.given_name || decodedToken.name || '';
};

// Type-safe function to get user's last name
export const getUserLastName = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken.family_name || '';
};

// Type-safe function to get user's full name
export const getUserFullName = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken.name || `${decodedToken.given_name || ''} ${decodedToken.family_name || ''}`.trim();
};

// Type-safe function to get user's role
export const getUserRole = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken['custom:role'] || '';
};

// Type-safe function to get user's occupation
export const getUserOccupation = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken['custom:occupation'] || '';
};

// Type-safe function to get custom user ID
export const getCustomUserId = (c: Context): string => {
    const decodedToken = getDecodedToken(c);
    return decodedToken['custom:userId'] || '';
};

// Type-safe function to get Cognito user data (if fetched)
export const getCognitoUser = (c: Context): any => {
    const cognitoUser = c.get('cognitoUser');

    if (!cognitoUser) {
        throw new Error('No Cognito user data found. Make sure authMiddleware is called with fetchCognitoUser: true');
    }

    return cognitoUser;
};

// Auth middleware that validates token and optionally fetches user from Cognito
export const authMiddleware = (options: { fetchCognitoUser?: boolean } = {}) => {
    return async (c: any, next: any) => {
        try {
            const token = getToken(c);

            if (!token) {
                return c.json({
                    code: "MISSING_ACCESS_TOKEN",
                    message: "Missing access token",
                    error: true,
                    payload: null
                }, 401);
            }

            // Validate token structure and expiration
            const decodedToken = validateToken(token);

            // Store token and decoded info in context
            c.set('accessToken', token);
            c.set('decodedToken', decodedToken);

            // Optionally fetch full user data from Cognito
            if (options.fetchCognitoUser) {
                console.warn('fetchCognitoUser is enabled but using ID token. Most user data is already available in the token. Consider using the helper functions instead.');

                // Skip the Cognito API call since we're using an ID token
                // All user data is already available in the decoded token
                // Use getUserFirstName(), getUserLastName(), getUserRole(), etc. instead
            }

            await next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            return c.json({
                code: "AUTHENTICATION_FAILED",
                message: error instanceof Error ? error.message : 'Authentication failed',
                error: true,
                payload: null
            }, 401);
        }
    };
};

// Optional auth middleware - doesn't fail if no token, just sets user if available
export const optionalAuthMiddleware = () => {
    return async (c: any, next: any) => {
        try {
            const token = getToken(c);

            if (token) {
                try {
                    const decodedToken = validateToken(token);
                    c.set('accessToken', token);
                    c.set('decodedToken', decodedToken);
                } catch (error) {
                    // Token exists but is invalid - just continue without setting user
                    console.warn('Invalid token in optional auth:', error);
                }
            }

            await next();

        } catch (error) {
            // In optional auth, we don't fail - just continue
            console.warn('Optional auth middleware error:', error);
            await next();
        }
    };
};