import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

// Async action to get videos list
export const asyncGetVideosList = async () => {
  // Make the API call using axiosInstance
 

  const response = await axiosInstance.get(NODE_API_ENDPOINTS?.getVideosList);
  
  // Return the response data directly (success or failure response)
  return response;
};