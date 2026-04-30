import request from 'supertest';
import { createAdaptorServer } from '@hono/node-server';
import { authApp } from '../lambda/routes/auth';
import { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand, RespondToAuthChallengeCommand, ChangePasswordCommand, ConfirmForgotPasswordCommand, ResendConfirmationCodeCommand, ConfirmSignUpCommand, ForgotPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const cognitoMock = mockClient(CognitoIdentityProviderClient);
const server = createAdaptorServer(authApp);

describe('Auth API Integration Tests', () => {
    const originalCognitoClientId = process.env.COGNITO_CLIENT_ID;
    const testClientId = 'test-cognito-client-id';

    beforeEach(() => {
        cognitoMock.reset();
        process.env.COGNITO_CLIENT_ID = testClientId;
    });

    afterEach(() => {
        process.env.COGNITO_CLIENT_ID = originalCognitoClientId;
    });

    describe('POST /login', () => {
        it('should return 200 and tokens on successful login', async () => {
            cognitoMock.on(InitiateAuthCommand, {
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: 'testuser',
                    PASSWORD: 'Password123!'
                },
                ClientId: testClientId
            }).resolves({
                AuthenticationResult: {
                    AccessToken: 'mockAccessToken',
                    IdToken: 'mockIdToken',
                    RefreshToken: 'mockRefreshToken',
                    ExpiresIn: 3600,
                    TokenType: 'Bearer'
                },
                ChallengeName: undefined,
                Session: undefined
            });

            const response = await request(server)
                .post('/login')
                .send({ username: 'testuser', password: 'Password123!' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User signed in successfully');
            expect(response.body.user.accessToken).toBe('mockAccessToken');
            expect(response.body.user.idToken).toBe('mockIdToken');
            expect(response.body.user.refreshToken).toBe('mockRefreshToken');
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('sessionId=mockIdToken'),
                    expect.stringContaining('refreshToken=mockRefreshToken')
                ])
            );
        });

        it('should return 401 for invalid credentials', async () => {
            cognitoMock.on(InitiateAuthCommand).rejectsOnce({
                name: 'NotAuthorizedException',
                message: 'Incorrect username or password.'
            } as any);

            const response = await request(server)
                .post('/login')
                .send({ username: 'wronguser', password: 'WrongPassword123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Incorrect username or password. Please try again.');
        });

        it('should return 200 with new password required challenge', async () => {
            cognitoMock.on(InitiateAuthCommand).resolves({
                ChallengeName: 'NEW_PASSWORD_REQUIRED',
                Session: 'mockSession',
                AuthenticationResult: undefined,
            });

            const response = await request(server)
                .post('/login')
                .send({ username: 'newpassworduser', password: 'TempPassword123!' })
                .expect(200);

            expect(response.body.success).toBe(false);
            expect(response.body.requiresNewPassword).toBe(true);
            expect(response.body.session).toBe('mockSession');
            expect(response.body.username).toBe('newpassworduser');
        });

        it('should return 400 for invalid input (Zod validation)', async () => {
            const response = await request(server)
                .post('/login')
                .send({ username: 'short', password: 'P1!' })
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.message).toBe('Invalid form data');
            expect(response.body.errors).toBeDefined();
            expect(response.body.errors.length).toBeGreaterThan(0);
        });

        it('should return 403 for unconfirmed user', async () => {
            cognitoMock.on(InitiateAuthCommand).rejectsOnce({
                name: 'UserNotConfirmedException',
                message: 'User is not confirmed.'
            } as any);

            const response = await request(server)
                .post('/login')
                .send({ username: 'unconfirmed', password: 'Password123!' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User sign-in failed - Account not confirmed.');
            expect(response.body.redirect).toBe('/confirm-account');
        });
    });

    describe('POST /otp', () => {
        it('should verify OTP successfully', async () => {
            cognitoMock.on(ConfirmSignUpCommand).resolves({});

            const response = await request(server)
                .post('/otp')
                .send({ action: 'VERIFY_OTP', email: 'test@example.com', otp: '123456' })
                .expect(200);

            expect(response.body.message).toBe('User confirmed successfully');
        });

        it('should resend OTP successfully', async () => {
            cognitoMock.on(ResendConfirmationCodeCommand).resolves({});

            const response = await request(server)
                .post('/otp')
                .send({ action: 'RESEND_OTP', email: 'test@example.com' })
                .expect(200);

            expect(response.body.message).toBe('OTP resent successfully');
        });

        it('should return 400 for missing email', async () => {
            const response = await request(server)
                .post('/otp')
                .send({ action: 'VERIFY_OTP', otp: '123456' })
                .expect(400);

            expect(response.body.error).toBe('Email is required');
        });

        it('should return 400 for invalid action', async () => {
            const response = await request(server)
                .post('/otp')
                .send({ action: 'INVALID_ACTION', email: 'test@example.com' })
                .expect(400);

            expect(response.body.error).toBe('Invalid action');
        });
    });

    describe('GET /verify', () => {
        it('should verify token successfully from cookie', async () => {
            cognitoMock.on(GetUserCommand).resolves({
                Username: 'testuser',
                UserAttributes: [{ Name: 'email', Value: 'test@example.com' }]
            });

            const response = await request(server)
                .get('/verify')
                .set('Cookie', ['sessionId=mockAccessToken'])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token verified successfully');
            expect(response.body.user.username).toBe('testuser');
        });

        it('should return 401 if no token provided', async () => {
            const response = await request(server)
                .get('/verify')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No access token provided');
        });

        it('should refresh token and verify if access token expired', async () => {
            cognitoMock.on(GetUserCommand).rejectsOnce({ name: 'NotAuthorizedException' });
            cognitoMock.on(InitiateAuthCommand, { AuthFlow: 'REFRESH_TOKEN_AUTH' }).resolvesOnce({
                AuthenticationResult: {
                    AccessToken: 'newMockAccessToken',
                    IdToken: 'newMockIdToken',
                    RefreshToken: 'mockRefreshToken',
                    ExpiresIn: 3600,
                    TokenType: 'Bearer'
                }
            });
            cognitoMock.on(GetUserCommand).resolvesOnce({
                Username: 'refreshedUser',
                UserAttributes: [{ Name: 'email', Value: 'refreshed@example.com' }]
            });

            const response = await request(server)
                .get('/verify')
                .set('Cookie', ['sessionId=expiredAccessToken', 'refreshToken=mockRefreshToken'])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed and verified');
            expect(response.body.user.username).toBe('refreshedUser');
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('sessionId=newMockIdToken')
                ])
            );
        });
    });

    describe('POST /refresh', () => {
        it('should refresh token successfully', async () => {
            cognitoMock.on(InitiateAuthCommand, { AuthFlow: 'REFRESH_TOKEN_AUTH' }).resolves({
                AuthenticationResult: {
                    AccessToken: 'newMockAccessToken',
                    IdToken: 'newMockIdToken',
                    RefreshToken: 'mockRefreshToken',
                    ExpiresIn: 3600,
                    TokenType: 'Bearer'
                }
            });

            const response = await request(server)
                .post('/refresh')
                .set('Cookie', ['refreshToken=oldRefreshToken'])
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.body.accessToken).toBe('newMockAccessToken');
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('sessionId=newMockIdToken')
                ])
            );
        });

        it('should return 401 if no refresh token provided', async () => {
            const response = await request(server)
                .post('/refresh')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('No refresh token provided');
        });

        it('should return 401 if refresh token is invalid', async () => {
            cognitoMock.on(InitiateAuthCommand, { AuthFlow: 'REFRESH_TOKEN_AUTH' }).rejectsOnce({ name: 'NotAuthorizedException' });

            const response = await request(server)
                .post('/refresh')
                .set('Cookie', ['refreshToken=invalidRefreshToken'])
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to refresh token');
        });
    });

    describe('POST /forgot-password', () => {
        it('should send password reset code successfully', async () => {
            cognitoMock.on(ForgotPasswordCommand).resolves({});

            const response = await request(server)
                .post('/forgot-password')
                .send({ email: 'forgot@example.com' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password reset code sent to your email');
        });

        it('should return 404 if user not found', async () => {
            cognitoMock.on(ForgotPasswordCommand).rejectsOnce({ name: 'UserNotFoundException' });

            const response = await request(server)
                .post('/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User not found');
        });

        it('should return 400 for invalid email format', async () => {
            const response = await request(server)
                .post('/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid email format');
        });
    });

    describe('POST /reset-password', () => {
        it('should reset password successfully', async () => {
            cognitoMock.on(ConfirmForgotPasswordCommand).resolves({});

            const response = await request(server)
                .post('/reset-password')
                .send({ email: 'reset@example.com', code: '123456', newPassword: 'NewPassword123!' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password reset successfully');
        });

        it('should return 400 for invalid verification code', async () => {
            cognitoMock.on(ConfirmForgotPasswordCommand).rejectsOnce({ name: 'CodeMismatchException' });

            const response = await request(server)
                .post('/reset-password')
                .send({ email: 'reset@example.com', code: 'wrongcode', newPassword: 'NewPassword123!' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid verification code');
        });

        it('should return 400 for expired verification code', async () => {
            cognitoMock.on(ConfirmForgotPasswordCommand).rejectsOnce({ name: 'ExpiredCodeException' });

            const response = await request(server)
                .post('/reset-password')
                .send({ email: 'reset@example.com', code: 'expiredcode', newPassword: 'NewPassword123!' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Verification code has expired');
        });
    });

    describe('POST /complete-new-password', () => {
        it('should complete new password setup successfully', async () => {
            cognitoMock.on(RespondToAuthChallengeCommand).resolves({
                AuthenticationResult: {
                    AccessToken: 'finalAccessToken',
                    IdToken: 'finalIdToken'
                }
            });

            const response = await request(server)
                .post('/complete-new-password')
                .send({ username: 'newpassworduser', newPassword: 'BrandNewPassword123!', session: 'mockSession' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password updated successfully');
            expect(response.body.tokens.AccessToken).toBe('finalAccessToken');
        });

        it('should return 400 for invalid request data', async () => {
            const response = await request(server)
                .post('/complete-new-password')
                .send({ username: 'user', newPassword: 'bad', session: 's' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid request data');
        });
    });

    describe('POST /change-password', () => {
        it('should change password successfully', async () => {
            cognitoMock.on(ChangePasswordCommand).resolves({});

            const response = await request(server)
                .post('/change-password')
                .send({ accessToken: 'validAccessToken', currentPassword: 'OldPassword123!', newPassword: 'BrandNewPassword123!' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');
        });

        it('should return 403 for incorrect current password', async () => {
            cognitoMock.on(ChangePasswordCommand).rejectsOnce({ name: 'NotAuthorizedException' });

            const response = await request(server)
                .post('/change-password')
                .send({ accessToken: 'validAccessToken', currentPassword: 'WrongPassword123!', newPassword: 'BrandNewPassword123!' })
                .expect(403);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Current password is incorrect or access token is invalid');
        });

        it('should return 400 for invalid input', async () => {
            const response = await request(server)
                .post('/change-password')
                .send({ accessToken: 'validAccessToken', currentPassword: 'P1!', newPassword: 'P2!' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid request data');
        });
    });

    describe('POST /logout', () => {
        it('should clear cookies and return success message', async () => {
            const response = await request(server)
                .post('/logout')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Logout successful');
            expect(response.headers['set-cookie']).toBeDefined();
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('sessionId=;'),
                    expect.stringContaining('refreshToken=;')
                ])
            );
        });
    });
});
