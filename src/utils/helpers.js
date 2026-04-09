import toast from "react-hot-toast";
import {
  errorMsgStyle,
  successMsgStyle,
  warningMsgStyle,
} from "../data/jsonData";
import { resolveTime, toastLoading } from "#constant/index";

const importAll = (r) => {
  let images = {};
  r.keys().forEach((item) => {
    const path = item.replace("./", ""); // Remove "./" from path
    images[path] = r(item); // Store with folder structure
  });
  return images;
};
export const images = importAll(require.context("../assets/images", true));

//   Show Success message
export const successMsg = async (msg) => {
  const loadingToast = toast.loading(toastLoading, successMsgStyle);
  successMsgStyle.id = loadingToast;
  await new Promise((resolve) => {
    setTimeout(resolve, resolveTime);
  });
  toast.success(msg, successMsgStyle);
};

// Show error message (same red style everywhere - broker setup, createStrategy, etc.)
export const errorMsg = async (msg) => {
  const loadingToast = toast.loading(toastLoading, { ...errorMsgStyle });
  await new Promise((resolve) => setTimeout(resolve, resolveTime));
  toast.error(msg, { ...errorMsgStyle, id: loadingToast });
};

// Show Warning message
export const warningMsg = async (msg) => {
  toast.success(msg, warningMsgStyle);
};

// Check Login
export const checkLogin = () => {
  let status = false;

  // Check if 'accessToken' is present in sessionStorage
  if (localStorage.getItem("tokenID") && localStorage.getItem("customerID")) {
    status = true;
  }

  return status;
};

export const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      successMsg("Text Copied!");
    })
    .catch((err) => {});
};

export const convertNumeric = (val) => {
    if(!val)
    {
      val = 0
    }
  
  return parseFloat(parseFloat(val).toFixed(2));
};
