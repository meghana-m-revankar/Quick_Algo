import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to handle gets logs
export const asyncGetLogs = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getRecordsHistoricalList, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};
