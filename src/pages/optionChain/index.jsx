import { IconRegistry } from "#components";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import "./optionChain.scss";
import useOptionChain from "./optionChain";
import useSymbolDetails from "#hooks/useSymbol";
import { FiSearch, FiX } from "react-icons/fi";
import { fetchSymbolLotSize } from "#utils/watchList";
import { SubscriptionDialog } from "#components";
import Tooltip from "@mui/material/Tooltip";
import { TextData, tooltipDesign } from "#constant/index";
import { FaChartLine } from "react-icons/fa6";
import { ButtonLoader } from "#components";
import { images } from "#helpers";

const OptionChain = () => {
  const {
    optionChainPEList,
    optionChainCEList,
    watchList,
    expiryList,
    setHoveredIndex,
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
    formErrors,
    brokerConfigList,
    isOrderLoading,
    CancelOrder,
    activeSubscriptionFeatures,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    clickedIndex,
    handleScroll,
    chartIdentifier,
    checkSubscriptionFeature,
  } = useOptionChain();
  const symbolValuePE = useSymbolDetails(optionChainPEList, "optionChain");
  const symbolValueCE = useSymbolDetails(optionChainCEList, "optionChain");
  const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);

  const symbolValueCEGreeks = useSymbolDetails(
    optionChainCEList,
    "optionChain",
    0,
    0,
    1,
  );

  const symbolValuePEGreeks = useSymbolDetails(
    optionChainPEList,
    "optionChain",
    0,
    0,
    1,
  );

  // State for Greeks visibility
  const [showGreeks, setShowGreeks] = useState(false);
  const [selectedOptionType, setSelectedOptionType] = useState("CE"); // CE or PE

  // State for mobile responsive features
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [mobileViewMode, setMobileViewMode] = useState("summary"); // "summary", "detailed", "greeks"

  // State for subscription upgrade popup
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] =
    useState("");

  // State for stock selector - simple input-based approach
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [popupPosition, setPopupPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const selectorRef = useRef(null);
  const inputRef = useRef(null);

  // Reset selected option type when Greeks are toggled
  useEffect(() => {
    if (!showGreeks) {
      setSelectedOptionType("CE");
    }
  }, [showGreeks]);

  // Calculate popup position and handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchInput("");
      }
    };

    const calculatePosition = () => {
      if (selectorRef.current && isSearchOpen) {
        const rect = selectorRef.current.getBoundingClientRect();
        setPopupPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    if (isSearchOpen) {
      calculatePosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition);
      // Focus input when opens
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [isSearchOpen]);

  // Filter stocks based on search input
  const filteredStocks = useMemo(() => {
    if (!watchList) return [];
    if (!searchInput.trim()) return watchList;
    const search = searchInput.toLowerCase();
    return watchList.filter((watch) => {
      const watchSymbol = watchListSymbol[watch?.identifier];
      return (
        watchSymbol?.product?.toLowerCase().includes(search) ||
        watchSymbol?.identifier?.toLowerCase().includes(search)
      );
    });
  }, [watchList, searchInput, watchListSymbol]);

  // Get current selected stock
  const currentStock = useMemo(() => {
    if (!watchList || !chartIdentifier) {
      return watchList?.[0];
    }

    // Try to find by identifier first
    const foundByIdentifier = watchList.find((watch) => {
      const watchSymbol = watchListSymbol[watch?.identifier];
      return watchSymbol?.identifier === chartIdentifier?.identifier;
    });
    if (foundByIdentifier) return foundByIdentifier;

    // Try to find by product
    const foundByProduct = watchList.find((watch) => {
      const watchSymbol = watchListSymbol[watch?.identifier];
      return (
        watchSymbol?.product === chartIdentifier?.product ||
        watchSymbol?.product === chartIdentifier?.identifier
      );
    });
    if (foundByProduct) return foundByProduct;

    // Default to first item
    return watchList?.[0];
  }, [watchList, chartIdentifier, watchListSymbol]);

  // Handle stock selection
  const handleStockSelect = (stock) => {
    if (handleChange && stock) {
      const watchSymbol = watchListSymbol[stock?.identifier];
      const syntheticEvent = {
        target: {
          name: "strProduct",
          value: watchSymbol?.product || stock?.product,
        },
      };
      handleChange(syntheticEvent);
    }
    setIsSearchOpen(false);
    setSearchInput("");
  };

  // Handle input click - open selector
  const handleInputClick = () => {
    setIsSearchOpen(true);
    setSearchInput("");
  };

  // Handle input change
  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
    setIsSearchOpen(true);
  };

  // Function to toggle row expansion
  const toggleRowExpansion = (rowId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId);
    } else {
      newExpandedRows.add(rowId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Function to switch mobile view mode
  const switchMobileViewMode = (mode) => {
    setMobileViewMode(mode);
  };

  const futureWatchListSymbol = useSymbolDetails(
    futueWatchList,
    "optionChain",
    1,
  );

  const updateAnalysis = useCallback(
    async (Producttype, type, data) => {
      // Set analysis type immediately for instant UI response
      setIsAnalysis(Producttype);

      // Handle scroll if needed
      if (clickedIndex) {
        handleScroll();
      }

      // Update order data immediately for instant response
      setOrderData((prev) => ({
        ...prev,
        IdentifierId: data?.symbolIdentifierId,
        OrderType: type == "buy" ? 1 : 2,
      }));

      // Fetch lot size asynchronously to not block UI
      try {
        const lotSize = await fetchSymbolLotSize(
          { identifierid: data?.symbolIdentifierId },
          navigate,
        );

        const breakeven = data?.lastTradePrice + data?.strikePrice;
        const TotalPurchaseAmt =
          orderData?.Quantity * lotSize?.quotationLot * data?.lastTradePrice;

        if (type == "buy") {
          let maxLoss = data?.lastTradePrice * lotSize?.quotationLot;
          setAnalysis({
            ...analysis,
            maxProfit: "Unlimited",
            maxLoss: maxLoss,
            identifier: data?.identifier,
            identifierId: data?.symbolIdentifierId,
            lotSize: lotSize?.quotationLot,
            type: type,
            ltp: data?.lastTradePrice,
            breakEven: parseFloat(breakeven).toFixed(2),
          });
        } else {
          let maxProfit = data?.lastTradePrice * lotSize?.quotationLot;
          setAnalysis({
            ...analysis,
            maxProfit: maxProfit,
            maxLoss: "Unlimited",
            identifier: data?.identifier,
            identifierId: data?.symbolIdentifierId,
            lotSize: lotSize?.quotationLot,
            type: type,
            ltp: data?.lastTradePrice,
            breakEven: parseFloat(breakeven).toFixed(2),
          });
        }

        // Update order data with calculated amount
        setOrderData((prev) => ({
          ...prev,
          TotalPurchaseAmt: parseFloat(parseFloat(TotalPurchaseAmt).toFixed(2)),
        }));
      } catch (error) {
        // Handle error silently to not block UI
      }
    },
    [clickedIndex, handleScroll, orderData?.Quantity, analysis, navigate],
  );

  const updatePriceType = (priceType, strikePrice) => {
    if (!strikePrice) return;
    let data = [];

    if (priceType == "CE") {
      data = Object.entries(symbolValueCE).find(
        ([key, value]) => value?.strikePrice == strikePrice,
      );
    }

    if (priceType == "PE") {
      data = Object.entries(symbolValuePE).find(
        ([key, value]) => value?.strikePrice == strikePrice,
      );
    }

    if (data?.length > 0 && data[1]) {
      // Update analysis with new option type data
      updateAnalysis(priceType, analysis?.type || "buy", data[1]);
    } else {
      // Fallback: try to find from option chain lists
      let optionData = null;
      if (priceType == "CE") {
        optionData = optionChainCEList?.find(
          (item) => item?.strikePrice == strikePrice,
        );
      } else if (priceType == "PE") {
        optionData = optionChainPEList?.find(
          (item) => item?.strikePrice == strikePrice,
        );
      }

      if (optionData) {
        // Get real-time data if available
        const realTimeData =
          priceType == "CE"
            ? symbolValueCE[optionData?.identifier]
            : symbolValuePE[optionData?.identifier];

        const dataToUse = realTimeData || optionData;
        if (dataToUse) {
          updateAnalysis(priceType, analysis?.type || "buy", {
            ...dataToUse,
            identifier: optionData?.identifier,
            symbolIdentifierId: optionData?.symbolIdentifierId,
            strikePrice: strikePrice,
          });
        }
      }
    }
  };

  useEffect(() => {
    if (isAnalysis != "" && analysis?.identifier) {
      let IdntSym = "";
      if (isAnalysis == "CE") {
        IdntSym = symbolValueCE[analysis?.identifier];
      } else {
        IdntSym = symbolValuePE[analysis?.identifier];
      }

      if (IdntSym && IdntSym != "") {
        let mtm = 0;
        if (analysis?.type == "buy") {
          mtm = IdntSym?.lastTradePrice * analysis?.lotSize - analysis?.maxLoss;
        } else {
          mtm =
            analysis?.maxProfit - IdntSym?.lastTradePrice * analysis?.lotSize;
        }

        setAnalysis((prev) => ({
          ...prev,
          data: IdntSym,
          mtm: mtm,
        }));

        let Qty = orderData?.Quantity;

        if (Qty == null) {
          Qty = 1;
        }
        const TotalPurchaseAmt =
          Qty * analysis?.lotSize * IdntSym?.lastTradePrice;
        let StopLossEstPrice =
          IdntSym?.lastTradePrice - (IdntSym?.lastTradePrice * 25) / 100;
        if (analysis?.type == "sell") {
          StopLossEstPrice =
            parseFloat(IdntSym?.lastTradePrice) +
            (parseFloat(IdntSym?.lastTradePrice) * 25) / 100;
        }

        setOrderData((prev) => ({
          ...prev,
          EntryPrice: parseFloat(IdntSym?.lastTradePrice),
          SellPrice: parseFloat(IdntSym?.sellPrice),
          BuyPrice: parseFloat(IdntSym?.buyPrice),
          StopLossEstPrice: parseFloat(parseFloat(StopLossEstPrice).toFixed(2)),
        }));
      }
    }
  }, [
    isAnalysis,
    optionChainCEList,
    optionChainPEList,
    symbolValueCE,
    symbolValuePE,
    analysis?.type,
    analysis?.identifier,
  ]);

  const handleMouseEnter = useCallback(
    (key, type) => {
      return () => {
        if (window.matchMedia("(min-width: 1025px)").matches) {
          setHoveredIndex(key);
          setHoveredType(type);
        }
      };
    },
    [setHoveredIndex, setHoveredType],
  );

  // State for order popup
  const [orderPopupOpen, setOrderPopupOpen] = useState(false);
  const [selectedOptionData, setSelectedOptionData] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Function to open order popup - optimized for instant response
  const openOrderPopup = useCallback(
    (optionData, orderType) => {
      // Check subscription before opening popup
      if (!checkSubscriptionFeature(orderType)) {
        const featureName = orderType === "buy" ? "Buy" : "Sell";
        setSubscriptionUpgradeMessage(
          `Your current subscription does not include Option Chain ${featureName} feature. Please upgrade your subscription to use this feature.`,
        );
        setSubscriptionUpgradeOpen(true);
        return;
      }

      // Open popup immediately for instant response
      setOrderPopupOpen(true);
      setSelectedOptionData(optionData);

      // Trigger analysis asynchronously to not block UI
      setTimeout(() => {
        if (optionData.optionType === "CE") {
          updateAnalysis("CE", orderType, optionData);
        } else if (optionData.optionType === "PE") {
          updateAnalysis("PE", orderType, optionData);
        }
      }, 0);
    },
    [checkSubscriptionFeature],
  );

  // Function to close order popup
  const closeOrderPopup = () => {
    setOrderPopupOpen(false);
    setSelectedOptionData(null);
    // Reset analysis when closing
    setIsAnalysis("");
    setAnalysis({});
  };

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <section className="content option_chain_page option-chain-page">
      <div className="option_data full-width">
        <div className="left_option full-width">
          <div className="card-box card-height">
            <div className="fixed-header">
              <div className="option_chain_header">
                <div className="select-container">
                  <IconRegistry name="search" size={20} />
                  <div className="stock-selector-wrapper" ref={selectorRef}>
                    <div className="stock-selector-main">
                      <input
                        ref={inputRef}
                        type="text"
                        className="stock-selector-input"
                        value={
                          isSearchOpen
                            ? searchInput
                            : currentStock
                              ? watchListSymbol[currentStock?.identifier]
                                  ?.product
                              : chartIdentifier?.product || ""
                        }
                        onChange={handleInputChange}
                        onClick={handleInputClick}
                        onFocus={handleInputClick}
                        placeholder="Search or select symbol..."
                        readOnly={!isSearchOpen}
                      />
                      <button
                        type="button"
                        className="stock-selector-button"
                        onClick={() => {
                          setIsSearchOpen(!isSearchOpen);
                          if (!isSearchOpen) {
                            setSearchInput("");
                          }
                        }}
                      >
                        <IconRegistry
                          name={isSearchOpen ? "caret-up" : "caret-down"}
                          size={18}
                        />
                      </button>
                    </div>

                    {isSearchOpen && (
                      <div
                        className="stock-selector-popup"
                        // style={{
                        //   position: "fixed",
                        //   top: `${popupPosition.top}px`,
                        //   left: `${popupPosition.left}px`,
                        //   width: `${popupPosition.width || 220}px`,
                        //   zIndex: 99999,
                        // }}
                      >
                        <div className="stock-popup-list">
                          {filteredStocks.length > 0 ? (
                            filteredStocks.map((stock, index) => {
                              const watchSymbol =
                                watchListSymbol[stock?.identifier];
                              const isCurrent =
                                watchSymbol?.product ===
                                  chartIdentifier?.product ||
                                watchSymbol?.identifier ===
                                  chartIdentifier?.identifier;
                              return (
                                <div
                                  key={`${stock?.identifier}-${index}`}
                                  className={`stock-popup-item ${
                                    isCurrent ? "active" : ""
                                  }`}
                                  onClick={() => handleStockSelect(stock)}
                                >
                                  <div className="stock-popup-symbol">
                                    {watchSymbol?.product}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="stock-popup-empty">
                              <IconRegistry name="search" size={24} />
                              <p>No stocks found</p>
                              <span>Try a different search term</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="mr-10">
                    {
                      watchListSymbol[chartIdentifier?.identifier]
                        ?.lastTradePrice
                    }
                  </span>{" "}
                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    leaveTouchDelay={10000}
                    componentsProps={tooltipDesign}
                    title="Chart"
                  >
                    {" "}
                    <span
                      className="no-button"
                      onClick={
                        activeSubscriptionFeatures?.liveCharts?.enabled == false
                          ? () => handleClickDialogOpen()
                          : () =>
                              navigate(`/chart`, {
                                state: { symbol: chartIdentifier?.identifier },
                              })
                      }
                    >
                      {" "}
                    {/* <FaChartLine size={20} /> */}
                    </span>
                  </Tooltip>
                </div>
                <div className="expiry_div">
                  <p>Expiry</p>
                  <select
                    name="strExpiry"
                    id="strExpiry"
                    onChange={handleChange}
                  >
                    {expiryList?.map((exData, key) => {
                      return <option>{exData}</option>;
                    })}
                  </select>
                </div>
                {futueWatchList?.length > 0 && (
                  <div className="expiry_div gap-3">
                    <p>Future Price</p>
                    <p
                      className={
                        futureWatchListSymbol[futueWatchList[0]?.identifier]
                          ?.priceChange < 0
                          ? "text-danger fw-500"
                          : "text-success fw-500"
                      }
                    >
                      {
                        futureWatchListSymbol[futueWatchList[0]?.identifier]
                          ?.lastTradePrice
                      }
                    </p>
                  </div>
                )}
                <div className="demo_video_div gap-3">
                  <span className="fw-500 fs-12">ATM IV:</span>
                  <span className="fw-500 fs-12 atm-ce-iv">
                    CE:{" "}
                    {(() => {
                      const atmRow = optionChainCEList?.find((item) => {
                        const ceData = symbolValueCE[item?.identifier];
                        return ceData?.product === "ATM";
                      });
                      if (atmRow) {
                        const ceGreeksData =
                          symbolValueCEGreeks[atmRow?.identifier];
                        return ceGreeksData?.iv
                          ? parseFloat(ceGreeksData.iv).toFixed(2)
                          : "0.00";
                      }
                      return "0.00";
                    })()}
                  </span>
                  <span className="fw-500 fs-12 atm-pe-iv">
                    PE:{" "}
                    {(() => {
                      const atmRow = optionChainPEList?.find((item) => {
                        const peData = symbolValuePE[item?.identifier];
                        return peData?.product === "ATM";
                      });
                      if (atmRow) {
                        const peGreeksData =
                          symbolValuePEGreeks[atmRow?.identifier];
                        return peGreeksData?.iv
                          ? parseFloat(peGreeksData.iv).toFixed(2)
                          : "0.00";
                      }
                      return "0.00";
                    })()}
                  </span>
                </div>
         {/*
  chartIdentifier?.symbolCategoryName == "MCX" ||
  chartIdentifier?.symbolCategoryName == "BSE" ? null : (
    <div
      className={`greeks-toggle-btn ${
        showGreeks ? "active" : ""
      }`}
      onClick={() => setShowGreeks(!showGreeks)}
    >
      <span>Greeks</span>
    </div>
  )
*/}
              </div>
            </div>
            {/* Mobile View Controls */}
            <div className="mobile-view-controls only-mobile">
              <div className="mobile-controls-header">
                <h4>Option Chain Data</h4>
                <div className="mobile-view-tabs">
                  <button
                    className={`mobile-tab ${
                      mobileViewMode === "summary" ? "active" : ""
                    }`}
                    onClick={() => switchMobileViewMode("summary")}
                  >
                    Summary
                  </button>
                  <button
                    className={`mobile-tab ${
                      mobileViewMode === "detailed" ? "active" : ""
                    }`}
                    onClick={() => switchMobileViewMode("detailed")}
                  >
                    Detailed
                  </button>
                  {showGreeks && (
                    <button
                      className={`mobile-tab ${
                        mobileViewMode === "greeks" ? "active" : ""
                      }`}
                      onClick={() => switchMobileViewMode("greeks")}
                    >
                      Greeks
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`price_content ${!showGreeks ? "greeks-hidden" : ""} ${
                isLoading ? "loading" : ""
              }`}
            >
              {showGreeks ? (
                // Greeks View Layout
                <div className="greeks-layout">
                  {/* Option Type Toggle */}
                  <div className="option-type-toggle">
                    <button
                      className={`toggle-btn ${
                        selectedOptionType === "CE" ? "active call-active" : ""
                      }`}
                      onClick={() => setSelectedOptionType("CE")}
                    >
                      Call
                    </button>
                    <button
                      className={`toggle-btn ${
                        selectedOptionType === "PE" ? "active put-active" : ""
                      }`}
                      onClick={() => setSelectedOptionType("PE")}
                    >
                      Put
                    </button>
                  </div>

                  {/* Greeks Table */}
                  <div className="greeks-table">
                    <div className="greeks-header">
                      <div className="strike-col">Strike</div>
                      <div className="data-col">LTP</div>
                      <div className="data-col">IV</div>
                      <div className="data-col">Delta</div>
                      <div className="data-col">Gamma</div>
                      <div className="data-col">Theta</div>
                      <div className="data-col">Vega</div>
                    </div>

                    <div className="greeks-body">
                      {optionChainCEList?.map((val, key) => {
                        const pe = optionChainPEList?.find(
                          (peOption) =>
                            peOption?.strikePrice === val?.strikePrice,
                        );
                        const currentData =
                          selectedOptionType === "CE"
                            ? symbolValueCE[val?.identifier]
                            : symbolValuePE[pe?.identifier];
                        const currentGreeks =
                          selectedOptionType === "CE"
                            ? symbolValueCEGreeks[val?.identifier]
                            : symbolValuePEGreeks[pe?.identifier];

                        return (
                          <div key={key} className="greeks-row">
                            <div className="strike-col">
                              {currentData?.strikePrice || "-"}
                            </div>
                            <div className="data-col">
                              <div className="ltp-value">
                                ₹{currentData?.lastTradePrice || "-"}
                              </div>
                              <div
                                className={
                                  currentData?.priceChangePercentage >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                              >
                                {currentData?.priceChangePercentage >= 0 ? (
                                  <IconRegistry name="caret-up" size={12} />
                                ) : (
                                  <IconRegistry name="caret-down" size={12} />
                                )}
                                {Math.abs(
                                  currentData?.priceChangePercentage || 0,
                                )}
                              </div>
                            </div>
                            <div className="data-col">
                              {currentGreeks?.iv
                                ? parseFloat(currentGreeks.iv).toFixed(3)
                                : "-"}
                            </div>
                            <div className="data-col">
                              {currentGreeks?.delta
                                ? parseFloat(currentGreeks.delta).toFixed(3)
                                : "-"}
                            </div>
                            <div className="data-col">
                              {currentGreeks?.gamma
                                ? parseFloat(currentGreeks.gamma).toFixed(3)
                                : "-"}
                            </div>
                            <div className="data-col">
                              {currentGreeks?.theta
                                ? parseFloat(currentGreeks.theta).toFixed(3)
                                : "-"}
                            </div>
                            <div className="data-col">
                              {currentGreeks?.vega
                                ? parseFloat(currentGreeks.vega).toFixed(3)
                                : "-"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                // Original Table Layout
                <>
                  {/* Mobile Header */}
                  <div className="mobile-header only-mobile">
                    <div className="mobile-header-content">
                      <span>CE</span>
                      <span>Strike</span>
                      <span>PE</span>
                    </div>
                  </div>

                  {/* Desktop Header */}
               {/*    <div
                    className={`option-table-header only-desktop ${
                      isSearchOpen ? "dropdown-open" : ""
                    }`}
                  >
                    <div
                      className={`header-row ${
                        !showGreeks ? "greeks-hidden" : ""
                      }`}
                    >
                      {showGreeks && (
                        <div className="header-cell greek-header">Delta</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Gamma</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Theta</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Vega</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">IV</div>
                      )}
                      <div
                        className={`header-cell ${
                          isSearchOpen ? "hide-on-dropdown" : ""
                        }`}
                      >
                        Product
                      </div>
                      <div
                        className={`header-cell ${
                          isSearchOpen ? "hide-on-dropdown" : ""
                        }`}
                      >
                        LTP Change
                      </div>
                      <div className="header-cell">LTP</div>
                      <div className="header-cell strike-header">
                        <div className="strike-header-content">
                          <span className="ce-indicator">CE</span>
                          <span className="strike-title">Strike</span>
                          <span className="pe-indicator">PE</span>
                        </div>
                      </div>
                      <div className="header-cell">LTP</div>
                      <div className="header-cell">LTP Change</div>
                      <div className="header-cell">Product</div>
                      {showGreeks && (
                        <div className="header-cell greek-header">IV</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Vega</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Theta</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Gamma</div>
                      )}
                      {showGreeks && (
                        <div className="header-cell greek-header">Delta</div>
                      )}
                    </div>
                  </div> */}

                  <table className="option-table">
               <thead className="option-table-header">
  <tr className={`only-desktop header-row ${!showGreeks ? 'greeks-hidden' : ''}`}>
    <th className="header-cell">Product</th>
    <th className="header-cell">LTP Change</th>
    <th className="header-cell">LTP</th>
    <th className="header-cell strike-header">
      <div className="strike-header-content">
        <span className="ce-indicator">CE</span>
        <span className="strike-title">Strike</span>
        <span className="pe-indicator">PE</span>
      </div>
    </th>
    <th className="header-cell">LTP</th>
    <th className="header-cell">LTP Change</th>
    <th className="header-cell">Product</th>
  </tr>
</thead>
                    <tbody>
                      {optionChainCEList?.length > 0 ? (
                        optionChainCEList?.map((val, key) => {
                          // Find PE option with matching strike price instead of using array index
                          const pe = optionChainPEList?.find(
                            (peOption) =>
                              peOption?.strikePrice === val?.strikePrice,
                          );

                          const ceProduct =
                            symbolValueCE[val?.identifier]?.product;
                          const peProduct =
                            symbolValuePE[pe?.identifier]?.product;
                          const TOTAL_COLUMNS = showGreeks ? 17 : 7;

                          return (
                            <tr
                              key={key}
                              onMouseLeave={() => setHoveredIndex(null)}
                              className={`${
                                ceProduct == "ATM" ? "main-content" : ""
                              } row position-relative ${
                                !showGreeks ? "greeks-hidden" : ""
                              }`}
                              ref={ceProduct == "ATM" ? sectionRef : null}
                            >
                              {/* CE Greek Data Columns */}
                              {showGreeks && (
                                <td
                                  className={`only-desktop greek-column delta ${
                                    ceProduct == "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {symbolValueCEGreeks[val?.identifier]?.delta
                                    ? parseFloat(
                                        symbolValueCEGreeks[val?.identifier]
                                          ?.delta,
                                      ).toFixed(4)
                                    : "0.0000"}
                                </td>
                              )}
                              {showGreeks && (
                                <td
                                  className={`only-desktop greek-column gamma ${
                                    ceProduct == "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {symbolValueCEGreeks[val?.identifier]?.gamma
                                    ? parseFloat(
                                        symbolValueCEGreeks[val?.identifier]
                                          ?.gamma,
                                      ).toFixed(4)
                                    : "0.0000"}
                                </td>
                              )}
                              {showGreeks && (
                                <td
                                  className={`only-desktop greek-column theta ${
                                    ceProduct == "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {symbolValueCEGreeks[val?.identifier]?.theta
                                    ? parseFloat(
                                        symbolValueCEGreeks[val?.identifier]
                                          ?.theta,
                                      ).toFixed(4)
                                    : "0.0000"}
                                </td>
                              )}
                              {showGreeks && (
                                <td
                                  className={`only-desktop greek-column vega ${
                                    ceProduct == "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {symbolValueCEGreeks[val?.identifier]?.vega
                                    ? parseFloat(
                                        symbolValueCEGreeks[val?.identifier]
                                          ?.vega,
                                      ).toFixed(4)
                                    : "0.0000"}
                                </td>
                              )}
                              {showGreeks && (
                                <td
                                  className={`only-desktop greek-column iv ${
                                    ceProduct == "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {symbolValueCEGreeks[val?.identifier]?.iv
                                    ? parseFloat(
                                        symbolValueCEGreeks[val?.identifier]
                                          ?.iv,
                                      ).toFixed(4)
                                    : "0.0000"}
                                </td>
                              )}
                              <td
                                className={`only-desktop ce-product-column ${
                                  ceProduct == "ITM" ? "secondary-color" : ""
                                }`}
                                onMouseEnter={handleMouseEnter(key, "CE")}
                                data-product={
                                  symbolValueCE[val?.identifier]?.product ||
                                  "CE"
                                }
                              >
                                {symbolValueCE[val?.identifier]?.product}
                                <div className="action-buttons ce-action-buttons">
                                {/*   <Tooltip title={TextData.chartTooltip} arrow>
                                    <span
                                      className="chart-icon"
                                      onClick={() =>
                                        navigate("/chart", {
                                          state: { symbol: val?.identifier },
                                        })
                                      }
                                    >
                                      <FaChartLine size={14} />
                                    </span>
                                  </Tooltip> */}
                                   <Tooltip title="Buy" arrow>
                                    <span
                                      className="buy-button"
                                      onClick={() => {
                                        const ceData =
                                          symbolValueCE[val?.identifier];
                                        openOrderPopup(
                                          {
                                            ...ceData,
                                            identifier: val?.identifier,
                                            symbolIdentifierId:
                                              val?.symbolIdentifierId,
                                            lastTradePrice:
                                              ceData?.lastTradePrice,
                                            strikePrice: ceData?.strikePrice,
                                            optionType: "CE",
                                          },
                                          "buy",
                                        );
                                      }}
                                    >
                                      B
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Sell" arrow>
                                    <span
                                      className="sell-button"
                                      onClick={() => {
                                        const ceData =
                                          symbolValueCE[val?.identifier];
                                        openOrderPopup(
                                          {
                                            ...ceData,
                                            identifier: val?.identifier,
                                            symbolIdentifierId:
                                              val?.symbolIdentifierId,
                                            lastTradePrice:
                                              ceData?.lastTradePrice,
                                            strikePrice: ceData?.strikePrice,
                                            optionType: "CE",
                                          },
                                          "sell",
                                        );
                                      }}
                                    >
                                      S
                                    </span>
                                  </Tooltip> 
                                </div>
                              </td>
                              <td
                                className={`only-desktop ${
                                  ceProduct == "ITM" ? "secondary-color" : ""
                                }`}
                                onMouseEnter={handleMouseEnter(key, "CE")}
                              >
                                {symbolValueCE[val?.identifier]
                                  ?.priceChangePercentage == 0 ? (
                                  symbolValueCE[val?.identifier]
                                    ?.priceChangePercentage
                                ) : symbolValueCE[val?.identifier]
                                    ?.priceChangePercentage > 0 ? (
                                  <div className="text-success">
                                    <IconRegistry name="caret-up" size={20} />
                                    {
                                      symbolValueCE[val?.identifier]
                                        ?.priceChangePercentage
                                    }
                                  </div>
                                ) : (
                                  <div className="text-danger">
                                    <IconRegistry name="caret-down" size={20} />
                                    {
                                      symbolValueCE[val?.identifier]
                                        ?.priceChangePercentage
                                    }
                                  </div>
                                )}
                              </td>
                              <td
                                className={`only-desktop ${
                                  ceProduct == "ITM"
                                    ? "secondary-color new-flex-data"
                                    : ""
                                }`}
                                onMouseEnter={handleMouseEnter(key, "CE")}
                              >
                                {symbolValueCE[val?.identifier]?.lastTradePrice}
                              </td>

                              <td className="only-desktop strike">
                                {symbolValueCE[val?.identifier]?.strikePrice}
                              </td>

                              {pe ? (
                                <>
                                  <td
                                    className={`only-desktop ${
                                      peProduct == "ITM"
                                        ? "secondary-color"
                                        : ""
                                    }`}
                                    onMouseEnter={handleMouseEnter(key, "PE")}
                                  >
                                    {
                                      symbolValuePE[pe?.identifier]
                                        ?.lastTradePrice
                                    }
                                  </td>
                                  <td
                                    className={`only-desktop ${
                                      peProduct == "ITM"
                                        ? "secondary-color"
                                        : ""
                                    }`}
                                    onMouseEnter={handleMouseEnter(key, "PE")}
                                  >
                                    {symbolValuePE[pe?.identifier]
                                      ?.priceChangePercentage == 0 ? (
                                      symbolValuePE[pe?.identifier]
                                        ?.priceChangePercentage
                                    ) : symbolValuePE[pe?.identifier]
                                        ?.priceChangePercentage > 0 ? (
                                      <div className="text-success">
                                        <IconRegistry
                                          name="caret-up"
                                          size={20}
                                        />
                                        {
                                          symbolValuePE[pe?.identifier]
                                            ?.priceChangePercentage
                                        }
                                      </div>
                                    ) : (
                                      <div className="text-danger">
                                        <IconRegistry
                                          name="caret-down"
                                          size={20}
                                        />
                                        {
                                          symbolValuePE[pe?.identifier]
                                            ?.priceChangePercentage
                                        }
                                      </div>
                                    )}
                                  </td>
                                  <td
                                    className={`only-desktop pe-product-column ${
                                      peProduct == "ITM"
                                        ? "secondary-color"
                                        : ""
                                    }`}
                                    onMouseEnter={handleMouseEnter(key, "PE")}
                                    data-product={
                                      symbolValuePE[pe?.identifier]?.product ||
                                      "PE"
                                    }
                                  >
                                    {symbolValuePE[pe?.identifier]?.product}{" "}
                                    <div className="action-buttons pe-action-buttons">
                                  {/*     <Tooltip
                                        title={TextData.chartTooltip}
                                        arrow
                                      >
                                        <span
                                          className="chart-icon"
                                          onClick={() =>
                                            navigate("/chart", {
                                              state: { symbol: pe?.identifier },
                                            })
                                          }
                                        >
                                          <FaChartLine size={14} />
                                        </span>
                                      </Tooltip> */}
                                      <Tooltip title="Buy" arrow>
                                        <span
                                          className="buy-button"
                                          onClick={() => {
                                            const peData =
                                              symbolValuePE[pe?.identifier];
                                            openOrderPopup(
                                              {
                                                ...peData,
                                                identifier: pe?.identifier,
                                                symbolIdentifierId:
                                                  pe?.symbolIdentifierId,
                                                lastTradePrice:
                                                  peData?.lastTradePrice,
                                                strikePrice:
                                                  peData?.strikePrice,
                                                optionType: "PE",
                                              },
                                              "buy",
                                            );
                                          }}
                                        >
                                          B
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Sell" arrow>
                                        <span
                                          className="sell-button"
                                          onClick={() => {
                                            const peData =
                                              symbolValuePE[pe?.identifier];
                                            openOrderPopup(
                                              {
                                                ...peData,
                                                identifier: pe?.identifier,
                                                symbolIdentifierId:
                                                  pe?.symbolIdentifierId,
                                                lastTradePrice:
                                                  peData?.lastTradePrice,
                                                strikePrice:
                                                  peData?.strikePrice,
                                                optionType: "PE",
                                              },
                                              "sell",
                                            );
                                          }}
                                        >
                                          S
                                        </span>
                                      </Tooltip> 
                                    </div>
                                  </td>
                                  {/* PE Greek Data Columns */}
                                  {showGreeks && (
                                    <td
                                      className={`only-desktop greek-column iv ${
                                        peProduct == "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {symbolValuePEGreeks[pe?.identifier]?.iv
                                        ? parseFloat(
                                            symbolValuePEGreeks[pe?.identifier]
                                              ?.iv,
                                          ).toFixed(4)
                                        : "0.0000"}
                                    </td>
                                  )}
                                  {showGreeks && (
                                    <td
                                      className={`only-desktop greek-column vega ${
                                        peProduct == "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {symbolValuePEGreeks[pe?.identifier]?.vega
                                        ? parseFloat(
                                            symbolValuePEGreeks[pe?.identifier]
                                              ?.vega,
                                          ).toFixed(4)
                                        : "0.0000"}
                                    </td>
                                  )}
                                  {showGreeks && (
                                    <td
                                      className={`only-desktop greek-column theta ${
                                        peProduct == "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {symbolValuePEGreeks[pe?.identifier]
                                        ?.theta
                                        ? parseFloat(
                                            symbolValuePEGreeks[pe?.identifier]
                                              ?.theta,
                                          ).toFixed(4)
                                        : "0.0000"}
                                    </td>
                                  )}
                                  {showGreeks && (
                                    <td
                                      className={`only-desktop greek-column gamma ${
                                        peProduct == "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {symbolValuePEGreeks[pe?.identifier]
                                        ?.gamma
                                        ? parseFloat(
                                            symbolValuePEGreeks[pe?.identifier]
                                              ?.gamma,
                                          ).toFixed(4)
                                        : "0.0000"}
                                    </td>
                                  )}
                                  {showGreeks && (
                                    <td
                                      className={`only-desktop greek-column delta ${
                                        peProduct == "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {symbolValuePEGreeks[pe?.identifier]
                                        ?.delta
                                        ? parseFloat(
                                            symbolValuePEGreeks[pe?.identifier]
                                              ?.delta,
                                          ).toFixed(4)
                                        : "0.0000"}
                                    </td>
                                  )}
                                </>
                              ) : (
                                <>
                                  <td className="only-desktop">-</td>
                                  <td className="only-desktop">-</td>
                                  <td className="only-desktop">-</td>
                                  {showGreeks && (
                                    <td className="only-desktop">-</td>
                                  )}
                                  {showGreeks && (
                                    <td className="only-desktop">-</td>
                                  )}
                                  {showGreeks && (
                                    <td className="only-desktop">-</td>
                                  )}
                                  {showGreeks && (
                                    <td className="only-desktop">-</td>
                                  )}
                                  {showGreeks && (
                                    <td className="only-desktop">-</td>
                                  )}
                                </>
                              )}

                              {/* Mobile summary cell */}
                              <td
                                className="only-mobile"
                                colSpan={TOTAL_COLUMNS}
                              >
                                <div className="mobile-summary">
                                  {/* Basic Summary View */}
                                  <div className="values">
                                    <div className="val">
                                      <span className="label">CE</span>
                                      <span className="price">
                                        {symbolValueCE[val?.identifier]
                                          ?.lastTradePrice || "-"}
                                      </span>
                                    </div>
                                    <div className="val strike">
                                      <span className="label">Strike</span>
                                      <span className="price">
                                        {symbolValueCE[val?.identifier]
                                          ?.strikePrice || "-"}
                                      </span>
                                    </div>
                                    <div className="val">
                                      <span className="label">PE</span>
                                      <span className="price">
                                        {pe
                                          ? symbolValuePE[pe?.identifier]
                                              ?.lastTradePrice || "-"
                                          : "-"}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Expandable Details */}
                                  <div className="mobile-details">
                                    <button
                                      className="expand-btn"
                                      onClick={() =>
                                        toggleRowExpansion(val?.identifier)
                                      }
                                    >
                                      <span>
                                        {expandedRows.has(val?.identifier)
                                          ? "Hide Details"
                                          : "Show Details"}
                                      </span>
                                      <span
                                        className={`expand-icon ${
                                          expandedRows.has(val?.identifier)
                                            ? "expanded"
                                            : ""
                                        }`}
                                      >
                                        ▼
                                      </span>
                                    </button>

                                    {expandedRows.has(val?.identifier) && (
                                      <div className="expanded-content">
                                        {/* CE Details */}
                                        <div className="option-details ce-details">
                                          <h5>Call Option (CE)</h5>
                                          <div className="detail-grid">
                                            <div className="detail-item">
                                              <span className="label">LTP</span>
                                              <span className="value">
                                                {symbolValueCE[val?.identifier]
                                                  ?.lastTradePrice || "-"}
                                              </span>
                                            </div>
                                            <div className="detail-item">
                                              <span className="label">
                                                Change
                                              </span>
                                              <span
                                                className={`value ${
                                                  symbolValueCE[val?.identifier]
                                                    ?.priceChangePercentage >= 0
                                                    ? "text-success"
                                                    : "text-danger"
                                                }`}
                                              >
                                                {symbolValueCE[val?.identifier]
                                                  ?.priceChangePercentage >= 0
                                                  ? "+"
                                                  : ""}
                                                {symbolValueCE[val?.identifier]
                                                  ?.priceChangePercentage || 0}
                                                %
                                              </span>
                                            </div>

                                            {showGreeks && (
                                              <>
                                                <div className="detail-item">
                                                  <span className="label">
                                                    Delta
                                                  </span>
                                                  <span className="value">
                                                    {symbolValueCEGreeks[
                                                      val?.identifier
                                                    ]?.delta || "-"}
                                                  </span>
                                                </div>
                                                <div className="detail-item">
                                                  <span className="label">
                                                    Gamma
                                                  </span>
                                                  <span className="value">
                                                    {symbolValueCEGreeks[
                                                      val?.identifier
                                                    ]?.gamma || "-"}
                                                  </span>
                                                </div>
                                                <div className="detail-item">
                                                  <span className="label">
                                                    Theta
                                                  </span>
                                                  <span className="value">
                                                    {symbolValueCEGreeks[
                                                      val?.identifier
                                                    ]?.theta || "-"}
                                                  </span>
                                                </div>
                                                <div className="detail-item">
                                                  <span className="label">
                                                    Vega
                                                  </span>
                                                  <span className="value">
                                                    {symbolValueCEGreeks[
                                                      val?.identifier
                                                    ]?.vega || "-"}
                                                  </span>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* PE Details */}
                                        {pe && (
                                          <div className="option-details pe-details">
                                            <h5>Put Option (PE)</h5>
                                            <div className="detail-grid">
                                              <div className="detail-item">
                                                <span className="label">
                                                  LTP
                                                </span>
                                                <span className="value">
                                                  {symbolValuePE[pe?.identifier]
                                                    ?.lastTradePrice || "-"}
                                                </span>
                                              </div>
                                              <div className="detail-item">
                                                <span className="label">
                                                  Change
                                                </span>
                                                <span
                                                  className={`value ${
                                                    symbolValuePE[
                                                      pe?.identifier
                                                    ]?.priceChangePercentage >=
                                                    0
                                                      ? "text-success"
                                                      : "text-danger"
                                                  }`}
                                                >
                                                  {symbolValuePE[pe?.identifier]
                                                    ?.priceChangePercentage >= 0
                                                    ? "+"
                                                    : ""}
                                                  {symbolValuePE[pe?.identifier]
                                                    ?.priceChangePercentage ||
                                                    0}
                                                  %
                                                </span>
                                              </div>

                                              {showGreeks && (
                                                <>
                                                  <div className="detail-item">
                                                    <span className="label">
                                                      Delta
                                                    </span>
                                                    <span className="value">
                                                      {symbolValuePEGreeks[
                                                        pe?.identifier
                                                      ]?.delta || "-"}
                                                    </span>
                                                  </div>
                                                  <div className="detail-item">
                                                    <span className="label">
                                                      Gamma
                                                    </span>
                                                    <span className="value">
                                                      {symbolValuePEGreeks[
                                                        pe?.identifier
                                                      ]?.gamma || "-"}
                                                    </span>
                                                  </div>
                                                  <div className="detail-item">
                                                    <span className="label">
                                                      Theta
                                                    </span>
                                                    <span className="value">
                                                      {symbolValuePEGreeks[
                                                        pe?.identifier
                                                      ]?.theta || "-"}
                                                    </span>
                                                  </div>
                                                  <div className="detail-item">
                                                    <span className="label">
                                                      Vega
                                                    </span>
                                                    <span className="value">
                                                      {symbolValuePEGreeks[
                                                        pe?.identifier
                                                      ]?.vega || "-"}
                                                    </span>
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* Mobile Action Buttons - only chart buttons visible */}
                                        <div className="mobile-actions">
                                          <button
                                            className="action-btn chart-btn"
                                            onClick={() =>
                                              navigate("/chart", {
                                                state: {
                                                  symbol: val?.identifier,
                                                },
                                              })
                                            }
                                            title="Open Chart"
                                          >
                                            <FaChartLine size={14} />
                                            Chart CE
                                          </button>
                                          {pe && (
                                            <button
                                              className="action-btn chart-btn"
                                              onClick={() =>
                                                navigate("/chart", {
                                                  state: {
                                                    symbol: pe?.identifier,
                                                  },
                                                })
                                              }
                                              title="Open Chart"
                                            >
                                              <FaChartLine size={14} />
                                              Chart PE
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={showGreeks ? 17 : 7}
                            className="no-data-cell"
                          >
                            <div className="no-data-container">
                              <div className="no-data-text">
                                No option chain data available
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Panel - Desktop Slide-in / Mobile Bottom Popup */}
      {orderPopupOpen && selectedOptionData && (
        <div
          className={
            isMobile ? "mobile-popup-overlay" : "order-overlay desktop-overlay"
          }
          onClick={closeOrderPopup}
        >
          <div
            className={isMobile ? "mobile-popup" : "order-panel desktop-panel"}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={isMobile ? "popup-header" : "order-popup-header"}>
              {isMobile ? (
                <>
                  <div className="popup-title">
                    <span className="popup-icon">📋</span>
                    <span>Place Order</span>
                  </div>
                  <button className="popup-close" onClick={closeOrderPopup}>
                    <FiX size={20} color="#dc3545" />
                  </button>
                </>
              ) : (
                <>
                  <h4>Place Order</h4>
                  <button className="close-btn" onClick={closeOrderPopup}>
                    <FiX size={20} color="#dc3545" />
                  </button>
                </>
              )}
            </div>

            <div className={"order-popup-content"}>
              {/* Analysis Section */}
              <div className="analysis-section">
                <h5>Analysis</h5>
                {isAnalysis != "" ? (
                  <div className="price_flex_box">
                    <div className="price">
                      <p>
                        <Tooltip
                          arrow
                          componentsProps={tooltipDesign}
                          title={TextData?.mtm_text}
                          enterTouchDelay={0}
                          leaveTouchDelay={10000}
                        >
                          MTM <IconRegistry name="exclamation-octagon" />
                        </Tooltip>
                      </p>
                      <p
                        className={
                          analysis?.mtm >= 0 ? "text-success" : "text-danger"
                        }
                      >
                        ₹ {analysis?.mtm}
                      </p>
                    </div>
                    <div className="price">
                      <p>Maximum Profit</p>
                      <p className="text-success">
                        {analysis?.maxProfit > 0 ? "₹ " : ""}
                        {analysis?.maxProfit}
                      </p>
                    </div>

                    <div className="price">
                      <p>Maximum Loss</p>
                      <p className="text-danger">
                        {analysis?.maxLoss > 0 ? "₹ " : ""}
                        {analysis?.type == "buy" ? "-" : ""}
                        {analysis?.maxLoss}
                      </p>
                    </div>

                    <div className="price">
                      <p>Breakeven</p>
                      <p className="text">{analysis?.breakEven}</p>
                    </div>
                  </div>
                ) : (
                  <div className="img_section">
                    <img
                      src={images["other/analysis.png"]}
                      className="analysisImg"
                      alt="analysis"
                    />
                    <h5 className="mt-5">
                      View payoff charts, key statistics, and detailed trade
                      analysis
                    </h5>
                    <p>
                      Choose trades directly from the Option Chain or apply a
                      ready-made strategy from the Positions tab to explore
                      insights
                    </p>
                  </div>
                )}
              </div>

              {/* Order Form Section */}
              {isAnalysis != "" && (
                <div className="order-form-section">
                  <div className="place_order">
                    <div className="order_header">
                      <span>{analysis?.identifier}</span>

                      <span
                        className={
                          analysis?.data?.priceChangePercentage > 0
                            ? "text-success"
                            : "text-danger"
                        }
                      >
                        {analysis?.data?.priceChangePercentage > 0 ? (
                          <IconRegistry name="caret-up" size={20} />
                        ) : (
                          <IconRegistry name="caret-down" />
                        )}{" "}
                        {analysis?.data?.priceChangePercentage}
                      </span>
                      <span>{analysis?.data?.lastTradePrice}</span>
                    </div>
                    <div className="order_body">
                      <form
                        onSubmit={
                          activeSubscriptionFeatures?.manualTradeAllow == true
                            ? handleOrderSubmit
                            : ""
                        }
                      >
                        <div className="first_row">
                          <div className="buy_sell_button">
                            {analysis?.type == "buy" ? (
                              <button
                                className="btn btn-success"
                                type="button"
                                onClick={() =>
                                  updateAnalysis(
                                    isAnalysis,
                                    "sell",
                                    analysis?.data,
                                  )
                                }
                              >
                                B
                              </button>
                            ) : (
                              <button
                                className="btn btn-danger"
                                type="button"
                                onClick={() =>
                                  updateAnalysis(
                                    isAnalysis,
                                    "buy",
                                    analysis?.data,
                                  )
                                }
                              >
                                S
                              </button>
                            )}
                          </div>
                          <div className="order_button">
                            <label>
                              <input
                                type="radio"
                                name="ProductType"
                                value="1"
                                className="peer radio "
                                checked={orderData?.ProductType == 1 ?? false}
                                onChange={handleOrderChange}
                              />
                              <div className="icon">CNC</div>
                            </label>
                            <label className="ml-5">
                              <input
                                type="radio"
                                name="ProductType"
                                value="2"
                                className="peer radio"
                                checked={orderData?.ProductType == 2 ?? false}
                                onChange={handleOrderChange}
                              />
                              <div className="icon">MIS</div>
                            </label>
                          </div>
                          <div className="order_button">
                            <label>
                              <input
                                type="radio"
                                value="CE"
                                className="peer radio "
                                checked={isAnalysis == "CE" ?? false}
                                onChange={() =>
                                  updatePriceType(
                                    "CE",
                                    analysis?.data?.strikePrice,
                                  )
                                }
                              />
                              <div className="icon">CE</div>
                            </label>
                            <label className="ml-5">
                              <input
                                type="radio"
                                value="PE"
                                className="peer radio"
                                checked={isAnalysis == "PE" ?? false}
                                onChange={() =>
                                  updatePriceType(
                                    "PE",
                                    analysis?.data?.strikePrice,
                                  )
                                }
                              />
                              <div className="icon">PE</div>
                            </label>
                          </div>

                          <div className="order_input">
                            <input
                              type="number"
                              className="form-control text-input"
                              placeholder="Enter Quantity"
                              name="Quantity"
                              min="1"
                              value={orderData?.Quantity}
                              onChange={handleOrderChange}
                            />
                            <small
                              style={{ fontSize: "12px", fontWeight: "500" }}
                            >
                              Lot Size: {analysis?.lotSize}
                            </small>
                            {formErrors?.Quantity && (
                              <div className="error-message">
                                {formErrors?.Quantity}
                              </div>
                            )}
                          </div>
                          <div className="order_input">
                            <input
                              type="text"
                              className="form-control text-input final_price"
                              placeholder="Enter Price"
                              name="EntryPrice"
                              value={orderData?.EntryPrice}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="second_row data-vn">
                          <div className="toogle toggle-flex-data data-wd-new">
                            <div className="w-75pr">
                              <p>
                                {" "}
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  title={TextData?.stop_loss}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                >
                                  {" "}
                                  Stop Loss{" "}
                                  <IconRegistry name="exclamation-octagon" />
                                </Tooltip>
                              </p>
                              <label className="toggle-switch blue">
                                <input
                                  type="checkbox"
                                  name="isStopLoss"
                                  checked
                                />
                                <span className="slider"></span>
                              </label>
                            </div>
                            {orderData?.isStopLoss ? (
                              <div
                                className="sl-loss-container"
                                style={{
                                  width: "100%",
                                  maxWidth: "100%",
                                  overflow: "hidden",
                                  boxSizing: "border-box",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {/* SL Est and Loss in one line */}
                                {orderData?.StopLossEstPrice &&
                                analysis?.lotSize &&
                                orderData?.Quantity ? (
                                  <div
                                    className="sl-loss-text"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "12px",
                                      color: "#dc3545",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      width: "100%",
                                      maxWidth: "100%",
                                      flexWrap: "nowrap",
                                    }}
                                  >
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        display: "inline",
                                      }}
                                    >
                                      SL Est: {orderData?.StopLossEstPrice}
                                    </span>
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        display: "inline",
                                      }}
                                    >
                                      |
                                    </span>
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        display: "inline",
                                      }}
                                    >
                                      Loss: ₹
                                      {(
                                        -Math.abs(
                                          (parseFloat(orderData?.EntryPrice) ||
                                            0) -
                                            (parseFloat(
                                              orderData?.StopLossEstPrice,
                                            ) || 0),
                                        ) *
                                        (analysis?.lotSize || 50) *
                                        (orderData?.Quantity || 1)
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                ) : (
                                  <div
                                    className="sl-loss-text"
                                    style={{
                                      fontSize: "12px",
                                      color: "#dc3545",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      width: "100%",
                                      maxWidth: "100%",
                                    }}
                                  >
                                    <span style={{ whiteSpace: "nowrap" }}>
                                      SL Est:{" "}
                                      {orderData?.StopLossEstPrice || "-"}
                                    </span>
                                  </div>
                                )}
                                {formErrors?.StopLossEstPrice && (
                                  <div className="error-message">
                                    {formErrors?.StopLossEstPrice}
                                  </div>
                                )}
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                          <div className="toogle toggle-flex-data data-wd-sml">
                            <div className="w-75pr">
                              <p> Take-profit</p>
                              <label className="toggle-switch blue">
                                <input
                                  type="checkbox"
                                  name="isTakeProfit"
                                  onChange={handleOrderChange}
                                />
                                <span className="slider"></span>
                              </label>
                            </div>
                            {orderData?.isTakeProfit ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  flexWrap: "nowrap",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <label
                                  htmlFor="TakeProfitEstPrice"
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  TGT Est.:
                                </label>
                                <input
                                  type="text"
                                  id="TakeProfitEstPrice"
                                  name="TakeProfitEstPrice"
                                  className="form-control text-input"
                                  value={orderData?.TakeProfitEstPrice || "0"}
                                  onChange={handleOrderChange}
                                  style={{
                                    flex: "1",
                                    minWidth: "60px",
                                    padding: "4px 8px",
                                    fontSize: "14px",
                                  }}
                                />
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        </div>
                        <div className="third_row">
                          <select
                            name="BrokerConfigID"
                            id="BrokerConfigID"
                            className="form-control text-input"
                            value={orderData?.BrokerConfigID || ""}
                            onChange={handleOrderChange}
                          >
                            {brokerConfigList?.map((val, key) => {
                              return (
                                <option value={val?.brokerconfigID}>
                                  {val?.brokerName}
                                </option>
                              );
                            })}
                          </select>
                          {formErrors?.BrokerConfigID && (
                            <div className="error-message">
                              {formErrors?.BrokerConfigID}
                            </div>
                          )}
                          <div className="mt-2 d-flex justify-content-between align-items-center">
                            <p className="mb-0">
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
                                        borderBottom:
                                          "1px solid rgba(255,255,255,0.3)",
                                        paddingBottom: 6,
                                      }}
                                    >
                                      <strong>
                                        Market Price Protection for Your Safety
                                      </strong>
                                    </div>
                                    <p style={{ margin: 0, marginTop: 4 }}>
                                      Market orders placed through Quick
                                      Algoplus come with built-in price
                                      protection. Following exchange rules, your
                                      broker may automatically convert market
                                      orders to limit orders within a safe price
                                      range (usually ±2.5% of current market
                                      price). This protects you from extreme,
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
                                <span
                                  style={{ cursor: "pointer", fontWeight: 600 }}
                                >
                                  MPP{" "}
                                  <IconRegistry name="exclamation-octagon" />
                                </span>
                              </Tooltip>
                            </p>
                            <p className="mb-0">
                              Required funds: {orderData?.TotalPurchaseAmt}
                            </p>
                          </div>
                          {formErrors?.InsufficientFunds && (
                            <div
                              className="error-message"
                              style={{
                                marginTop: "10px",
                                padding: "10px",
                                backgroundColor: "#fee",
                                border: "1px solid #fcc",
                                borderRadius: "4px",
                                color: "#c33",
                                fontSize: "14px",
                                fontWeight: "600",
                              }}
                            >
                              {formErrors?.InsufficientFunds}
                            </div>
                          )}
                        </div>
                        <div className="four_row mt-3 d-flex">
                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => {
                              CancelOrder();
                            }}
                          >
                            Cancel
                          </button>

                          <button
                            className="btn btn-success ml-5"
                            disabled={isOrderLoading}
                            type={
                              activeSubscriptionFeatures?.manualTradeAllow ==
                              true
                                ? "submit"
                                : "button"
                            }
                            onClick={
                              activeSubscriptionFeatures?.manualTradeAllow ==
                              false
                                ? () => handleClickDialogOpen()
                                : null
                            }
                          >
                            {isOrderLoading ? (
                              <ButtonLoader isloading={true} />
                            ) : (
                              "Place Order"
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {dialogOpen && (
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}

      {subscriptionUpgradeOpen && (
        <SubscriptionDialog
          open={subscriptionUpgradeOpen}
          handleClose={() => setSubscriptionUpgradeOpen(false)}
          message={subscriptionUpgradeMessage}
        />
      )}
    </section>
  );
};

export default OptionChain;
