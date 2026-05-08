# Authentication

All endpoints except those under `/auth/*` and `/health` require a valid JWT passed as a Bearer token.

## Login flow

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your-password"
}
```

A successful response returns `idToken`, `accessToken`, and `refreshToken`.

## Sending authenticated requests

```http
GET /users/me
Authorization: Bearer <idToken>
```

## Token refresh

When the `idToken` expires, call `/auth/refresh`. The server reads the `refreshToken` from the cookie (or you can send it in the request body) and returns new tokens.

## First login (NEW_PASSWORD_REQUIRED)

If the response contains `challengeName: "NEW_PASSWORD_REQUIRED"`, redirect the user to set a new password:

```http
POST /auth/complete-new-password
Content-Type: application/json

{
  "email": "user@example.com",
  "session": "<session from login response>",
  "newPassword": "NewSecurePassword1!"
}
```
