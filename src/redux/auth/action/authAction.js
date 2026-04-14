import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
// Async action to handle user login
export const asyncUserLogin = async ({formData}) => {
  try {
    // Login to ASP.NET API (existing functionality)
    const response = await axios.post(API_ENDPOINTS?.CustGetLogin, { ...formData });

    // Return original response (no change to existing flow)
    return response;
  } catch (error) {
    throw error;
  }
};
console.log("axios baseURL:", axios.defaults.baseURL);
// Async action to handle mobile login with OTP
export const asyncCustLoginWithMobile = async ({formData}) => {
  try {
    // Mobile login API call
    const response = await axios.post(API_ENDPOINTS?.CustLoginWithMobile, { ...formData });
    return response;
  } catch (error) {
    throw error;
  }
};
export const asyncUserVerifyOtp = async (formData) => {
  const url =
    `${API_ENDPOINTS?.CustVerifyOTP}` +
    `?CustomerID=${formData.CustomerID}` +
    `&&otp=${formData.otp}` +
    `&&ipAddress=${formData.ipAddress}` +
    `&&Device=${formData.Device}`;

  return axios.get(url);
};

export const asyncGetCustomerKycStatus = async ({ customerID, tokenID }) => {
  const response = await axios.get("GetCustomerKycStatus", {
    params: {
      customerId: customerID,  // numeric 69561
    },
    headers: {
      Authorization: `${customerID}:${tokenID}`,
      "Content-type": "application/json",
    }
  });
  return response;
};
// Async action to handle user login
export const asyncUserSignup =  async ({formData}) => {
  // Make the API call and directly return the response without error handling
  const response = await axios.post(API_ENDPOINTS?.CustSaveSignup, { ...formData });

  // Return the response data directly (success or failure response)
  return response;
};
 
// Async action to handle user login
export const asyncCustForgotpassword =  async ({formData}) => {
  // Make the API call and directly return the response without error handling
  const response = await axios.post(API_ENDPOINTS?.CustForgotpassword, { ...formData });

  // Return the response data directly (success or failure response)
  return response;
};
