class APIEndPoints {
  constructor() {}

  signinAPI() {
    const signin =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/login";
    return signin;
  }

  signupAPI() {
    const signup =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/signup";
    return signup;
  }

  profileAPI() {
    const profile =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/profile";
    return profile;
  }

  otpApi() {
    const otp =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/verify-otp";
    return otp;
  }

  applyForLeave() {
    const leaveApply =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/lms/apply-leave";
    return leaveApply;
  }

  approveLeave() {
    const approveLeave =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/lms/updateleave";
    return approveLeave;
  }

  getAllLeavesData() {
    const getLeaves =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/lms/getleave";
    return getLeaves;
  }
  getLeaveByID() {
    const getLeaveByID =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/lms/getleave/by-id";
    return getLeaveByID;
  }

  addNewEmployee() {
    const addNewEmployee =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/invite-emp";
    return addNewEmployee;
  }
  viewAllEmployees() {
    const viewAllEmployees =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/employee";
    return viewAllEmployees;
  }

  viewEmployeeByID() {
    const viewEmpByID =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/employee/by-id";
    return viewEmpByID;
  }

  forgotPassword() {
    const forgotPassword =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/forgot-password";
    return forgotPassword;
  }
  resetPassword() {
    const resetPassword =
      "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/dev/user-service/reset-password";
    return resetPassword;
  }
}
export default APIEndPoints;
