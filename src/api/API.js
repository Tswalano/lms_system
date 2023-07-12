import axios from "axios";

export const signIn = async (endpoint, formValues, logIn) => {
  try {
    const response = await axios.post(endpoint, formValues);

    // do something if successful

    if (response.status === 200) {
      const userToken = response.data.token;
      const userRole = response.data.user.role;
      logIn(userToken, userRole);
    }

    return; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    if (error.response.status === 401 || error.response.status === 400) {
      console.log(error.response.data.message);
    }
  }
};
