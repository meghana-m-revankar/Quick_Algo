import { IconRegistry, SubscriptionDialog } from "#components";
import React, { useState, useEffect, useMemo, useContext, useRef } from "react";
import { FiX } from "react-icons/fi";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { useTradingBox } from "../../context/TradingBoxContext";
import useSymbolDetails from "../../hooks/useSymbol";
import { useSignalR } from "../../services/signalR";
import { asyncPostCreateOrder } from "../../redux/order/action.js";
import { errorMsg, successMsg } from "../../utils/helpers";
import { validateFormData } from "../../utils/validation";
import Joi from "joi";
import { fetchWatchList } from "../../utils/watchList";
import { GlobalContext } from "../../context";
import { useGlobalServices } from "#services/global";
import "./TradingBox.scss";

const TradingBox = ({ id, symbol = "NIFTY", onClose }) => {
  // Get subscription details from GlobalContext
  const { activeSubscriptionFeatures } = useGlobalServices();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);

  // Use TradingBox context
  const {
    getBoxState,
    getAvailableStrikes,
    getCurrentOptionData,
    updateOptionType,
    updateStrikePrice,
    optionChainCache,
    getBrokerConfig,
    brokerConfigList,
    isLoadingBrokers,
    addTradingBox,
    tradingBoxes,
    refreshBrokerList,
  } = useTradingBox();

  // Get box-specific state
  const boxState = getBoxState(id);
  const {
    selectedProduct,
    selectedExpiry,
    selectedStrike,
    selectedOptionType,
    lotSize,
    isLoadingOptions,
  } = boxState;

  // Order submission state
  const [isOrderLoading, setIsOrderLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Real-time data loading state
  const [isRealTimeDataLoading, setIsRealTimeDataLoading] = useState(true);

  // Symbol list state
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [isSymbolChangeLoading, setIsSymbolChangeLoading] = useState(false);
  const dropdownContainerRef = useRef(null);

  // Get the correct option data based on selected option type
  const getOptionDataByType = React.useCallback(
    (optionType) => {
      if (!selectedStrike || !selectedProduct || !selectedExpiry) {
        return null;
      }

      const cacheKey = `${selectedProduct}_${selectedExpiry}`;
      const cachedData = optionChainCache[cacheKey];

      if (!cachedData) {
        return null;
      }

      // Get the correct list based on option type
      const optionList =
        optionType === "CE" ? cachedData.ceList : cachedData.peList;

      // Find the option that matches the selected strike price and option type
      const currentOption = optionList.find(
        (option) => option.strikePrice === selectedStrike,
      );

      if (!currentOption) {
        return null;
      }

      // Use the identifier that matches the optionChain format
      const finalIdentifier =
        currentOption.identifier ||
        currentOption.symbolIdentifierId ||
        `${currentOption.symbol}_${currentOption.strikePrice}_${optionType}`;

      return {
        ...currentOption,
        optionType: optionType,
        identifier: finalIdentifier,
      };
    },
    [selectedStrike, selectedProduct, selectedExpiry, optionChainCache],
  );

  // Get current option data (for backward compatibility)
  const currentOptionData = getCurrentOptionData(id);

  const ceOptionData = getOptionDataByType("CE");
  const peOptionData = getOptionDataByType("PE");

  // Memoize the option data arrays to prevent infinite loops
  const ceOptionDataArray = useMemo(() => {
    return ceOptionData && ceOptionData.identifier ? [ceOptionData] : [];
  }, [ceOptionData?.identifier, id]); // Add id to force recreation when box is reopened

  const peOptionDataArray = useMemo(() => {
    return peOptionData && peOptionData.identifier ? [peOptionData] : [];
  }, [peOptionData?.identifier, id]); // Add id to force recreation when box is reopened

  // Add unique identifiers to force fresh subscriptions when the same symbol is reopened
  const [subscriptionTimestamp, setSubscriptionTimestamp] = useState(
    Date.now(),
  );

  const ceOptionDataArrayWithKey = useMemo(() => {
    return ceOptionDataArray.map((data) => ({
      ...data,
      _uniqueKey: `${id}_${subscriptionTimestamp}`, // Add unique key to force fresh subscription
    }));
  }, [ceOptionDataArray, id, subscriptionTimestamp]);

  const peOptionDataArrayWithKey = useMemo(() => {
    return peOptionDataArray.map((data) => ({
      ...data,
      _uniqueKey: `${id}_${subscriptionTimestamp}`, // Add unique key to force fresh subscription
    }));
  }, [peOptionDataArray, id, subscriptionTimestamp]);

  // Subscribe to real-time data
  const symbolValueCE =
    useSymbolDetails(ceOptionDataArrayWithKey, "optionChain") || {};
  const symbolValuePE =
    useSymbolDetails(peOptionDataArrayWithKey, "optionChain") || {};

  // Ensure we have valid data structures
  const safeSymbolValueCE =
    typeof symbolValueCE === "object" ? symbolValueCE : {};
  const safeSymbolValuePE =
    typeof symbolValuePE === "object" ? symbolValuePE : {};

  // Ensure symbol is always a string
  const symbolDisplay =
    typeof symbol === "string"
      ? symbol
      : symbol?.name || symbol?.identifier || symbol?.tradeSymbol || "NIFTY";

  const [orderType, setOrderType] = useState("buy"); // 'buy' or 'sell'
  const [quantity, setQuantity] = useState(1);
  const [productType, setProductType] = useState("MIS"); // 'CNC' or 'MIS'
  const [selectedBroker, setSelectedBroker] = useState(""); // Will be set from broker config

  const signalRContext = useSignalR();

  // Get max lot based on panel name (symbol name)
  const getMaxLot = React.useCallback(() => {
    if (!activeSubscriptionFeatures) return null;

    // Check if maxLotSet exists in activeSubscriptionFeatures
    const maxLot =
      activeSubscriptionFeatures?.maxLots ||
      activeSubscriptionFeatures?.maxLot ||
      null;

    // If maxLotSet is an object with panel-specific limits, get by symbol name
    if (typeof maxLot === "object" && maxLot !== null) {
      const symbolName =
        symbolDisplay?.toUpperCase() || symbol?.toUpperCase() || "";
      return maxLot[symbolName] || maxLot[symbol] || maxLot.default || null;
    }

    // If maxLotSet is a number, return it
    if (typeof maxLot === "number") {
      return maxLot;
    }

    // If maxLotSet is a string, try to parse it
    if (typeof maxLot === "string") {
      const parsed = parseInt(maxLot);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }, [activeSubscriptionFeatures, symbolDisplay, symbol]);

  // Monitor id changes and ensure proper initialization
  useEffect(() => {
    if (id) {
      // Force a re-render when id becomes valid
      setSubscriptionTimestamp(Date.now());
    }
  }, [id]);

  // Fetch available symbols
  const fetchAvailableSymbols = React.useCallback(async () => {
    try {
      setIsLoadingSymbols(true);
      const symbolsData = await fetchWatchList({
        categoryID: 5,
        identifier: "",
      });

      if (symbolsData && Array.isArray(symbolsData)) {
        // Get top 3 and bottom 2 symbols
        const topSymbols = symbolsData.slice(0, 4);
        const bottomSymbols = symbolsData.slice(-2);

        // Combine top and bottom symbols, avoiding duplicates
        const combinedSymbols = [...topSymbols];
        bottomSymbols.forEach((symbol) => {
          if (
            !combinedSymbols.find(
              (s) => s.symbolIdentifierId === symbol.symbolIdentifierId,
            )
          ) {
            combinedSymbols.push(symbol);
          }
        });

        setAvailableSymbols(combinedSymbols);
      }
    } catch (error) {
      // Error fetching symbols
    } finally {
      setIsLoadingSymbols(false);
    }
  }, []);

  // Load symbols when component mounts
  useEffect(() => {
    fetchAvailableSymbols();
  }, [fetchAvailableSymbols]);

  // Calculate dropdown position when it opens - Not needed for absolute positioning
  // Position will be calculated by CSS relative to container

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isSymbolDropdownOpen &&
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target) &&
        !event.target.closest(".symbol-dropdown")
      ) {
        setIsSymbolDropdownOpen(false);
      }
    };

    if (isSymbolDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSymbolDropdownOpen]);

  // Handle symbol change
  const handleSymbolChange = async (newSymbol) => {
    try {
      setIsSymbolChangeLoading(true);

      if (onClose) {
        onClose();
      }

      // Add new trading box with selected symbol
      await addTradingBox(newSymbol);
    } catch (error) {
      // Error changing symbol
    } finally {
      setIsSymbolChangeLoading(false);
    }
  };

  // Handle symbol selection from dropdown
  const handleSymbolSelection = async (symbol) => {
    try {
      setIsSymbolChangeLoading(true);
      setIsSymbolDropdownOpen(false);

      // Update current trading box instead of creating new one
      const currentBox = tradingBoxes.find((box) => box.id === id);
      if (currentBox) {
        // Create updated box with new symbol but same position
        const updatedBox = {
          ...currentBox,
          id: id, // Keep the same ID
          symbol: symbol?.identifier || symbol?.symbolName || symbol,
          symbolDisplay: symbol?.identifier || symbol?.symbolName || "Unknown",
          // Pass the complete symbol data for API calls
          symbolIdentifierId:
            symbol?.symbolIdentifierId || symbol?.identifierId || symbol?.id,
          product:
            symbol?.product || symbol?.name || symbol?.identifier || "NIFTY",
          name: symbol?.symbolName || symbol?.name,
          identifier: symbol?.identifier,
          tradeSymbol: symbol?.symbolName || symbol?.tradeSymbol,
        };
        // Update the box with new symbol data
        await addTradingBox(updatedBox);
      }
    } catch (error) {
      // Error changing symbol
    } finally {
      setIsSymbolChangeLoading(false);
    }
  };

  // Fetch broker configuration on component mount
  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const brokers = await getBrokerConfig();
        if (brokers && brokers.length > 0) {
          setSelectedBroker(brokers[0]?.brokerconfigID?.toString() || "");
        }
      } catch (error) {
        // Error fetching broker configuration
      }
    };

    fetchBrokers();
  }, [getBrokerConfig]);

  // Force re-subscription when connection becomes active
  useEffect(() => {
    if (signalRContext?.isConnectionActive && (ceOptionData || peOptionData)) {
      // Force resubscription by calling the SignalR functions directly
      if (ceOptionData?.identifier) {
        signalRContext.ordersignalr(ceOptionData.identifier);
      }
      if (peOptionData?.identifier) {
        signalRContext.ordersignalr(peOptionData.identifier);
      }
    }
  }, [
    signalRContext?.isConnectionActive,
    ceOptionData,
    peOptionData,
    signalRContext,
  ]);

  // Force fresh subscription when option data changes
  useEffect(() => {
    if (ceOptionData || peOptionData) {
      setSubscriptionTimestamp(Date.now());
    }
  }, [ceOptionData?.identifier, peOptionData?.identifier]);

  // Manual retry function for real-time data
  const retryRealTimeData = React.useCallback(() => {
    // Force fresh subscription by updating timestamp
    setSubscriptionTimestamp(Date.now());

    // Force re-subscription by calling the SignalR functions directly
    if (signalRContext && (ceOptionData || peOptionData)) {
      if (ceOptionData?.identifier) {
        signalRContext.ordersignalr(ceOptionData.identifier);
      }
      if (peOptionData?.identifier) {
        signalRContext.ordersignalr(peOptionData.identifier);
      }
    }
  }, [signalRContext, ceOptionData, peOptionData]);

  // Auto-retry mechanism for when real-time data is not received
  useEffect(() => {
    const checkRealTimeData = () => {
      const ceData = safeSymbolValueCE[ceOptionData?.identifier];
      const peData = safeSymbolValuePE[peOptionData?.identifier];

      if (
        (ceOptionData && !ceData?.lastTradePrice) ||
        (peOptionData && !peData?.lastTradePrice)
      ) {
        setTimeout(() => {
          retryRealTimeData();
        }, 2000); // Retry after 2 seconds
      }
    };

    const timer = setTimeout(checkRealTimeData, 5000); // Check after 5 seconds

    return () => clearTimeout(timer);
  }, [
    ceOptionData,
    peOptionData,
    safeSymbolValueCE,
    safeSymbolValuePE,
    retryRealTimeData,
  ]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // The useSymbol hook will handle the cleanup automatically
    };
  }, [id]);

  // Monitor real-time data loading state
  useEffect(() => {
    const currentOptionDataByType =
      selectedOptionType === "CE" ? ceOptionData : peOptionData;

    if (currentOptionDataByType) {
      const realTimeData =
        selectedOptionType === "CE"
          ? safeSymbolValueCE[currentOptionDataByType.identifier]
          : safeSymbolValuePE[currentOptionDataByType.identifier];

      // Check if we have real-time data
      const hasRealTimeData =
        realTimeData?.lastTradePrice &&
        parseFloat(realTimeData.lastTradePrice) > 0;

      if (hasRealTimeData) {
        setIsRealTimeDataLoading(false);
      }
    }
  }, [
    ceOptionData,
    peOptionData,
    safeSymbolValueCE,
    safeSymbolValuePE,
    selectedOptionType,
  ]);

  // Reset loading state when option data changes
  useEffect(() => {
    if (ceOptionData || peOptionData) {
      setIsRealTimeDataLoading(true);
    }
  }, [ceOptionData?.identifier, peOptionData?.identifier]);

  // Get available strikes with ATM/ITM/OTM labels
  const availableStrikes = getAvailableStrikes(id);

  // Get the currently selected option label
  const getSelectedOptionLabel = React.useCallback(() => {
    if (!selectedStrike || !availableStrikes) return "ATM"; // Default to ATM
    const selectedOption = availableStrikes.find(
      (option) => option.strikePrice === selectedStrike,
    );
    return selectedOption ? selectedOption.label : "ATM"; // Default to ATM if not found
  }, [selectedStrike, availableStrikes]);

  // Get real-time price and price change data for current option
  const getRealTimeData = React.useCallback(() => {
    if (!currentOptionData) {
      return { price: "0.00", change: 0, percentage: 0 };
    }

    // Get the correct option data based on selected type
    const currentOptionDataByType =
      selectedOptionType === "CE" ? ceOptionData : peOptionData;

    if (!currentOptionDataByType) {
      return { price: "0.00", change: 0, percentage: 0 };
    }

    const realTimeData =
      selectedOptionType === "CE"
        ? safeSymbolValueCE[currentOptionDataByType.identifier]
        : safeSymbolValuePE[currentOptionDataByType.identifier];

    // Try multiple sources for price data with fallbacks
    let price = "0.00";

    // First try real-time data
    if (
      realTimeData?.lastTradePrice &&
      parseFloat(realTimeData.lastTradePrice) > 0
    ) {
      price = String(realTimeData.lastTradePrice);
    }
    // Fallback to option data
    else if (
      currentOptionDataByType.lastTradePrice &&
      parseFloat(currentOptionDataByType.lastTradePrice) > 0
    ) {
      price = String(currentOptionDataByType.lastTradePrice);
    }
    // Fallback to sell price
    else if (
      currentOptionDataByType.sellPrice &&
      parseFloat(currentOptionDataByType.sellPrice) > 0
    ) {
      price = String(currentOptionDataByType.sellPrice);
    }
    // Fallback to buy price
    else if (
      currentOptionDataByType.buyPrice &&
      parseFloat(currentOptionDataByType.buyPrice) > 0
    ) {
      price = String(currentOptionDataByType.buyPrice);
    }
    // Final fallback - use a default price based on strike
    else if (selectedStrike && parseFloat(selectedStrike) > 0) {
      // For options, use a small percentage of strike price as default
      const defaultPrice = (parseFloat(selectedStrike) * 0.01).toFixed(2);
      price = defaultPrice;
    }

    // Calculate price change and percentage
    const currentPriceNum = parseFloat(price) || 0;
    const previousPrice =
      parseFloat(
        realTimeData?.closePrice ||
          currentOptionDataByType?.closePrice ||
          price,
      ) || 0;
    const change = currentPriceNum - previousPrice;
    const percentage = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    // Ensure we have valid numbers
    const validChange = isNaN(change) ? 0 : change;
    const validPercentage = isNaN(percentage) ? 0 : percentage;

    return {
      price: price.toString(),
      change: validChange,
      percentage: validPercentage,
    };
  }, [
    currentOptionData,
    selectedOptionType,
    ceOptionData,
    peOptionData,
    safeSymbolValueCE,
    safeSymbolValuePE,
    selectedStrike,
  ]);

  // Don't render if id is undefined
  if (!id) {
    return null;
  }

  const {
    price: currentPrice,
    change: priceChange,
    percentage: pricePercentage,
  } = getRealTimeData();

  const handleQuantityChange = (change) => {
    const newQuantity = Math.max(1, quantity + change);
    const maxLot = getMaxLot();

    // Validate against max lot if available
    if (maxLot !== null && newQuantity > maxLot) {
      errorMsg(
        `Maximum lot limit is ${maxLot} for ${symbolDisplay || symbol}. You cannot exceed this limit.`,
      );
      setQuantity(maxLot);
      return;
    }

    setQuantity(newQuantity);
  };

  const handlePriceChange = (e) => {
    // Price is now read-only from real-time data
  };

  // Check if buy/sell is allowed based on subscription (same logic as OptionChain)
  const checkSubscriptionFeature = (type) => {
    if (!activeSubscriptionFeatures) {
      return false;
    }
    const optionChain = activeSubscriptionFeatures.optionChain;
    if (!optionChain) {
      return false;
    }
    return type === "buy" ? optionChain.buy == true : optionChain.sell == true;
  };

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onClose) {
      onClose();
    }
  };

  // Order submission function
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Subscription gate for Buy/Sell (aligned with OptionChain)
    if (!checkSubscriptionFeature(orderType)) {
      setSubscriptionDialogOpen(true);
      return;
    }

    // Get the current option data based on selected type
    const currentOptionDataByType =
      selectedOptionType === "CE" ? ceOptionData : peOptionData;

    if (!currentOptionDataByType) {
      errorMsg("Please select a valid option");
      return;
    }

    // Validate max lot before submitting order
    const maxLot = getMaxLot();
    if (maxLot !== null && quantity > maxLot) {
      errorMsg(
        `Maximum lot limit is ${maxLot} for ${symbolDisplay || symbol}. Your order quantity (${quantity}) exceeds this limit. Please reduce the quantity.`,
      );
      return;
    }

    // Prepare order data with all fields exactly like optionChain
    const orderData = {
      SymbolID: 0,
      Type: 1, // 1 for buy, 2 for sell
      OrderType: orderType === "buy" ? 1 : 2, // Market order
      Quantity: quantity,
      EntryPrice: parseFloat(currentPrice) || 0,
      VolumePrice: "",
      Commission: "",
      TotalPurchaseAmt:
        (parseFloat(currentPrice) || 0) *
        quantity *
        (lotSize?.QuotationLot || lotSize?.quotationLot || lotSize || 50),
      isLimitOrder: "",
      isMarketOrder: "",
      isStopLoss: true,
      StopLossPer: "",
      StopLossEstPrice: (() => {
        // Calculate stop loss based on option type and trade direction (same logic as optionChain)
        const lastTradePrice = parseFloat(currentPrice) || 0;
        let stopLossPrice = lastTradePrice - (lastTradePrice * 25) / 100;

        if (orderType === "sell") {
          stopLossPrice =
            parseFloat(lastTradePrice) +
            (parseFloat(lastTradePrice) * 25) / 100;
        }

        return parseFloat(parseFloat(stopLossPrice).toFixed(2));
      })(),
      isTakeProfit: false,
      TakeProfitPer: "",
      TakeProfitEstPrice: 0,
      OrderStatus: 1,
      BrokerConfigID: parseInt(selectedBroker) || 0,
      SellPrice:
        parseFloat(currentOptionDataByType?.sellPrice || currentPrice) || 0,
      BuyPrice:
        parseFloat(currentOptionDataByType?.buyPrice || currentPrice) || 0,
      ClosedPrice: "",
      ProductType: productType === "CNC" ? 1 : 2, // 1 for CNC, 2 for MIS
      ProfitLost: "",
      IdentifierId:
        currentOptionDataByType.symbolIdentifierId ||
        currentOptionDataByType.identifierId ||
        currentOptionDataByType.symbolID ||
        0,
      IsSettled: "",
      iSAutoTrade: false,
      BrokerStatus: "",
      OrderID: 0,
    };

    // Define the validation schema for the form
    const validationSchema = Joi.object({
      Quantity: Joi.number().required().min(1).messages({
        "any.required": "Quantity is required.",
        "number.min": "Quantity must be greater than 0",
      }),
      BrokerConfigID: Joi.number().required().label("Broker").messages({
        "any.required": "Broker is required.",
      }),
      EntryPrice: Joi.number().required().min(0.01).messages({
        "any.required": "Price is required.",
        "number.min": "Price must be greater than 0",
      }),
    }).unknown(true);

    // Use validateFormData from validation.js to validate the form data
    const validationResponse = await validateFormData(
      orderData,
      validationSchema,
    );

    // If validation fails, set the errors
    if (!validationResponse.status) {
      setFormErrors(validationResponse.errors);
      return;
    }

    // Clear any previous errors
    setFormErrors({});

    // Calculate total quantity (quantity * lot size)
    const totalQuantity =
      orderData.Quantity *
      (lotSize?.QuotationLot || lotSize?.quotationLot || lotSize || 50);
    orderData.Quantity = totalQuantity;

    setIsOrderLoading(true);

    try {
      const result = await asyncPostCreateOrder({ formData: orderData });

      if (result?.data?.message === "Success") {
        successMsg("Order placed successfully...");
        if (onClose) {
          onClose();
        }
      } else {
        errorMsg(result?.data?.message || "Order placement failed");
      }
    } catch (loginError) {
      // Error handling
    } finally {
      setIsOrderLoading(false);
    }
  };

  return (
    <div className="trading-box">
      <div className="trading-box-header">
        <div className="header-drag-area" style={{ cursor: "move" }}>
          <div className="symbol-info">
            <div className="symbol-price">
              <div
                className="symbol-dropdown-container"
                ref={dropdownContainerRef}
              >
                <button
                  className="symbol-dropdown-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isSymbolChangeLoading) {
                      setIsSymbolDropdownOpen((prev) => !prev);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (!isSymbolChangeLoading) {
                      setIsSymbolDropdownOpen((prev) => !prev);
                    }
                  }}
                  type="button"
                  disabled={isSymbolChangeLoading}
                >
                  <span className="symbol">
                    {isSymbolChangeLoading
                      ? "Loading..."
                      : String(symbolDisplay || "")}
                  </span>
                  {isSymbolChangeLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <IconRegistry
                      name="caret-down"
                      className="dropdown-arrow"
                    />
                  )}
                </button>

                {isSymbolDropdownOpen && (
                  <div
                    className="symbol-dropdown"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      zIndex: 10001,
                      visibility: "visible",
                      opacity: 1,
                    }}
                  >
                    <div className="dropdown-header">
                      <span>Select Symbol</span>
                      <button
                        className="close-dropdown-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsSymbolDropdownOpen(false);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setIsSymbolDropdownOpen(false);
                        }}
                        type="button"
                      >
                        <FiX size={18} color="#dc3545" />
                      </button>
                    </div>
                    <div className="symbol-list">
                      {isLoadingSymbols ? (
                        <div className="loading-symbols">
                          Loading symbols...
                        </div>
                      ) : availableSymbols.length > 0 ? (
                        availableSymbols
                          .filter(
                            (symbol) =>
                              symbol?.identifier !== symbolDisplay &&
                              symbol?.symbolName !== symbolDisplay,
                          )
                          .slice(0, 6) // Limit to 6 symbols to avoid scrolling
                          .map((symbol, index) => (
                            <button
                              key={index}
                              className="symbol-option"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleSymbolSelection(symbol);
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleSymbolSelection(symbol);
                              }}
                              type="button"
                            >
                              <span className="symbol-name">
                                {symbol?.identifier || symbol?.symbolName}
                              </span>
                              <span className="symbol-details">
                                {symbol?.symbolName || ""}
                              </span>
                            </button>
                          ))
                      ) : (
                        <div className="loading-symbols">
                          No symbols available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <span className="price">
                {isRealTimeDataLoading ? (
                  <span style={{ color: "#ffa500" }}>Loading...</span>
                ) : (
                  <>
                    {String(currentPrice || "0.00")}
                    {parseFloat(currentPrice || "0") === 0 && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#ff6b6b",
                          marginLeft: "4px",
                        }}
                      >
                        (No RT Data)
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="price-change">
              <span
                className={`change-arrow ${priceChange >= 0 ? "up" : "down"}`}
              >
                {priceChange >= 0 ? "▲" : "▼"}
              </span>
              <span
                className={`change-value ${
                  priceChange >= 0 ? "positive" : "negative"
                }`}
              >
                {priceChange >= 0 ? "+" : ""}
                {isNaN(priceChange) ? "0.00" : priceChange.toFixed(2)} (
                {pricePercentage >= 0 ? "+" : ""}
                {isNaN(pricePercentage) ? "0.00" : pricePercentage.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="header-controls">
          <button
            className="close-btn"
            onClick={handleClose}
            type="button"
            title="Close Trading Box"
          >
            <FiX size={20} color="#dc3545" />
          </button>
        </div>
      </div>

      <div className="trading-box-content">
        {/* Vertical Controls Layout */}
        <div className="controls-container-vertical">
          {/* Required funds + MPP row (above Buy/Sell) */}
          <div className="control-group-vertical" style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
                width: "100%",
                fontSize: "14px",
              }}
            >
              <span>
                <Tooltip
                  arrow
                  componentsProps={tooltipDesign}
                  enterTouchDelay={0}
                  title={
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "1rem",
                          marginBottom: 8,
                          borderBottom: "1px solid rgba(255,255,255,0.3)",
                          paddingBottom: 6,
                        }}
                      >
                        <strong>Market Price Protection for Your Safety</strong>
                      </div>
                      <p style={{ margin: 0, marginTop: 4 }}>
                        Market orders placed through Quick Algoplus come with
                        built-in price protection. Following exchange rules,
                        your broker may automatically convert market orders to
                        limit orders within a safe price range (usually ±2.5% of
                        current market price). This protects you from extreme,
                        unexpected price movements.
                      </p>
                    </div>
                  }
                  slotProps={{
                    popper: {
                      sx: {
                        zIndex: 10001,
                        "& .MuiTooltip-tooltip": {
                          backgroundColor: "#1e3a5f",
                          color: "#e8f4fc",
                          maxWidth: 380,
                          padding: "12px 14px",
                          fontSize: "0.95rem",
                          lineHeight: 1.5,
                          borderRadius: 0,
                        },
                      },
                    },
                  }}
                >
                  <span style={{ cursor: "pointer", fontWeight: 600 }}>
                    MPP <IconRegistry name="exclamation-octagon" />
                  </span>
                </Tooltip>
              </span>
              <span style={{ fontWeight: 600 }}>
                Required funds:{" "}
                {(
                  (parseFloat(currentPrice) || 0) *
                  quantity *
                  (lotSize?.QuotationLot ||
                    lotSize?.quotationLot ||
                    lotSize ||
                    50)
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Buy/Sell Toggle */}
          <div className="control-group-vertical">
            <div className="order-type-toggle">
              <button
                className={`toggle-btn buy ${
                  orderType === "buy" ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!checkSubscriptionFeature("buy")) {
                    setSubscriptionDialogOpen(true);
                    return;
                  }
                  setOrderType("buy");
                }}
                type="button"
              >
                B
              </button>
              <button
                className={`toggle-btn sell ${
                  orderType === "sell" ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!checkSubscriptionFeature("sell")) {
                    setSubscriptionDialogOpen(true);
                    return;
                  }
                  setOrderType("sell");
                }}
                type="button"
              >
                S
              </button>
            </div>
          </div>

          {/* Option Type Controls */}
          <div className="control-group-vertical">
            <div className="option-type-controls">
              <button
                className={`option-btn ${
                  selectedOptionType === "CE" ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateOptionType(id, "CE");
                }}
                type="button"
              >
                CE
              </button>
              <button
                className={`option-btn ${
                  selectedOptionType === "PE" ? "active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateOptionType(id, "PE");
                }}
                type="button"
              >
                PE
              </button>
            </div>
          </div>

          {/* Strike Price Dropdown */}
          <div className="control-group-vertical">
            <div className="strike-type-dropdown">
              <select
                className="strike-select"
                value={getSelectedOptionLabel()}
                size={1}
                disabled={isLoadingOptions || !selectedExpiry}
                onChange={(e) => {
                  e.stopPropagation();
                  const selectedOption = availableStrikes.find(
                    (option) => option.label === e.target.value,
                  );
                  updateStrikePrice(
                    id,
                    selectedOption ? selectedOption.strikePrice : null,
                  );
                  // Close dropdown after selection with small delay
                  const selectElement = e.target;
                  setTimeout(() => {
                    selectElement.size = 1;
                    // Don't blur immediately - let user see the selection
                    setTimeout(() => {
                      selectElement.blur();
                    }, 100);
                  }, 50);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  // Prevent default to handle manually
                  if (e.target.size === 1) {
                    e.preventDefault();
                    // Expand dropdown when clicked - show all options
                    e.target.size = Math.min(
                      availableStrikes?.length || 1,
                      availableStrikes?.length || 1,
                    );
                    // Focus immediately for desktop
                    e.target.focus();
                  }
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  // Handle touch events for mobile
                  const selectElement = e.currentTarget;
                  if (selectElement.size === 1 && !selectElement.disabled) {
                    // Expand dropdown - show all options
                    selectElement.size = Math.min(
                      availableStrikes?.length || 1,
                      availableStrikes?.length || 1,
                    );
                    // Force focus immediately for mobile - no delay
                    requestAnimationFrame(() => {
                      selectElement.focus();
                      // Ensure it's visible
                      selectElement.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                    });
                  }
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  // Ensure dropdown stays open on touch end
                  const selectElement = e.currentTarget;
                  if (selectElement.size === 1 && !selectElement.disabled) {
                    selectElement.size = Math.min(
                      availableStrikes?.length || 1,
                      availableStrikes?.length || 1,
                    );
                    // Keep dropdown open - focus immediately
                    requestAnimationFrame(() => {
                      selectElement.focus();
                      selectElement.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                    });
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const selectElement = e.currentTarget;
                  if (selectElement.disabled) {
                    return;
                  }
                  // Toggle dropdown - if expanded, collapse; if collapsed, expand
                  if (selectElement.size === 1) {
                    // Expand dropdown when clicked - show all options
                    selectElement.size = Math.min(
                      availableStrikes?.length || 1,
                      availableStrikes?.length || 1,
                    );
                    // Focus immediately
                    requestAnimationFrame(() => {
                      selectElement.focus();
                    });
                  } else {
                    // Don't collapse on click - let user select
                    // Only collapse on blur
                  }
                }}
                onBlur={(e) => {
                  // Delay collapse to allow selection - different delays for different views
                  const isMobile = window.innerWidth <= 768;
                  const isLandscape = window.innerHeight < window.innerWidth;

                  // Longer delay for mobile, especially portrait
                  let delay = 200; // Default desktop
                  if (isMobile && !isLandscape) {
                    delay = 400; // Mobile portrait - longest delay
                  } else if (isMobile && isLandscape) {
                    delay = 300; // Mobile landscape
                  } else if (isLandscape) {
                    delay = 250; // Desktop landscape
                  }

                  setTimeout(() => {
                    // Only collapse if still blurred and not focused
                    if (
                      e.target.size !== 1 &&
                      document.activeElement !== e.target
                    ) {
                      e.target.size = 1;
                    }
                  }, delay);
                }}
              >
                {isLoadingOptions ? (
                  <option value="">Loading strikes...</option>
                ) : availableStrikes && availableStrikes.length > 0 ? (
                  availableStrikes.map((option, index) => (
                    <option
                      key={`${option.label}-${option.strikePrice}-${index}`}
                      value={option.label}
                    >
                      {option.label}
                    </option>
                  ))
                ) : (
                  <option value="ATM">ATM</option>
                )}
              </select>
            </div>
          </div>

          {/* Quantity Input with Lots and Lot Size */}
          <div className="control-group-vertical">
            <div className="quantity-wrapper">
              <div className="quantity-input">
                <div
                  className="quantity-label-top"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "6px",
                    width: "100%",
                  }}
                >
                  <span>
                    Lot Size:{" "}
                    {lotSize?.QuotationLot ||
                      lotSize?.quotationLot ||
                      lotSize ||
                      "50"}
                  </span>
                  <Tooltip
                    arrow
                    componentsProps={tooltipDesign}
                    enterTouchDelay={0}
                    title={
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "1rem",
                            marginBottom: 8,
                            borderBottom: "1px solid rgba(255,255,255,0.3)",
                            paddingBottom: 6,
                          }}
                        >
                          <strong>
                            Market Price Protection for Your Safety
                          </strong>
                        </div>
                        <p style={{ margin: 0, marginTop: 4 }}>
                          Market orders placed through Quick Algoplus come with
                          built-in price protection. Following exchange rules,
                          your broker may automatically convert market orders to
                          limit orders within a safe price range (usually ±2.5%
                          of current market price). This protects you from
                          extreme, unexpected price movements.
                        </p>
                      </div>
                    }
                    slotProps={{
                      popper: {
                        sx: {
                          zIndex: 10001,
                          "& .MuiTooltip-tooltip": {
                            backgroundColor: "#1e3a5f",
                            color: "#e8f4fc",
                            maxWidth: 380,
                            padding: "12px 14px",
                            fontSize: "0.95rem",
                            lineHeight: 1.5,
                            borderRadius: 0,
                          },
                        },
                      },
                    }}
                  >
                    <span style={{ cursor: "pointer", fontWeight: 600 }}>
                      MPP <IconRegistry name="exclamation-octagon" />
                    </span>
                  </Tooltip>
                </div>
                <div className="quantity-controls">
                  <button
                    className="quantity-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(-1);
                    }}
                    type="button"
                  >
                    <IconRegistry name="caret-down" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newQuantity = parseInt(e.target.value) || 1;
                      const maxLot = getMaxLot();

                      // Validate against max lot if available
                      if (maxLot !== null && newQuantity > maxLot) {
                        errorMsg(
                          `Maximum lot limit is ${maxLot} for ${symbolDisplay || symbol}. You cannot exceed this limit.`,
                        );
                        setQuantity(maxLot);
                        return;
                      }

                      setQuantity(Math.max(1, newQuantity));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="quantity-field"
                    max={getMaxLot() || undefined}
                  />
                  <button
                    className="quantity-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuantityChange(1);
                    }}
                    type="button"
                  >
                    <IconRegistry name="caret-up" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Type Controls (CNC/MIS) */}
          <div className="control-group-vertical">
            <div className="product-type-controls">
              <button
                className={`product-btn ${productType === "CNC" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProductType("CNC");
                }}
                type="button"
              >
                CNC
              </button>
              <button
                className={`product-btn ${productType === "MIS" ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setProductType("MIS");
                }}
                type="button"
              >
                MIS
              </button>
            </div>
          </div>

          {/* Broker Selection */}
          <div className="control-group-vertical">
            <div className="broker-selection">
              <div className="broker-select-container">
                <select
                  className="broker-select"
                  value={selectedBroker}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedBroker(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isLoadingBrokers}
                >
                  {isLoadingBrokers ? (
                    <option value="">Loading brokers...</option>
                  ) : brokerConfigList && brokerConfigList.length > 0 ? (
                    brokerConfigList.map((broker) => (
                      <option
                        key={
                          broker?.brokerconfigID ||
                          broker?.brokerName ||
                          "unknown"
                        }
                        value={broker?.brokerconfigID?.toString() || ""}
                      >
                        {broker?.brokerName || "Unknown Broker"}
                      </option>
                    ))
                  ) : (
                    <option value="">No brokers available</option>
                  )}
                </select>
                <button
                  className="broker-refresh-btn"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await refreshBrokerList();
                    } catch (error) {
                      // Error refreshing brokers
                    }
                  }}
                  disabled={isLoadingBrokers}
                  title="Refresh broker list"
                  type="button"
                >
                  {isLoadingBrokers ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <IconRegistry name="refresh" size={16} color="#dc3545" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Price Input - Hidden */}
          {/* <div className="control-group-vertical">
            <div className="price-input">
              <input
                type="text"
                value={
                  isRealTimeDataLoading
                    ? "Loading..."
                    : String(currentPrice || "0.00")
                }
                onChange={(e) => {
                  e.stopPropagation();
                  handlePriceChange(e);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`price-field ${
                  isRealTimeDataLoading ? "loading" : ""
                }`}
                placeholder="Price"
                readOnly
              />
            </div>
          </div> */}

          {/* Stop Loss Estimated Price Display */}
          <div className="control-group-vertical">
            <div className="stop-loss-display">
              {(() => {
                // Calculate stop loss based on option type and trade direction
                const lastTradePrice = parseFloat(currentPrice) || 0;
                let stopLossPrice =
                  lastTradePrice - (lastTradePrice * 25) / 100;

                if (orderType === "sell") {
                  stopLossPrice =
                    parseFloat(lastTradePrice) +
                    (parseFloat(lastTradePrice) * 25) / 100;
                }

                // Calculate SL points (difference between current price and stop loss)
                const slPoints = Math.abs(lastTradePrice - stopLossPrice);

                // Calculate loss in Rs: SL points * lot size * quantity (always negative for loss)
                const lotSizeValue =
                  lotSize?.QuotationLot ||
                  lotSize?.quotationLot ||
                  lotSize ||
                  50;
                const lossInRs = -(slPoints * lotSizeValue * quantity);

                return (
                  <div className="stop-loss-single-line">
                    <span className="stop-loss-label">SL Est:</span>
                    <span className="stop-loss-value">
                      {parseFloat(parseFloat(stopLossPrice).toFixed(2))}
                    </span>
                    <span className="stop-loss-separator">|</span>
                    <span className="stop-loss-label">Loss:</span>
                    <span className="stop-loss-loss-value">
                      ₹{parseFloat(lossInRs).toFixed(2)}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {Object.keys(formErrors).length > 0 && (
          <div className="error-display">
            {Object.values(formErrors).map((error, index) => (
              <div key={index} className="error-message">
                {error}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className={`buy-btn ${orderType} ${
              isOrderLoading ? "loading" : ""
            }`}
            onClick={handleOrderSubmit}
            type="button"
            disabled={isOrderLoading}
          >
            {isOrderLoading
              ? "Processing..."
              : isRealTimeDataLoading
                ? "Loading..."
                : `${orderType.toUpperCase()} @ ${String(
                    currentPrice || "0.00",
                  )}`}
          </button>
        </div>
      </div>
      {subscriptionDialogOpen && (
        <SubscriptionDialog
          open={subscriptionDialogOpen}
          handleClose={() => setSubscriptionDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default TradingBox;
