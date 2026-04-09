import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

// Async action to get help categories
export const asyncGetHelpCategories = async () => {
    const response = await axiosInstance.get(
            NODE_API_ENDPOINTS?.helpCategories
        );
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get help structure by category_id
export const asyncGetHelpStructure = async (category_id) => {
    const response = await axiosInstance.get(
            NODE_API_ENDPOINTS?.helpStructure,
        {
          params: {
            category_id: category_id
          }
        }
      );
  // Return the response data directly (success or failure response)
  return response;
};