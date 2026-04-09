import React, { useCallback, useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../context";
import {
  asyncGetSignalFormat,
  asyncGetSymbolCategoryList,
  asyncGetSymbolIdentifierByCategory,
} from "#redux/symbol/symbolAction.js";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import { useNavigate } from "react-router-dom";
import { asyncGetPlatforms } from "#redux/strategy/action.js";
import {
  asyncGenerateApiKey,
  asyncGetCustomerApiKey,
} from "#redux/user/action.js";
import Joi from "joi";
import { successMsg } from "#helpers";
import Swal from "sweetalert2";
import { useGlobalServices } from "#services/global";

const useApiDocs = () => {
  const { strategyList } = useContext(GlobalContext);
  const { activeSubscriptionFeatures } = useGlobalServices();
  const navigate = useNavigate();
  const [symbolCategoryList, setSymbolCategoryList] = useState([]);
  const [identifierList, setIdentifierList] = useState([]);
  const [platformList, setPlatformList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [formErrors, setFormErrors] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [signal, setSignal] = useState("strike");
  const [scriptData, setScriptData] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] = useState("");

  const [apiDoc, setApiDoc] = useState({
    IdentifierID: 0,
    PlatformName: 0,
    authHeader: "",
    stratergyid: 0,
    text: "",
  });

  const handleClickDialogOpen = (data, tab) => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const getSymbolCategoryList = useCallback(async () => {
    try {
      const result = await asyncGetSymbolCategoryList();
      const allCategory = result?.data?.result;
      if (allCategory?.length) {
        setSymbolCategoryList(allCategory);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    }
  }, [navigate]);

  const getPlatformList = useCallback(async () => {
    try {
      const result = await asyncGetPlatforms();
      const allPlatform = result?.data?.result;
      if (allPlatform?.length) {
        setPlatformList(allPlatform);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    }
  }, [navigate]);

  const getCustomerApiKey = useCallback(async () => {
    try {
      const result = await asyncGetCustomerApiKey();
      const key = result?.data?.key;
      if (key) {
        setApiDoc({ ...apiDoc, authHeader: key });
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    } finally {
      setDataLoading(false);
    }
  }, [navigate]);

  const getCategorySymbols = async () => {
    try {
      const result = await asyncGetSymbolIdentifierByCategory({
        categoryID: selectedCategory,
      });
      const symbolList = result?.data?.result;
      if (symbolList?.length) {
        setIdentifierList(symbolList);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    }
  };

  useEffect(() => {
    if (selectedCategory > 0) {
      getCategorySymbols();
    }
  }, [selectedCategory]);

  useEffect(() => {
    getSymbolCategoryList();
    getPlatformList();
    getCustomerApiKey();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setApiDoc({ ...apiDoc, [name]: value });
    setFormErrors({ ...formErrors, [name]: "" });
  };

  // Check if apiAccess is available in subscription
  const checkApiAccess = () => {
    if (!activeSubscriptionFeatures) {
      return false;
    }
    return activeSubscriptionFeatures.apiAccess === true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check subscription before submitting
    if (!checkApiAccess()) {
      setSubscriptionUpgradeMessage(
        "Your current subscription does not include API Access feature. Please upgrade your subscription to use this feature."
      );
      setSubscriptionUpgradeOpen(true);
      return;
    }

    const validationSchema = Joi.object({
      authHeader: Joi.string().required().messages({
        "any.required": "API Key is required.",
        "string.empty": "API Key is required.",
        "string.base": "API Key is required.",
      }),
      stratergyid: Joi.number().min(1).required().messages({
        "any.required": "Strategy is required.",
        "number.empty": "Strategy is required.",
        "number.min": "Strategy is required.",
      }),
      text: Joi.string().required().messages({
        "any.required": "Identifier is required.",
        "number.empty": "Identifier is required.",
        "number.min": "Identifier is required.",
      }),
      PlatformName: Joi.string().required().messages({
        "any.required": "Platform is required.",
        "number.empty": "Platform is required.",
        "number.min": "Platform is required.",
      }),
    }).unknown(true);

    const validationResponse = await validateFormData(apiDoc, validationSchema);

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }
    setIsLoading(true);
    await asyncGetSignalFormat({ formData: apiDoc })
      .then(async (result) => {
        successMsg("Get script successfully...");
        const script = result?.data;

        if (signal == "strike") {
          setScriptData({
            heading: script?.formatHeading,
            format: script?.format,
            url: script?.formaturl,
          });
        } else {
          setScriptData({
            heading: script?.directHeading,
            format: script?.directformat,
            url: script?.directformaturl,
          });
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const generateAPIKey = async () => {
    await asyncGenerateApiKey()
      .then(async (result) => {
        successMsg("API Key generate successfully...");
        setApiDoc({
          ...apiDoc,
          authHeader: result?.data?.key,
        });
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  };
  const generateApiKey = async () => {
    if (apiDoc?.authHeader) {
      const confirmResult = await Swal.fire({
        title: "Are you sure?",
        text: "You want to regenerate the key, This will deactivate all the signals that are configured?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Re-generate it!",
        confirmButtonColor: "#F3C619",
        cancelButtonText: "No, cancel!",
        customClass: {
          icon: "custom-warning-icon",
        },
      });

      if (confirmResult.isConfirmed) {
        generateAPIKey();
      }
    } else {
      generateAPIKey();
    }
  };

  return {
    activeSubscriptionFeatures,
    strategyList,
    symbolCategoryList,
    identifierList,
    platformList,
    apiDoc,
    selectedCategory,
    setSelectedCategory,
    handleChange,
    formErrors,
    handleSubmit,
    dataLoading,
    setSignal,
    signal,
    isLoading,
    scriptData,
    generateApiKey,
    dialogOpen,
    setDialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    subscriptionUpgradeOpen,
    setSubscriptionUpgradeOpen,
    subscriptionUpgradeMessage,
    setSubscriptionUpgradeMessage,
    checkApiAccess,
  };
};

export default useApiDocs;
