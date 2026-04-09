import axios from "axios";
import Storage from "./storage";
import AuthService from "./authService";

let ReactAppUrl;

if (process.env.REACT_APP_ENV === "production") {
  ReactAppUrl = process.env.REACT_APP_PRODUCTION_NODE_API_URL;
} else {
  ReactAppUrl =  process.env.REACT_APP_NODE_API_URL
}

// Create axios instance with the dynamic base URL
const instance = axios.create({
  baseURL: ReactAppUrl,
  withCredentials: true, // Enable cookies
});

instance.defaults.headers.common["Content-Type"] = "application/json";

// Request interceptor to add Node.js token
instance.interceptors.request.use((config) => {
  // Try to get token from localStorage first
  let token = Storage.decryptData(localStorage.getItem("nodeToken"));
  
  // If no token in localStorage, try to get from cookies
  if (!token) {
    // You can access cookies here if needed
    // token = getCookie('nodeAuthToken');
  }
  
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  } else {
  }
  
  // Track API call as user activity
  AuthService.trackApiActivity();
  
  return config;
});

// Response interceptor to handle auth errors
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear Node.js tokens only
      AuthService.clearNodeTokens();
      
      // Don't redirect - let ASP.NET handle the main logout
    }
    return Promise.reject(error);
  }
);

export default instance;
