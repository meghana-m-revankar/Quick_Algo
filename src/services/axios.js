import axios from "axios";

const baseURL = process.env.REACT_APP_PRODUCTION_API_URL || "";

const instance = axios.create({
  baseURL,
});

instance.interceptors.request.use((config) => {
  const customerID = localStorage.getItem("customerID");
  const token = localStorage.getItem("tokenID");

  config.headers = config.headers || {};
  config.headers["Content-Type"] = "application/json";

  if (customerID && token) {
    config.headers["Authorization"] = `${customerID}:${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;