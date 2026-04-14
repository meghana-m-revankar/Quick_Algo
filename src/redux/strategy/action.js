import axios from "#axios";
import axiosInstance from "#axiosInstance";
import { API_ENDPOINTS, NODE_API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";
import Cookies from "js-cookie";
import chartAxios from "#services/chartAxios";


// Async action to handle get strategy list
export const asyncGetStrategyList = async () => {
  const token = localStorage.getItem("tokenID");
  const customerID = localStorage.getItem("customerID");

  const response = await axios.get(API_ENDPOINTS?.getStratergyList, {
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });

  return response;
};

// Async action to handle get strategy list 
export const asyncGetPlatforms = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetPlatforms, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to handle get strategy description
export const asyncGetStrategyDescription = async (strategy_id) => {
  // Make the API call and directly return the response without error handling
  const token = Cookies.get("authToken");
  

  
  const response = await axiosInstance.get(`${NODE_API_ENDPOINTS?.strategyDescription}/${strategy_id}`, {
    headers: {
      authorization: `Bearer ${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};



// Async action to handle get admin strategy
export const asyncGetAdminStrategy = async () => {

  const response = await chartAxios.get(`${NODE_API_ENDPOINTS?.getAdminStrategy}`);
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to handle get client strategy
export const asyncGetClientStrategy = async (customerId) => {
  const requestBody = customerId ? { CustomerId: customerId } : {};
  const response = await chartAxios.post(`${NODE_API_ENDPOINTS?.getClientStrategy}`, requestBody);
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to handle get active strategies
export const asyncGetActiveStrategies = async (params = {}) => {
  const requestBody = {};
  if (params.customerId) requestBody.CustomerId = params.customerId;
  if (params.companyId) requestBody.CompanyId = params.companyId;
  
  const response = await chartAxios.post(`${NODE_API_ENDPOINTS?.getActiveStrategies}`, requestBody);
  return response;
};

// Async action to handle get strategy details by ID (for client strategies)
export const asyncGetStrategyDetails = async (strategyId) => {
  const response = await chartAxios.get(`${NODE_API_ENDPOINTS?.getStrategyDetails}/${strategyId}`);
  return response;
};

// Async action to handle get admin strategy details by ID
export const asyncGetAdminStrategyDetails = async (strategyId) => {
  const response = await chartAxios.get(`${NODE_API_ENDPOINTS?.getAdminStrategyDetails}/${strategyId}`);
  return response;
};

// Async action to handle get strategy orders
export const asyncGetStrategyOrders = async (strategyId, processStrategyId = null) => {
  let url = '';
  if (processStrategyId) {
    url = `${NODE_API_ENDPOINTS?.getStrategyOrders}/execution/${processStrategyId}`;
  } else {
    url = `${NODE_API_ENDPOINTS?.getStrategyOrders}/${strategyId}`;
  }
  
  const response = await chartAxios.get(url);
  return response;
};

// Async action to deploy admin strategy to client
export const asyncDeployAdminStrategy = async (deployData) => {
  const response = await chartAxios.post(NODE_API_ENDPOINTS?.deployAdminStrategy, deployData);
  return response;
};

// Async action to update strategy broker (enable/disable)
export const asyncUpdateStrategyBroker = async (brokerData) => {
  const response = await chartAxios.post(NODE_API_ENDPOINTS?.updateStrategyBroker, brokerData);
  return response;
};

// Async action to stop strategy (temporary stop for today only)
export const asyncStopStrategy = async (strategyId) => {
  const response = await chartAxios.post(`${NODE_API_ENDPOINTS?.stopStrategy}/${strategyId}`);
  return response;
};