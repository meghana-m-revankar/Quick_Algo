import axios from "#axios";
import { API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";

// Async action to handle user login
export const asyncGetHeaderSymbols = async () => {
  const token = localStorage.getItem("tokenID");
  const customerID = localStorage.getItem("customerID");

  const response = await axios.get(API_ENDPOINTS?.GetHeaderSymbols, {
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });

  return response;
};

// Async action to Get Top Gainers
export const asyncGetTopGainers = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getTopGainer, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to Get Top Gainers
export const asyncGetTopLosers = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getTopLooser, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to Watchlist symbol
export const asyncGetWatchListByUserId = async ({ sendData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetWatchListByUserId, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to option symbol expiry list
export const asyncGetSymbolExpiryList = async ({ sendData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getoptionexpiryList, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to option symbol expiry list
export const asyncGetCustBrokerConfig = async ({ sendData }) => {
  const token = localStorage.getItem("tokenID");
  const customerID = localStorage.getItem("customerID");

  const response = await axios.get(API_ENDPOINTS?.GetCustBrokerConfig, {
    headers: {
      authorization: `${customerID}:${token}`,
      "Content-Type": "application/json",
    },
  });

  return response;
};

// Async action to symbol lot size
export const asyncGetLotSizeBysymbol = async ({ sendData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getLotsizeBysymbol, {
    params: sendData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to symbol category
export const asyncGetSymbolCategory = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetSymbolcat, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to symbol category
export const asyncGetSymbolCategoryAll = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetSymbolcatAll, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};

// Async action to symbol category
export const asyncGetSymbolCategoryList = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetSymbolCatogeryList, {
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
}; 


// Async action to symbol category By Customer ID
export const asyncGetSymbolIdentifierByCustomerID = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(
    API_ENDPOINTS?.SymbolIdentifierByCustomerID,
    {
      params: sendData,
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );
  // Return the response data directly (success or failure response)
  return response;
};


// Async action to symbol  By category ID
export const asyncGetSymbolIdentifierByCategory = async (sendData) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(
    API_ENDPOINTS?.GetSymbolIdentifierByCategory,
    {
      params: sendData,
      headers: {
        authorization: `${customerID}:${token}`, // Add the Authorization header
        "Content-Type": "application/json",
      },
    }
  );
  // Return the response data directly (success or failure response)
  return response;
};



// Async action to get signal format
export const asyncGetSignalFormat= async ({ formData }) => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.post(
    API_ENDPOINTS?.GetSignalFormat,
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

// Async action to get MCX symbols
export const asyncGetMCXSymbols = async () => {
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.GetSymbolIdentifierByCategory, {
    params: { categoryID: 3 }, // MCX category ID is 3 as seen in algo.js
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};



