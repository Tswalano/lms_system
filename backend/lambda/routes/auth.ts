import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import {
    AuthFlowType,
    InitiateAuthCommand,
    GetUserCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
    CognitoIdentityProviderClient, ResendConfirmationCodeCommand, ConfirmSignUpCommand,
    RespondToAuthChallengeCommand,
    ChangePasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';

import { changePasswordSchema, forgotPasswordSchema, loginSchema, refreshTokenSchema, resetPasswordSchema } from '../schemas/validationSchemas';
import z from 'zod';

const app = new Hono();

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const client = new CognitoIdentityProviderClient({});

const initiateAuth = async ({ username, password }: { username: string; password: string }) => {

    if (!username || !password || !COGNITO_CLIENT_ID) {
        return {
            success: false,
            statusCode: 400,
            data: {
                message: "Missing username, password, or client ID",
                code: "InvalidRequestError",
                error: true,
            },
        };
    }

    try {

        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
            ClientId: COGNITO_CLIENT_ID,
        });

        const { AuthenticationResult, ChallengeName, Session } = await client.send(command);

        return {
            success: true,
            statusCode: 200,
            data: {
                message: "User signed in successfully",
                code: ChallengeName || "UserSignedIn",
                payload: { ...AuthenticationResult, Session },
                error: false
            }
        };
    }
    catch (error: any) {
        const { name, __type } = error;

        if (name === "NotAuthorizedException" || __type === "NotAuthorizedException") {
            return {
                success: false,
                statusCode: 401,
                data: {
                    message: "User sign in failed - Not Authorized",
                    code: "NotAuthorizedException",
                    error: true,
                    payload: error
                }
            };
        }
        else if (name === "UserNotConfirmedException" || __type === "UserNotConfirmedException") {
            return {
                success: false,
                statusCode: 403,
                data: {
                    message: "User sign in failed - User Is Not Confirmed",
                    code: "UserNotConfirmedException",
                    redirect: "/confirm-account",
                    error: true,
                    payload: error
                }
            };
        }

        return {
            success: false,
            statusCode: 500,
            data: {
                message: "User sign in failed",
                code: "UserSignedInError",
                error: true,
                payload: error
            }
        };
    }
};

const getUserFromToken = async (accessToken: string) => {
    try {

        const command = new GetUserCommand({
            AccessToken: accessToken
        });

        const response = await client.send(command);

        return {
            success: true,
            user: {
                username: response.Username,
                email: response.UserAttributes?.find(attr => attr.Name === 'email')?.Value,
                emailVerified: response.UserAttributes?.find(attr => attr.Name === 'email_verified')?.Value === 'true',
                firstName: response.UserAttributes?.find(attr => attr.Name === 'given_name')?.Value,
                lastName: response.UserAttributes?.find(attr => attr.Name === 'family_name')?.Value,
                customUserId: response.UserAttributes?.find(attr => attr.Name === 'custom:userId')?.Value,
                sub: response.UserAttributes?.find(attr => attr.Name === 'sub')?.Value,
                attributes: response.UserAttributes
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.name || 'TokenValidationError'
        };
    }
};

const refreshAccessToken = async (refreshToken: string) => {
    try {

        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            AuthParameters: {
                REFRESH_TOKEN: refreshToken,
            },
            ClientId: COGNITO_CLIENT_ID,
        });

        const { AuthenticationResult } = await client.send(command);

        return {
            success: true,
            data: AuthenticationResult
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.name || 'RefreshTokenError'
        };
    }
};

// Login route
app.post('/login', async (c) => {
    try {
        const formData = await c.req.json();

        // Validate input
        const { username, password } = loginSchema.parse(formData);

        // Authenticate with Cognito
        const authResult = await initiateAuth({ username, password });

        if (!authResult.success) {
            return c.json(authResult.data, authResult.statusCode as any);
        }

        // Check if Cognito requires a new password
        const challengeName = authResult.data.code;
        if (challengeName === 'NEW_PASSWORD_REQUIRED') {
            return c.json({
                success: false,
                requiresNewPassword: true,
                message: "User must set a new password",
                session: authResult.data.payload.Session, // needed for the next step
                username: username // pass it back for frontend to resubmit
            }, 200);
        }

        // If authentication is successful, set cookies
        if (authResult.data.payload?.AccessToken) {
            const tokenToStore = authResult.data.payload.IdToken || authResult.data.payload.AccessToken;

            setCookie(c, 'sessionId', tokenToStore, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
                maxAge: 60 * 60 * 24 * 30
            });

            if (authResult.data.payload?.RefreshToken) {
                setCookie(c, 'refreshToken', authResult.data.payload.RefreshToken, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Lax',
                    maxAge: 60 * 60 * 24 * 30
                });
            }

            c.header('X-Debug-Cookie', 'Cookie-Set');
            c.header('X-Token-Type', authResult.data.payload.IdToken ? 'id_token' : 'access_token');
        }

        const response = {
            success: true,
            message: authResult.data.message,
            token: authResult.data.payload?.AccessToken,
            idToken: authResult.data.payload?.IdToken,
            user: {
                accessToken: authResult.data.payload?.AccessToken,
                idToken: authResult.data.payload?.IdToken,
                refreshToken: authResult.data.payload?.RefreshToken,
                tokenType: authResult.data.payload?.TokenType,
                expiresIn: authResult.data.payload?.ExpiresIn
            }
        };

        return c.json(response, 200);

    } catch (error) {
        console.error('Login error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                error: true,
                message: 'Invalid form data',
                errors: error.errors
            }, 400);
        }

        return c.json({
            error: true,
            message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }, 500);
    }
});


app.post('/otp', async (c) => {
    const { action, email, otp } = await c.req.json();

    try {
        if (!email) return c.json({ error: 'Email is required' }, 400);

        if (action === 'VERIFY_OTP') {
            if (!otp) return c.json({ error: 'OTP is required' }, 400);

            const confirm = new ConfirmSignUpCommand({
                ClientId: COGNITO_CLIENT_ID,
                Username: email,
                ConfirmationCode: otp,
            });

            const result = await client.send(confirm);
            return c.json({ message: 'User confirmed successfully', result }, 200);
        }

        if (action === 'RESEND_OTP') {
            const resend = new ResendConfirmationCodeCommand({
                ClientId: COGNITO_CLIENT_ID,
                Username: email,
            });

            const result = await client.send(resend);
            return c.json({ message: 'OTP resent successfully', result }, 200);
        }

        return c.json({ error: 'Invalid action' }, 400);
    } catch (err: any) {
        return c.json({ error: err.name || 'UnknownError', message: err.message }, 500);
    }
});

// Verify token route
app.get('/verify', async (c) => {
    try {
        // Get token from cookie or Authorization header
        let accessToken = getCookie(c, 'sessionId');

        if (!accessToken) {
            const authHeader = c.req.header('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                accessToken = authHeader.substring(7);
            }
        }

        if (!accessToken) {
            return c.json({
                success: false,
                message: 'No access token provided'
            }, 401);
        }

        // If it's an ID token, we need to get the access token to verify with Cognito
        // For now, we'll try to verify directly and handle the error if it's an ID token
        const userResult = await getUserFromToken(accessToken);

        if (!userResult.success) {
            // Try to refresh token if verification failed
            const refreshToken = getCookie(c, 'refreshToken');

            if (refreshToken) {
                const refreshResult = await refreshAccessToken(refreshToken);

                if (refreshResult.success && refreshResult.data?.AccessToken) {
                    // Store the new token (prefer ID token if available)
                    const newTokenToStore = refreshResult.data.IdToken || refreshResult.data.AccessToken;

                    setCookie(c, 'sessionId', newTokenToStore, {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'Lax',
                        maxAge: 60 * 60 * 24 * 30
                    });

                    // Get user info with new access token
                    const newUserResult = await getUserFromToken(refreshResult.data.AccessToken);

                    if (newUserResult.success) {
                        return c.json({
                            success: true,
                            message: 'Token refreshed and verified',
                            user: {
                                id: newUserResult.user?.customUserId || newUserResult.user?.sub,
                                username: newUserResult.user?.username,
                                email: newUserResult.user?.email,
                                firstName: newUserResult.user?.firstName,
                                lastName: newUserResult.user?.lastName,
                                emailVerified: newUserResult.user?.emailVerified,
                                sub: newUserResult.user?.sub,
                                customUserId: newUserResult.user?.customUserId
                            },
                            token: refreshResult.data.AccessToken
                        }, 200);
                    }
                }
            }

            return c.json({
                success: false,
                message: 'Invalid or expired token'
            }, 401);
        }

        return c.json({
            success: true,
            message: 'Token verified successfully',
            user: {
                id: userResult.user?.customUserId || userResult.user?.sub,
                username: userResult.user?.username,
                email: userResult.user?.email,
                firstName: userResult.user?.firstName,
                lastName: userResult.user?.lastName,
                emailVerified: userResult.user?.emailVerified,
                sub: userResult.user?.sub,
                customUserId: userResult.user?.customUserId
            }
        }, 200);

    } catch (error) {
        console.error('Verify token error:', error);
        return c.json({
            success: false,
            message: 'Token verification failed'
        }, 500);
    }
});

// Refresh token route
app.post('/refresh', async (c) => {
    try {
        let refreshToken = getCookie(c, 'refreshToken');

        if (!refreshToken) {
            const body = await c.req.json();
            const { refreshToken: bodyRefreshToken } = refreshTokenSchema.parse(body);
            refreshToken = bodyRefreshToken;
        }

        if (!refreshToken) {
            return c.json({
                success: false,
                message: 'No refresh token provided'
            }, 401);
        }

        const refreshResult = await refreshAccessToken(refreshToken);

        if (!refreshResult.success) {
            return c.json({
                success: false,
                message: 'Failed to refresh token'
            }, 401);
        }

        // Update cookies with new tokens (prefer ID token)
        if (refreshResult.data?.AccessToken) {
            const tokenToStore = refreshResult.data.IdToken || refreshResult.data.AccessToken;

            setCookie(c, 'sessionId', tokenToStore, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
                maxAge: 60 * 60 * 24 * 30
            });
        }

        return c.json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: refreshResult.data?.AccessToken,
            idToken: refreshResult.data?.IdToken,
            tokenType: refreshResult.data?.TokenType,
            expiresIn: refreshResult.data?.ExpiresIn
        }, 200);

    } catch (error) {
        console.error('Refresh token error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        return c.json({
            success: false,
            message: 'Token refresh failed'
        }, 500);
    }
});

// Forgot password route
app.post('/forgot-password', async (c) => {
    try {
        const body = await c.req.json();
        const { email } = forgotPasswordSchema.parse(body);

        const command = new ForgotPasswordCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email
        });

        await client.send(command);

        return c.json({
            success: true,
            message: 'Password reset code sent to your email'
        }, 200);

    } catch (error: any) {
        console.error('Forgot password error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid email format',
                errors: error.errors
            }, 400);
        }

        if (error.name === 'UserNotFoundException') {
            return c.json({
                success: false,
                message: 'User not found'
            }, 404);
        }

        return c.json({
            success: false,
            message: 'Failed to send reset code'
        }, 500);
    }
});

// Reset password route
app.post('/reset-password', async (c) => {
    try {
        const body = await c.req.json();
        const { email, code, newPassword } = resetPasswordSchema.parse(body);

        const command = new ConfirmForgotPasswordCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword
        });

        await client.send(command);

        return c.json({
            success: true,
            message: 'Password reset successfully'
        }, 200);

    } catch (error: any) {
        console.error('Reset password error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        if (error.name === 'CodeMismatchException') {
            return c.json({
                success: false,
                message: 'Invalid verification code'
            }, 400);
        }

        if (error.name === 'ExpiredCodeException') {
            return c.json({
                success: false,
                message: 'Verification code has expired'
            }, 400);
        }

        return c.json({
            success: false,
            message: 'Failed to reset password'
        }, 500);
    }
});

app.post('/complete-new-password', async (c) => {
    try {


        const body = await c.req.json();
        const { username, newPassword, session } = z
            .object({
                username: z.string().min(1),
                newPassword: z.string().min(8),
                session: z.string().min(1)
            })
            .parse(body);

        const command = new RespondToAuthChallengeCommand({
            ClientId: process.env.COGNITO_CLIENT_ID!,
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            Session: session,
            ChallengeResponses: {
                USERNAME: username,
                NEW_PASSWORD: newPassword
            }
        });

        const response = await client.send(command);

        return c.json({
            success: true,
            message: 'Password updated successfully',
            tokens: response.AuthenticationResult
        }, 200);

    } catch (error: any) {
        console.error('Complete new password error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        return c.json({
            success: false,
            message: error.message || 'Failed to complete password setup'
        }, 500);
    }
});

app.post('/change-password', async (c) => {
    try {
        const body = await c.req.json();
        const { accessToken, currentPassword, newPassword } = changePasswordSchema.parse(body);

        const command = new ChangePasswordCommand({
            AccessToken: accessToken,
            PreviousPassword: currentPassword,
            ProposedPassword: newPassword
        });

        await client.send(command);

        return c.json({
            success: true,
            message: 'Password changed successfully'
        }, 200);

    } catch (error: any) {
        console.error('Change password error:', error);

        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        if (error.name === 'NotAuthorizedException') {
            return c.json({
                success: false,
                message: 'Current password is incorrect or access token is invalid'
            }, 403);
        }

        return c.json({
            success: false,
            message: 'Failed to change password'
        }, 500);
    }
});

// Logout route
app.post('/logout', async (c) => {
    try {
        // Delete the session cookies
        deleteCookie(c, 'sessionId', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        });

        deleteCookie(c, 'refreshToken', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        });

        return c.json({
            success: true,
            message: 'Logout successful'
        }, 200);

    } catch (error) {
        console.error('Logout error:', error);
        return c.json(
            {
                success: false,
                message: 'Logout failed'
            },
            500
        );
    }
});

export { app as auth };