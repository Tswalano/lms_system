class APIEndPoints {
  constructor() {}

  signinAPI() {
    const signin =
      "https://11qegqaxid.execute-api.us-east-1.amazonaws.com/dev/user-service/login";
    return signin;
  }

  signupAPI() {
    const signup =
      "https://11qegqaxid.execute-api.us-east-1.amazonaws.com/dev/user-service/signup";
    return signup;
  }

  profileAPI() {
    const profile =
      "https://11qegqaxid.execute-api.us-east-1.amazonaws.com/dev/user-service/profile/";
    return profile;
  }

  otpApi() {
    const otp =
      "https://11qegqaxid.execute-api.us-east-1.amazonaws.com/dev/user-service/verify-otp";
    return otp;
  }
}
export default APIEndPoints;
