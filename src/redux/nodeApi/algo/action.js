import axiosInstance from "#axiosInstance";
import { NODE_API_ENDPOINTS } from "#constant/endPoint";

export const asyncAddAlgoData = async ({ payload }) => {
  const response = await axiosInstance.post(
    NODE_API_ENDPOINTS.addAlgo,
    payload
  );
  return response;
};

export const asyncGetAlgoData = async ({ sendData } = {}) => {
  const response = await axiosInstance.get(NODE_API_ENDPOINTS.getAlgo, {
    params: sendData || { identifier: 1 },
  });
  return response;
};