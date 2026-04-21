import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  return {
    authorization: `${customerID}:${token}`,
    "Content-Type": "application/json",
  };
};

// Async action to Create Order
export const asyncPostCreateOrder = async ({ formData }) => {
  const response = await axios.post(
    API_ENDPOINTS?.PostCreateOrder,
    { ...formData },
    { headers: getAuthHeaders() }
  );
  return response;
};

// Async action to Update Order
export const asyncPostUpdateOrder = async ({ formData }) => {
  const response = await axios.post(
    API_ENDPOINTS?.PostUpdateOrder,
    { ...formData },
    { headers: getAuthHeaders() }
  );
  return response;
};

// ✅ Active Orders - uses GetOrderListActive
export const asyncGetOrderListActive = async (sendData) => {
  const response = await axios.get(API_ENDPOINTS?.GetOrderListActive, {
    params: {
      AutoOrder: sendData?.AutoOrder ?? 0,
      indentifier: sendData?.indentifier ?? "",
      Pl: sendData?.Pl ?? 0,
      CategoryId: sendData?.CategoryId ?? 0,
    },
    headers: getAuthHeaders(),
  });
  return response;
};

// ✅ Closed Orders - uses GetOrderListClosed
export const asyncGetOrderListClosed = async (sendData) => {
  const response = await axios.get(API_ENDPOINTS?.GetOrderListClosed, {
    params: {
      AutoOrder: sendData?.AutoOrder ?? 0,
      indentifier: sendData?.indentifier ?? "",
      Pl: sendData?.Pl ?? 0,
      CategoryId: sendData?.CategoryId ?? 0,
    },
    headers: getAuthHeaders(),
  });
  return response;
};

// ✅ Pending Orders - uses GetOrderListPending
export const asyncGetOrderListPending = async (sendData) => {
  const response = await axios.get(API_ENDPOINTS?.GetOrderListPending, {
    params: {
      AutoOrder: sendData?.AutoOrder ?? 0,
      indentifier: sendData?.indentifier ?? "",
      Pl: sendData?.Pl ?? 0,
      CategoryId: sendData?.CategoryId ?? 0,
    },
    headers: getAuthHeaders(),
  });
  return response;
};

// ✅ Rejected Orders - uses GetOrderListRejected
export const asyncGetOrderListRejected = async (sendData) => {
  const response = await axios.get(API_ENDPOINTS?.GetOrderListRejected, {
    params: {
      AutoOrder: sendData?.AutoOrder ?? 0,
      indentifier: sendData?.indentifier ?? "",
      Pl: sendData?.Pl ?? 0,
      CategoryId: sendData?.CategoryId ?? 0,
    },
    headers: getAuthHeaders(),
  });
  return response;
};

// Day Order P&L
export const asyncGetDayOrderProfitLoss = async () => {
  const response = await axios.get(API_ENDPOINTS?.GetdayorderProfitLoss, {
    headers: getAuthHeaders(),
  });
  return response;
};

// Order Exit
export const asyncOrderExit = async (sendData) => {
  const response = await axios.get(API_ENDPOINTS?.RoundoffOrders, {
    params: sendData,
    headers: getAuthHeaders(),
  });
  return response;
};

// Broker Cash Available
export const asyncPostBrokerCashAvailable = async ({ formData }) => {
  const response = await axios.post(
    API_ENDPOINTS?.GetBrokerAvailableCash,
    { ...formData },
    { headers: getAuthHeaders() }
  );
  return response;
};