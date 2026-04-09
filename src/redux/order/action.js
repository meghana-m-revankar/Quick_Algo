import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";


// Async action to Create Order
export const asyncPostCreateOrder = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.PostCreateOrder,
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

// Async action to Create Order
export const asyncPostUpdateOrder = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.PostUpdateOrder,
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



// Unified async action to get order list by status
// sendData should contain status field: 'active', 'closed', 'rejected', 'pending'
export const asyncGetOrderList = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  
  const response = await axios.get(API_ENDPOINTS?.GetAllOrderList, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get active order (backward compatibility)
export const asyncGetOrderListActive = async (sendData) => {
  return await asyncGetOrderList({ ...sendData, orderType : 'active' });
};

// Async action to get day order clode
export const asyncGetDayOrderProfitLoss = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetdayorderProfitLoss, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get Closed order (backward compatibility)
export const asyncGetOrderListClosed = async (sendData) => {
  return await asyncGetOrderList({ ...sendData, orderType: 'closed' });
};

// Async action to get Rejected order (backward compatibility)
export const asyncGetOrderListRejected = async (sendData) => {
  return await asyncGetOrderList({ ...sendData, orderType: 'rejected' });
};

// Async action to get Pending order (backward compatibility)
export const asyncGetOrderListPending = async (sendData) => {
  return await asyncGetOrderList({ ...sendData, orderType: 'pending' });
};


// Async action to get Rejected order
export const asyncOrderExit = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.RoundoffOrders, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to get Broker Cash Available
export const asyncPostBrokerCashAvailable = async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.GetBrokerAvailableCash,
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