import axios from "axios";
import {
  GenericResponse,
  ILoginResponse,
  AuthAPIResponse,
  AuthUserAPIResponse,
  CognitoAPIResponse,
  LeaveRequest,
  LeaveAPIResponse,
  LeaveType,
  LeaveAPIResponseUID,
  leaveStatus,
} from "./types";
import jwtDecode from "jwt-decode";

const BASE_URL = "https://vtiho5i399.execute-api.af-south-1.amazonaws.com/dev";

const authApi = axios.create({
  baseURL: BASE_URL,
  // withCredentials: true,
});

// authApi.defaults.headers.common['Content-Type'] = 'application/json';
// // add cors
// authApi.defaults.headers.common['Access-Control-Allow-Origin'] = '*';

// TODO add refresh token API
export const refreshAccessTokenFn = async () => {
  const response = await authApi.get<ILoginResponse>("auth/refresh");
  return response.data;
};

authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const errMessage = error.response.data.message as string;
    if (errMessage.includes("not logged in") && !originalRequest._retry) {
      originalRequest._retry = true;
      await refreshAccessTokenFn();
      return authApi(originalRequest);
    }
    if (error.response.data.message.includes("not refresh")) {
      document.location.href = "/signin";
    }
    if (
      error.response.data.message.includes("The incoming token has expired")
    ) {
      // TODO refresh token
      console.log("The incoming token has expired ");
    }
    // TODO: clear cookies
    return Promise.reject(error);
  }
);

export const loginUserFn = async (user: {
  username: string;
  password: string;
}) => {
  const response = await authApi.post<AuthAPIResponse>("sign-in", user);
  const { statusCode, body } = response.data;

  console.log("body", response);

  // TODO: refactor this
  if (statusCode !== 200) {
    throw new Error(
      JSON.stringify({
        message: body.message,
        code: body.code,
      })
    );
  }

  return response.data;
};

export const createUserFn = async (user: {
  firstName: string;
  lastName: string;
}) => {
  const response = await authApi.post<AuthAPIResponse>("sign-up", user);
  return response.data.body;
};

export const forgotPasswordFn = async (user: { email: string }) => {
  const response = await authApi.post<AuthAPIResponse>("forgot-password", {
    ...user,
    action: "FORGOT_PASSWORD",
  });
  return response.data.body;
};

export const confirmVerificationCodeFn = async (user: {
  newPassword: string;
  email: string;
  verificationCode: string;
}) => {
  const response = await authApi.post<AuthAPIResponse>("forgot-password", {
    ...user,
    action: "RESET_PASSWORD",
  });
  return response.data.body;
};

export const changePasswordFn = async (user: {
  oldPassword: string;
  newPassword: string;
  accessToken: string;
}) => {
  const response = await authApi.post<AuthAPIResponse>("forgot-password", {
    ...user,
    action: "CHANGE_PASSWORD",
  });
  return response.data.body;
};

export const forcePasswordChangeFn = async (user: {
  newPassword: string;
  email: string;
  session: string;
}) => {
  if (!user.email) {
    throw new Error("Email is required");
  }

  if (!user.session) {
    throw new Error("Session is required");
  }

  const response = await authApi.post<AuthAPIResponse>("forgot-password", {
    ...user,
    action: "FORCE_CHANGE_PASSWORD",
  });
  return response.data.body;
};

export const getMeFn = async (token: string, userId: string) => {
  const response = await authApi.post<AuthUserAPIResponse>(
    "get-user",
    {
      userId: userId,
      action: "GET_USER_BY_ID",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const getAllUsersFn = async (token: string) => {
  const response = await authApi.post<CognitoAPIResponse>(
    "get-user",
    {
      action: "GET_USERS",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.body;
};

// Leave API methods
export const getAllLeaveRequestsFn = async (token: string) => {
  const response = await authApi.get<LeaveAPIResponseUID>("get-all-leave-req", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response;
};

export const applyForLeaveFN = async (
  token: string,
  apply_leave: LeaveType
) => {
  const response = await authApi.post<LeaveAPIResponse>(
    "apply-for-leave",
    apply_leave,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.leaveData;
};

export const getAllLeaveRequestByUID = async (token: string) => {
  const decode = jwtDecode(token) as { "custom:userId": string };

  try {
    const response = await authApi.get<LeaveAPIResponseUID>(
      "get-all-leave-req",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data.leaveData);
    // Check if response.data and response.data.body are defined
    if (!response.data || !response.data || !response.data.leaveData) {
      throw new Error("Invalid response format: Missing leave data");
    }

    // Filter leave requests belonging to the user identified by decode.sub (UID)
    const userLeaveRequests = response.data.leaveData.filter(
      (leaveRequest) => leaveRequest.uid === decode["custom:userId"]
    );

    return {
      statusCode: 200,
      body: userLeaveRequests,
    };
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    throw new Error("Failed to fetch leave requests");
  }
};

export const updateLeaveStatusFn = async (
  token: string,
  leaveStatus: leaveStatus
) => {
  const response = await authApi.post<LeaveAPIResponse>(
    "update-leave-status",
    leaveStatus,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.leaveData;
};

export const getPublicHolidayDatesFn = async (
  token: string,
  start: Date | undefined = undefined,
  end: Date | undefined = undefined
): Promise<string[]> => {
  try {
    const options = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    const response = await authApi.get<string[]>("public-holidays", options);

    return Promise.resolve(response.data);
  } catch (apiError) {
    const newError = new Error("Failed to get public holidays from API", {
      cause: apiError,
    });
    return Promise.reject(newError);
  }
};
