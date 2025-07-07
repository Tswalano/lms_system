"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const hono_1 = require("hono");
const cookie_1 = require("hono/cookie");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const validationSchemas_1 = require("../schemas/validationSchemas");
const zod_1 = __importDefault(require("zod"));
const app = new hono_1.Hono();
exports.auth = app;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({});
const initiateAuth = async ({ username, password }) => {
    try {
        const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: client_cognito_identity_provider_1.AuthFlowType.USER_PASSWORD_AUTH,
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
    catch (error) {
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
const getUserFromToken = async (accessToken) => {
    try {
        const command = new client_cognito_identity_provider_1.GetUserCommand({
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
    }
    catch (error) {
        return {
            success: false,
            error: error.name || 'TokenValidationError'
        };
    }
};
const refreshAccessToken = async (refreshToken) => {
    try {
        const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
            AuthFlow: client_cognito_identity_provider_1.AuthFlowType.REFRESH_TOKEN_AUTH,
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
    }
    catch (error) {
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
        console.log("Login request data:", formData);
        // Validate input
        const { username, password } = validationSchemas_1.loginSchema.parse(formData);
        // Authenticate with Cognito
        const authResult = await initiateAuth({ username, password });
        if (!authResult.success) {
            return c.json(authResult.data, authResult.statusCode);
        }
        // If authentication is successful, set cookie with the appropriate token
        if (authResult.data.payload?.AccessToken) {
            // Use ID token if available (contains user attributes), otherwise use access token
            const tokenToStore = authResult.data.payload.IdToken || authResult.data.payload.AccessToken;
            (0, cookie_1.setCookie)(c, 'sessionId', tokenToStore, {
                path: '/',
                httpOnly: true,
                secure: true,
                sameSite: 'Lax',
                maxAge: 60 * 60 * 24 * 30 // 30 days
            });
            // Set refresh token cookie if available
            if (authResult.data.payload?.RefreshToken) {
                (0, cookie_1.setCookie)(c, 'refreshToken', authResult.data.payload.RefreshToken, {
                    path: '/',
                    httpOnly: true,
                    secure: true,
                    sameSite: 'Lax',
                    maxAge: 60 * 60 * 24 * 30 // 30 days
                });
            }
            // Add debug header
            c.header('X-Debug-Cookie', 'Cookie-Set');
            c.header('X-Token-Type', authResult.data.payload.IdToken ? 'id_token' : 'access_token');
        }
        console.log('Authentication result:', authResult);
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
        console.log('Login response:', response);
        console.log('Set-Cookie header:', c.res.headers.get('Set-Cookie'));
        return c.json(response, 200);
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof zod_1.default.ZodError) {
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
        if (!email)
            return c.json({ error: 'Email is required' }, 400);
        if (action === 'VERIFY_OTP') {
            if (!otp)
                return c.json({ error: 'OTP is required' }, 400);
            const confirm = new client_cognito_identity_provider_1.ConfirmSignUpCommand({
                ClientId: COGNITO_CLIENT_ID,
                Username: email,
                ConfirmationCode: otp,
            });
            const result = await client.send(confirm);
            return c.json({ message: 'User confirmed successfully', result }, 200);
        }
        if (action === 'RESEND_OTP') {
            const resend = new client_cognito_identity_provider_1.ResendConfirmationCodeCommand({
                ClientId: COGNITO_CLIENT_ID,
                Username: email,
            });
            const result = await client.send(resend);
            return c.json({ message: 'OTP resent successfully', result }, 200);
        }
        return c.json({ error: 'Invalid action' }, 400);
    }
    catch (err) {
        return c.json({ error: err.name || 'UnknownError', message: err.message }, 500);
    }
});
// Verify token route
app.get('/verify', async (c) => {
    try {
        // Get token from cookie or Authorization header
        let accessToken = (0, cookie_1.getCookie)(c, 'sessionId');
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
            const refreshToken = (0, cookie_1.getCookie)(c, 'refreshToken');
            if (refreshToken) {
                const refreshResult = await refreshAccessToken(refreshToken);
                if (refreshResult.success && refreshResult.data?.AccessToken) {
                    // Store the new token (prefer ID token if available)
                    const newTokenToStore = refreshResult.data.IdToken || refreshResult.data.AccessToken;
                    (0, cookie_1.setCookie)(c, 'sessionId', newTokenToStore, {
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
    }
    catch (error) {
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
        let refreshToken = (0, cookie_1.getCookie)(c, 'refreshToken');
        if (!refreshToken) {
            const body = await c.req.json();
            const { refreshToken: bodyRefreshToken } = validationSchemas_1.refreshTokenSchema.parse(body);
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
            (0, cookie_1.setCookie)(c, 'sessionId', tokenToStore, {
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
    }
    catch (error) {
        console.error('Refresh token error:', error);
        if (error instanceof zod_1.default.ZodError) {
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
        const { email } = validationSchemas_1.forgotPasswordSchema.parse(body);
        const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({});
        const command = new client_cognito_identity_provider_1.ForgotPasswordCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email
        });
        await client.send(command);
        return c.json({
            success: true,
            message: 'Password reset code sent to your email'
        }, 200);
    }
    catch (error) {
        console.error('Forgot password error:', error);
        if (error instanceof zod_1.default.ZodError) {
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
        const { email, code, newPassword } = validationSchemas_1.resetPasswordSchema.parse(body);
        const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({});
        const command = new client_cognito_identity_provider_1.ConfirmForgotPasswordCommand({
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
    }
    catch (error) {
        console.error('Reset password error:', error);
        if (error instanceof zod_1.default.ZodError) {
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
// Logout route
app.post('/logout', async (c) => {
    try {
        // Delete the session cookies
        (0, cookie_1.deleteCookie)(c, 'sessionId', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        });
        (0, cookie_1.deleteCookie)(c, 'refreshToken', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax'
        });
        return c.json({
            success: true,
            message: 'Logout successful'
        }, 200);
    }
    catch (error) {
        console.error('Logout error:', error);
        return c.json({
            success: false,
            message: 'Logout failed'
        }, 500);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsK0JBQTRCO0FBQzVCLHdDQUFpRTtBQUNqRSxnR0FPbUQ7QUFFbkQsb0VBQTBIO0FBQzFILDhDQUFvQjtBQUVwQixNQUFNLEdBQUcsR0FBRyxJQUFJLFdBQUksRUFBRSxDQUFDO0FBcWlCUCxtQkFBSTtBQW5pQnBCLE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztBQUN4RCxNQUFNLE1BQU0sR0FBRyxJQUFJLGdFQUE2QixDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBRXJELE1BQU0sWUFBWSxHQUFHLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQTBDLEVBQUUsRUFBRTtJQUMxRixJQUFJLENBQUM7UUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHNEQUFtQixDQUFDO1lBQ3BDLFFBQVEsRUFBRSwrQ0FBWSxDQUFDLGtCQUFrQjtZQUN6QyxjQUFjLEVBQUU7Z0JBQ1osUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFFBQVEsRUFBRSxRQUFRO2FBQ3JCO1lBQ0QsUUFBUSxFQUFFLGlCQUFpQjtTQUM5QixDQUFDLENBQUM7UUFFSCxNQUFNLEVBQUUsb0JBQW9CLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBRSxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwRixPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUk7WUFDYixVQUFVLEVBQUUsR0FBRztZQUNmLElBQUksRUFBRTtnQkFDRixPQUFPLEVBQUUsNkJBQTZCO2dCQUN0QyxJQUFJLEVBQUUsYUFBYSxJQUFJLGNBQWM7Z0JBQ3JDLE9BQU8sRUFBRSxFQUFFLEdBQUcsb0JBQW9CLEVBQUUsT0FBTyxFQUFFO2dCQUM3QyxLQUFLLEVBQUUsS0FBSzthQUNmO1NBQ0osQ0FBQztJQUNOLENBQUM7SUFDRCxPQUFP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SUFFWixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FDVDtZQUNJLE9BQU8sRUFBRSxLQUFLO1lBQ2QsT0FBTyxFQUFFLGVBQWU7U0FDM0IsRUFDRCxHQUFHLENBQ04sQ0FBQztJQUNOLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhvbm8gfSBmcm9tICdob25vJztcbmltcG9ydCB7IGdldENvb2tpZSwgc2V0Q29va2llLCBkZWxldGVDb29raWUgfSBmcm9tICdob25vL2Nvb2tpZSc7XG5pbXBvcnQge1xuICAgIEF1dGhGbG93VHlwZSxcbiAgICBJbml0aWF0ZUF1dGhDb21tYW5kLFxuICAgIEdldFVzZXJDb21tYW5kLFxuICAgIEZvcmdvdFBhc3N3b3JkQ29tbWFuZCxcbiAgICBDb25maXJtRm9yZ290UGFzc3dvcmRDb21tYW5kLFxuICAgIENvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50LCBSZXNlbmRDb25maXJtYXRpb25Db2RlQ29tbWFuZCwgQ29uZmlybVNpZ25VcENvbW1hbmRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXInO1xuXG5pbXBvcnQgeyBmb3Jnb3RQYXNzd29yZFNjaGVtYSwgbG9naW5TY2hlbWEsIHJlZnJlc2hUb2tlblNjaGVtYSwgcmVzZXRQYXNzd29yZFNjaGVtYSB9IGZyb20gJy4uL3NjaGVtYXMvdmFsaWRhdGlvblNjaGVtYXMnO1xuaW1wb3J0IHogZnJvbSAnem9kJztcblxuY29uc3QgYXBwID0gbmV3IEhvbm8oKTtcblxuY29uc3QgQ09HTklUT19DTElFTlRfSUQgPSBwcm9jZXNzLmVudi5DT0dOSVRPX0NMSUVOVF9JRDtcbmNvbnN0IGNsaWVudCA9IG5ldyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7fSk7XG5cbmNvbnN0IGluaXRpYXRlQXV0aCA9IGFzeW5jICh7IHVzZXJuYW1lLCBwYXNzd29yZCB9OiB7IHVzZXJuYW1lOiBzdHJpbmc7IHBhc3N3b3JkOiBzdHJpbmcgfSkgPT4ge1xuICAgIHRyeSB7XG5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBJbml0aWF0ZUF1dGhDb21tYW5kKHtcbiAgICAgICAgICAgIEF1dGhGbG93OiBBdXRoRmxvd1R5cGUuVVNFUl9QQVNTV09SRF9BVVRILFxuICAgICAgICAgICAgQXV0aFBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICAgICBVU0VSTkFNRTogdXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgUEFTU1dPUkQ6IHBhc3N3b3JkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENsaWVudElkOiBDT0dOSVRPX0NMSUVOVF9JRCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgeyBBdXRoZW50aWNhdGlvblJlc3VsdCwgQ2hhbGxlbmdlTmFtZSwgU2Vzc2lvbiB9ID0gYXdhaXQgY2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAyMDAsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogXCJVc2VyIHNpZ25lZCBpbiBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgICAgICAgICBjb2RlOiBDaGFsbGVuZ2VOYW1lIHx8IFwiVXNlclNpZ25lZEluXCIsXG4gICAgICAgICAgICAgICAgcGF5bG9hZDogeyAuLi5BdXRoZW50aWNhdGlvblJlc3VsdCwgU2Vzc2lvbiB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBjb25zdCB7IG5hbWUsIF9fdHlwZSB9ID0gZXJyb3I7XG5cbiAgICAgICAgaWYgKG5hbWUgPT09IFwiTm90QXV0aG9yaXplZEV4Y2VwdGlvblwiIHx8IF9fdHlwZSA9PT0gXCJOb3RBdXRob3JpemVkRXhjZXB0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogNDAxLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJVc2VyIHNpZ24gaW4gZmFpbGVkIC0gTm90IEF1dGhvcml6ZWRcIixcbiAgICAgICAgICAgICAgICAgICAgY29kZTogXCJOb3RBdXRob3JpemVkRXhjZXB0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBwYXlsb2FkOiBlcnJvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZSA9PT0gXCJVc2VyTm90Q29uZmlybWVkRXhjZXB0aW9uXCIgfHwgX190eXBlID09PSBcIlVzZXJOb3RDb25maXJtZWRFeGNlcHRpb25cIikge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA0MDMsXG4gICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlVzZXIgc2lnbiBpbiBmYWlsZWQgLSBVc2VyIElzIE5vdCBDb25maXJtZWRcIixcbiAgICAgICAgICAgICAgICAgICAgY29kZTogXCJVc2VyTm90Q29uZmlybWVkRXhjZXB0aW9uXCIsXG4gICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0OiBcIi9jb25maXJtLWFjY291bnRcIixcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHBheWxvYWQ6IGVycm9yXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IDUwMCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBcIlVzZXIgc2lnbiBpbiBmYWlsZWRcIixcbiAgICAgICAgICAgICAgICBjb2RlOiBcIlVzZXJTaWduZWRJbkVycm9yXCIsXG4gICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgcGF5bG9hZDogZXJyb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG5jb25zdCBnZXRVc2VyRnJvbVRva2VuID0gYXN5bmMgKGFjY2Vzc1Rva2VuOiBzdHJpbmcpID0+IHtcbiAgICB0cnkge1xuXG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0VXNlckNvbW1hbmQoe1xuICAgICAgICAgICAgQWNjZXNzVG9rZW46IGFjY2Vzc1Rva2VuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICB1c2VyOiB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHJlc3BvbnNlLlVzZXJuYW1lLFxuICAgICAgICAgICAgICAgIGVtYWlsOiByZXNwb25zZS5Vc2VyQXR0cmlidXRlcz8uZmluZChhdHRyID0+IGF0dHIuTmFtZSA9PT0gJ2VtYWlsJyk/LlZhbHVlLFxuICAgICAgICAgICAgICAgIGVtYWlsVmVyaWZpZWQ6IHJlc3BvbnNlLlVzZXJBdHRyaWJ1dGVzPy5maW5kKGF0dHIgPT4gYXR0ci5OYW1lID09PSAnZW1haWxfdmVyaWZpZWQnKT8uVmFsdWUgPT09ICd0cnVlJyxcbiAgICAgICAgICAgICAgICBmaXJzdE5hbWU6IHJlc3BvbnNlLlVzZXJBdHRyaWJ1dGVzPy5maW5kKGF0dHIgPT4gYXR0ci5OYW1lID09PSAnZ2l2ZW5fbmFtZScpPy5WYWx1ZSxcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogcmVzcG9uc2UuVXNlckF0dHJpYnV0ZXM/LmZpbmQoYXR0ciA9PiBhdHRyLk5hbWUgPT09ICdmYW1pbHlfbmFtZScpPy5WYWx1ZSxcbiAgICAgICAgICAgICAgICBjdXN0b21Vc2VySWQ6IHJlc3BvbnNlLlVzZXJBdHRyaWJ1dGVzPy5maW5kKGF0dHIgPT4gYXR0ci5OYW1lID09PSAnY3VzdG9tOnVzZXJJZCcpPy5WYWx1ZSxcbiAgICAgICAgICAgICAgICBzdWI6IHJlc3BvbnNlLlVzZXJBdHRyaWJ1dGVzPy5maW5kKGF0dHIgPT4gYXR0ci5OYW1lID09PSAnc3ViJyk/LlZhbHVlLFxuICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHJlc3BvbnNlLlVzZXJBdHRyaWJ1dGVzXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IubmFtZSB8fCAnVG9rZW5WYWxpZGF0aW9uRXJyb3InXG4gICAgICAgIH07XG4gICAgfVxufTtcblxuY29uc3QgcmVmcmVzaEFjY2Vzc1Rva2VuID0gYXN5bmMgKHJlZnJlc2hUb2tlbjogc3RyaW5nKSA9PiB7XG4gICAgdHJ5IHtcblxuICAgICAgICBjb25zdCBjb21tYW5kID0gbmV3IEluaXRpYXRlQXV0aENvbW1hbmQoe1xuICAgICAgICAgICAgQXV0aEZsb3c6IEF1dGhGbG93VHlwZS5SRUZSRVNIX1RPS0VOX0FVVEgsXG4gICAgICAgICAgICBBdXRoUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAgIFJFRlJFU0hfVE9LRU46IHJlZnJlc2hUb2tlbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDbGllbnRJZDogQ09HTklUT19DTElFTlRfSUQsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHsgQXV0aGVudGljYXRpb25SZXN1bHQgfSA9IGF3YWl0IGNsaWVudC5zZW5kKGNvbW1hbmQpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgZGF0YTogQXV0aGVudGljYXRpb25SZXN1bHRcbiAgICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIGVycm9yOiBlcnJvci5uYW1lIHx8ICdSZWZyZXNoVG9rZW5FcnJvcidcbiAgICAgICAgfTtcbiAgICB9XG59O1xuXG4vLyBMb2dpbiByb3V0ZVxuYXBwLnBvc3QoJy9sb2dpbicsIGFzeW5jIChjKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZm9ybURhdGEgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTG9naW4gcmVxdWVzdCBkYXRhOlwiLCBmb3JtRGF0YSk7XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICAgICAgY29uc3QgeyB1c2VybmFtZSwgcGFzc3dvcmQgfSA9IGxvZ2luU2NoZW1hLnBhcnNlKGZvcm1EYXRhKTtcblxuICAgICAgICAvLyBBdXRoZW50aWNhdGUgd2l0aCBDb2duaXRvXG4gICAgICAgIGNvbnN0IGF1dGhSZXN1bHQgPSBhd2FpdCBpbml0aWF0ZUF1dGgoeyB1c2VybmFtZSwgcGFzc3dvcmQgfSk7XG5cbiAgICAgICAgaWYgKCFhdXRoUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oYXV0aFJlc3VsdC5kYXRhLCBhdXRoUmVzdWx0LnN0YXR1c0NvZGUgYXMgYW55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGF1dGhlbnRpY2F0aW9uIGlzIHN1Y2Nlc3NmdWwsIHNldCBjb29raWUgd2l0aCB0aGUgYXBwcm9wcmlhdGUgdG9rZW5cbiAgICAgICAgaWYgKGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkPy5BY2Nlc3NUb2tlbikge1xuICAgICAgICAgICAgLy8gVXNlIElEIHRva2VuIGlmIGF2YWlsYWJsZSAoY29udGFpbnMgdXNlciBhdHRyaWJ1dGVzKSwgb3RoZXJ3aXNlIHVzZSBhY2Nlc3MgdG9rZW5cbiAgICAgICAgICAgIGNvbnN0IHRva2VuVG9TdG9yZSA9IGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkLklkVG9rZW4gfHwgYXV0aFJlc3VsdC5kYXRhLnBheWxvYWQuQWNjZXNzVG9rZW47XG5cbiAgICAgICAgICAgIHNldENvb2tpZShjLCAnc2Vzc2lvbklkJywgdG9rZW5Ub1N0b3JlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgICAgICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgICAgICAgICAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICBzYW1lU2l0ZTogJ0xheCcsXG4gICAgICAgICAgICAgICAgbWF4QWdlOiA2MCAqIDYwICogMjQgKiAzMCAvLyAzMCBkYXlzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gU2V0IHJlZnJlc2ggdG9rZW4gY29va2llIGlmIGF2YWlsYWJsZVxuICAgICAgICAgICAgaWYgKGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkPy5SZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgICAgICAgICBzZXRDb29raWUoYywgJ3JlZnJlc2hUb2tlbicsIGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkLlJlZnJlc2hUb2tlbiwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgICAgICAgICAgIGh0dHBPbmx5OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHNhbWVTaXRlOiAnTGF4JyxcbiAgICAgICAgICAgICAgICAgICAgbWF4QWdlOiA2MCAqIDYwICogMjQgKiAzMCAvLyAzMCBkYXlzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCBkZWJ1ZyBoZWFkZXJcbiAgICAgICAgICAgIGMuaGVhZGVyKCdYLURlYnVnLUNvb2tpZScsICdDb29raWUtU2V0Jyk7XG4gICAgICAgICAgICBjLmhlYWRlcignWC1Ub2tlbi1UeXBlJywgYXV0aFJlc3VsdC5kYXRhLnBheWxvYWQuSWRUb2tlbiA/ICdpZF90b2tlbicgOiAnYWNjZXNzX3Rva2VuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRpb24gcmVzdWx0OicsIGF1dGhSZXN1bHQpO1xuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGF1dGhSZXN1bHQuZGF0YS5tZXNzYWdlLFxuICAgICAgICAgICAgdG9rZW46IGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkPy5BY2Nlc3NUb2tlbixcbiAgICAgICAgICAgIGlkVG9rZW46IGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkPy5JZFRva2VuLFxuICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiBhdXRoUmVzdWx0LmRhdGEucGF5bG9hZD8uQWNjZXNzVG9rZW4sXG4gICAgICAgICAgICAgICAgaWRUb2tlbjogYXV0aFJlc3VsdC5kYXRhLnBheWxvYWQ/LklkVG9rZW4sXG4gICAgICAgICAgICAgICAgcmVmcmVzaFRva2VuOiBhdXRoUmVzdWx0LmRhdGEucGF5bG9hZD8uUmVmcmVzaFRva2VuLFxuICAgICAgICAgICAgICAgIHRva2VuVHlwZTogYXV0aFJlc3VsdC5kYXRhLnBheWxvYWQ/LlRva2VuVHlwZSxcbiAgICAgICAgICAgICAgICBleHBpcmVzSW46IGF1dGhSZXN1bHQuZGF0YS5wYXlsb2FkPy5FeHBpcmVzSW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zb2xlLmxvZygnTG9naW4gcmVzcG9uc2U6JywgcmVzcG9uc2UpO1xuICAgICAgICBjb25zb2xlLmxvZygnU2V0LUNvb2tpZSBoZWFkZXI6JywgYy5yZXMuaGVhZGVycy5nZXQoJ1NldC1Db29raWUnKSk7XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0xvZ2luIGVycm9yOicsIGVycm9yKTtcblxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiB6LlpvZEVycm9yKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIGZvcm0gZGF0YScsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yczogZXJyb3IuZXJyb3JzXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICA0MDBcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0FuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWQnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgNTAwXG4gICAgICAgICk7XG4gICAgfVxufSk7XG5cbmFwcC5wb3N0KCcvb3RwJywgYXN5bmMgKGMpID0+IHtcbiAgICBjb25zdCB7IGFjdGlvbiwgZW1haWwsIG90cCB9ID0gYXdhaXQgYy5yZXEuanNvbigpO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKCFlbWFpbCkgcmV0dXJuIGMuanNvbih7IGVycm9yOiAnRW1haWwgaXMgcmVxdWlyZWQnIH0sIDQwMCk7XG5cbiAgICAgICAgaWYgKGFjdGlvbiA9PT0gJ1ZFUklGWV9PVFAnKSB7XG4gICAgICAgICAgICBpZiAoIW90cCkgcmV0dXJuIGMuanNvbih7IGVycm9yOiAnT1RQIGlzIHJlcXVpcmVkJyB9LCA0MDApO1xuXG4gICAgICAgICAgICBjb25zdCBjb25maXJtID0gbmV3IENvbmZpcm1TaWduVXBDb21tYW5kKHtcbiAgICAgICAgICAgICAgICBDbGllbnRJZDogQ09HTklUT19DTElFTlRfSUQsXG4gICAgICAgICAgICAgICAgVXNlcm5hbWU6IGVtYWlsLFxuICAgICAgICAgICAgICAgIENvbmZpcm1hdGlvbkNvZGU6IG90cCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQuc2VuZChjb25maXJtKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oeyBtZXNzYWdlOiAnVXNlciBjb25maXJtZWQgc3VjY2Vzc2Z1bGx5JywgcmVzdWx0IH0sIDIwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYWN0aW9uID09PSAnUkVTRU5EX09UUCcpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc2VuZCA9IG5ldyBSZXNlbmRDb25maXJtYXRpb25Db2RlQ29tbWFuZCh7XG4gICAgICAgICAgICAgICAgQ2xpZW50SWQ6IENPR05JVE9fQ0xJRU5UX0lELFxuICAgICAgICAgICAgICAgIFVzZXJuYW1lOiBlbWFpbCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbGllbnQuc2VuZChyZXNlbmQpO1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7IG1lc3NhZ2U6ICdPVFAgcmVzZW50IHN1Y2Nlc3NmdWxseScsIHJlc3VsdCB9LCAyMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbih7IGVycm9yOiAnSW52YWxpZCBhY3Rpb24nIH0sIDQwMCk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIGMuanNvbih7IGVycm9yOiBlcnIubmFtZSB8fCAnVW5rbm93bkVycm9yJywgbWVzc2FnZTogZXJyLm1lc3NhZ2UgfSwgNTAwKTtcbiAgICB9XG59KTtcblxuLy8gVmVyaWZ5IHRva2VuIHJvdXRlXG5hcHAuZ2V0KCcvdmVyaWZ5JywgYXN5bmMgKGMpID0+IHtcbiAgICB0cnkge1xuICAgICAgICAvLyBHZXQgdG9rZW4gZnJvbSBjb29raWUgb3IgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICAgICAgbGV0IGFjY2Vzc1Rva2VuID0gZ2V0Q29va2llKGMsICdzZXNzaW9uSWQnKTtcblxuICAgICAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICBjb25zdCBhdXRoSGVhZGVyID0gYy5yZXEuaGVhZGVyKCdBdXRob3JpemF0aW9uJyk7XG4gICAgICAgICAgICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuID0gYXV0aEhlYWRlci5zdWJzdHJpbmcoNyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTm8gYWNjZXNzIHRva2VuIHByb3ZpZGVkJ1xuICAgICAgICAgICAgfSwgNDAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIGl0J3MgYW4gSUQgdG9rZW4sIHdlIG5lZWQgdG8gZ2V0IHRoZSBhY2Nlc3MgdG9rZW4gdG8gdmVyaWZ5IHdpdGggQ29nbml0b1xuICAgICAgICAvLyBGb3Igbm93LCB3ZSdsbCB0cnkgdG8gdmVyaWZ5IGRpcmVjdGx5IGFuZCBoYW5kbGUgdGhlIGVycm9yIGlmIGl0J3MgYW4gSUQgdG9rZW5cbiAgICAgICAgY29uc3QgdXNlclJlc3VsdCA9IGF3YWl0IGdldFVzZXJGcm9tVG9rZW4oYWNjZXNzVG9rZW4pO1xuXG4gICAgICAgIGlmICghdXNlclJlc3VsdC5zdWNjZXNzKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gcmVmcmVzaCB0b2tlbiBpZiB2ZXJpZmljYXRpb24gZmFpbGVkXG4gICAgICAgICAgICBjb25zdCByZWZyZXNoVG9rZW4gPSBnZXRDb29raWUoYywgJ3JlZnJlc2hUb2tlbicpO1xuXG4gICAgICAgICAgICBpZiAocmVmcmVzaFRva2VuKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVmcmVzaFJlc3VsdCA9IGF3YWl0IHJlZnJlc2hBY2Nlc3NUb2tlbihyZWZyZXNoVG9rZW4pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlZnJlc2hSZXN1bHQuc3VjY2VzcyAmJiByZWZyZXNoUmVzdWx0LmRhdGE/LkFjY2Vzc1Rva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBuZXcgdG9rZW4gKHByZWZlciBJRCB0b2tlbiBpZiBhdmFpbGFibGUpXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1Rva2VuVG9TdG9yZSA9IHJlZnJlc2hSZXN1bHQuZGF0YS5JZFRva2VuIHx8IHJlZnJlc2hSZXN1bHQuZGF0YS5BY2Nlc3NUb2tlbjtcblxuICAgICAgICAgICAgICAgICAgICBzZXRDb29raWUoYywgJ3Nlc3Npb25JZCcsIG5ld1Rva2VuVG9TdG9yZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgaHR0cE9ubHk6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBzYW1lU2l0ZTogJ0xheCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXhBZ2U6IDYwICogNjAgKiAyNCAqIDMwXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIEdldCB1c2VyIGluZm8gd2l0aCBuZXcgYWNjZXNzIHRva2VuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1VzZXJSZXN1bHQgPSBhd2FpdCBnZXRVc2VyRnJvbVRva2VuKHJlZnJlc2hSZXN1bHQuZGF0YS5BY2Nlc3NUb2tlbik7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKG5ld1VzZXJSZXN1bHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVG9rZW4gcmVmcmVzaGVkIGFuZCB2ZXJpZmllZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogbmV3VXNlclJlc3VsdC51c2VyPy5jdXN0b21Vc2VySWQgfHwgbmV3VXNlclJlc3VsdC51c2VyPy5zdWIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiBuZXdVc2VyUmVzdWx0LnVzZXI/LnVzZXJuYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWFpbDogbmV3VXNlclJlc3VsdC51c2VyPy5lbWFpbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3ROYW1lOiBuZXdVc2VyUmVzdWx0LnVzZXI/LmZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdE5hbWU6IG5ld1VzZXJSZXN1bHQudXNlcj8ubGFzdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYWlsVmVyaWZpZWQ6IG5ld1VzZXJSZXN1bHQudXNlcj8uZW1haWxWZXJpZmllZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViOiBuZXdVc2VyUmVzdWx0LnVzZXI/LnN1YixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tVXNlcklkOiBuZXdVc2VyUmVzdWx0LnVzZXI/LmN1c3RvbVVzZXJJZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9rZW46IHJlZnJlc2hSZXN1bHQuZGF0YS5BY2Nlc3NUb2tlblxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgb3IgZXhwaXJlZCB0b2tlbidcbiAgICAgICAgICAgIH0sIDQwMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnVG9rZW4gdmVyaWZpZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAgICAgICBpZDogdXNlclJlc3VsdC51c2VyPy5jdXN0b21Vc2VySWQgfHwgdXNlclJlc3VsdC51c2VyPy5zdWIsXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXJSZXN1bHQudXNlcj8udXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgZW1haWw6IHVzZXJSZXN1bHQudXNlcj8uZW1haWwsXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lOiB1c2VyUmVzdWx0LnVzZXI/LmZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICBsYXN0TmFtZTogdXNlclJlc3VsdC51c2VyPy5sYXN0TmFtZSxcbiAgICAgICAgICAgICAgICBlbWFpbFZlcmlmaWVkOiB1c2VyUmVzdWx0LnVzZXI/LmVtYWlsVmVyaWZpZWQsXG4gICAgICAgICAgICAgICAgc3ViOiB1c2VyUmVzdWx0LnVzZXI/LnN1YixcbiAgICAgICAgICAgICAgICBjdXN0b21Vc2VySWQ6IHVzZXJSZXN1bHQudXNlcj8uY3VzdG9tVXNlcklkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdWZXJpZnkgdG9rZW4gZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1Rva2VuIHZlcmlmaWNhdGlvbiBmYWlsZWQnXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxufSk7XG5cbi8vIFJlZnJlc2ggdG9rZW4gcm91dGVcbmFwcC5wb3N0KCcvcmVmcmVzaCcsIGFzeW5jIChjKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IHJlZnJlc2hUb2tlbiA9IGdldENvb2tpZShjLCAncmVmcmVzaFRva2VuJyk7XG5cbiAgICAgICAgaWYgKCFyZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgICAgICBjb25zdCB7IHJlZnJlc2hUb2tlbjogYm9keVJlZnJlc2hUb2tlbiB9ID0gcmVmcmVzaFRva2VuU2NoZW1hLnBhcnNlKGJvZHkpO1xuICAgICAgICAgICAgcmVmcmVzaFRva2VuID0gYm9keVJlZnJlc2hUb2tlbjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVmcmVzaFRva2VuKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTm8gcmVmcmVzaCB0b2tlbiBwcm92aWRlZCdcbiAgICAgICAgICAgIH0sIDQwMSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZWZyZXNoUmVzdWx0ID0gYXdhaXQgcmVmcmVzaEFjY2Vzc1Rva2VuKHJlZnJlc2hUb2tlbik7XG5cbiAgICAgICAgaWYgKCFyZWZyZXNoUmVzdWx0LnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmVmcmVzaCB0b2tlbidcbiAgICAgICAgICAgIH0sIDQwMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgY29va2llcyB3aXRoIG5ldyB0b2tlbnMgKHByZWZlciBJRCB0b2tlbilcbiAgICAgICAgaWYgKHJlZnJlc2hSZXN1bHQuZGF0YT8uQWNjZXNzVG9rZW4pIHtcbiAgICAgICAgICAgIGNvbnN0IHRva2VuVG9TdG9yZSA9IHJlZnJlc2hSZXN1bHQuZGF0YS5JZFRva2VuIHx8IHJlZnJlc2hSZXN1bHQuZGF0YS5BY2Nlc3NUb2tlbjtcblxuICAgICAgICAgICAgc2V0Q29va2llKGMsICdzZXNzaW9uSWQnLCB0b2tlblRvU3RvcmUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgICAgICAgaHR0cE9ubHk6IHRydWUsXG4gICAgICAgICAgICAgICAgc2VjdXJlOiB0cnVlLFxuICAgICAgICAgICAgICAgIHNhbWVTaXRlOiAnTGF4JyxcbiAgICAgICAgICAgICAgICBtYXhBZ2U6IDYwICogNjAgKiAyNCAqIDMwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdUb2tlbiByZWZyZXNoZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiByZWZyZXNoUmVzdWx0LmRhdGE/LkFjY2Vzc1Rva2VuLFxuICAgICAgICAgICAgaWRUb2tlbjogcmVmcmVzaFJlc3VsdC5kYXRhPy5JZFRva2VuLFxuICAgICAgICAgICAgdG9rZW5UeXBlOiByZWZyZXNoUmVzdWx0LmRhdGE/LlRva2VuVHlwZSxcbiAgICAgICAgICAgIGV4cGlyZXNJbjogcmVmcmVzaFJlc3VsdC5kYXRhPy5FeHBpcmVzSW5cbiAgICAgICAgfSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1JlZnJlc2ggdG9rZW4gZXJyb3I6JywgZXJyb3IpO1xuXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIHouWm9kRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHJlcXVlc3QgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1Rva2VuIHJlZnJlc2ggZmFpbGVkJ1xuICAgICAgICB9LCA1MDApO1xuICAgIH1cbn0pO1xuXG4vLyBGb3Jnb3QgcGFzc3dvcmQgcm91dGVcbmFwcC5wb3N0KCcvZm9yZ290LXBhc3N3b3JkJywgYXN5bmMgKGMpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgYy5yZXEuanNvbigpO1xuICAgICAgICBjb25zdCB7IGVtYWlsIH0gPSBmb3Jnb3RQYXNzd29yZFNjaGVtYS5wYXJzZShib2R5KTtcblxuICAgICAgICBjb25zdCBjbGllbnQgPSBuZXcgQ29nbml0b0lkZW50aXR5UHJvdmlkZXJDbGllbnQoe30pO1xuXG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSBuZXcgRm9yZ290UGFzc3dvcmRDb21tYW5kKHtcbiAgICAgICAgICAgIENsaWVudElkOiBDT0dOSVRPX0NMSUVOVF9JRCxcbiAgICAgICAgICAgIFVzZXJuYW1lOiBlbWFpbFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCBjbGllbnQuc2VuZChjb21tYW5kKTtcblxuICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnUGFzc3dvcmQgcmVzZXQgY29kZSBzZW50IHRvIHlvdXIgZW1haWwnXG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZvcmdvdCBwYXNzd29yZCBlcnJvcjonLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygei5ab2RFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0ludmFsaWQgZW1haWwgZm9ybWF0JyxcbiAgICAgICAgICAgICAgICBlcnJvcnM6IGVycm9yLmVycm9yc1xuICAgICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnVXNlck5vdEZvdW5kRXhjZXB0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ1VzZXIgbm90IGZvdW5kJ1xuICAgICAgICAgICAgfSwgNDA0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHNlbmQgcmVzZXQgY29kZSdcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG59KTtcblxuLy8gUmVzZXQgcGFzc3dvcmQgcm91dGVcbmFwcC5wb3N0KCcvcmVzZXQtcGFzc3dvcmQnLCBhc3luYyAoYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgIGNvbnN0IHsgZW1haWwsIGNvZGUsIG5ld1Bhc3N3b3JkIH0gPSByZXNldFBhc3N3b3JkU2NoZW1hLnBhcnNlKGJvZHkpO1xuXG4gICAgICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7fSk7XG5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBDb25maXJtRm9yZ290UGFzc3dvcmRDb21tYW5kKHtcbiAgICAgICAgICAgIENsaWVudElkOiBDT0dOSVRPX0NMSUVOVF9JRCxcbiAgICAgICAgICAgIFVzZXJuYW1lOiBlbWFpbCxcbiAgICAgICAgICAgIENvbmZpcm1hdGlvbkNvZGU6IGNvZGUsXG4gICAgICAgICAgICBQYXNzd29yZDogbmV3UGFzc3dvcmRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYXdhaXQgY2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1Bhc3N3b3JkIHJlc2V0IHN1Y2Nlc3NmdWxseSdcbiAgICAgICAgfSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignUmVzZXQgcGFzc3dvcmQgZXJyb3I6JywgZXJyb3IpO1xuXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIHouWm9kRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHJlcXVlc3QgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ0NvZGVNaXNtYXRjaEV4Y2VwdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHZlcmlmaWNhdGlvbiBjb2RlJ1xuICAgICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnRXhwaXJlZENvZGVFeGNlcHRpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnVmVyaWZpY2F0aW9uIGNvZGUgaGFzIGV4cGlyZWQnXG4gICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmVzZXQgcGFzc3dvcmQnXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxufSk7XG5cbi8vIExvZ291dCByb3V0ZVxuYXBwLnBvc3QoJy9sb2dvdXQnLCBhc3luYyAoYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIC8vIERlbGV0ZSB0aGUgc2Vzc2lvbiBjb29raWVzXG4gICAgICAgIGRlbGV0ZUNvb2tpZShjLCAnc2Vzc2lvbklkJywge1xuICAgICAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICAgICAgaHR0cE9ubHk6IHRydWUsXG4gICAgICAgICAgICBzZWN1cmU6IHRydWUsXG4gICAgICAgICAgICBzYW1lU2l0ZTogJ0xheCdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVsZXRlQ29va2llKGMsICdyZWZyZXNoVG9rZW4nLCB7XG4gICAgICAgICAgICBwYXRoOiAnLycsXG4gICAgICAgICAgICBodHRwT25seTogdHJ1ZSxcbiAgICAgICAgICAgIHNlY3VyZTogdHJ1ZSxcbiAgICAgICAgICAgIHNhbWVTaXRlOiAnTGF4J1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gYy5qc29uKHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnTG9nb3V0IHN1Y2Nlc3NmdWwnXG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdMb2dvdXQgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uKFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdMb2dvdXQgZmFpbGVkJ1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIDUwMFxuICAgICAgICApO1xuICAgIH1cbn0pO1xuXG5leHBvcnQgeyBhcHAgYXMgYXV0aCB9OyJdfQ==