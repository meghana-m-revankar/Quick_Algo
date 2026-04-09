import axiosInstance from "#services/axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

export const asyncGetDashboardData = async (params = {}) => {
  try {

    const response = await axiosInstance.get(
      `${NODE_API_ENDPOINTS?.getDashboardData}`
    );

    return response;
  } catch (error) {
    throw error;
  }
};
