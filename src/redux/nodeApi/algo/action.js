import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";
import Cookies from "js-cookie";

// Async action to add algo data
export const asyncAddAlgoData = async ({ formData }) => {
  const token = Cookies.get("authToken");
  
  const response = await axiosInstance.post(
    NODE_API_ENDPOINTS?.addAlgo,
    { ...formData },
    
  );

  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get algo data
export const asyncGetAlgoData = async ({ sendData }) => {
  const token = Cookies.get("authToken");
  
  const response = await axiosInstance.get(NODE_API_ENDPOINTS?.getAlgo, {
    params: sendData,
  });

  // Return the response data directly (success or failure response)
  return response;
};
