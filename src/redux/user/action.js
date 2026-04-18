import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to get customer subscription 
export const asyncGetCustomerSubscription = async () => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));

  const response = await fetch(`https://qapi.quickalgoplus.co.in/api/${API_ENDPOINTS?.GetCustomerSubscription}`, {
    method: "POST",
    headers: {
      authorization: `Z8K1Q4M7R2L9T6P3X5A0V2N8D1J7C4S9H3G6B5F2W8E0Y1U4R7O9T5M2K3L6P1N8`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      CustomerId: customerID,
      expInDays: 30,
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {}

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
  };
};

// Async action to get subscription expiry
export const asyncGetSubscriptionExpiry = async () => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetSubscriptionExpiry, {  // ✅ GET not POST
    params: { CustomerId: customerID },  // ✅ params not body
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });
  return response;
};

// Async action to get customer API key
export const asyncGetCustomerApiKey = async () => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetCustomerApiKey, {
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });
  return response;
};

// Async action to generate API key
export const asyncGenerateApiKey = async () => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GenerateApiKey, {
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });
  return response;
};