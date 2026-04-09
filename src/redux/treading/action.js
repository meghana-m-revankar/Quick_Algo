import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to get signal format
export const asyncPostStrategyBuilder = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.PostTrendStrategyData,
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
