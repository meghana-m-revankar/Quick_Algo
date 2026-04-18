import axios from "axios";

const baseURL = process.env.REACT_APP_PRODUCTION_API_URL || "";

const instance = axios.create({
  baseURL,
  timeout: 15000,
});

// ✅ REQUEST INTERCEPTOR
instance.interceptors.request.use((config) => {
  const customerID = localStorage.getItem("customerID");
  const token = localStorage.getItem("tokenID");

  config.headers = config.headers || {};
  config.headers["Content-Type"] = "application/json";

  // 🔥 FINAL FIX: detect Node API properly
  const isNodeAPI =
    config.baseURL?.includes("quickalgoplus.co.in") ||
    config.url?.includes("algo") ||
    config.url?.includes("strategy") ||
    config.url?.includes("api/");

  if (isNodeAPI) {
    // ✅ Node API → Bearer token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    delete config.headers["authorization"];
  } else {
    // ✅ Old API → customerID:token
    if (customerID && token) {
      config.headers["authorization"] = `${customerID}:${token}`;
    }
    delete config.headers["Authorization"];
  }

  return config;
});

// ✅ RESPONSE INTERCEPTOR
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.clear();

      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    if (status === 400) {
      console.error("BAD REQUEST:", error.response?.data);
    }

    if (status === 403) {
      console.error("FORBIDDEN:", error.response?.data);
    }

    return Promise.reject(error);
  }
);

export default instance;