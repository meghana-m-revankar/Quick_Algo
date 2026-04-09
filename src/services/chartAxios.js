import axios from "axios";
import Storage from "./storage";

const ReactAppUrl = process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT;

// Create axios instance with the dynamic base URL
const instance = axios.create({
  baseURL: ReactAppUrl,
});

instance.defaults.headers.common["Content-Type"] = "application/json";

// Request interceptor to add chart token (cusToken)
instance.interceptors.request.use((config) => {
  // Get cusToken from localStorage (customer token for reactchart)
  const cusToken = Storage.decryptData(localStorage.getItem("cusToken"));
  
  // Fallback to static token if cusToken is not available (for backward compatibility)
  const { REACT_APP_CHART_SECRET_TOKEN } = process.env;
  const token = cusToken || REACT_APP_CHART_SECRET_TOKEN;
  
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return config;
});


export default instance;
