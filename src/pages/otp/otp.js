import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import platform from "platform";
import Joi from "joi";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import {
  asyncGetCustomerKycStatus,
  asyncUserVerifyOtp,
  asyncUserLogin,
  asyncCustLoginWithMobile,
} from "#redux/auth/action/authAction.js";
import { errorMsg, successMsg } from "#helpers";
import { userLoginSuccess } from "#redux/auth/slice/authSlice.js";
import useTimer from "#hooks/useTimer";
import AuthService from "#services/authService";

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
    CustomerID: resCustomerID,
    ipAddress: localStorage.getItem("ipv4"),
    OTP: "",
    Device: platform.name,
  });

  // Check if customerID or resCustomerID is missing, redirect to login
  useEffect(() => {
    if (!customerID || !resCustomerID) {
      navigate("/");
      return;
    }
  }, [customerID, resCustomerID, navigate]);

  useEffect(() => {
    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const handleCloseTermsModal = () => setShowTermsModal(false);
  const handleShowTermsModal = () => setShowTermsModal(true);

  const GetCustomerKycStatus = (customerID,tokenID) => {
    const formData = {
      CustomerId: resCustomerID,
    };

    asyncGetCustomerKycStatus({ formData,customerID,tokenID })
      .then((result) => {
        if (result?.data?.result?.isKYCRequired) {
          window.location.href = companyDetails?.kYC_URL;
        } else {
          navigate("/dashboard");
        }
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
      });
  };

  const handleResendOtp = () => {
    // Prevent multiple simultaneous calls using ref
    if (isResendingRef.current || resendLoading) {
      return;
    }
    
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

    // Ensure we have the latest CompanyID if needed
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
      asyncCustLoginWithMobile({ formData: resendFormData })
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
    }
  };


  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationSchema = Joi.object({
      OTP: Joi.number().required().messages({
        "any.required": "OTP is required.",
        "string.empty": "OTP is required.",
      }),
    }).unknown(true);
    
    const validationResponse = await validateFormData(
      formData,
      validationSchema
    );

    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    setIsLoading(true);
    asyncUserVerifyOtp(formData)
      .then(async (result) => {
        if (result?.data == "InValid" || result?.data == "InValid OTP") {
          errorMsg("Invalid OTP");
        } else {
          if (result?.data?.isactive == true) {
            try {
              const nodeTokenCreated = await AuthService.createNodeToken(result?.data,resCustomerID);
              // Also create ReactChart token - pass tokenID for KYC check
              await AuthService.createReactChartToken(result?.data, resCustomerID, result?.data?.tokenID);
              if (nodeTokenCreated) {
                AuthService.init();
              }
            } catch (error) {
              // Failed to create Node.js token
            }

            dispatch(userLoginSuccess({ data: result?.data, customerId: resCustomerID }));
            GetCustomerKycStatus(resCustomerID, result?.data?.tokenID);
          } else {
            if(result?.data?.status == "401") {
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
