import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { asyncUserLogin, asyncCustLoginWithMobile } from "#redux/auth/action/authAction";
import Joi from "joi";
import { errorMsg } from "#helpers";
import { validateFormData, handleCatchErrors } from "#utils/validation";
import platform from "platform";

const UserLogin = () => {
  const navigate = useNavigate();

  const [loading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState("mobile");

  const { companyDetails } = useSelector((state) => state.companyDetails);

  const [formData, setFormData] = useState({
    Username: "",
    Password: "",
    MobileNo: "",
    CompanyID: "",
    DeviceNo: platform.name,
    TypeodDevice: platform.name,
    ipAddress: localStorage.getItem("ipv4"),
  });

  useEffect(() => {
    if (companyDetails?.companyID) {
      setFormData(prev => ({
        ...prev,
        CompanyID: companyDetails.companyID,
      }));
    }
  }, [companyDetails?.companyID]);

  const [formErrors, setFormErrors] = useState({});
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For MobileNo field: only allow numbers and limit to 10 digits
    if (name === "MobileNo") {
      // Remove all non-numeric characters
      processedValue = value.replace(/\D/g, "");
      // Limit to 10 digits
      if (processedValue.length > 10) {
        processedValue = processedValue.slice(0, 10);
      }
    }
    
    setFormData((prev) => ({ 
      ...prev,
      [name]: processedValue,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let validationSchema;
    
    if (loginMode === "username") {
      validationSchema = Joi.object({
        Username: Joi.string().required().messages({
          "any.required": "Username is required.",
          "string.empty": "Username is required.",
        }),
        Password: Joi.string().required().messages({
          "any.required": "Password is required.",
          "string.empty": "Password is required.",
        }),
      }).unknown(true);
    } else {
      validationSchema = Joi.object({
        MobileNo: Joi.string()
          .pattern(/^[0-9]{10}$/)
          .required()
          .messages({
            "any.required": "Mobile number is required.",
            "string.empty": "Mobile number is required.",
            "string.pattern.base": "Mobile number must be exactly 10 digits.",
          }),
      }).unknown(true);
    }

    const validationResponse = await validateFormData(
      formData,
      validationSchema
    );

    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    setIsLoading(true);
    
    if (loginMode === "username") {
      const usernameLoginData = {
        Username: formData?.Username,
        Password: formData?.Password,
        CompanyID: formData?.CompanyID,
        DeviceNo: formData?.DeviceNo,
        ipAddress: formData?.ipAddress
      };
      
      asyncUserLogin({ formData: usernameLoginData })
        .then((result) => {
          if (result?.data?.message === "success") {
            navigate("/otp", {
              state: {
                customerID: formData?.Username,
                resCustomerID: result?.data?.result?.customerId,
                loginMode: "username",
                loginFormData: usernameLoginData,
              },
            });
          } else {
            errorMsg(result?.data?.message);
          }
        })
        .catch((loginError) => {
          handleCatchErrors(loginError, navigate, setFormErrors, "/");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      const mobileLoginData = {
        MobileNo: formData?.MobileNo,
        DeviceNo: formData?.DeviceNo,
        TypeodDevice: formData?.TypeodDevice,
        ipAddress: formData?.ipAddress
      };
      
      asyncCustLoginWithMobile({ formData: mobileLoginData })
        .then((result) => {
          if (result?.data?.message === "success") {
            navigate("/otp", {
              state: {
                customerID: formData?.MobileNo,
                resCustomerID: result?.data?.result?.customerId,
                loginMode: "mobile",
                loginFormData: mobileLoginData,
              },
            });
          } else {
            errorMsg(result?.data?.message);
          }
        })
        .catch((loginError) => {
          handleCatchErrors(loginError, navigate, setFormErrors, "/");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return {
    formData,
    formErrors,
    isPasswordVisible,
    loading,
    loginMode,
    handleSubmit,
    handleChange,
    setIsPasswordVisible,
    setLoginMode,
  };
};

export default UserLogin;
