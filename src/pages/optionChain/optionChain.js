import { errorMsg, successMsg } from "#helpers";
import useSymbolDetails from "#hooks/useSymbol";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { asyncPostCreateOrder, asyncPostBrokerCashAvailable } from "#redux/order/action.js";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors, validateFormData } from "#utils/validation";
import Storage from "#services/storage";
import { fetchSymbolExpiryList, fetchWatchList } from "#utils/watchList";
import Joi from "joi";
import React, { useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalServices } from "#services/global";

const useOptionChain = () => {
  const { activeSubscriptionFeatures } = useGlobalServices();
  const navigate = useNavigate();
  const [optionChainPEList, setOptionChainPEList] = useState([]);
  const [optionChainCEList, setOptionChainCEList] = useState([]);
  const [watchList, setWatchList] = useState([]);
  const [futueWatchList, setFutueWatchList] = useState([]);
  const [expiryList, setExpiryList] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoveredType, setHoveredType] = useState(null);

  const [clickedIndex, setClickedIndex] = useState(null);
  const [clickedType, setClickedType] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [isAnalysis, setIsAnalysis] = useState("");
  const [chartIdentifier, setChartIdentifier] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const [brokerConfigList, setBrokerConfigList] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);

  // Move formData state to the top
  const [formData, setFormData] = useState({
    strProduct: "",
    strExpiry: "",
    strike: "",
  });

  const handleClickDialogOpen = (data, tab) => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const sectionRef = useRef(null);

  // Simplified scroll function for better performance
  const scrollToATM = () => {
    if (sectionRef.current) {
      const scrollContainer = document.querySelector('.price_content');
      
      if (scrollContainer) {
        const atmElement = sectionRef.current;
        const elementRect = atmElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        // Calculate the target scroll position to center the element
        const elementCenter = elementRect.top + (elementRect.height / 2);
        const containerCenter = containerRect.top + (containerRect.height / 2);
        const scrollAdjustment = elementCenter - containerCenter;
        const targetScrollTop = scrollContainer.scrollTop + scrollAdjustment;
        
        // Scroll to center the ATM row
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: "smooth"
        });
      } else {
        // Fallback to window scroll
        const elementPosition = sectionRef.current.getBoundingClientRect().top + window.scrollY;
        const windowHeight = window.innerHeight;
        const elementHeight = sectionRef.current.offsetHeight;
        const targetScrollTop = elementPosition - (windowHeight / 2) + (elementHeight / 2);
        
        window.scrollTo({ 
          top: targetScrollTop, 
          behavior: "smooth" 
        });
      }
    }
  };


  const handleScroll = () => {
    if (sectionRef.current) {
      const offset = 200; // Adjust this value as needed
      const elementPosition =
        sectionRef.current.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({ top: elementPosition - offset, behavior: "smooth" });
    }
  };

  // Simplified scroll to ATM when data is loaded
  useEffect(() => {
    if (optionChainCEList?.length > 0 && optionChainPEList?.length > 0 && !isLoading) {
      setTimeout(() => {
        scrollToATM();
      }, 500);
    }
  }, [optionChainCEList, optionChainPEList, isLoading]);

  const analysisObj = {
    mtm: 0,
    maxProfit: 0,
    risk: "N/A",
    maxLoss: "N/A",
    marginApprox: "Coming soon...",
    breakEven: 0,
    data: "",
    identifierId: "",
    lotSize: 0,
    identifier: "",
  };
  const [analysis, setAnalysis] = useState(analysisObj);

  const [orderData, setOrderData] = useState({
    SymbolID: 0,
    Type: 1,
    OrderType: 1,
    Quantity: 1,
    EntryPrice: 0,
    VolumePrice: 0,
    Commission: 0,
    TotalPurchaseAmt: 0,
    isLimitOrder: false,
    isMarketOrder: true,
    isStopLoss: true,
    StopLossPer: 0,
    StopLossEstPrice: 0,
    isTakeProfit: false,
    TakeProfitPer: 0,
    TakeProfitEstPrice: 0,
    OrderStatus: 1,
    BrokerConfigID: "",
    SellPrice: 0,
    BuyPrice: 0,
    ClosedPrice: 0,
    ProductType: 2,
    ProfitLost: 0,
    IdentifierId: "",
    IsSettled: false,
    iSAutoTrade: false,
    BrokerStatus: 0,
    OrderID: 0,
  });



  const handleOrderChange = (e) => {
    const { name, value, checked } = e.target;

    if (name == "isTakeProfit" || name == "isStopLoss") {
      setOrderData({ ...orderData, [name]: checked });
    } else {
      if (
        name == "StopLossEstPrice" ||
        name == "TakeProfitEstPrice" ||
        name == "Quantity"
      ) {
        if (/^\d*$/.test(value)) {
          if (name == "Quantity") {
            if (value.length <= 6)
              setOrderData({
                ...orderData,
                [name]: value,
                TotalPurchaseAmt:
                  value * analysis?.lotSize * orderData?.EntryPrice,
              });
          } else {
            setOrderData({ ...orderData, [name]: value });
          }
        }
      } else if (name === "BrokerConfigID") {
        // Find the selected broker from brokerConfigList and set both BrokerConfigID and BrokerID
        const selectedBroker = brokerConfigList.find(
          (broker) => broker.brokerconfigID == value
        );
        setOrderData({
          ...orderData,
          BrokerConfigID: value,
          
        });

        setSelectedBroker(selectedBroker.brokerID);
      } else {
        setOrderData({ ...orderData, [name]: value });
      }
    }
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      newErrors[name] = "";
      // Clear InsufficientFunds error when user changes order details
      if (name === "Quantity" || name === "BrokerConfigID") {
        delete newErrors.InsufficientFunds;
      }
      return newErrors;
    });
  };

  const getWatchlist = async () => {
    const data = await fetchWatchList(
      { categoryID: 5, identifier: "" },
      navigate
    );
    if (data?.length > 0) {
      setWatchList(data);
      if (data[0]?.product) {
        setChartIdentifier(data[0]);

        setFormData((prev) => ({
          ...prev,
          strProduct: data[0]?.product,
        }));
        getFutureWatchlist(data[0]?.product);
        getSymbolExpiryList(data[0]?.product);
      }
    }
  };

  const getFutureWatchlist = async (productName) => {
    const data = await fetchWatchList(
      { categoryID: 2, identifier: "" },
      navigate
    );
    if (data) {
      const result = data?.filter((item) => item.product === productName);
      setFutueWatchList(result);
    }
  };

  const getSymbolExpiryList = useCallback(async (strProduct) => {
    const expiryData = await fetchSymbolExpiryList(
      { strProduct: strProduct },
      navigate
    );
    if (expiryData && expiryData.length > 0) {
      expiryData.reverse();
      setFormData((prev) => {
        // Only update if expiry actually changed
        if (prev.strExpiry === expiryData[0]) {
          return prev;
        }
        return {
          ...prev,
          strExpiry: expiryData[0],
        };
      });
      setExpiryList(expiryData);
    }
  }, [navigate, setFormData]);

  useEffect(() => {
    getWatchlist();
    asyncGetCustBrokerConfig({ sendData: "" })
      .then((result) => {
        const activeBroker = result?.data?.result.filter(
          (broker) => broker.status == true
        );
        if (activeBroker?.length > 0) {
          setBrokerConfigList(activeBroker);
          setOrderData({
            ...orderData,
            BrokerConfigID: activeBroker[0]?.brokerconfigID,
          });
          setSelectedBroker(activeBroker[0].brokerID);
        }
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
      });
  }, []);

  // Cache for option chain data to avoid redundant API calls
  const [dataCache, setDataCache] = useState(new Map());
  const dataCacheRef = useRef(new Map());
  const isFetchingRef = useRef(false);
  const lastFetchedKeyRef = useRef("");
  const formDataRef = useRef({ strProduct: "", strExpiry: "" });
  const lastProcessedProductRef = useRef("");

  // Keep refs in sync with state
  useEffect(() => {
    dataCacheRef.current = dataCache;
  }, [dataCache]);

  useEffect(() => {
    formDataRef.current = formData || { strProduct: "", strExpiry: "" };
  }, [formData]);

  useEffect(() => {
    const product = formData?.strProduct;
    const expiry = formData?.strExpiry;
    
    if (!product || !expiry) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `${product}_${expiry}`;
    
    // Prevent duplicate fetches for same key
    if (isFetchingRef.current && lastFetchedKeyRef.current === cacheKey) {
      return;
    }

    // Check if data exists in cache first (most reliable)
    const currentCache = dataCacheRef.current;
    if (currentCache.has(cacheKey)) {
      const cachedData = currentCache.get(cacheKey);
      // Only update if data is different to prevent unnecessary re-renders
      if (JSON.stringify(cachedData.peList) !== JSON.stringify(optionChainPEList) ||
          JSON.stringify(cachedData.ceList) !== JSON.stringify(optionChainCEList)) {
        setOptionChainPEList(cachedData.peList);
        setOptionChainCEList(cachedData.ceList);
      }
      setIsLoading(false);
      return;
    }
      
    // If data is not in cache, we need to fetch fresh data
    // (This happens when product/expiry changes or on first load)

    // Only show loading if data is not available
    if (optionChainCEList.length === 0 && optionChainPEList.length === 0) {
      setIsLoading(true);
    }
    
    // Mark as fetching to prevent duplicate calls
    isFetchingRef.current = true;
    lastFetchedKeyRef.current = cacheKey;
    
    // Immediate data fetching - no delay
    const fetchOptionData = async () => {
      try {
        const [peResult, ceResult] = await Promise.all([
          asyncGetOptionListPE({ formData: { strProduct: product, strExpiry: expiry } }),
          asyncGetOptionListCE({ formData: { strProduct: product, strExpiry: expiry } })
        ]);

        const peData = peResult?.data?.result || [];
        const ceData = ceResult?.data?.result || [];

        // Cache the data with timestamp for cache invalidation
        setDataCache(prev => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, {
            peList: peData,
            ceList: ceData,
            timestamp: Date.now()
          });
          return newCache;
        });

        // Update data immediately
        setOptionChainPEList(peData);
        setOptionChainCEList(ceData);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        handleCatchErrors(err, navigate);
      } finally {
        // Reset fetching flag after a delay to allow for rapid changes
        setTimeout(() => {
          isFetchingRef.current = false;
        }, 500);
      }
    };

    // Fetch immediately - no debounce delay
    fetchOptionData();
  }, [formData?.strProduct, formData?.strExpiry, navigate]);

  const handleChange = useCallback(async (e) => {
    const { name, value } = e.target; 
    
    if (name == "strProduct") {
      // Prevent duplicate calls for same product - use ref to check
      const currentProduct = formDataRef.current?.strProduct;
      if (currentProduct === value || lastProcessedProductRef.current === value) {
        return; // Already set or processing, skip
      }

      // Mark as processing to prevent duplicate calls
      lastProcessedProductRef.current = value;

      // Clear old option chain data immediately when product changes
      setOptionChainCEList([]);
      setOptionChainPEList([]);
      setIsLoading(true);
      
      // Clear cache for old product to force fresh fetch (use ref to avoid dependency)
      if (currentProduct) {
        const currentCache = dataCacheRef.current;
        const oldExpiry = formDataRef.current?.strExpiry || "";
        if (currentCache.has(`${currentProduct}_${oldExpiry}`)) {
          setDataCache(prev => {
            const newCache = new Map(prev);
            // Remove all cache entries for the old product
            for (const key of newCache.keys()) {
              if (key.startsWith(`${currentProduct}_`)) {
                newCache.delete(key);
              }
            }
            return newCache;
          });
        }
      }
      
      // Find chart identifier immediately (watchList accessed via closure, no dependency needed)
      const currentWatchList = watchList;
      const findData = currentWatchList.find((item) => item.product == value);
      if (findData) {
        setChartIdentifier(findData);
      }
      
      // Update form data first to prevent flicker
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        strExpiry: "", // Reset expiry to trigger fresh fetch
      }));
      
      // Get expiry list and update form data in parallel
      try {
        await getSymbolExpiryList(value);
      } catch (error) {
        // Silent fail
        lastProcessedProductRef.current = ""; // Reset on error
      }
    } else {
      // For other changes, update form data immediately
      setFormData((prev) => {
        // Only update if value actually changed
        if (prev[name] === value) {
          return prev;
        }
        return {
          ...prev,
          [name]: value,
        };
      });
    }
    
    // Reset analysis when changing symbols
    setIsAnalysis("");
    setAnalysis(analysisObj);
  }, [getSymbolExpiryList, setFormData, setOptionChainCEList, setOptionChainPEList, setIsLoading, setChartIdentifier, setIsAnalysis, setAnalysis]);


  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    // Define the validation schema for the form
    const validationSchema = Joi.object({
      Quantity: Joi.number().required().min(1).messages({
        "any.required": "Quantity is required.",
        "number.min": "Quantity must be greater than 0",
      }),
      BrokerConfigID: Joi.number().required().label("Broker").messages({
        "any.required": "Broker is required.",
      }),
    }).unknown(true);
    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      orderData,
      validationSchema
    );
    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }


    // Call BrokerCashAvailable API before placing order
    setIsOrderLoading(true);
    
    // Only check broker cash availability if selectedBroker is 5
    if (selectedBroker != 5) {
      try {
        const brokerCashPayload = {
          CustomerID: Storage.decryptData(localStorage.getItem("customerID")),
          BrokerID: 0,
          BrokerConfigID: orderData?.BrokerConfigID || "",
        };


        
        const brokerCashResponse = await asyncPostBrokerCashAvailable({ formData: brokerCashPayload });
      
        
        // Calculate required amount for the order
        const requiredAmount = orderData?.Quantity * analysis?.lotSize * orderData?.EntryPrice;
      

        
        // Get available amount from response (checking different possible response structures)
        const availableAmount = 
                               brokerCashResponse?.data ||
                               0;


        // Check if available amount is sufficient
        if (Number(availableAmount) < Number(requiredAmount)) {
          const shortfallAmount = Number(requiredAmount) - Number(availableAmount);
          const errorMessage = `Insufficient funds! Required: ₹${Number(requiredAmount).toFixed(2)}, Available: ₹${Number(availableAmount).toFixed(2)}, Shortfall: ₹${shortfallAmount.toFixed(2)}`;
        
          setFormErrors({
            InsufficientFunds: errorMessage
          });
          setIsOrderLoading(false);
          return;
        }
        
        // Clear any previous insufficient funds error
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.InsufficientFunds;
          return newErrors;
        });
      
      } catch (brokerCashError) {
     
        setFormErrors({
          InsufficientFunds: "Unable to verify broker cash availability. Please try again."
        });
        setIsOrderLoading(false);
        return;
      }
    }

    let formData = orderData;

    formData.Quantity = formData?.Quantity * analysis?.lotSize;

    asyncPostCreateOrder({ formData })
      .then((result) => {
        if (result?.data?.message == "success") {
          successMsg("Order placed successfully...");
          navigate("/order/active");
        } else {
          errorMsg(result?.data?.message);
        }
      })
      .catch((loginError) => {
        // Show specific 400 validation errors (e.g. lot vs freeze quantity) in the main alert panel
        if (
          loginError?.response?.status === 400 &&
          loginError?.response?.data?.message
        ) {
          setFormErrors((prev) => ({
            ...prev,
            InsufficientFunds: loginError.response.data.message,
          }));
          return;
        }

        handleCatchErrors(loginError, navigate, setFormErrors, "/");
      })
      .finally(() => {
        setIsOrderLoading(false);
      });
  };

  const CancelOrder = () => {
    setIsAnalysis("");
    setAnalysis(analysisObj);
  };

  // Add cache cleanup function
  const clearCache = () => {
    setDataCache(new Map());
  };

  // Check if buy/sell is allowed based on subscription
  const checkSubscriptionFeature = (orderType) => {
    if (!activeSubscriptionFeatures) {
      return false;
    }
    const optionChain = activeSubscriptionFeatures.optionChain;
    if (!optionChain) {
      return false;
    }
    return orderType === "buy" ? optionChain.buy == true : optionChain.sell == true;
  };

  // Add cache management functions

  return {
    formData,
    optionChainPEList,
    optionChainCEList,
    watchList,
    expiryList,
    hoveredIndex,
    setHoveredIndex,
    hoveredType,
    setHoveredType,
    sectionRef,
    handleChange,
    isLoading,
    futueWatchList,
    isAnalysis,
    setIsAnalysis,
    navigate,
    orderData,
    setOrderData,
    handleOrderChange,
    analysis,
    setAnalysis,
    handleOrderSubmit,
    brokerConfigList,
    formErrors,
    isOrderLoading,
    CancelOrder,
    activeSubscriptionFeatures,
    dialogOpen,
    setDialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    clickedIndex,
    setClickedIndex,
    clickedType,
    setClickedType,
    handleScroll,
    scrollToATM,
    chartIdentifier,
    clearCache,
    getSymbolExpiryList,
    setOptionChainCEList,
    setOptionChainPEList,
    setFormData,
    activeSubscriptionFeatures,
    checkSubscriptionFeature,
  };
};

export default useOptionChain;
