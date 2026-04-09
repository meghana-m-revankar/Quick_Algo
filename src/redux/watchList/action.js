import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to symbol category
export const asyncGetGetWatchListByUserId = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(
    API_ENDPOINTS?.GetWatchListByUserId,
    {
      params: sendData,
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );
  // Return the response data directly (success or failure response)
  return response;
};



// Async action to Add WatchList
export const asyncAddWatchList = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.AddWatchList,
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

