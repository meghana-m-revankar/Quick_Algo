import { errorMsg, successMsg } from "#helpers";
import {
  asyncGetCustBrokerConfigByID,
  asyncPostChoiceBrokerLogin,
  asyncPostCustBrokerConfig,
  asyncVerifyOTP,
  asyncDhanGenerateConsent,
  asyncDhanConsumeConsent,
} from "#redux/broker/action.js";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import { asyncUpdateStrategyBroker } from "#redux/strategy/action.js";
import { useGlobalServices } from "#services/global";
import Storage from "#services/storage";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import { decryptBrokerData } from "#utils/brokerEncryption";
import Joi from "joi";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

const useBrokerSetup = () => {  
  const { brokerMasterList, activeSubscriptionFeatures } = useGlobalServices();
  const [brokerConfigDetails, setBrokerConfigDetails] = useState("");
  const [brokerDetail, setBrokerDetail] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [responseVisible, setResponseVisible] = useState(false);
  const [mpinVisible, setMpinVisible] = useState(false);
  const [totpVisible, setTotpVisible] = useState(false);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [sourceVisible, setSourceVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [otpData, setOtpData] = useState({
    brokerId: "",
    OTP: "",
    userId: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] = useState("");
  const [customerBrokerList, setCustomerBrokerList] = useState([]);
  const { companyDetails } = useSelector((state) => state.companyDetails);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    AccessToken: null,
    SecratKey: "",
    ApiKey: "",
    ApiToken: "",
    BrokerID: "",
    ClientCode: "",
    Password: "",
    TOTP: "",
    OTP: null,
    RequestToken: "",
    AppSource: "",
    C_Password: null,
    C_Mobileno: null,
    c_neofinkey: "neotradeapi",
    RefreshToken: "",
    status: true,
    CompanyID: "",
    BrokerconfigID: "",
  });



  console.log("brokerConfigDetails", brokerDetail);
  useEffect(() => {
    if (brokerDetail) {
      setFormData({
        ...formData,
        BrokerconfigID: brokerConfigDetails?.brokerconfigID,
        CompanyID: companyDetails?.companyID,
        BrokerID: brokerDetail?.brokerID,
        ApiUrl:
          brokerDetail?.brokerID == 9
            ? "https://algoresponcetrading.in/BrokerResponse.html"
            : "",
      });

      setOtpData({
        ...otpData,

        brokerId: brokerDetail?.brokerID,
      });
    }
  }, [brokerDetail, brokerConfigDetails]);

  // Do NOT clear here; refresh/unmount would wipe selected broker
  // We'll rely on global navigation hook and logout to clear



  // Check broker limit
  const checkBrokerLimit = () => {
    const maxBrokerLimit = activeSubscriptionFeatures?.maxBrokerAddLimitCount || 0;
    const currentBrokerCount = customerBrokerList?.length || 0;
    
    if (maxBrokerLimit > 0 && currentBrokerCount >= maxBrokerLimit) {
      setSubscriptionUpgradeMessage(
        `You have reached the maximum broker limit (${maxBrokerLimit}). Please upgrade your subscription to add more brokers.`
      );
      setSubscriptionUpgradeOpen(true);
      return false;
    }
    return true;
  };

  // Early check for broker limit when page loads (for direct URL access)
  useEffect(() => {
    if (activeSubscriptionFeatures) {
      const brokerId = Storage.getBrokerSetupData();
      
      if (!brokerId) {
        // No broker selected - redirect immediately
        errorMsg("No broker selected");
        navigate("/broker");
        return;
      }
      
      // Check current broker count to verify limit
      asyncGetCustBrokerConfig({ sendData: "" })
        .then((result) => {
          const allBrokers = result?.data?.result || [];
          const activeBrokers = allBrokers.filter(
            (broker) => broker.status == true
          );
          setCustomerBrokerList(activeBrokers);
          
          // Check if this is a new broker setup (brokerId exists but not in user's broker list)
          const brokerExist = allBrokers.find(
            (broker) => broker.brokerID == brokerId
          );
          
          // If broker doesn't exist in user's list, it's a new setup - check limit
          if (!brokerExist) {
            const maxBrokerLimit = activeSubscriptionFeatures?.maxBrokerAddLimitCount || 0;
            if (maxBrokerLimit > 0 && activeBrokers.length >= maxBrokerLimit) {
              setSubscriptionUpgradeMessage(
                `You have reached the maximum broker limit (${maxBrokerLimit}). Please upgrade your subscription to add more brokers.`
              );
              setSubscriptionUpgradeOpen(true);
              setTimeout(() => {
                navigate("/broker");
              }, 2000);
              setScreenLoading(false);
              return;
            }
          }
        })
        .catch((err) => {
          // Silently fail - will be handled in main useEffect
        });
    }
  }, [activeSubscriptionFeatures, navigate]);

  useEffect(() => {
    if (brokerMasterList?.length > 0) {
      // Get broker ID from localStorage instead of URL
      const brokerId = Storage.getBrokerSetupData();
      
      if (brokerId) {
        const brokerMasterExist = brokerMasterList.find(
          (broker) => broker.brokerID == brokerId
        );

        if (brokerMasterExist) {
          setBrokerDetail(brokerMasterExist);
          asyncGetCustBrokerConfig({ sendData: "" })
            .then((result) => {
              const allBrokers = result?.data?.result || [];
              const activeBrokers = allBrokers.filter(
                (broker) => broker.status == true
              );
              setCustomerBrokerList(activeBrokers);
              
              const brokerExist = allBrokers.find(
                (broker) => broker.brokerID == brokerId
              );

              if (brokerExist) {
                brokerConfigDetail(brokerExist?.brokerconfigID);
              }
              // Limit check is now handled in the early useEffect above
            })
            .catch((err) => {
              handleCatchErrors(err, navigate);
            })
            .finally(() => {
              setTimeout(() => {
                setScreenLoading(false);
              }, 500);
            });
        } else {
          errorMsg("Broker not found");
          navigate("/broker");
        }
      } else {
        errorMsg("No broker selected");
        navigate("/broker");
      }
    }
  }, [brokerMasterList]);

  const brokerConfigDetail = (configId) => {
    asyncGetCustBrokerConfigByID({ ConfigID: configId })
      .then((result) => {
        setBrokerConfigDetails(result?.data?.result);
        const data = result?.data?.result;
    
        // Decrypt sensitive fields from API response
        const decryptedData = decryptBrokerData(data);
    
        // Check if form data exists in localStorage first
        const savedFormData = Storage.getBrokerFormData();

  
        
        if (savedFormData && savedFormData.BrokerID == decryptedData?.brokerID) {
          // Use saved form data from localStorage
          setFormData((prev) => ({
            ...prev,
            ...savedFormData,
            BrokerconfigID: decryptedData?.brokerconfigID,
            CompanyID: companyDetails?.companyID,
            BrokerID: brokerDetail?.brokerID,
            ApiUrl: brokerDetail?.brokerID == 9
              ? "https://algoresponcetrading.in/BrokerResponse.html"
              : "",
          }));
        } else {
          // Use API data (decrypted)
          setFormData((prev) => ({
            ...prev,
            SecratKey: decryptedData?.secratKey ?? "",
            ApiKey: decryptedData?.apiKey ?? "",
            RequestToken: decryptedData?.requestToken ?? "",
            Password: decryptedData?.password ?? "",
            ClientCode: decryptedData?.clientCode ?? "",
            ApiToken: decryptedData?.apiToken ?? "",
            AppSource: decryptedData?.appSource ?? "",
            C_Mobileno: decryptedData?.c_mobileno ?? "",
            c_neofinkey: decryptedData?.c_neofinkey ?? "neotradeapi",
            C_Password: decryptedData?.c_password ?? "",
          }));
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  };

  

  const [formErrors, setFormErrors] = useState({});

  // On change data
  const handleChange = (e) => {
    const { name, value } = e.target;

    // name and value

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  // On submit data
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check broker limit before submitting
    if (!checkBrokerLimit()) {
      return;
    }

    // Define the validation schema for the form
    const validationSchema = Joi.object({
      ApiKey: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(1, 2, 3, 5, 6, 7, 8, 9, 10,11,12),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 6
                ? "Vendor Id"
                : brokerDetail?.brokerID == 7
                ? "User Key"
                : brokerDetail?.brokerID == 10
                ? "API/Consumer key"
                : "API key"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 6
                ? "Vendor Id"
                : brokerDetail?.brokerID == 7
                ? "User Key"
                : brokerDetail?.brokerID == 10
                ? "API/Consumer key"
                : "API key"
            } is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      SecratKey: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(1, 2, 6, 7, 9,12),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 6 || brokerDetail?.brokerID == 7
                ? "Encryption"
                : brokerDetail?.brokerID == 10
                ? "Consumer Secret"
                : "Secret"
            } key is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 6 || brokerDetail?.brokerID == 7
                ? "Encryption"
                : brokerDetail?.brokerID == 10
                ? "Consumer Secret"
                : "Secret"
            } key is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      RequestToken: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(1, 6, 7, 8,12),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 6 ? "Encryption IV" : "Request token"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 6 ? "Encryption IV" : "Request token"
            } is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      ClientCode: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(2, 3, 6, 8, 9,11,12),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 9 ? "Request" : brokerDetail?.brokerID == 11 ? "Dhan Client ID" : "D-emat"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 9 ? "Request" : brokerDetail?.brokerID == 11 ? "Dhan Client ID" : "D-emat"
            } code is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      Password: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(2, 6),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 2
                ? "D-emat MPIN"
                : brokerDetail?.brokerID == 10
                ? "receive by Mail Password"
                : "D-emat Password"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 2
                ? "D-emat MPIN"
                : brokerDetail?.brokerID == 10
                ? "receive by Mail Password"
                : "D-emat Password"
            } is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      TOTP: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(2, 6),
        then: Joi.string().required().messages({
          "any.required": "TOTP is required.",
          "string.empty": "TOTP is required.",
        }),
        otherwise: Joi.string().allow("").optional(),
      }),
      ApiToken: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(6, 7, 8),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 6
                ? "Vendor key"
                : brokerDetail?.brokerID == 8
                ? "Secret Key"
                : "User Id"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 6
                ? "Vendor key"
                : brokerDetail?.brokerID == 8
                ? "Secret Key"
                : "User Id"
            } is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
      AppSource: Joi.alternatives().conditional("BrokerID", {
        is: Joi.valid(7),
        then: Joi.string()
          .required()
          .messages({
            "any.required": `${
              brokerDetail?.brokerID == 7 ? "App Source" : "App Source"
            } is required.`,
            "string.empty": `${
              brokerDetail?.brokerID == 7 ? "App Source" : "App Source"
            } is required.`,
          }),
        otherwise: Joi.string().allow("").optional(),
      }),
    }).unknown(true);
    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      formData,
      validationSchema
    );

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    setIsLoading(true);
    
    asyncPostCustBrokerConfig({ formData })
      .then(async (result) => {
        if (result?.data?.status == 201) {
          errorMsg(result?.data?.message);
        } else {
          if (brokerDetail?.brokerID == 10) {
            setOtpData({ ...otpData, userId: Storage.decryptData(localStorage.getItem("customerID")) });
            successMsg("OTP sent successfully!");
          } else {
            successMsg("Broker added successfully!");
            
            // Update strategies with broker tokens after successful broker setup
            try {
              const customerId = Storage.decryptData(localStorage.getItem("customerID"));
              const customerToken = Storage.decryptData(localStorage.getItem("tokenID"));
              
              // Get broker token from result or formData
              // Note: The actual broker token might come from the broker API response
              // For now, we'll use the brokerConfigID from formData
              const brokerConfigID = formData.BrokerconfigID || brokerConfigDetails?.brokerconfigID;
              
              if (customerId && customerToken && brokerConfigID) {
                // Call strategy broker update API to enable broker for all strategies
                await asyncUpdateStrategyBroker({
                  CustomerId: customerId,
                  action: "enable",
                  brokerConfigID: brokerConfigID,
                  customerToken: customerToken,
                  customerBrokerToken: customerToken // Using customerToken as broker token for now
                });
              }
            } catch (strategyError) {
              // Log error but don't block broker setup success
              console.error("Error updating strategies with broker:", strategyError);
            }
            
            // Clear form data from localStorage after successful save
            Storage.clearBrokerFormData();
            navigate("/broker");
          }
        }
      })
      .catch((loginError) => {
        handleCatchErrors(loginError, navigate, setFormErrors, "/");
      })
      .finally(() => {
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      });
  };

  // On otp change data
  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    if (/^\d*$/.test(value)) {
      setOtpData((prev) => ({
        ...prev,
        [name]: value,
      }));
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // On OTP submit data
  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    // Define the validation schema for the form
    const validationSchema = Joi.object({
      OTP: Joi.number().required().messages({
        "any.required": "OTP is required.",
      }),
    }).unknown(true);
    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      otpData,
      validationSchema
    );

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    setIsLoading(true);
    asyncVerifyOTP({ ...otpData })
      .then(async (result) => {
        // cjce
        if (result?.data?.message == "success") {
          successMsg("Broker added successfully!");
          
          // Update strategies with broker tokens after successful OTP verification
          try {
            const customerId = Storage.decryptData(localStorage.getItem("customerID"));
            const customerToken = Storage.decryptData(localStorage.getItem("tokenID"));
            
            // Get broker token from result or formData
            const brokerConfigID = formData.BrokerconfigID || brokerConfigDetails?.brokerconfigID;
            
            if (customerId && customerToken && brokerConfigID) {
              // Call strategy broker update API to enable broker for all strategies
              await asyncUpdateStrategyBroker({
                CustomerId: customerId,
                action: "enable",
                brokerConfigID: brokerConfigID,
                customerToken: customerToken,
                customerBrokerToken: customerToken // Using customerToken as broker token for now
              });
            }
          } catch (strategyError) {
            // Log error but don't block broker setup success
            console.error("Error updating strategies with broker:", strategyError);
          }
          
          // Clear form data from localStorage after successful OTP verification
          Storage.clearBrokerFormData();
          navigate("/broker");
        } else {
          errorMsg("Please try again.");
        }
      })
      .catch((loginError) => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Get TOTP
  const saveTOTP = () => {
    setOtpLoading(true);
    asyncPostChoiceBrokerLogin({ formData })
      .then((result) => {
        if (result?.data?.result) {
          successMsg("TOTP send successfully!");
        } else {
          errorMsg("Please try again.");
        }
      })
      .catch(() => {
        errorMsg("Please try again.");
      })
      .finally(() => {
        setTimeout(() => {
          setOtpLoading(false);
        }, 100);
      });
  };

  // Save form data to localStorage
  const saveFormDataToStorage = () => {
    const dataToSave = {
      ...formData,
      BrokerID: brokerDetail?.brokerID,
      CompanyID: companyDetails?.companyID,
    };
    Storage.saveBrokerFormData(dataToSave);
  };

  // Dhan Test Connection - Step 1: Generate Consent
  const handleDhanTestConnection = async () => {
    if (!formData.ClientCode) {
      errorMsg("Please enter Dhan Client ID first");
      return;
    }

    if (!formData.ApiKey) {
      errorMsg("Please enter API Key first");
      return;
    }

    if (!formData.SecratKey) {
      errorMsg("Please enter Secret Key first");
      return;
    }

    try {
      setIsLoading(true);
      const result = await asyncDhanGenerateConsent({ 
        dhanClientId: formData.ClientCode, // Using ClientCode instead of DhanClientId
        apiKey: formData.ApiKey,
        secretKey: formData.SecratKey
      });
      
      if (result?.data?.status === "success" && result?.data?.consentAppId) {
        // Step 2: Redirect to Dhan login page
        const loginUrl = `https://auth.dhan.co/login/consentApp-login?consentAppId=${result.data.consentAppId}`;
        window.open(loginUrl, "_blank");
        successMsg("Redirecting to Dhan login page. Please complete login and return to this page.");
      } else {
        errorMsg("Failed to generate consent. Please try again.");
      }
    } catch (error) {
      errorMsg("Failed to generate consent. Please check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Dhan Test Connection - Step 3: Consume Consent (called from URL callback)
  const handleDhanConsumeConsent = async (tokenId) => {
    try {
      setIsLoading(true);
      const result = await asyncDhanConsumeConsent({ 
        tokenId,
        apiKey: formData.ApiKey,
        secretKey: formData.SecratKey
      });
      
      if (result?.data?.accessToken) {
        // Automatically fill the access token in RequestToken field
        setFormData((prev) => ({
          ...prev,
          RequestToken: result.data.accessToken
        }));
        
        successMsg(`Dhan connection successful! Access Token automatically filled in Request Token field.`);
        
        // Log the details
   
     
      } else {
        errorMsg("Failed to get access token. Please try again.");
      }
    } catch (error) {
      errorMsg("Failed to consume consent. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear form data from localStorage when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function - runs when component unmounts
      Storage.clearBrokerFormData();
    };
  }, []);


    // Extract request token from URL and auto-fill RequestToken field
    useEffect(() => {
      const requestToken = searchParams.get("request_token");
      const brokerId = Storage.getBrokerSetupData();
      const clientCode = searchParams.get("clientCode");
      const tokenId = searchParams.get("tokenId"); // For Dhan callback

      if ((requestToken || clientCode|| tokenId) && brokerConfigDetails) {
        setFormData((prev) => ({
          ...prev,
            RequestToken: requestToken ?? formData?.RequestToken ?? "",
          ClientCode: brokerId == 8 ? formData?.ClientCode : clientCode ?? formData?.ClientCode ?? "",
        }));

        // Auto-submit the form after filling
        setTimeout(() => {
          handleSubmit(new Event('submit'));
        }, 1000); // 1 second delay to ensure form data is updated
      }

      // Handle Dhan tokenId callback - automatically get access token
      if (tokenId && brokerId == 11 && brokerConfigDetails) {
        handleDhanConsumeConsent(tokenId);
      }
    }, [searchParams, brokerConfigDetails]);

  return {
    brokerConfigDetails,
    brokerDetail,
    keyVisible,
    setKeyVisible,
    secretVisible,
    setSecretVisible,
    responseVisible,
    setResponseVisible,
    handleChange,
    formData,
    subscriptionUpgradeOpen,
    setSubscriptionUpgradeOpen,
    subscriptionUpgradeMessage,
    formErrors,
    isLoading,
    handleSubmit,
    screenLoading,
    codeVisible,
    setCodeVisible,
    mpinVisible,
    setMpinVisible,
    totpVisible,
    setTotpVisible,
    tokenVisible,
    setTokenVisible,
    saveTOTP,
    otpLoading,
    sourceVisible,
    setSourceVisible,
    passwordVisible,
    setPasswordVisible,
    otpData,
    handleOtpSubmit,
    handleOtpChange,
    saveFormDataToStorage,
    handleDhanTestConnection,
    handleDhanConsumeConsent,
    subscriptionUpgradeOpen,
    setSubscriptionUpgradeOpen,
    subscriptionUpgradeMessage,
  };
};

export default useBrokerSetup;
