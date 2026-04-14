import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import platform from "platform";
import Joi from "joi";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import { getKycLatest } from "#services/kycService"; // adjust path

import {
  asyncGetCustomerKycStatus,
  asyncUserVerifyOtp,
  asyncUserLogin,
 // asyncCustLoginWithMobile,
} from "#redux/auth/action/authAction.js";
import { errorMsg, successMsg } from "#helpers";
import { userLoginSuccess } from "#redux/auth/slice/authSlice.js";
import useTimer from "#hooks/useTimer";
//import AuthService from "#services/authService";

const UserOtp = () => {
  const location = useLocation();
  const { customerID, resCustomerID, loginMode, loginFormData } = location.state || {};

  const navigate = useNavigate();
  const { companyDetails } = useSelector((state) => state.companyDetails);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const isResendingRef = useRef(false);
  const { timeLeft, isRunning, startTimer } = useTimer(30);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    CustomerId: "",
    ipAddress: localStorage.getItem("ipv4"),
    OTP: "",
    Device: platform.name,
  });

  useEffect(() => {
    if (resCustomerID) {
      setFormData((prev) => ({ ...prev, CustomerId: resCustomerID }));
    }
  }, [resCustomerID]);

  useEffect(() => {
    if (!location.state) navigate("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleShowTermsModal = () => setShowTermsModal(true);

  // ✅ DEFINED FIRST — before handleSubmit uses it
const GetCustomerKycStatus1 = (numericCustomerID, tokenID) => {
  asyncGetCustomerKycStatus({ 
    customerID: numericCustomerID,  // 69561
    tokenID                          // ← now passed correctly
  })
    .then((result) => {
      if (result?.data?.result?.isKYCRequired) {
        window.location.href = companyDetails?.kYC_URL;
      } else {
        navigate("/dashboard");
      }
    })
    .catch(() => navigate("/dashboard"));
};
const GetCustomerKycStatus = (numericCustomerID, tokenID) => {
  getKycLatest(
    companyDetails?.companyID || 1,
    customerID
  )
    .then((result) => {
      if (result?.result?.isKYCRequired || result?.isKYCRequired) {
        window.location.href = companyDetails?.kYC_URL;
      } else {
        window.location.href = "/dashboard"; // ← full reload, bypasses rehydration issue
      }
    })
    .catch(() => {
      window.location.href = "/dashboard"; // ← full reload
    });
};
  const handleResendOtp = () => {
    if (isResendingRef.current || resendLoading) return;
    if (!loginFormData || !loginMode) {
      errorMsg("Unable to resend OTP. Please try logging in again.");
      return;
    }
    if (isRunning) {
      errorMsg(`Please wait ${timeLeft} seconds before resending OTP.`);
      return;
    }

    isResendingRef.current = true;
    setResendLoading(true);

    const resendFormData = { ...loginFormData };
    if (loginMode === "username" && !resendFormData.CompanyID && companyDetails?.companyID) {
      resendFormData.CompanyID = companyDetails.companyID;
    }

    if (loginMode === "username") {
      asyncUserLogin({ formData: resendFormData })
        .then((result) => {
          if (result?.data?.message === "success") {
            startTimer();
            successMsg("OTP has been resent successfully.");
          } else {
            errorMsg(result?.data?.message || "Failed to resend OTP.");
          }
        })
        .catch((error) => {
          errorMsg("Failed to resend OTP. Please try again.");
          handleCatchErrors(error, navigate, setFormErrors, "/");
        })
        .finally(() => {
          isResendingRef.current = false;
          setResendLoading(false);
        });
    } else {
      isResendingRef.current = false;
      setResendLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationSchema = Joi.object({
      OTP: Joi.number().required().messages({
        "any.required": "OTP is required.",
        "number.base": "OTP is required.",
      }),
    }).unknown(true);

    const validationResponse = await validateFormData(formData, validationSchema);
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    const otpPayload = {
      CustomerID: resCustomerID,
      otp: String(formData.OTP).trim(),
      ipAddress: localStorage.getItem("ipv4") || "127.0.0.1",
      Device: formData.Device || "Chrome",
      DeviceNo: formData.Device || "Chrome",
      UserName: customerID || "",   // ✅ "QA69561" username string
      CompanyID: 1,
      macid: "fe80::216e:6507:4b90:3719",
      privateipaddress: "127.0.0.1",
    };

    setIsLoading(true);

    asyncUserVerifyOtp(otpPayload)
      .then(async (result) => {
        if (result?.data == "InValid" || result?.data == "InValid OTP") {
          errorMsg("Invalid OTP");
        } else {
          if (result?.data?.isactive == true) {
            dispatch(userLoginSuccess({ data: result?.data, customerId: resCustomerID }));

            // ✅ Set localStorage BEFORE calling KYC so interceptor has the token
            localStorage.setItem("tokenID", result?.data?.tokenID);
            localStorage.setItem("customerID", resCustomerID);

            // ✅ Called AFTER definition — works correctly
            GetCustomerKycStatus(resCustomerID, result?.data?.tokenID);
          } else {
            if (result?.data?.status == "401") {
              errorMsg(result?.data?.message);
            } else {
              errorMsg("Please try again.");
            }
          }
        }
        setIsLoading(false);
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
        setIsLoading(false);
      });
  };

  return {
    customerID,
    companyDetails,
    showTermsModal,
    handleCloseTermsModal,
    handleShowTermsModal,
    formData,
    handleChange,
    handleSubmit,
    formErrors,
    loading,
    timeLeft,
    isRunning,
    startTimer,
    loginMode,
    handleResendOtp,
    resendLoading,
  };
};

export default UserOtp;