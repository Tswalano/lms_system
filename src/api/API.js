import axios from "axios";

//API to sign user/admin into the page
export const signIn = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);
    return response.data;

    // return true; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    return error.response.data.message;
  }
};
//To post data from signUp and Verify page
export const signUpAndVerify = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);
    // do something if successful
    const responseData = {
      status: (await response).status,
      message: (await response).data.message,
    };
    return responseData;
    //}

    //return; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    const responseData = {
      status: (await error.response).status,
      message: (await error.response).data.message,
    };
    return responseData;
    //}
  }
};

//To post data that require tokens
export const postData = async (endpoint, formValues, token) => {
  try {
    const response = axios.post(endpoint, formValues, {
      headers: { Authorization: "Bearer " + token },
    });
    const responseData = {
      status: (await response).status,
      message: (await response).data.message,
    };
    return responseData;
  } catch (error) {
    // do something if there is an error
    const responseData = {
      status: (await error.response).status,
      message: (await error.response).data.message,
    };
    return responseData;
  }
};

export const postResponse = async (endpoint, formValues, token) => {
  try {
    const response = axios.post(endpoint, formValues, {
      headers: { Authorization: "Bearer " + token },
    });
    return response;
  } catch (error) {
    // do something if there is an error
    if (
      error.response.status === 401 ||
      error.response.status === 400 ||
      error.response.status === 404 ||
      error.response.status === 500
    ) {
      return error.response.data.message;
    }
  }
};

export const putData = async (endpoint, formValues, token) => {
  try {
    if (token !== null) {
      try {
        const response = await axios.put(endpoint, formValues, {
          headers: { Authorization: "Bearer " + token },
        });
        if (response.status === 200) {
          return response;
        }
      } catch (error) {
        // do something if there is an error
        if (
          error.response.status === 401 ||
          error.response.status === 400 ||
          error.response.status === 404 ||
          error.response.status === 500
        ) {
          return error;
        }
      }
    } else {
      return "Token Invalid";
    }
  } catch (error) {
    return error.response.data.message;
  }
};

export const getDataByID = async (endpoint, id, token) => {
  try {
    const response = await axios.post(endpoint, id, {
      headers: { Authorization: "Bearer " + token },
    });
    try {
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      // do something if there is an error
      if (
        error.response.status === 401 ||
        error.response.status === 400 ||
        error.response.status === 404 ||
        error.response.status === 500
      ) {
        return error.response.data.message;
      }
    }
  } catch (error) {
    return error;
  }
};

//API Method for getting data (GET)
export const getData = async (endpoint, token) => {
  try {
    const response = await axios.get(endpoint, {
      headers: { Authorization: "Bearer " + token },
    });
    try {
      return response.data;
    } catch (error) {
      // do something if there is an error
      if (
        error.response.status === 401 ||
        error.response.status === 400 ||
        error.response.status === 404 ||
        error.response.status === 500
      ) {
        return error.response.data.message;
      }
    }
  } catch (error) {
    return error;
  }
};
