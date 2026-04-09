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


// Async action to handle user login
export const asyncUserVerifyOtp =  async (formData) => {
  // Make the API call and directly return the response without error handling
  const response = await axios.post(API_ENDPOINTS?.CustVerifyOTP, { ...formData });// -- stage
  // const response = await axios.get(API_ENDPOINTS?.CustVerifyOTP, { params : formData });  
  // Return the response data directly (success or failure response)
  return response;
};


// Async action to handle user login
export const asyncGetCustomerKycStatus =  async ({formData,customerID,tokenID}) => {
 
  // Make the API call and directly return the response without error handling
  const response = await axios.post(API_ENDPOINTS?.GetCustomerKycStatus, { ...formData }, {
    headers: {
      authorization: `${customerID}:${tokenID}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
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
