import axios from "axios";
import Storage from "./storage";
import AuthService from "./authService";

let ReactAppUrl;

ReactAppUrl = process.env.REACT_APP_PRODUCTION_API_URL;

// Create axios instance with the dynamic base URL
const instance = axios.create({
  baseURL: ReactAppUrl,
});

// Set default content type for requests
// instance.defaults.headers.common["content-type"] = "multipart/form-data";

instance.defaults.headers.common["Content-Type"] = "application/json"; // Default content type (JSON)

// Request interceptor to add authentication tokens to headers
instance.interceptors.request.use((config) => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));

  if (token && customerID) {
    // Add Authorization header with customerID:token format
    config.headers["authorization"] = `${customerID}:${token}`;
  }

  // Track API call as user activity
  AuthService.trackApiActivity();

  return config;
});

// Response interceptor to handle authentication errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error);
    if (error.response?.status === 401) {
      // Clear authentication data and redirect to login
      // localStorage.removeItem("customerID");
      // localStorage.removeItem("tokenID");
      // localStorage.removeItem("UserName");
      // localStorage.removeItem("loginTime");
      
      // // Redirect to login page
      // window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default instance;
