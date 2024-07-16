class APIEndPoints {
  apiBaseUrl = "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com";
  apiStage = "dev";

  constructor() {}

  signinAPI() {
    const signin = `${this.apiBaseUrl}/${this.apiStage}/user-service/login`;

    return signin;
  }

  signupAPI() {
    const signup = `${this.apiBaseUrl}/${this.apiStage}/user-service/signup`;

    return signup;
  }

  profileAPI() {
    const profile = `${this.apiBaseUrl}/${this.apiStage}/user-service/profile`;

    return profile;
  }

  otpApi() {
    const otp = `${this.apiBaseUrl}/${this.apiStage}/user-service/verify-otp`;

    return otp;
  }

  applyForLeave() {
    const leaveApply = `${this.apiBaseUrl}/${this.apiStage}/lms/apply-leave`;

    return leaveApply;
  }

  editLeave() {
    const editLeave = `${this.apiBaseUrl}/${this.apiStage}/lms/edit-leave`;

    return editLeave;
  }

  approveLeave() {
    const approveLeave = `${this.apiBaseUrl}/${this.apiStage}/lms/updateleave`;

    return approveLeave;
  }

  getAllLeavesData() {
    const getLeaves = `${this.apiBaseUrl}/${this.apiStage}/lms/getleave`;

    return getLeaves;
  }
  getLeaveByID() {
    const getLeaveByID = `${this.apiBaseUrl}/${this.apiStage}/lms/getleave/by-id`;

    return getLeaveByID;
  }

  addNewEmployee() {
    const addNewEmployee = `${this.apiBaseUrl}/${this.apiStage}/user-service/invite-emp`;

    return addNewEmployee;
  }
  viewAllEmployees() {
    const viewAllEmployees = `${this.apiBaseUrl}/${this.apiStage}/user-service/employee`;

    return viewAllEmployees;
  }

  viewEmployeeByID() {
    const viewEmpByID = `${this.apiBaseUrl}/${this.apiStage}/user-service/employee/by-id`;

    return viewEmpByID;
  }

  forgotPassword() {
    const forgotPassword = `${this.apiBaseUrl}/${this.apiStage}/user-service/forgot-password`;

    return forgotPassword;
  }
  resetPassword() {
    const resetPassword = `${this.apiBaseUrl}/${this.apiStage}/user-service/reset-password`;

    return resetPassword;
  }
  uploadDocument() {
    const uploadDocument = `${this.apiBaseUrl}/${this.apiStage}/lms/upload`;

    return uploadDocument;
  }

  getPublicHolidayDates() {
    const getPublicHolidaysUrl = `${this.apiBaseUrl}/${this.apiStage}/lms/upload`;

    return getPublicHolidaysUrl;
  }
}
export default APIEndPoints;
