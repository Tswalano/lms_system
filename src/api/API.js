import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const signIn = async (endpoint, formValues, logIn) => {
  try {
    const response = await axios.post(endpoint, formValues);

    // do something if successful

    if (response.status === 200) {
      const userToken = response.data.token;
      const userRole = response.data.user.role;
      logIn(userToken, userRole);
      console.log(response.data.token);
    }

    return true; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    if (error.response.status === 401 || error.response.status === 400) {
      console.log(error.response.data.message);
    }
    return false;
  }
};

export const signUpAndVerify = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);

    // do something if successful

    if (response.status === 200) {
      console.log(response.data);
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

//In both these methods create a return variable to return messages or success or errors
export const postData = async (endpoint, formValues, token) => {
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
        error.response.status === 404
      ) {
        console.log(error.response.data.message);
        return false;
      }
    }
  } else {
    console.log("token Invalid");
  }
};
