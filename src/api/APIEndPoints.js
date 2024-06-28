class APIEndPoints {

  constructor() {
    // Check if NODE_ENV environment variable is set to 'production'
    if (process.env.NODE_ENV === 'production') {
      this.baseURL = "https://e08o1ifxrk.execute-api.eu-west-1.amazonaws.com/prod";
    } else {
      // Default to development URL if NODE_ENV is not 'production'
      this.baseURL = "https://vtiho5i399.execute-api.af-south-1.amazonaws.com/dev";
    }
  }

  get signinAPI() {
    return `${this.baseURL}/signin`;
  }

  get signupAPI() {
    return `${this.baseURL}/signup`;
  }

  get profileAPI() {
    return `${this.baseURL}/profile`;
  }

  get otpApi() {
    return `${this.baseURL}/verify-otp`;
  }

  get applyForLeave() {
    return `${this.baseURL}/apply-leave`;
  }

  get editLeave() {
    return `${this.baseURL}/edit-leave`;
  }

  get approveLeave() {
    return `${this.baseURL}/updateleave`;
  }

  get getAllLeavesData() {
    return `${this.baseURL}/getleave`;
  }

  get getLeaveByID() {
    return `${this.baseURL}/getleave/by-id`;
  }

  get addNewEmployee() {
    return `${this.baseURL}/invite-emp`;
  }

  get viewAllEmployees() {
    return `${this.baseURL}/employee`;
  }

  get viewEmployeeByID() {
    return `${this.baseURL}/employee/by-id`;
  }

  get forgotPassword() {
    return `${this.baseURL}/forgot-password`;
  }

  get resetPassword() {
    return `${this.baseURL}/reset-password`;
  }

  get uploadDocument() {
    return `${this.baseURL}/upload`;
  }
}

export default APIEndPoints;
