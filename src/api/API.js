import axios from "axios";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const login = async (endPoint, credentials) => {
  try {
    /*const response = await axios.post("/api/login", { username, password });
      const token = response.data.token;
      // Store the token in local storage or state, or use it as needed
      return token;*/
    //console.log(endPoint, credentials);

    axios.post(endPoint, credentials).then((response) => {
      console.log(response);
    });
    //
  } catch (response) {
    //console.error("Error logging in:", error);

    //await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    console.log(response);

    /*if (error.response.status === 400) {
      //
      sessionStorage.setItem("isAuthenticated", false);
      alert(error.response.data.message);
    }
    if (error.response.status === 401) {
      //
      sessionStorage.setItem("isAuthenticated", false);
      alert(error.response.data.message);
    }
    if (error.response.status === 404) {
      //
      sessionStorage.setItem("isAuthenticated", false);
      alert(error.response.data.message);
    }
    if (error.response.status === 400) {
      //
      sessionStorage.setItem("isAuthenticated", false);
      alert(error.response.data.message);
    }*/
  }
};

export const postFormData = async (formValues, endpoint, token) => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.post(endpoint, formValues, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error posting form data:", error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries exceeded");
};

/*export const postFormData = async (formValues, endpoint) => {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const response = await axios.post(endpoint, formValues);
      return response.data;
    } catch (error) {
      console.error("Error posting form data:", error);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
  throw new Error("Max retries exceeded");
};*/
