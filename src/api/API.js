import axios from "axios";

export const signIn = async (endpoint, formValues) => {
  try {
    const response = await axios.post(endpoint, formValues);

    // do something if successful
    sessionStorage.setItem("token", response.data.token);
    if (response.status === 200) {
      console.log(response.data.pmessage);
    }

    return; // Exit the function if successful
  } catch (error) {
    // do something if there is an error
    if (error.response.status === 401 || error.response.status === 400) {
      console.log(error.response.data.message);
    }
  }
};
