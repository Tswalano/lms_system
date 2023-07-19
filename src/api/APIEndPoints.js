class APIEndPoints {
  constructor() {}

  signinAPI() {
    const signin =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/user-service/login";
    return signin;
  }

  signupAPI() {
    const signup =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/user-service/signup";
    return signup;
  }

  profileAPI() {
    const profile =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/user-service/profile";
    return profile;
  }

  otpApi() {
    const otp =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/user-service/verify-otp";
    return otp;
  }

  applyForLeave() {
    const leaveApply =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/lms/apply-leave";
    return leaveApply;
  }

  getAllLeavesData() {
    const getLeaves =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/lms/getleave";
    return getLeaves;
  }
  getLeaveByID() {
    const getLeaveByID =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/lms/getleave/by-id";
    return getLeaveByID;
  }

  addNewEmployee() {
    const addNewEmployee =
      "https://wvyxktkf2k.execute-api.us-east-2.amazonaws.com/dev/user-service/invite-emp";
    return addNewEmployee;
  }
}
export default APIEndPoints;
