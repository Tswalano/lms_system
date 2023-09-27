class APIEndPoints {
  constructor() {}

  signinAPI() {
    const signin =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/login";
    return signin;
  }

  signupAPI() {
    const signup =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/signup";
    return signup;
  }

  profileAPI() {
    const profile =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/profile";
    return profile;
  }

  otpApi() {
    const otp =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/verify-otp";
    return otp;
  }

  applyForLeave() {
    const leaveApply =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/lms/apply-leave";
    return leaveApply;
  }

  approveLeave() {
    const approveLeave =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/lms/updateleave";
    return approveLeave;
  }

  getAllLeavesData() {
    const getLeaves =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/lms/getleave";
    return getLeaves;
  }
  getLeaveByID() {
    const getLeaveByID =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/lms/getleave/by-id";
    return getLeaveByID;
  }

  addNewEmployee() {
    const addNewEmployee =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/invite-emp";
    return addNewEmployee;
  }
  viewAllEmployees() {
    const viewAllEmployees =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/employee";
    return viewAllEmployees;
  }

  viewEmployeeByID() {
    const viewEmpByID =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/employee/by-id";
    return viewEmpByID;
  }

  forgotPassword() {
    const forgotPassword =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/forgot-password";
    return forgotPassword;
  }
  resetPassword() {
    const resetPassword =
      "https://xn2i4oyr8b.execute-api.us-west-2.amazonaws.com/dev/user-service/reset-password";
    return resetPassword;
  }
}
export default APIEndPoints;
