import { API_ENDPOINTS } from "#constant/endPoint";
import axios from "#axios";
import Storage from "#services/storage";

// Async action to PUT List
export const asyncGetOptionListPE = async ({formData}) => {
 
   
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getoptionlistPE, {
    params : formData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};


// Async action to PUT List
export const asyncGetOptionListCE = async ({formData}) => {
 
   
  // Make the API call and directly return the response without error handling
  const token = Storage.decryptData(localStorage.getItem("tokenID"));
  const customerID = Storage.decryptData(localStorage.getItem("customerID"));
  const response = await axios.get(API_ENDPOINTS?.getoptionlistCE, {
    params : formData,
    headers: {
      authorization: `${customerID}:${token}`, // Add the Authorization header
      "Content-Type": "application/json",
    },
  });
  // Return the response data directly (success or failure response)
  return response;
};