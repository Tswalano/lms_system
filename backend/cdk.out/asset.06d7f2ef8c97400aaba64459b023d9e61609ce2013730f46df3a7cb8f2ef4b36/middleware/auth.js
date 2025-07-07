"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = exports.getCognitoUser = exports.getCustomUserId = exports.getUserOccupation = exports.getUserRole = exports.getUserFullName = exports.getUserLastName = exports.getUserFirstName = exports.getUserEmail = exports.getCognitoSub = exports.getUserId = exports.getAccessToken = exports.getDecodedToken = exports.validateToken = exports.getToken = void 0;
const cookie_1 = require("hono/cookie");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({});
// Get token from cookie or Authorization header
const getToken = (c) => {
    // First try to get from cookie
    let accessToken = (0, cookie_1.getCookie)(c, 'sessionId');
    // If not in cookie, try Authorization header
    if (!accessToken) {
        const authHeader = c.req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            accessToken = authHeader.substring(7);
        }
    }
    return accessToken ?? null;
};
exports.getToken = getToken;
// Simple token validation (decode only, no signature verification)
const validateToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded) {
            throw new Error("Invalid token: could not decode");
        }
        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
            throw new Error("Token expired");
        }
        // Validate required fields
        if (!decoded['sub']) {
            throw new Error("Invalid token structure: missing 'sub'");
        }
        // Check if token is for access OR id (both are valid for authentication)
        if (decoded.token_use !== 'access' && decoded.token_use !== 'id') {
            throw new Error("Invalid token: not an access or id token");
        }
        return decoded;
    }
    catch (error) {
        console.error('Token validation error:', error);
        throw new Error("Unauthorized: Invalid token");
    }
};
exports.validateToken = validateToken;
// Type-safe function to get decoded token from context
const getDecodedToken = (c) => {
    const decodedToken = c.get('decodedToken');
    if (!decodedToken) {
        throw new Error('No decoded token found in context. Make sure auth middleware is applied.');
    }
    return decodedToken;
};
exports.getDecodedToken = getDecodedToken;
// Type-safe function to get access token from context
const getAccessToken = (c) => {
    const accessToken = c.get('accessToken');
    if (!accessToken) {
        throw new Error('No access token found in context. Make sure auth middleware is applied.');
    }
    return accessToken;
};
exports.getAccessToken = getAccessToken;
// Type-safe function to get user ID
const getUserId = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken['custom:userId'];
};
exports.getUserId = getUserId;
// Type-safe function to get Cognito sub
const getCognitoSub = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken.sub;
};
exports.getCognitoSub = getCognitoSub;
// Type-safe function to get user email
const getUserEmail = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken.email;
};
exports.getUserEmail = getUserEmail;
// Type-safe function to get user's first name
const getUserFirstName = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken.given_name || decodedToken.name || '';
};
exports.getUserFirstName = getUserFirstName;
// Type-safe function to get user's last name
const getUserLastName = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken.family_name || '';
};
exports.getUserLastName = getUserLastName;
// Type-safe function to get user's full name
const getUserFullName = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken.name || `${decodedToken.given_name || ''} ${decodedToken.family_name || ''}`.trim();
};
exports.getUserFullName = getUserFullName;
// Type-safe function to get user's role
const getUserRole = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken['custom:role'] || '';
};
exports.getUserRole = getUserRole;
// Type-safe function to get user's occupation
const getUserOccupation = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken['custom:occupation'] || '';
};
exports.getUserOccupation = getUserOccupation;
// Type-safe function to get custom user ID
const getCustomUserId = (c) => {
    const decodedToken = (0, exports.getDecodedToken)(c);
    return decodedToken['custom:userId'] || '';
};
exports.getCustomUserId = getCustomUserId;
// Type-safe function to get Cognito user data (if fetched)
const getCognitoUser = (c) => {
    const cognitoUser = c.get('cognitoUser');
    if (!cognitoUser) {
        throw new Error('No Cognito user data found. Make sure authMiddleware is called with fetchCognitoUser: true');
    }
    return cognitoUser;
};
exports.getCognitoUser = getCognitoUser;
// Auth middleware that validates token and optionally fetches user from Cognito
const authMiddleware = (options = {}) => {
    return async (c, next) => {
        try {
            const token = (0, exports.getToken)(c);
            if (!token) {
                return c.json({
                    code: "MISSING_ACCESS_TOKEN",
                    message: "Missing access token",
                    error: true,
                    payload: null
                }, 401);
            }
            // Validate token structure and expiration
            const decodedToken = (0, exports.validateToken)(token);
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
        }
        catch (error) {
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
exports.authMiddleware = authMiddleware;
// Optional auth middleware - doesn't fail if no token, just sets user if available
const optionalAuthMiddleware = () => {
    return async (c, next) => {
        try {
            const token = (0, exports.getToken)(c);
            if (token) {
                try {
                    const decodedToken = (0, exports.validateToken)(token);
                    c.set('accessToken', token);
                    c.set('decodedToken', decodedToken);
                }
                catch (error) {
                    // Token exists but is invalid - just continue without setting user
                    console.warn('Invalid token in optional auth:', error);
                }
            }
            await next();
        }
        catch (error) {
            // In optional auth, we don't fail - just continue
            console.warn('Optional auth middleware error:', error);
            await next();
        }
    };
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImF1dGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsd0NBQXdDO0FBQ3hDLGdHQUEwRztBQUMxRyxnRUFBK0I7QUFHL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxnRUFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQTBCckQsZ0RBQWdEO0FBQ3pDLE1BQU0sUUFBUSxHQUFHLENBQUMsQ0FBTSxFQUFpQixFQUFFO0lBQzlDLCtCQUErQjtJQUMvQixJQUFJLFdBQVcsR0FBRyxJQUFBLGtCQUFTLEVBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTVDLDZDQUE2QztJQUM3QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDZixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqRCxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDakQsV0FBVyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUMsQ0FBQztJQUNMLENBQUM7SUFFRCxPQUFPLFdBQVcsSUFBSSxJQUFJLENBQUM7QUFDL0IsQ0FBQyxDQUFDO0FBYlcsUUFBQSxRQUFRLFlBYW5CO0FBRUYsbUVBQW1FO0FBQzVELE1BQU0sYUFBYSxHQUFHLENBQUMsS0FBYSxFQUFnQixFQUFFO0lBQ3pELElBQUksQ0FBQztRQUNELE1BQU0sT0FBTyxHQUFHLHNCQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBaUIsQ0FBQztRQUVsRCxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDWCxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELDRCQUE0QjtRQUM1QixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FB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QUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO29CQUNiLG1FQUFtRTtvQkFDbkUsT0FBTyxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDM0QsQ0FBQztZQUNMLENBQUM7WUFFRCxNQUFNLElBQUksRUFBRSxDQUFDO1FBRWpCLENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2Isa0RBQWtEO1lBQ2xELE9BQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdkQsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUNqQixDQUFDO0lBQ0wsQ0FBQyxDQUFDO0FBQ04sQ0FBQyxDQUFDO0FBeEJXLFFBQUEsc0JBQXNCLDBCQXdCakMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRDb29raWUgfSBmcm9tICdob25vL2Nvb2tpZSc7XG5pbXBvcnQgeyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCwgR2V0VXNlckNvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXJcIjtcbmltcG9ydCBqd3QgZnJvbSAnanNvbndlYnRva2VuJztcbmltcG9ydCB7IENvbnRleHQgfSBmcm9tICdob25vJztcblxuY29uc3QgY2xpZW50ID0gbmV3IENvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50KHt9KTtcblxuZXhwb3J0IGludGVyZmFjZSBEZWNvZGVkVG9rZW4ge1xuICAgIHN1Yjogc3RyaW5nO1xuICAgIGVtYWlsOiBzdHJpbmc7XG4gICAgdXNlcm5hbWU/OiBzdHJpbmc7XG4gICAgZmFtaWx5X25hbWU/OiBzdHJpbmc7XG4gICAgZ2l2ZW5fbmFtZT86IHN0cmluZztcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIHByZWZlcnJlZF91c2VybmFtZT86IHN0cmluZztcbiAgICBleHA6IG51bWJlcjtcbiAgICBpYXQ6IG51bWJlcjtcbiAgICB0b2tlbl91c2U6IHN0cmluZztcbiAgICAnY3VzdG9tOnJvbGUnPzogc3RyaW5nO1xuICAgICdjdXN0b206b2NjdXBhdGlvbic/OiBzdHJpbmc7XG4gICAgJ2N1c3RvbTp1c2VySWQnOiBzdHJpbmc7XG4gICAgJ2NvZ25pdG86dXNlcm5hbWUnPzogc3RyaW5nO1xufVxuXG4vLyBUeXBlLXNhZmUgY29udGV4dCB2YXJpYWJsZXMgaW50ZXJmYWNlXG5pbnRlcmZhY2UgQXV0aFZhcmlhYmxlcyB7XG4gICAgYWNjZXNzVG9rZW46IHN0cmluZztcbiAgICBkZWNvZGVkVG9rZW46IERlY29kZWRUb2tlbjtcbiAgICBjb2duaXRvVXNlcj86IGFueTtcbn1cblxuLy8gR2V0IHRva2VuIGZyb20gY29va2llIG9yIEF1dGhvcml6YXRpb24gaGVhZGVyXG5leHBvcnQgY29uc3QgZ2V0VG9rZW4gPSAoYzogYW55KTogc3RyaW5nIHwgbnVsbCA9PiB7XG4gICAgLy8gRmlyc3QgdHJ5IHRvIGdldCBmcm9tIGNvb2tpZVxuICAgIGxldCBhY2Nlc3NUb2tlbiA9IGdldENvb2tpZShjLCAnc2Vzc2lvbklkJyk7XG5cbiAgICAvLyBJZiBub3QgaW4gY29va2llLCB0cnkgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICBpZiAoIWFjY2Vzc1Rva2VuKSB7XG4gICAgICAgIGNvbnN0IGF1dGhIZWFkZXIgPSBjLnJlcS5oZWFkZXIoJ0F1dGhvcml6YXRpb24nKTtcbiAgICAgICAgaWYgKGF1dGhIZWFkZXIgJiYgYXV0aEhlYWRlci5zdGFydHNXaXRoKCdCZWFyZXIgJykpIHtcbiAgICAgICAgICAgIGFjY2Vzc1Rva2VuID0gYXV0aEhlYWRlci5zdWJzdHJpbmcoNyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYWNjZXNzVG9rZW4gPz8gbnVsbDtcbn07XG5cbi8vIFNpbXBsZSB0b2tlbiB2YWxpZGF0aW9uIChkZWNvZGUgb25seSwgbm8gc2lnbmF0dXJlIHZlcmlmaWNhdGlvbilcbmV4cG9ydCBjb25zdCB2YWxpZGF0ZVRva2VuID0gKHRva2VuOiBzdHJpbmcpOiBEZWNvZGVkVG9rZW4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QuZGVjb2RlKHRva2VuKSBhcyBEZWNvZGVkVG9rZW47XG5cbiAgICAgICAgaWYgKCFkZWNvZGVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRva2VuOiBjb3VsZCBub3QgZGVjb2RlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdG9rZW4gaXMgZXhwaXJlZFxuICAgICAgICBjb25zdCBub3cgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgICAgICAgaWYgKGRlY29kZWQuZXhwICYmIGRlY29kZWQuZXhwIDwgbm93KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUb2tlbiBleHBpcmVkXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXG4gICAgICAgIGlmICghZGVjb2RlZFsnc3ViJ10pIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgdG9rZW4gc3RydWN0dXJlOiBtaXNzaW5nICdzdWInXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgdG9rZW4gaXMgZm9yIGFjY2VzcyBPUiBpZCAoYm90aCBhcmUgdmFsaWQgZm9yIGF1dGhlbnRpY2F0aW9uKVxuICAgICAgICBpZiAoZGVjb2RlZC50b2tlbl91c2UgIT09ICdhY2Nlc3MnICYmIGRlY29kZWQudG9rZW5fdXNlICE9PSAnaWQnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHRva2VuOiBub3QgYW4gYWNjZXNzIG9yIGlkIHRva2VuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlY29kZWQ7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdUb2tlbiB2YWxpZGF0aW9uIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5hdXRob3JpemVkOiBJbnZhbGlkIHRva2VuXCIpO1xuICAgIH1cbn07XG5cbi8vIFR5cGUtc2FmZSBmdW5jdGlvbiB0byBnZXQgZGVjb2RlZCB0b2tlbiBmcm9tIGNvbnRleHRcbmV4cG9ydCBjb25zdCBnZXREZWNvZGVkVG9rZW4gPSAoYzogQ29udGV4dCk6IERlY29kZWRUb2tlbiA9PiB7XG4gICAgY29uc3QgZGVjb2RlZFRva2VuID0gYy5nZXQoJ2RlY29kZWRUb2tlbicpIGFzIERlY29kZWRUb2tlbjtcblxuICAgIGlmICghZGVjb2RlZFRva2VuKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGVjb2RlZCB0b2tlbiBmb3VuZCBpbiBjb250ZXh0LiBNYWtlIHN1cmUgYXV0aCBtaWRkbGV3YXJlIGlzIGFwcGxpZWQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlY29kZWRUb2tlbjtcbn07XG5cbi8vIFR5cGUtc2FmZSBmdW5jdGlvbiB0byBnZXQgYWNjZXNzIHRva2VuIGZyb20gY29udGV4dFxuZXhwb3J0IGNvbnN0IGdldEFjY2Vzc1Rva2VuID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGFjY2Vzc1Rva2VuID0gYy5nZXQoJ2FjY2Vzc1Rva2VuJykgYXMgc3RyaW5nO1xuXG4gICAgaWYgKCFhY2Nlc3NUb2tlbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGFjY2VzcyB0b2tlbiBmb3VuZCBpbiBjb250ZXh0LiBNYWtlIHN1cmUgYXV0aCBtaWRkbGV3YXJlIGlzIGFwcGxpZWQuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFjY2Vzc1Rva2VuO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCB1c2VyIElEXG5leHBvcnQgY29uc3QgZ2V0VXNlcklkID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGdldERlY29kZWRUb2tlbihjKTtcbiAgICByZXR1cm4gZGVjb2RlZFRva2VuWydjdXN0b206dXNlcklkJ107XG59O1xuXG4vLyBUeXBlLXNhZmUgZnVuY3Rpb24gdG8gZ2V0IENvZ25pdG8gc3ViXG5leHBvcnQgY29uc3QgZ2V0Q29nbml0b1N1YiA9IChjOiBDb250ZXh0KTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBnZXREZWNvZGVkVG9rZW4oYyk7XG4gICAgcmV0dXJuIGRlY29kZWRUb2tlbi5zdWI7XG59O1xuXG4vLyBUeXBlLXNhZmUgZnVuY3Rpb24gdG8gZ2V0IHVzZXIgZW1haWxcbmV4cG9ydCBjb25zdCBnZXRVc2VyRW1haWwgPSAoYzogQ29udGV4dCk6IHN0cmluZyA9PiB7XG4gICAgY29uc3QgZGVjb2RlZFRva2VuID0gZ2V0RGVjb2RlZFRva2VuKGMpO1xuICAgIHJldHVybiBkZWNvZGVkVG9rZW4uZW1haWw7XG59O1xuXG4vLyBUeXBlLXNhZmUgZnVuY3Rpb24gdG8gZ2V0IHVzZXIncyBmaXJzdCBuYW1lXG5leHBvcnQgY29uc3QgZ2V0VXNlckZpcnN0TmFtZSA9IChjOiBDb250ZXh0KTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBnZXREZWNvZGVkVG9rZW4oYyk7XG4gICAgcmV0dXJuIGRlY29kZWRUb2tlbi5naXZlbl9uYW1lIHx8IGRlY29kZWRUb2tlbi5uYW1lIHx8ICcnO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCB1c2VyJ3MgbGFzdCBuYW1lXG5leHBvcnQgY29uc3QgZ2V0VXNlckxhc3ROYW1lID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGdldERlY29kZWRUb2tlbihjKTtcbiAgICByZXR1cm4gZGVjb2RlZFRva2VuLmZhbWlseV9uYW1lIHx8ICcnO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCB1c2VyJ3MgZnVsbCBuYW1lXG5leHBvcnQgY29uc3QgZ2V0VXNlckZ1bGxOYW1lID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGdldERlY29kZWRUb2tlbihjKTtcbiAgICByZXR1cm4gZGVjb2RlZFRva2VuLm5hbWUgfHwgYCR7ZGVjb2RlZFRva2VuLmdpdmVuX25hbWUgfHwgJyd9ICR7ZGVjb2RlZFRva2VuLmZhbWlseV9uYW1lIHx8ICcnfWAudHJpbSgpO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCB1c2VyJ3Mgcm9sZVxuZXhwb3J0IGNvbnN0IGdldFVzZXJSb2xlID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGdldERlY29kZWRUb2tlbihjKTtcbiAgICByZXR1cm4gZGVjb2RlZFRva2VuWydjdXN0b206cm9sZSddIHx8ICcnO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCB1c2VyJ3Mgb2NjdXBhdGlvblxuZXhwb3J0IGNvbnN0IGdldFVzZXJPY2N1cGF0aW9uID0gKGM6IENvbnRleHQpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IGdldERlY29kZWRUb2tlbihjKTtcbiAgICByZXR1cm4gZGVjb2RlZFRva2VuWydjdXN0b206b2NjdXBhdGlvbiddIHx8ICcnO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCBjdXN0b20gdXNlciBJRFxuZXhwb3J0IGNvbnN0IGdldEN1c3RvbVVzZXJJZCA9IChjOiBDb250ZXh0KTogc3RyaW5nID0+IHtcbiAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBnZXREZWNvZGVkVG9rZW4oYyk7XG4gICAgcmV0dXJuIGRlY29kZWRUb2tlblsnY3VzdG9tOnVzZXJJZCddIHx8ICcnO1xufTtcblxuLy8gVHlwZS1zYWZlIGZ1bmN0aW9uIHRvIGdldCBDb2duaXRvIHVzZXIgZGF0YSAoaWYgZmV0Y2hlZClcbmV4cG9ydCBjb25zdCBnZXRDb2duaXRvVXNlciA9IChjOiBDb250ZXh0KTogYW55ID0+IHtcbiAgICBjb25zdCBjb2duaXRvVXNlciA9IGMuZ2V0KCdjb2duaXRvVXNlcicpO1xuXG4gICAgaWYgKCFjb2duaXRvVXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIENvZ25pdG8gdXNlciBkYXRhIGZvdW5kLiBNYWtlIHN1cmUgYXV0aE1pZGRsZXdhcmUgaXMgY2FsbGVkIHdpdGggZmV0Y2hDb2duaXRvVXNlcjogdHJ1ZScpO1xuICAgIH1cblxuICAgIHJldHVybiBjb2duaXRvVXNlcjtcbn07XG5cbi8vIEF1dGggbWlkZGxld2FyZSB0aGF0IHZhbGlkYXRlcyB0b2tlbiBhbmQgb3B0aW9uYWxseSBmZXRjaGVzIHVzZXIgZnJvbSBDb2duaXRvXG5leHBvcnQgY29uc3QgYXV0aE1pZGRsZXdhcmUgPSAob3B0aW9uczogeyBmZXRjaENvZ25pdG9Vc2VyPzogYm9vbGVhbiB9ID0ge30pID0+IHtcbiAgICByZXR1cm4gYXN5bmMgKGM6IGFueSwgbmV4dDogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCB0b2tlbiA9IGdldFRva2VuKGMpO1xuXG4gICAgICAgICAgICBpZiAoIXRva2VuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgICAgIGNvZGU6IFwiTUlTU0lOR19BQ0NFU1NfVE9LRU5cIixcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJNaXNzaW5nIGFjY2VzcyB0b2tlblwiLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgcGF5bG9hZDogbnVsbFxuICAgICAgICAgICAgICAgIH0sIDQwMSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFZhbGlkYXRlIHRva2VuIHN0cnVjdHVyZSBhbmQgZXhwaXJhdGlvblxuICAgICAgICAgICAgY29uc3QgZGVjb2RlZFRva2VuID0gdmFsaWRhdGVUb2tlbih0b2tlbik7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIHRva2VuIGFuZCBkZWNvZGVkIGluZm8gaW4gY29udGV4dFxuICAgICAgICAgICAgYy5zZXQoJ2FjY2Vzc1Rva2VuJywgdG9rZW4pO1xuICAgICAgICAgICAgYy5zZXQoJ2RlY29kZWRUb2tlbicsIGRlY29kZWRUb2tlbik7XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHkgZmV0Y2ggZnVsbCB1c2VyIGRhdGEgZnJvbSBDb2duaXRvXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5mZXRjaENvZ25pdG9Vc2VyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdmZXRjaENvZ25pdG9Vc2VyIGlzIGVuYWJsZWQgYnV0IHVzaW5nIElEIHRva2VuLiBNb3N0IHVzZXIgZGF0YSBpcyBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgdG9rZW4uIENvbnNpZGVyIHVzaW5nIHRoZSBoZWxwZXIgZnVuY3Rpb25zIGluc3RlYWQuJyk7XG5cbiAgICAgICAgICAgICAgICAvLyBTa2lwIHRoZSBDb2duaXRvIEFQSSBjYWxsIHNpbmNlIHdlJ3JlIHVzaW5nIGFuIElEIHRva2VuXG4gICAgICAgICAgICAgICAgLy8gQWxsIHVzZXIgZGF0YSBpcyBhbHJlYWR5IGF2YWlsYWJsZSBpbiB0aGUgZGVjb2RlZCB0b2tlblxuICAgICAgICAgICAgICAgIC8vIFVzZSBnZXRVc2VyRmlyc3ROYW1lKCksIGdldFVzZXJMYXN0TmFtZSgpLCBnZXRVc2VyUm9sZSgpLCBldGMuIGluc3RlYWRcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbmV4dCgpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBdXRoIG1pZGRsZXdhcmUgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICAgICAgY29kZTogXCJBVVRIRU5USUNBVElPTl9GQUlMRURcIixcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdBdXRoZW50aWNhdGlvbiBmYWlsZWQnLFxuICAgICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgICAgIHBheWxvYWQ6IG51bGxcbiAgICAgICAgICAgIH0sIDQwMSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLy8gT3B0aW9uYWwgYXV0aCBtaWRkbGV3YXJlIC0gZG9lc24ndCBmYWlsIGlmIG5vIHRva2VuLCBqdXN0IHNldHMgdXNlciBpZiBhdmFpbGFibGVcbmV4cG9ydCBjb25zdCBvcHRpb25hbEF1dGhNaWRkbGV3YXJlID0gKCkgPT4ge1xuICAgIHJldHVybiBhc3luYyAoYzogYW55LCBuZXh0OiBhbnkpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHRva2VuID0gZ2V0VG9rZW4oYyk7XG5cbiAgICAgICAgICAgIGlmICh0b2tlbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRlY29kZWRUb2tlbiA9IHZhbGlkYXRlVG9rZW4odG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBjLnNldCgnYWNjZXNzVG9rZW4nLCB0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIGMuc2V0KCdkZWNvZGVkVG9rZW4nLCBkZWNvZGVkVG9rZW4pO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRva2VuIGV4aXN0cyBidXQgaXMgaW52YWxpZCAtIGp1c3QgY29udGludWUgd2l0aG91dCBzZXR0aW5nIHVzZXJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIHRva2VuIGluIG9wdGlvbmFsIGF1dGg6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgbmV4dCgpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBJbiBvcHRpb25hbCBhdXRoLCB3ZSBkb24ndCBmYWlsIC0ganVzdCBjb250aW51ZVxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdPcHRpb25hbCBhdXRoIG1pZGRsZXdhcmUgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgICAgYXdhaXQgbmV4dCgpO1xuICAgICAgICB9XG4gICAgfTtcbn07Il19