import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

// Async action to fetch news list
export const asyncGetNewsList = async ({ page = 1, category_id = null, limit = 10 }) => {
    // Make the API call using axiosInstance
    const params = {
        page,
        limit,
    };

    if (category_id && category_id !== "all") {
        params.category_id = category_id;
    }

    const response = await axiosInstance.get(NODE_API_ENDPOINTS?.getNewsList, { params });
    
    // Return the response data directly (success or failure response)
    return response;
};

// Async action to fetch news by category
export const asyncGetNewsByCategory = async ({ category_id, page = 1, limit = 10 }) => {
    // Make the API call using axiosInstance
    const params = {
        page,
        limit,
        category_id
    };

    const response = await axiosInstance.get(NODE_API_ENDPOINTS?.getNewsList, { params });
    
    // Return the response data directly (success or failure response)
    return response;
};

// Async action to fetch news detail by ID
export const asyncGetNewsDetail = async ({ id }) => {
    // Make the API call using axiosInstance
    const response = await axiosInstance.get(`${NODE_API_ENDPOINTS?.getNewsDetail}/${id}`);
    
    // Return the response data directly (success or failure response)
    return response;
};
