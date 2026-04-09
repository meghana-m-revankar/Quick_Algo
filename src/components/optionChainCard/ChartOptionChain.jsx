import { IconRegistry } from "#components";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import "./ChartOptionChain.scss";
import useOptionChain from "../../pages/optionChain/optionChain";
import useSymbolDetails from "#hooks/useSymbol";
import { ShimmerTable } from "react-shimmer-effects";
import { SubscriptionDialog } from "#components";
import Tooltip from "@mui/material/Tooltip";
import { TextData, tooltipDesign } from "#constant/index";
import { errorMsg } from "../../utils/helpers";

const ChartOptionChain = ({
  onNavigateToChart = null,
  shouldOpenATMCEPE = false,
  onReceiveATMCEPE = null,
  currentSymbol = null,
  isMultiChartMode = false,
  onClosePopup = null,
  isSymbolAlreadyOpen = null,
}) => {
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
    navigate,
    activeSubscriptionFeatures,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    chartIdentifier,
    formData,
    setOptionChainCEList,
    setOptionChainPEList,
    setFormData,
    getSymbolExpiryList,
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

  // State for stock selector - simple input-based approach
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const selectorRef = useRef(null);
  const inputRef = useRef(null);
  const lastRequestedProductRef = useRef(null);
  const isInitializingRef = useRef(false);
  const watchListStableRef = useRef(null);

  // Stabilize watchList reference - only update if content actually changes
  useEffect(() => {
    if (!watchList || watchList.length === 0) {
      watchListStableRef.current = null;
      return;
    }

    // Compare by product identifiers, not reference
    const currentProducts = watchList
      .map((item) => item?.product || item?.identifier)
      .join(",");
    const previousProducts = watchListStableRef.current?.products || "";

    if (currentProducts !== previousProducts) {
      watchListStableRef.current = {
        list: watchList,
        products: currentProducts,
      };
    }
  }, [watchList]);

  // Reset selected option type when Greeks are toggled
  useEffect(() => {
    if (!showGreeks) {
      setSelectedOptionType("CE");
    }
  }, [showGreeks]);

  // Close selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setSearchInput("");
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus input when opens
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  // Filter stocks based on search input - show all if searching, otherwise all available
  const filteredStocks = useMemo(() => {
    if (!watchList) return [];
    if (!searchInput.trim()) return watchList; // Show all when no search

    const search = searchInput.toLowerCase();
    return watchList.filter((watch) => {
      return (
        watch?.product?.toLowerCase().includes(search) ||
        watch?.identifier?.toLowerCase().includes(search)
      );
    });
  }, [watchList, searchInput]);

  // Get current selected stock
  const currentStock = useMemo(() => {
    if (!watchList || !chartIdentifier) {
      return watchList?.[0];
    }

    // Try to find by identifier first
    const foundByIdentifier = watchList.find(
      (watch) => watch?.identifier === chartIdentifier?.identifier,
    );
    if (foundByIdentifier) return foundByIdentifier;

    // Try to find by product
    const foundByProduct = watchList.find(
      (watch) => watch?.product === chartIdentifier?.identifier,
    );
    if (foundByProduct) return foundByProduct;

    // Default to first item
    return watchList?.[0];
  }, [watchList, chartIdentifier]);

  // Handle stock selection
  const handleStockSelect = (stock) => {
    if (handleChange && stock) {
      const syntheticEvent = {
        target: {
          name: "strProduct",
          value: stock.product,
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

  // Chart page behavior: align with standalone OptionChain page.
  // Only trigger the standard `useOptionChain` flow (handleChange -> useEffect fetch).
  // Avoid direct/duplicate CE/PE API calls from this component.
  useEffect(() => {
    if (!currentSymbol || !handleChange) return;

    // Use stable watchList reference to prevent socket-triggered re-runs
    const stableWatchList = watchListStableRef.current?.list;
    if (!stableWatchList || stableWatchList.length === 0) return;

    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) return;

    const baseSymbol = currentSymbol.replace(/CE|PE.*$/i, "").trim();
    const baseUpper = baseSymbol.toUpperCase();

    const findWatchItem = stableWatchList.find((item) => {
      const itemProduct = item?.product?.toUpperCase() || "";
      const itemIdentifier = item?.identifier?.toUpperCase() || "";
      return (
        itemProduct === baseUpper ||
        itemIdentifier === baseUpper ||
        itemProduct.startsWith(baseUpper) ||
        itemIdentifier.startsWith(baseUpper)
      );
    });

    const productToUse = findWatchItem?.product;
    if (!productToUse) return;

    // Prevent re-trigger loops: check if already requested OR if formData already has this product
    if (
      lastRequestedProductRef.current === productToUse ||
      formData?.strProduct === productToUse
    ) {
      return;
    }

    // Mark as initializing to prevent concurrent calls
    isInitializingRef.current = true;
    lastRequestedProductRef.current = productToUse;

    // Trigger same flow as OptionChain page (clears lists, fetches expiry, then CE/PE).
    handleChange({
      target: { name: "strProduct", value: productToUse },
    });

    // Reset initialization flag after a delay (longer to prevent rapid re-triggers)
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 2000);
  }, [currentSymbol, formData?.strProduct]);

  // Note: watchList-load is handled by the effect above; avoid double triggering.

  // Effect to ensure option chain is loaded for currentSymbol when shouldOpenATMCEPE is true
  useEffect(() => {
    if (!shouldOpenATMCEPE || !currentSymbol || !handleChange) return;

    // Only trigger if chartIdentifier doesn't match AND we haven't already requested this
    if (chartIdentifier?.identifier === currentSymbol) return;

    // Prevent multiple simultaneous calls
    if (isInitializingRef.current) return;

    // Use stable watchList reference
    const stableWatchList = watchListStableRef.current?.list;
    if (!stableWatchList) return;

    const findWatchItem = stableWatchList.find(
      (item) =>
        item.product === currentSymbol || item.identifier === currentSymbol,
    );
    if (!findWatchItem) return;

    const productToUse = findWatchItem.product;
    if (!productToUse) return;

    // Prevent duplicate calls
    if (
      lastRequestedProductRef.current === productToUse ||
      formData?.strProduct === productToUse
    ) {
      return;
    }

    isInitializingRef.current = true;
    lastRequestedProductRef.current = productToUse;

    handleChange({
      target: { name: "strProduct", value: productToUse },
    });

    setTimeout(() => {
      isInitializingRef.current = false;
    }, 1000);
  }, [
    shouldOpenATMCEPE,
    currentSymbol,
    chartIdentifier?.identifier,
    formData?.strProduct,
    handleChange,
  ]);

  // Effect to find and send ATM CE+PE when requested
  useEffect(() => {
    if (!shouldOpenATMCEPE || !onReceiveATMCEPE) {
      return;
    }

    // Function to find and send ATM CE+PE
    const findAndSendATMCEPE = () => {
      // Check if data is available - need both CE and PE lists with data
      if (
        !optionChainCEList ||
        !optionChainPEList ||
        !symbolValueCE ||
        !symbolValuePE ||
        optionChainCEList.length === 0 ||
        optionChainPEList.length === 0
      ) {
        return false; // Data not ready
      }

      // Don't block on chartIdentifier mismatch - trust currentSymbol prop and loaded data
      // The data loading effect ensures correct symbol is loaded when shouldOpenATMCEPE is true

      // Find ATM CE (product === "ATM")
      const atmCE = optionChainCEList.find((item) => {
        const ceData = symbolValueCE[item?.identifier];
        return ceData?.product === "ATM";
      });

      // Find ATM PE (matching strike price)
      const atmPE = atmCE
        ? optionChainPEList.find((item) => {
            const peData = symbolValuePE[item?.identifier];
            if (!peData) return false;
            const ceStrikePrice = symbolValueCE[atmCE?.identifier]?.strikePrice;
            return (
              peData?.strikePrice === ceStrikePrice && peData?.product === "ATM"
            );
          })
        : null;

      if (atmCE && atmPE && atmCE.identifier && atmPE.identifier) {
        // Verify that the ATM options match the currentSymbol (first chart symbol)
        if (currentSymbol) {
          // Extract base symbol from CE identifier (e.g., BANKNIFTY25110425750CE -> BANKNIFTY)
          // Try multiple patterns to extract base symbol
          const ceBaseMatch = atmCE.identifier.match(/^([A-Z]+)/);
          const ceBaseSymbol = ceBaseMatch ? ceBaseMatch[1] : "";
          const currentSymbolUpper = currentSymbol.toUpperCase();

          // Check if the base symbol from CE matches current symbol
          // Handle cases like BANKNIFTY vs BANKNIFTY2511...
          if (
            ceBaseSymbol &&
            !ceBaseSymbol.startsWith(currentSymbolUpper) &&
            !currentSymbolUpper.startsWith(ceBaseSymbol)
          ) {
            // Symbols don't match - this is wrong symbol's options
            // Still return but will be validated in parent component
          }
        }

        // Use currentSymbol prop if provided (from first chart), otherwise use chartIdentifier
        const baseSymbolForCallback =
          currentSymbol || chartIdentifier?.identifier;
        // Call back with ATM CE and PE identifiers
        onReceiveATMCEPE(
          atmCE.identifier,
          atmPE.identifier,
          baseSymbolForCallback,
        );
        return true; // Success
      }

      return false; // Not found
    };

    // Try immediately first
    if (findAndSendATMCEPE()) {
      return; // Success, done
    }

    // Data not ready or not found - retry with interval
    // Increased retry time to 10 seconds (20 * 500ms) to allow data loading
    let retryCount = 0;
    const maxRetries = 20;

    const retryInterval = setInterval(() => {
      retryCount++;

      if (findAndSendATMCEPE()) {
        clearInterval(retryInterval);
      } else if (retryCount >= maxRetries) {
        // Max retries reached, notify failure
        clearInterval(retryInterval);
        onReceiveATMCEPE(null, null, null);
      }
    }, 500);

    return () => clearInterval(retryInterval);
  }, [
    shouldOpenATMCEPE,
    onReceiveATMCEPE,
    optionChainCEList,
    optionChainPEList,
    symbolValueCE,
    symbolValuePE,
    chartIdentifier,
    currentSymbol,
    isLoading,
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

  return (
    <section className="content option_chain_page chart_option_chain">
      <div className="option_data">
        <div className="left_option full_width">
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
                            : currentStock?.product || ""
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
                      <div className="stock-selector-popup">
                        <div className="stock-popup-list">
                          {filteredStocks.length > 0 ? (
                            filteredStocks.map((stock, index) => (
                              <div
                                key={`${stock?.product}-${stock?.identifier}-${index}`}
                                className={`stock-popup-item ${
                                  currentStock?.product === stock?.product
                                    ? "active"
                                    : ""
                                }`}
                                onClick={() => handleStockSelect(stock)}
                              >
                                <div className="stock-popup-symbol">
                                  {stock?.product}
                                </div>
                              </div>
                            ))
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
                  </span>
                  <Tooltip
                    arrow
                    enterTouchDelay={0}
                    leaveTouchDelay={10000}
                    componentsProps={tooltipDesign}
                    title="Chart"
                  >
                    <span
                      className="no-button"
                      onClick={
                        activeSubscriptionFeatures?.liveCharts?.enabled == false
                          ? () => handleClickDialogOpen()
                          : (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Close subscription dialog if open
                              if (dialogOpen) {
                                handleDialogClose();
                              }
                              // Close options chain popup if callback provided
                              if (onClosePopup) {
                                onClosePopup();
                              }
                              if (onNavigateToChart) {
                                onNavigateToChart(chartIdentifier?.identifier);
                              } else {
                                // Check if symbol is already open before navigating
                                if (
                                  isSymbolAlreadyOpen &&
                                  isSymbolAlreadyOpen(
                                    chartIdentifier?.identifier,
                                  )
                                ) {
                                  errorMsg(
                                    `This chart is already open: ${chartIdentifier?.identifier?.replace(/^[A-Z]+:/, "")}`,
                                  );
                                  return;
                                }
                                navigate(`/chart`, {
                                  state: {
                                    symbol: chartIdentifier?.identifier,
                                  },
                                });
                              }
                            }
                      }
                    >
                      <IconRegistry name="chart-line" size={20} />
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
                      return <option key={key}>{exData}</option>;
                    })}
                  </select>
                </div>
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
                {chartIdentifier?.symbolCategoryName == "MCX" ||
                chartIdentifier?.symbolCategoryName == "BSE" ? null : (
                  <div
                    className={`greeks-toggle-btn ${
                      showGreeks ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowGreeks(!showGreeks);
                    }}
                  >
                    <span>Greeks</span>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`price_content ${!showGreeks ? "greeks-hidden" : ""}`}
            >
              {showGreeks ? (
                // Greeks View Layout
                <div className="greeks-layout">
                  {/* Option Type Toggle */}
                  <div className="option-type-toggle">
                    <button
                      className={`toggle-btn ${
                        selectedOptionType === "CE" ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedOptionType("CE");
                      }}
                    >
                      Call
                    </button>
                    <button
                      className={`toggle-btn ${
                        selectedOptionType === "PE" ? "active" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedOptionType("PE");
                      }}
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

                        const isATMRow =
                          currentData?.product === "ATM" ||
                          currentGreeks?.product === "ATM";
                        return (
                          <div
                            key={key}
                            className={`greeks-row ${isATMRow ? "atm-row" : ""}`}
                          >
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
                              <span
                                style={{
                                  color:
                                    currentGreeks?.delta >= 0
                                      ? "#00ff88"
                                      : "#ff4444",
                                  fontWeight: "600",
                                }}
                              >
                                {currentGreeks?.delta
                                  ? parseFloat(currentGreeks.delta).toFixed(3)
                                  : "-"}
                              </span>
                            </div>
                            <div className="data-col">
                              <span
                                style={{
                                  color:
                                    currentGreeks?.gamma >= 0
                                      ? "#00ff88"
                                      : "#ff4444",
                                  fontWeight: "600",
                                }}
                              >
                                {currentGreeks?.gamma
                                  ? parseFloat(currentGreeks.gamma).toFixed(3)
                                  : "-"}
                              </span>
                            </div>
                            <div className="data-col">
                              <span
                                style={{
                                  color:
                                    currentGreeks?.theta >= 0
                                      ? "#00ff88"
                                      : "#ff4444",
                                  fontWeight: "600",
                                }}
                              >
                                {currentGreeks?.theta
                                  ? parseFloat(currentGreeks.theta).toFixed(3)
                                  : "-"}
                              </span>
                            </div>
                            <div className="data-col">
                              <span
                                style={{
                                  color:
                                    currentGreeks?.vega >= 0
                                      ? "#00ff88"
                                      : "#ff4444",
                                  fontWeight: "600",
                                }}
                              >
                                {currentGreeks?.vega
                                  ? parseFloat(currentGreeks.vega).toFixed(3)
                                  : "-"}
                              </span>
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
                  <div className="option-table-header only-desktop">
                    <div
                      className={`header-row ${
                        !showGreeks ? "greeks-hidden" : ""
                      } ${isMultiChartMode ? "multi-chart-mode" : ""}`}
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
                      <div className="header-cell">Product</div>
                      {!isMultiChartMode && (
                        <div className="header-cell">LTP Change</div>
                      )}
                      <div className="header-cell">LTP</div>
                      <div className="header-cell strike-header">
                        <div className="strike-header-content">
                          <span className="ce-indicator">CE</span>
                          <span className="strike-title">Strike</span>
                          <span className="pe-indicator">PE</span>
                        </div>
                      </div>
                      <div className="header-cell">LTP</div>
                      {!isMultiChartMode && (
                        <div className="header-cell">LTP Change</div>
                      )}
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
                  </div>

                  <div className="table-container">
                    <table className="option-table">
                      <thead>
                        <tr
                          className="only-desktop"
                          style={{ display: "none" }}
                        >
                          {showGreeks && <th>Delta</th>}
                          {showGreeks && <th>Gamma</th>}
                          {showGreeks && <th>Theta</th>}
                          {showGreeks && <th>Vega</th>}
                          {showGreeks && <th>IV</th>}
                          <th>Product</th>
                          {!isMultiChartMode && <th>LTP Change</th>}
                          <th>LTP</th>
                          <th className="strike">
                            <span className="ce-indicator">CE</span>
                            <span className="strike-title">Strike</span>
                            <span className="pe-indicator">PE</span>
                          </th>
                          <th>LTP</th>
                          {!isMultiChartMode && <th>LTP Change</th>}
                          <th>Product</th>
                          {showGreeks && <th>IV</th>}
                          {showGreeks && <th>Vega</th>}
                          {showGreeks && <th>Theta</th>}
                          {showGreeks && <th>Gamma</th>}
                          {showGreeks && <th>Delta</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <ShimmerTable
                            row={20}
                            col={showGreeks ? 17 : 7}
                            border={0}
                            borderColor={"#cbd5e1"}
                            rounded={0.25}
                            rowGap={1}
                            colPadding={[5, 5, 5, 5]}
                          />
                        ) : (
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
                                  ceProduct === "ATM" ? "main-content" : ""
                                } row position-relative ${
                                  !showGreeks ? "greeks-hidden" : ""
                                }`}
                                ref={ceProduct === "ATM" ? sectionRef : null}
                              >
                                {/* CE Greek Data Columns */}
                                {showGreeks && (
                                  <td
                                    className={`only-desktop greek-column delta ${
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
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
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
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
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
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
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
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
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
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
                                    ceProduct === "ITM" ? "secondary-color" : ""
                                  }`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                  data-product={
                                    symbolValueCE[val?.identifier]?.product ||
                                    "CE"
                                  }
                                >
                                  {symbolValueCE[val?.identifier]?.product}
                                  <div className="action-buttons ce-action-buttons">
                                    <Tooltip
                                      title={TextData.chartTooltip}
                                      arrow
                                    >
                                      <span
                                        className="chart-icon"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Close subscription dialog if open
                                          if (dialogOpen) {
                                            handleDialogClose();
                                          }
                                          // Close options chain popup if callback provided
                                          if (onClosePopup) {
                                            onClosePopup();
                                          }
                                          if (onNavigateToChart) {
                                            // Pass option data for CE
                                            onNavigateToChart(val?.identifier, {
                                              baseSymbol:
                                                chartIdentifier?.identifier,
                                              strikePrice:
                                                symbolValueCE[val?.identifier]
                                                  ?.strikePrice,
                                              optionType: "CE",
                                            });
                                          } else {
                                            // Check if symbol is already open before navigating
                                            if (
                                              isSymbolAlreadyOpen &&
                                              isSymbolAlreadyOpen(
                                                val?.identifier,
                                              )
                                            ) {
                                              errorMsg(
                                                `This chart is already open: ${val?.identifier?.replace(/^[A-Z]+:/, "")}`,
                                              );
                                              return;
                                            }
                                            navigate("/chart", {
                                              state: {
                                                symbol: val?.identifier,
                                              },
                                            });
                                          }
                                        }}
                                      >
                                        <IconRegistry
                                          name="chart-line"
                                          size={14}
                                        />
                                      </span>
                                    </Tooltip>
                                  </div>
                                </td>
                                {!isMultiChartMode && (
                                  <td
                                    className={`only-desktop ${
                                      ceProduct === "ITM"
                                        ? "secondary-color"
                                        : ""
                                    }`}
                                    onMouseEnter={handleMouseEnter(key, "CE")}
                                  >
                                    {symbolValueCE[val?.identifier]
                                      ?.priceChangePercentage === 0 ? (
                                      symbolValueCE[val?.identifier]
                                        ?.priceChangePercentage
                                    ) : symbolValueCE[val?.identifier]
                                        ?.priceChangePercentage > 0 ? (
                                      <div className="text-success">
                                        <IconRegistry
                                          name="caret-up"
                                          size={20}
                                        />
                                        {
                                          symbolValueCE[val?.identifier]
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
                                          symbolValueCE[val?.identifier]
                                            ?.priceChangePercentage
                                        }
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td
                                  className={`only-desktop ${
                                    ceProduct === "ITM"
                                      ? "secondary-color new-flex-data"
                                      : ""
                                  } ${ceProduct === "ATM" ? "atm-ltp-cell" : ""}`}
                                  onMouseEnter={handleMouseEnter(key, "CE")}
                                >
                                  {
                                    symbolValueCE[val?.identifier]
                                      ?.lastTradePrice
                                  }
                                </td>

                                <td className="only-desktop strike">
                                  {symbolValueCE[val?.identifier]?.strikePrice}
                                </td>

                                {pe ? (
                                  <>
                                    <td
                                      className={`only-desktop ${
                                        peProduct === "ITM"
                                          ? "secondary-color"
                                          : ""
                                      } ${peProduct === "ATM" ? "atm-ltp-cell" : ""}`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                    >
                                      {
                                        symbolValuePE[pe?.identifier]
                                          ?.lastTradePrice
                                      }
                                    </td>
                                    {!isMultiChartMode && (
                                      <td
                                        className={`only-desktop ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePE[pe?.identifier]
                                          ?.priceChangePercentage === 0 ? (
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
                                    )}
                                    <td
                                      className={`only-desktop pe-product-column ${
                                        peProduct === "ITM"
                                          ? "secondary-color"
                                          : ""
                                      }`}
                                      onMouseEnter={handleMouseEnter(key, "PE")}
                                      data-product={
                                        symbolValuePE[pe?.identifier]
                                          ?.product || "PE"
                                      }
                                    >
                                      {symbolValuePE[pe?.identifier]?.product}{" "}
                                      <div className="action-buttons pe-action-buttons">
                                        <Tooltip
                                          title={TextData.chartTooltip}
                                          arrow
                                        >
                                          <span
                                            className="chart-icon"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              // Close subscription dialog if open
                                              if (dialogOpen) {
                                                handleDialogClose();
                                              }
                                              // Close options chain popup if callback provided
                                              if (onClosePopup) {
                                                onClosePopup();
                                              }
                                              if (onNavigateToChart) {
                                                // Pass option data for PE
                                                onNavigateToChart(
                                                  pe?.identifier,
                                                  {
                                                    baseSymbol:
                                                      chartIdentifier?.identifier,
                                                    strikePrice:
                                                      symbolValuePE[
                                                        pe?.identifier
                                                      ]?.strikePrice,
                                                    optionType: "PE",
                                                  },
                                                );
                                              } else {
                                                // Check if symbol is already open before navigating
                                                if (
                                                  isSymbolAlreadyOpen &&
                                                  isSymbolAlreadyOpen(
                                                    pe?.identifier,
                                                  )
                                                ) {
                                                  errorMsg(
                                                    `This chart is already open: ${pe?.identifier?.replace(/^[A-Z]+:/, "")}`,
                                                  );
                                                  return;
                                                }
                                                navigate("/chart", {
                                                  state: {
                                                    symbol: pe?.identifier,
                                                  },
                                                });
                                              }
                                            }}
                                          >
                                            <IconRegistry
                                              name="chart-line"
                                              size={14}
                                            />
                                          </span>
                                        </Tooltip>
                                      </div>
                                    </td>
                                    {/* PE Greek Data Columns */}
                                    {showGreeks && (
                                      <td
                                        className={`only-desktop greek-column iv ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePEGreeks[pe?.identifier]?.iv
                                          ? parseFloat(
                                              symbolValuePEGreeks[
                                                pe?.identifier
                                              ]?.iv,
                                            ).toFixed(4)
                                          : "0.0000"}
                                      </td>
                                    )}
                                    {showGreeks && (
                                      <td
                                        className={`only-desktop greek-column vega ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePEGreeks[pe?.identifier]
                                          ?.vega
                                          ? parseFloat(
                                              symbolValuePEGreeks[
                                                pe?.identifier
                                              ]?.vega,
                                            ).toFixed(4)
                                          : "0.0000"}
                                      </td>
                                    )}
                                    {showGreeks && (
                                      <td
                                        className={`only-desktop greek-column theta ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePEGreeks[pe?.identifier]
                                          ?.theta
                                          ? parseFloat(
                                              symbolValuePEGreeks[
                                                pe?.identifier
                                              ]?.theta,
                                            ).toFixed(4)
                                          : "0.0000"}
                                      </td>
                                    )}
                                    {showGreeks && (
                                      <td
                                        className={`only-desktop greek-column gamma ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePEGreeks[pe?.identifier]
                                          ?.gamma
                                          ? parseFloat(
                                              symbolValuePEGreeks[
                                                pe?.identifier
                                              ]?.gamma,
                                            ).toFixed(4)
                                          : "0.0000"}
                                      </td>
                                    )}
                                    {showGreeks && (
                                      <td
                                        className={`only-desktop greek-column delta ${
                                          peProduct === "ITM"
                                            ? "secondary-color"
                                            : ""
                                        }`}
                                        onMouseEnter={handleMouseEnter(
                                          key,
                                          "PE",
                                        )}
                                      >
                                        {symbolValuePEGreeks[pe?.identifier]
                                          ?.delta
                                          ? parseFloat(
                                              symbolValuePEGreeks[
                                                pe?.identifier
                                              ]?.delta,
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
                                    <div className="values">
                                      <div className="val">
                                        {symbolValueCE[val?.identifier]
                                          ?.lastTradePrice || "-"}
                                      </div>
                                      <div className="val">
                                        {symbolValueCE[val?.identifier]
                                          ?.strikePrice || "-"}
                                      </div>
                                      <div className="val">
                                        {pe
                                          ? symbolValuePE[pe?.identifier]
                                              ?.lastTradePrice || "-"
                                          : "-"}
                                      </div>
                                    </div>
                                    <div className="meta">
                                      <span
                                        className={
                                          symbolValueCE[val?.identifier]
                                            ?.priceChangePercentage >= 0
                                            ? "text-success"
                                            : "text-danger"
                                        }
                                      >
                                        {symbolValueCE[val?.identifier]
                                          ?.priceChangePercentage >= 0 ? (
                                          <IconRegistry
                                            name="caret-up"
                                            size={16}
                                          />
                                        ) : (
                                          <IconRegistry
                                            name="caret-down"
                                            size={16}
                                          />
                                        )}
                                        {Math.abs(
                                          symbolValueCE[val?.identifier]
                                            ?.priceChangePercentage || 0,
                                        )}
                                      </span>
                                      <span className="pill">
                                        {symbolValueCE[val?.identifier]
                                          ?.product || "CE"}
                                      </span>
                                      <span
                                        className={
                                          pe &&
                                          symbolValuePE[pe?.identifier]
                                            ?.priceChangePercentage >= 0
                                            ? "text-success"
                                            : "text-danger"
                                        }
                                      >
                                        {pe ? (
                                          <>
                                            {symbolValuePE[pe?.identifier]
                                              ?.priceChangePercentage >= 0 ? (
                                              <IconRegistry
                                                name="caret-up"
                                                size={16}
                                              />
                                            ) : (
                                              <IconRegistry
                                                name="caret-down"
                                                size={16}
                                              />
                                            )}
                                            {Math.abs(
                                              symbolValuePE[pe?.identifier]
                                                ?.priceChangePercentage || 0,
                                            )}
                                          </>
                                        ) : (
                                          "-"
                                        )}
                                      </span>
                                    </div>
                                    <div className="mobile-chart-actions">
                                      <Tooltip
                                        title={
                                          TextData.chartTooltip || "Open Chart"
                                        }
                                        arrow
                                        enterTouchDelay={0}
                                      >
                                        <button
                                          type="button"
                                          className="mobile-chart-icon ce-chart"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Close subscription dialog if open
                                            if (dialogOpen) {
                                              handleDialogClose();
                                            }
                                            // Close options chain popup if callback provided
                                            if (onClosePopup) {
                                              onClosePopup();
                                            }
                                            if (onNavigateToChart) {
                                              onNavigateToChart(
                                                val?.identifier,
                                                {
                                                  baseSymbol:
                                                    chartIdentifier?.identifier,
                                                  strikePrice:
                                                    symbolValueCE[
                                                      val?.identifier
                                                    ]?.strikePrice,
                                                  optionType: "CE",
                                                },
                                              );
                                            } else {
                                              // Check if symbol is already open before navigating
                                              if (
                                                isSymbolAlreadyOpen &&
                                                isSymbolAlreadyOpen(
                                                  val?.identifier,
                                                )
                                              ) {
                                                errorMsg(
                                                  `This chart is already open: ${val?.identifier?.replace(/^[A-Z]+:/, "")}`,
                                                );
                                                return;
                                              }
                                              navigate("/chart", {
                                                state: {
                                                  symbol: val?.identifier,
                                                },
                                              });
                                            }
                                          }}
                                          onTouchStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onTouchEnd={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Close subscription dialog if open
                                            if (dialogOpen) {
                                              handleDialogClose();
                                            }
                                            // Close options chain popup if callback provided
                                            if (onClosePopup) {
                                              onClosePopup();
                                            }
                                            if (onNavigateToChart) {
                                              onNavigateToChart(
                                                val?.identifier,
                                                {
                                                  baseSymbol:
                                                    chartIdentifier?.identifier,
                                                  strikePrice:
                                                    symbolValueCE[
                                                      val?.identifier
                                                    ]?.strikePrice,
                                                  optionType: "CE",
                                                },
                                              );
                                            } else {
                                              navigate("/chart", {
                                                state: {
                                                  symbol: val?.identifier,
                                                },
                                              });
                                            }
                                          }}
                                        >
                                          <IconRegistry
                                            name="chart-line"
                                            size={18}
                                          />
                                        </button>
                                      </Tooltip>
                                      {pe && (
                                        <Tooltip
                                          title={
                                            TextData.chartTooltip ||
                                            "Open Chart"
                                          }
                                          arrow
                                          enterTouchDelay={0}
                                        >
                                          <button
                                            type="button"
                                            className="mobile-chart-icon pe-chart"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              // Close subscription dialog if open
                                              if (dialogOpen) {
                                                handleDialogClose();
                                              }
                                              // Close options chain popup if callback provided
                                              if (onClosePopup) {
                                                onClosePopup();
                                              }
                                              if (onNavigateToChart) {
                                                onNavigateToChart(
                                                  pe?.identifier,
                                                  {
                                                    baseSymbol:
                                                      chartIdentifier?.identifier,
                                                    strikePrice:
                                                      symbolValuePE[
                                                        pe?.identifier
                                                      ]?.strikePrice,
                                                    optionType: "PE",
                                                  },
                                                );
                                              } else {
                                                // Check if symbol is already open before navigating
                                                if (
                                                  isSymbolAlreadyOpen &&
                                                  isSymbolAlreadyOpen(
                                                    pe?.identifier,
                                                  )
                                                ) {
                                                  errorMsg(
                                                    `This chart is already open: ${pe?.identifier?.replace(/^[A-Z]+:/, "")}`,
                                                  );
                                                  return;
                                                }
                                                navigate("/chart", {
                                                  state: {
                                                    symbol: pe?.identifier,
                                                  },
                                                });
                                              }
                                            }}
                                            onTouchStart={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                            }}
                                            onTouchEnd={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              // Close subscription dialog if open
                                              if (dialogOpen) {
                                                handleDialogClose();
                                              }
                                              // Close options chain popup if callback provided
                                              if (onClosePopup) {
                                                onClosePopup();
                                              }
                                              if (onNavigateToChart) {
                                                onNavigateToChart(
                                                  pe?.identifier,
                                                  {
                                                    baseSymbol:
                                                      chartIdentifier?.identifier,
                                                    strikePrice:
                                                      symbolValuePE[
                                                        pe?.identifier
                                                      ]?.strikePrice,
                                                    optionType: "PE",
                                                  },
                                                );
                                              } else {
                                                navigate("/chart", {
                                                  state: {
                                                    symbol: pe?.identifier,
                                                  },
                                                });
                                              }
                                            }}
                                          >
                                            <IconRegistry
                                              name="chart-line"
                                              size={18}
                                            />
                                          </button>
                                        </Tooltip>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {dialogOpen && (
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}
    </section>
  );
};

export default ChartOptionChain;
