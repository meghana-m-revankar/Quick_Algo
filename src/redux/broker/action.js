import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to handle user login
export const asyncGetBrokerMaster = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetBokerMaster, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to handle user login
export const asyncGetCustBrokerConfigByID = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetCustBrokerConfigByID, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to Add Broker
export const asyncPostCustBrokerConfig = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.PostCustBrokerConfig,
    { ...formData },
    {
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );

  // Return the response data directly (success or failure response)
  return response;
};


// Async action to save broker totp
export const asyncPostChoiceBrokerLogin = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.ChoiceBrokerLogin,
    { ...formData },
    {
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );

  // Return the response data directly (success or failure response)
  return response;
};


// / Async action to Submit OTP
export const asyncVerifyOTP = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.VerifyKotakUserOtp, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};



// Async action to save broker totp
export const asyncPostCustBrokerStatus = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.PostCustBrokerStatus,
    { ...formData },
    {
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );

  // Return the response data directly (success or failure response)
  return response;
};

// Dhan Broker Test Connection APIs
// Step 1: Generate Consent
export const asyncDhanGenerateConsent = async ({ dhanClientId, apiKey, secretKey }) => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.GenerateConsent,
    {
      DhanClientId: dhanClientId,
      ApiKey: apiKey,
      ApiSecret: secretKey
    },
    {
      headers: {
        authorization: `${customerID}:${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
};

// Step 3: Consume Consent
export const asyncDhanConsumeConsent = async ({ tokenId, apiKey, secretKey }) => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.ConsumeConsent,
    {
      TokenId: tokenId,
      ApiKey: apiKey,
      ApiSecret: secretKey
    },
    {
      headers: {
        authorization: `${customerID}:${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response;
};