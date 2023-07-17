import axios from "axios";

//API to sign user/admin into the page
export const signIn = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);
    return response.data;

    // return true; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    if (error.response.status === 401 || error.response.status === 400) {
      console.log(error.response.data.message);
    }
    return false;
  }
};
//To post data from signUp and Verify page
export const signUpAndVerify = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);

    // do something if successful

    if (response.status === 200) {
      return true;
    }

    return; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    if (
      error.response.status === 401 ||
      error.response.status === 400 ||
      error.response.status === 500
    ) {
      console.log(error.response.data.message);
      return false;
    }
  }
};

//To post data that require tokens
export const postData = async (endpoint, formValues, token) => {
  try {
    if (token !== null) {
      try {
        const response = axios.post(endpoint, formValues, {
          headers: { Authorization: "Bearer " + token },
        });
        if (response.status === 200) {
          console.log(response.data.pmessage);
          return true;
        }
      } catch (error) {
        // do something if there is an error
        if (
          error.response.status === 401 ||
          error.response.status === 400 ||
          error.response.status === 404 ||
          error.response.status === 500
        ) {
          return false;
        }
      }
    } else {
      console.log("token Invalid");
    }
  } catch (e) {
    console.log(e);
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
          return false;
        }
      }
    } else {
      console.log("token Invalid");
    }
  } catch (e) {
    console.log(e);
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
      console.log(error);
      // do something if there is an error
      if (
        error.response.status === 401 ||
        error.response.status === 400 ||
        error.response.status === 404 ||
        error.response.status === 500
      ) {
        return false;
      }
    }
  } catch (error) {
    console.log(error);
  }
};

//API Method for getting data (GET)
export const getData = async (endpoint, token) => {
  try {
    const response = await axios.get(endpoint, {
      headers: { Authorization: "Bearer " + token },
    });
    try {
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.log(error);
      // do something if there is an error
      if (
        error.response.status === 401 ||
        error.response.status === 400 ||
        error.response.status === 404 ||
        error.response.status === 500
      ) {
        return false;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
