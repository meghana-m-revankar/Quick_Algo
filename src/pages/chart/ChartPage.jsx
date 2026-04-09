import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useChartWidget } from "../../hooks/useChartWidget";
import { useChartSocket } from "../../hooks/useSignalR";
import { useSignalR } from "../../services/signalR";
import { fetchWatchList } from "../../utils/watchList";
import ChartOptionChain from "../../components/optionChainCard/ChartOptionChain";
import ActiveStrategies from "../strategyList/ActiveStrategies";
import { ThemeContext } from "../../context";
import { useTradingBox } from "../../context/TradingBoxContext";
import {
  IconRegistry,
  TradingBoxContainer,
  EditOrderDialog,
  SubscriptionDialog,
} from "#components";
import { useGlobalServices } from "#services/global";
import {
  asyncGetOrderListActive,
  asyncOrderExit,
} from "../../redux/order/action.js";
import {
  asyncGetSymbolCategoryList,
  asyncGetSymbolIdentifierByCustomerID,
} from "../../redux/symbol/symbolAction.js";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "../../redux/optionChain/optionChainAction.js";
import { fetchSymbolExpiryList } from "../../utils/watchList";
import useSymbolDetails from "../../hooks/useSymbol";
import { handleCatchErrors } from "../../utils/validation";
import { errorMsg } from "../../utils/helpers";
import Storage from "../../services/storage";
import "./ChartPage.scss";

// Global chart library loading promise to prevent duplicate loads
let globalChartLibraryPromise = null;

// Individual chart library loaders for each chart - Optimized to prevent duplicate loading
const createIndividualChartLoader = (chartId) => {
  return new Promise((resolve, reject) => {
    // Check if TradingView is already loaded
    if (window.TradingView && window.TradingView.widget) {
      resolve({ widget: window.TradingView.widget, chartId });
      return;
    }

    // If library is already being loaded, reuse the promise
    if (globalChartLibraryPromise) {
      globalChartLibraryPromise
        .then(() => {
          if (window.TradingView && window.TradingView.widget) {
            resolve({ widget: window.TradingView.widget, chartId });
          } else {
            reject(
              new Error(
                `TradingView widget not found after script load for ${chartId}`,
              ),
            );
          }
        })
        .catch(reject);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.getElementById("charting-library-global");
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        if (window.TradingView && window.TradingView.widget) {
          resolve({ widget: window.TradingView.widget, chartId });
          return;
        }
      } else {
        // Script is loading, wait for it
        existingScript.addEventListener("load", () => {
          if (window.TradingView && window.TradingView.widget) {
            resolve({ widget: window.TradingView.widget, chartId });
          } else {
            reject(
              new Error(
                `TradingView widget not found after script load for ${chartId}`,
              ),
            );
          }
        });
        return;
      }
    }

    // Create script element - use single global script for all charts
    const script = document.createElement("script");
    script.id = "charting-library-global";
    script.src = "/charting_library/charting_library.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    // Create promise for this load
    globalChartLibraryPromise = new Promise((scriptResolve, scriptReject) => {
      script.onload = () => {
        script.dataset.loaded = "true";
        if (window.TradingView && window.TradingView.widget) {
          scriptResolve({ widget: window.TradingView.widget });
        } else {
          scriptReject(
            new Error(
              `TradingView widget not found after script load for ${chartId}`,
            ),
          );
        }
      };

      script.onerror = () => {
        scriptReject(
          new Error(
            `Failed to load TradingView charting library for ${chartId}`,
          ),
        );
      };
    });

    document.head.appendChild(script);

    // Wait for the global promise
    globalChartLibraryPromise
      .then((result) => {
        resolve({ widget: result.widget, chartId });
      })
      .catch(reject);
  });
};

// Check environment and use appropriate chart API endpoint
const isDevelopment = process.env.REACT_APP_ENV === "development";
const REACT_APP_CHART_API_ENDPOINT = isDevelopment
  ? process.env.REACT_APP_CHART_API_ENDPOINT
  : process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT;

const { REACT_APP_CHART_SECRET_TOKEN } = process.env;
const lastBarsCache = new Map();
const apiCallCache = new Map();
const activeRequests = new Map();

// Map category names to category IDs (same as algo page)
const categoryIdMap = {
  NSE: 1,
  FUTURES: 2,
  OPTIONS: 5,
  MCX: 3,
  BSE: 12,
};

const ChartPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const symbol =
    location?.state?.symbol || localStorage.getItem("_symbol") || "NIFTY";

  // Get theme from context
  const { themeMode, setThemeMode } = useContext(ThemeContext);

  // Get trading box context
  const { tradingBoxes, addTradingBox } = useTradingBox();

  // Get subscription features
  const { activeSubscriptionFeatures } = useGlobalServices();
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] =
    useState("");

  const chartContainerRef = useRef();
  const chartContainer2Ref = useRef();
  const [retryCount, setRetryCount] = useState(0);
  const [chartLayout, setChartLayout] = useState("horizontal");
  const [chartCount, setChartCount] = useState(1); // Default to 1 chart
  // Keep only actually-open chart symbols in state by default.
  // Additional symbols are appended only when user opens more charts.
  const [chartSymbols, setChartSymbols] = useState([symbol]);

  // Widget initialization tracking refs - defined early for use in forceWidget2Reset
  const widgetInitTrackingRef = useRef({
    widget2: false,
    widget3: false,
    widget4: false,
  });
  const [showOptionChain, setShowOptionChain] = useState(false);
  const [showOrders, setShowOrders] = useState(false); // Start with false on mobile
  const [showTradingBox, setShowTradingBox] = useState(false);

  // State for OptionChain popup (moved earlier to avoid initialization error)
  const [showOptionChainPopup, setShowOptionChainPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // State for left slide panel (option chain) - moved earlier to avoid initialization error
  const [showLeftSlidePanel, setShowLeftSlidePanel] = useState(false);

  // Chart management dialog state
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [pendingSymbol, setPendingSymbol] = useState(null);
  const [isFirstChartOpen, setIsFirstChartOpen] = useState(false);

  // CE/PE option dialog state
  const [showOptionDialog, setShowOptionDialog] = useState(false);
  const [pendingOptionData, setPendingOptionData] = useState(null);

  // CE+PE sub-dialog state
  const [showCEPESubDialog, setShowCEPESubDialog] = useState(false);

  // State to trigger ATM CE+PE opening
  const [shouldOpenATMCEPE, setShouldOpenATMCEPE] = useState(false);

  // Mobile popup state
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [mobilePopupType, setMobilePopupType] = useState("");
  const [mobilePopupTitle, setMobilePopupTitle] = useState("");
  const [mobilePopupIcon, setMobilePopupIcon] = useState("");

  // State for active orders per chart symbol
  const [chartOrders, setChartOrders] = useState({});
  const [orderDialogState, setOrderDialogState] = useState({
    open: false,
    orderData: null,
    symbol: null,
  });

  // Mobile detection and orientation
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth,
  );

  // Simple mobile detection
  const detectMobile = () => {
    return window.innerWidth <= 768;
  };

  // Simple orientation detection
  const getOrientation = () => {
    return window.innerHeight > window.innerWidth;
  };

  // Mobile chart count state
  const [mobileChartCount, setMobileChartCount] = useState(1); // Default to 1 chart on mobile

  // Force chart count based on mobile state
  const effectiveChartCount = isMobile ? mobileChartCount : chartCount;

  // Subscription-aware max charts (defaults to 1 when no subscription)
  const getMaxChartsAllowed = useCallback(() => {
    const deviceMax = isMobile ? 2 : 3;

    const liveEnabled = activeSubscriptionFeatures?.liveCharts?.enabled;
    const chartsCount = activeSubscriptionFeatures?.liveCharts?.chartsCount;

    // If no active subscription features, or liveCharts disabled → only 1 chart allowed
    if (!activeSubscriptionFeatures || liveEnabled === false) {
      return 1;
    }

    // If chartsCount is 0/undefined, default to 1
    const subscriptionMax =
      chartsCount === 0 || chartsCount === undefined ? 1 : chartsCount;

    return Math.min(deviceMax, subscriptionMax);
  }, [isMobile, activeSubscriptionFeatures]);

  // Monitor chart count and enforce limit
  useEffect(() => {
    const maxChartsAllowed = getMaxChartsAllowed();
    const currentCount = isMobile ? mobileChartCount : chartCount;

    if (currentCount > maxChartsAllowed) {
      // Revert to max allowed count
      if (isMobile) {
        setMobileChartCount(maxChartsAllowed);
      } else {
        setChartCount(maxChartsAllowed);
      }

      setSubscriptionUpgradeMessage(
        `You have reached the maximum chart limit (${maxChartsAllowed}). Please upgrade your subscription to add more charts.`,
      );
      setSubscriptionUpgradeOpen(true);
    }
  }, [chartCount, mobileChartCount, isMobile, getMaxChartsAllowed]);

  // Cleanup widget function
  const cleanupWidget = (widget, widgetName, destroyFunction) => {
    if (widget && destroyFunction) {
      try {
        // Use the hook's destroyWidget function to properly reset state
        destroyFunction();

        // Update widget state tracking
        const widgetKey = widgetName.toLowerCase().replace("widget", "widget");
        widgetStatesRef.current[widgetKey] = null;
        widgetInitTrackingRef.current[widgetKey] = false; // Reset initialization tracking
      } catch (error) {
        // Error removing widget
      }
    }
  };

  // Force widget2 state reset function - defined early to avoid initialization error
  const forceWidget2Reset = useCallback(() => {
    if (widgetInitTrackingRef.current) {
      widgetInitTrackingRef.current.widget2 = false; // Reset initialization tracking
    }
    // Force a re-render by updating a dummy state
    setRetryCount((prev) => prev + 1);
  }, []);

  // Toggle mobile chart count between 1 and 2 (max 2 on mobile)
  const toggleMobileChartCount = useCallback(() => {
    if (isMobile) {
      const currentCount = mobileChartCount;
      const newCount = currentCount === 1 ? 2 : 1;

      if (newCount === 2) {
        // Check limit before increasing
        const chartsCount = activeSubscriptionFeatures?.liveCharts?.chartsCount;
        // If chartsCount is 0 or undefined, default to 1 chart allowed
        const maxChartsCount =
          chartsCount === 0 || chartsCount === undefined ? 1 : chartsCount;
        if (newCount > maxChartsCount) {
          setSubscriptionUpgradeMessage(
            `You have reached the maximum chart limit (${maxChartsCount}). Please upgrade your subscription to add more charts.`,
          );
          setSubscriptionUpgradeOpen(true);
          return;
        }

        // Opening second chart - ensure we have symbols for it
        setChartSymbols((prevSymbols) => {
          const newSymbols = [...prevSymbols];
          // Ensure we have at least 2 symbols
          while (newSymbols.length < 2) {
            newSymbols.push(newSymbols.length === 1 ? "NIFTY" : "BANKNIFTY");
          }
          return newSymbols;
        });
        forceWidget2Reset();
      } else {
        // Closing second chart - update symbols array
        setChartSymbols((prevSymbols) => {
          const newSymbols = [...prevSymbols];
          // Remove the second chart's symbol, keep at least one
          if (newSymbols.length > 1) {
            newSymbols.splice(1, 1);
          }
          return newSymbols;
        });
      }

      setMobileChartCount(newCount);
    }
  }, [
    isMobile,
    mobileChartCount,
    activeSubscriptionFeatures,
    forceWidget2Reset,
  ]);

  // Enhanced automatic orientation detection and handling
  useEffect(() => {
    // Function to detect orientation and update state
    const detectOrientation = () => {
      const newIsPortrait = getOrientation();
      const orientationChanged = newIsPortrait !== isPortrait;

      if (orientationChanged) {
        setIsPortrait(newIsPortrait);
        applyResponsiveGridClasses();
      }
    };

    // Function to apply responsive grid classes
    const applyResponsiveGridClasses = () => {
      const chartsWrapper = document.querySelector(".charts-wrapper");
      if (chartsWrapper) {
        // Remove existing classes
        chartsWrapper.classList.remove("one", "two", "three", "four");

        // Add appropriate class based on chart count
        if (effectiveChartCount === 1) {
          chartsWrapper.classList.add("one");
        } else if (effectiveChartCount === 2) {
          chartsWrapper.classList.add("two");
        } else if (effectiveChartCount === 3) {
          chartsWrapper.classList.add("three");
        } else if (effectiveChartCount === 3) {
          chartsWrapper.classList.add("four");
        }
      }
    };

    // Function to handle chart count changes
    const handleChartCountChange = () => {
      applyResponsiveGridClasses();

      // Force chart resize after count change
      // Call immediately without delay
      handleChartResize();
    };

    // Chart resize function
    const handleChartResize = () => {
      const charts = document.querySelectorAll(".chart-container");

      charts.forEach((chart, index) => {
        if (chart && chart.clientWidth > 0) {
          // Force chart to recalculate dimensions
          chart.style.width = chart.clientWidth + "px";
          chart.style.height = chart.clientHeight + "px";

          // Dispatch resize event for TradingView charts
          const resizeEvent = new Event("resize");
          chart.dispatchEvent(resizeEvent);
        }
      });

      // Apply responsive grid classes after resize
      applyResponsiveGridClasses();
    };

    // Function to handle orientation change specifically
    const handleOrientationChange = () => {
      // Wait for the orientation change to complete
      // Detect orientation immediately
      detectOrientation();

      // Force a complete chart refresh after orientation change
      handleChartResize();

      // Additional chart refresh for TradingView
      requestAnimationFrame(() => {
        document.querySelectorAll(".chart-container").forEach((chart) => {
          if (chart) {
            const resizeEvent = new Event("resize");
            chart.dispatchEvent(resizeEvent);
          }
        });
      });
    };

    // Function to handle window resize
    const handleResize = () => {
      detectOrientation();
      handleChartResize();
      // Also check if tab relocation is needed
      handleSmartTabRelocation();
    };

    // Add event listeners
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    // Add orientation change handler
    window.addEventListener("orientationchange", handleOrientationChange);

    // Initial orientation detection
    detectOrientation();

    // Initial mobile detection - Deferred for faster initial load
    const timeoutId = setTimeout(() => {
      const initialMobile = detectMobile();
      if (initialMobile !== isMobile) {
        setIsMobile(initialMobile);
      }

      // Apply initial grid classes after mobile detection
      applyResponsiveGridClasses();
      handleSmartTabRelocation();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [isPortrait, chartCount, isMobile]);

  const { subscribeOnStream, unsubscribeOnStream } = useChartSocket();
  const signalRContext = useSignalR();
  const [currentSymbol, setCurrentSymbol] = useState(null);

  // Get watchList for current price - Organized by segments
  const [watchList, setWatchList] = useState([]);
  const [symbolCategoryList, setSymbolCategoryList] = useState([]);
  const [stocksBySegment, setStocksBySegment] = useState({});
  const [selectedSegment, setSelectedSegment] = useState({}); // Per chart segment selection
  // Lazy-load categories/stocks only when user opens selector.
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Options Chain data state
  const [optionsChainData, setOptionsChainData] = useState([]);
  const [optionsChainLoading, setOptionsChainLoading] = useState(false);

  // Fetch stocks for all categories (same logic as algo page)
  const fetchStocksForCategories = useCallback(
    async (categories) => {
      try {
        // First get all symbols like algo page does
        const result = await asyncGetSymbolIdentifierByCustomerID({
          searchtxt: "",
        });
        const allData = result?.data?.result || [];

        const allStocks = {};
        const combinedList = [];

        // Process each category like algo page
        const updatedList = await Promise.all(
          categories.map(async (val) => {
            const categoryName = val?.symbolCategoryName;

            if (categoryName === "NSE") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "NSE",
              );
              const watchListNSEData = await fetchWatchList(
                { categoryID: 1, identifier: "" },
                navigate,
              );

              const finalSymbolCategoryData = symbolCategoryData.map(
                (mainItem) => {
                  const match = watchListNSEData?.find(
                    (item) => item.symbolIdentifierId == mainItem.identifierID,
                  );

                  return {
                    ...mainItem,
                    watchListID: match ? match.watchListID : 0,
                    symbolIdentifierId: match
                      ? match.symbolIdentifierId
                      : mainItem.identifierID,
                    addedinAlgoTrade: match ? match.addedinAlgoTrade : false,
                    customerAlgoTradeID: match ? match.customerAlgoTradeID : 0,
                    identifier: mainItem.identifier || mainItem.identifierName,
                    product: mainItem.product || mainItem.productName,
                  };
                },
              );
              return { ...val, symbol: finalSymbolCategoryData };
            }

            if (categoryName === "FUTURES") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "FUTURES",
              );

              let watchListFUTData = await fetchWatchList(
                { categoryID: 2, identifier: "" },
                navigate,
              );
              if (!watchListFUTData) {
                watchListFUTData = [];
              }

              const finalSymbolCategoryData = symbolCategoryData.map(
                (mainItem) => {
                  const match = watchListFUTData?.find(
                    (item) => item.symbolIdentifierId == mainItem.identifierID,
                  );

                  return {
                    ...mainItem,
                    watchListID: match ? match.watchListID : 0,
                    symbolIdentifierId: match
                      ? match.symbolIdentifierId
                      : mainItem.identifierID,
                    addedinAlgoTrade: match ? match.addedinAlgoTrade : false,
                    customerAlgoTradeID: match ? match.customerAlgoTradeID : 0,
                    identifier: mainItem.identifier || mainItem.identifierName,
                    product: mainItem.product || mainItem.productName,
                  };
                },
              );

              return { ...val, symbol: finalSymbolCategoryData };
            }

            if (categoryName === "OPTIONS") {
              let data = await fetchWatchList(
                { categoryID: 5, identifier: "" },
                navigate,
              );
              if (!data) {
                data = [];
              }

              return { ...val, symbol: data };
            }

            if (categoryName === "MCX") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "MCX",
              );
              let watchListFUTData = await fetchWatchList(
                { categoryID: 3, identifier: "" },
                navigate,
              );

              if (!watchListFUTData) {
                watchListFUTData = [];
              }

              const finalSymbolCategoryData =
                symbolCategoryData
                  ?.map((mainItem) => {
                    if (!mainItem) return null;

                    const match = watchListFUTData?.find(
                      (item) =>
                        item?.symbolIdentifierId == mainItem?.identifierID,
                    );

                    return {
                      ...mainItem,
                      watchListID: match?.watchListID || 0,
                      symbolIdentifierId:
                        match?.symbolIdentifierId || mainItem?.identifierID,
                      addedinAlgoTrade: match?.addedinAlgoTrade || false,
                      customerAlgoTradeID: match?.customerAlgoTradeID || 0,
                      identifier:
                        mainItem.identifier || mainItem.identifierName,
                      product: mainItem.product || mainItem.productName,
                    };
                  })
                  ?.filter(Boolean) || [];
              return { ...val, symbol: finalSymbolCategoryData };
            }

            if (categoryName === "BSE") {
              const symbolCategoryData = allData?.filter(
                (v) => v?.symbolCategoryName === "BSE",
              );
              let watchListFUTData = await fetchWatchList(
                { categoryID: 12, identifier: "" },
                navigate,
              );
              if (!watchListFUTData) {
                watchListFUTData = [];
              }
              const finalSymbolCategoryData =
                symbolCategoryData
                  ?.map((mainItem) => {
                    if (!mainItem) return null;

                    const match = watchListFUTData?.find(
                      (item) =>
                        item?.symbolIdentifierId == mainItem?.identifierID,
                    );

                    return {
                      ...mainItem,
                      watchListID: match?.watchListID || 0,
                      symbolIdentifierId:
                        match?.symbolIdentifierId || mainItem?.identifierID,
                      addedinAlgoTrade: match?.addedinAlgoTrade || false,
                      customerAlgoTradeID: match?.customerAlgoTradeID || 0,
                      identifier:
                        mainItem.identifier || mainItem.identifierName,
                      product: mainItem.product || mainItem.productName,
                    };
                  })
                  ?.filter(Boolean) || [];
              return { ...val, symbol: finalSymbolCategoryData };
            }

            return val;
          }),
        );

        // Organize stocks by segment
        updatedList.forEach((category) => {
          const categoryName = category?.symbolCategoryName;
          if (category?.symbol && category.symbol.length > 0) {
            allStocks[categoryName] = category.symbol;
            combinedList.push(...category.symbol);
          }
        });

        setStocksBySegment(allStocks);
        // Set default watchList to first category
        if (updatedList.length > 0) {
          const firstCategory = updatedList[0]?.symbolCategoryName;
          if (allStocks[firstCategory] && allStocks[firstCategory].length > 0) {
            setWatchList(allStocks[firstCategory]);
          } else if (combinedList.length > 0) {
            setWatchList(combinedList);
          }
        }
      } catch (error) {
        handleCatchErrors(error, navigate);
      }
    },
    [navigate],
  );

  // Fetch symbol categories (same as algo page)
  const getSymbolCategoryList = useCallback(async () => {
    try {
      setCategoryLoading(true);
      const result = await asyncGetSymbolCategoryList();
      const allCategory = result?.data?.result;

      if (allCategory?.length) {
        setSymbolCategoryList(allCategory);
        // Fetch stocks for each category
        await fetchStocksForCategories(allCategory);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
    } finally {
      setCategoryLoading(false);
    }
  }, [navigate, fetchStocksForCategories]);

  // Ensure categories/stocks are loaded only when needed (stock selector open).
  const ensureSymbolCatalogLoaded = useCallback(() => {
    if (categoryLoading) return;
    if (symbolCategoryList?.length > 0) return;
    // Fire-and-forget: caller just needs the load to start.
    getSymbolCategoryList();
  }, [categoryLoading, symbolCategoryList?.length, getSymbolCategoryList]);

  // Options chain (CHAIN tab in selector): fetch ONLY for the selected chart symbol.
  // This replaces the old 50-stocks prefetch (which could trigger ~150 API calls).
  const [optionsChainMeta, setOptionsChainMeta] = useState({
    baseSymbol: null,
    expiry: null,
  });

  const fetchOptionsChainForSymbol = useCallback(
    async (rawSymbol) => {
      try {
        const symbolToUse = rawSymbol || chartSymbols[0] || symbol;
        if (!symbolToUse) return;

        // Normalize underlying (strip CE/PE suffix if any)
        const baseSymbol = String(symbolToUse)
          .replace(/CE|PE.*$/i, "")
          .trim();
        if (!baseSymbol) return;

        // Avoid refetch if already loaded for same base symbol and we have data
        if (
          optionsChainMeta?.baseSymbol === baseSymbol &&
          optionsChainData.length > 0 &&
          !optionsChainLoading
        ) {
          return;
        }

        setOptionsChainLoading(true);
        setOptionsChainData([]); // reset so UI doesn't show stale strikes

        const expiryData = await fetchSymbolExpiryList(
          { strProduct: baseSymbol },
          navigate,
        );
        const firstExpiry = expiryData?.[0];
        if (!firstExpiry) {
          setOptionsChainMeta({ baseSymbol, expiry: null });
          return;
        }

        const [ceResult, peResult] = await Promise.all([
          asyncGetOptionListCE({
            formData: { strProduct: baseSymbol, strExpiry: firstExpiry },
          }),
          asyncGetOptionListPE({
            formData: { strProduct: baseSymbol, strExpiry: firstExpiry },
          }),
        ]);

        const ceList = ceResult?.data?.result || [];
        const peList = peResult?.data?.result || [];
        const allOptions = [];

        ceList.forEach((option) => {
          allOptions.push({
            stockName: baseSymbol,
            strikePrice: option.strikePrice,
            optionType: "CE",
            identifier: option.identifier,
            lastTradePrice: option.lastTradePrice,
            expiry: firstExpiry,
          });
        });

        peList.forEach((option) => {
          allOptions.push({
            stockName: baseSymbol,
            strikePrice: option.strikePrice,
            optionType: "PE",
            identifier: option.identifier,
            lastTradePrice: option.lastTradePrice,
            expiry: firstExpiry,
          });
        });

        setOptionsChainMeta({ baseSymbol, expiry: firstExpiry });
        setOptionsChainData(allOptions);
      } catch (error) {
        handleCatchErrors(error, navigate);
      } finally {
        setOptionsChainLoading(false);
      }
    },
    [
      chartSymbols,
      symbol,
      navigate,
      optionsChainMeta,
      optionsChainData.length,
      optionsChainLoading,
    ],
  );

  const fetchOptionsChainForChartIndex = useCallback(
    (chartIndex) => {
      const sym = chartSymbols?.[chartIndex] || chartSymbols?.[0] || symbol;
      fetchOptionsChainForSymbol(sym);
    },
    [chartSymbols, symbol, fetchOptionsChainForSymbol],
  );

  // Backward-compat alias (old name used in JSX handlers).
  const fetchAllOptionsChainData = fetchOptionsChainForSymbol;

  // NOTE: We intentionally do NOT auto-fetch categories on mount.
  // Categories + watchlists are heavy and should be loaded when user opens selector.

  // Get watchListSymbol using useSymbolDetails hook
  const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);

  // Keep `currentSymbol` in sync with main chart.
  // Option chain fetching is handled inside `ChartOptionChain` via `useOptionChain`
  // (single flow) to avoid duplicate CE/PE API calls.
  useEffect(() => {
    const mainSymbol = chartSymbols[0] || symbol;
    if (mainSymbol && currentSymbol !== mainSymbol) {
      // Only update if different to prevent unnecessary re-renders
      setCurrentSymbol(mainSymbol);
    }
  }, [chartSymbols, symbol, currentSymbol]);

  // State for stock selector for each chart
  const [stockSelectorState, setStockSelectorState] = useState({});

  // Initialize stock selector state for each chart
  const initializeStockSelector = useCallback(
    (chartIndex) => {
      setStockSelectorState((prev) => ({
        ...prev,
        [chartIndex]: {
          isSearchOpen: false,
          searchInput: "",
          popupPosition: { top: 0, left: 0, width: 0 },
        },
      }));
      // Set default segment to first category
      if (symbolCategoryList.length > 0) {
        const firstCategory = symbolCategoryList[0]?.symbolCategoryName;
        setSelectedSegment((prev) => ({
          ...prev,
          [chartIndex]: firstCategory,
        }));
      }
    },
    [symbolCategoryList],
  );

  // When categories arrive, ensure each chart has a default segment.
  useEffect(() => {
    if (!symbolCategoryList?.length) return;
    const firstCategory = symbolCategoryList[0]?.symbolCategoryName;
    if (!firstCategory) return;
    setSelectedSegment((prev) => {
      const next = { ...prev };
      // Only fill missing entries; don't override user's selection.
      for (let i = 0; i < 4; i++) {
        if (!next[i]) next[i] = firstCategory;
      }
      return next;
    });
  }, [symbolCategoryList]);

  // Update stock selector state for a specific chart
  const updateStockSelectorState = useCallback((chartIndex, updates) => {
    setStockSelectorState((prev) => ({
      ...prev,
      [chartIndex]: {
        ...prev[chartIndex],
        ...updates,
      },
    }));
  }, []);

  // Get stocks for selected segment of a specific chart
  const getStocksForSegment = useCallback(
    (chartIndex) => {
      const categoryName = selectedSegment[chartIndex];
      if (!categoryName && symbolCategoryList.length > 0) {
        // Default to first category
        const firstCategory = symbolCategoryList[0]?.symbolCategoryName;
        return stocksBySegment[firstCategory] || [];
      }
      return stocksBySegment[categoryName] || [];
    },
    [stocksBySegment, selectedSegment, symbolCategoryList],
  );

  // Get stocks for a specific chart
  const getFilteredStocks = useCallback(
    (chartIndex) => {
      const selectedSeg = selectedSegment[chartIndex];
      const selectorState = stockSelectorState[chartIndex];
      const searchInput = selectorState?.searchInput || "";

      // If OPTIONS CHAIN tab is selected, return options chain data
      if (selectedSeg === "OPTIONS CHAIN") {
        // Return empty array if no data available
        if (!optionsChainData || optionsChainData.length === 0) {
          return [];
        }

        // Group options by stockName and strikePrice
        const groupedOptions = {};

        optionsChainData.forEach((option) => {
          const key = `${option.stockName}_${option.strikePrice}`;
          if (!groupedOptions[key]) {
            groupedOptions[key] = {
              stockName: option.stockName,
              strikePrice: option.strikePrice,
              expiry: option.expiry,
              ce: null,
              pe: null,
            };
          }

          if (option.optionType === "CE") {
            groupedOptions[key].ce = option;
          } else if (option.optionType === "PE") {
            groupedOptions[key].pe = option;
          }
        });

        // Convert grouped options to array format
        let filteredOptions = Object.values(groupedOptions).map((group) => ({
          stockName: group.stockName,
          strikePrice: group.strikePrice,
          expiry: group.expiry,
          ce: group.ce,
          pe: group.pe,
          // For display, use CE identifier if available, otherwise PE
          identifier: group.ce?.identifier || group.pe?.identifier,
          product: `${group.stockName} ${group.strikePrice}`,
          symbolName: `${group.stockName} ${group.strikePrice}`,
          hasCE: !!group.ce,
          hasPE: !!group.pe,
        }));

        // Search filter removed for CHAIN tab

        // Sort by stockName and strikePrice - Index stocks first
        const indexStocks = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY"];

        filteredOptions.sort((a, b) => {
          const aIsIndex = indexStocks.some(
            (index) =>
              a.stockName?.toUpperCase().includes(index) ||
              a.stockName?.toUpperCase() === index,
          );
          const bIsIndex = indexStocks.some(
            (index) =>
              b.stockName?.toUpperCase().includes(index) ||
              b.stockName?.toUpperCase() === index,
          );

          // Index stocks come first
          if (aIsIndex && !bIsIndex) return -1;
          if (!aIsIndex && bIsIndex) return 1;

          // If both are index or both are not, sort by stockName
          if (a.stockName !== b.stockName) {
            // Within index stocks, maintain NIFTY, BANKNIFTY, FINNIFTY order
            if (aIsIndex && bIsIndex) {
              const aIndex = indexStocks.findIndex(
                (index) =>
                  a.stockName?.toUpperCase().includes(index) ||
                  a.stockName?.toUpperCase() === index,
              );
              const bIndex = indexStocks.findIndex(
                (index) =>
                  b.stockName?.toUpperCase().includes(index) ||
                  b.stockName?.toUpperCase() === index,
              );
              if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
              }
            }
            return a.stockName.localeCompare(b.stockName);
          }

          // Same stock name, sort by strike price
          return a.strikePrice - b.strikePrice;
        });

        return filteredOptions;
      }

      const segmentStocks = getStocksForSegment(chartIndex);
      return segmentStocks || [];
    },
    [
      getStocksForSegment,
      selectedSegment,
      optionsChainData,
      stockSelectorState,
    ],
  );

  // Handle stock selection for a specific chart
  const handleStockSelect = useCallback(
    (chartIndex, stock) => {
      if (stock) {
        // Get symbol identifier directly from stock - prioritize identifier over product to avoid "EQUITY" issue
        const selectedSymbol =
          stock?.identifier ||
          stock?.identifierName ||
          stock?.symbolName ||
          (stock?.product && stock?.product !== "EQUITY"
            ? stock.product
            : null) ||
          stock?.product;

        // Clear cache for old symbol when changing
        const oldSymbol = chartSymbols[chartIndex];
        if (oldSymbol && oldSymbol !== selectedSymbol) {
          // Clear all cache entries for the old symbol
          lastBarsCache.delete(oldSymbol);
          // Clear API cache entries that match the old symbol
          const keysToDelete = [];
          apiCallCache.forEach((value, key) => {
            if (key.startsWith(`${oldSymbol}_`)) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach((key) => apiCallCache.delete(key));
        }

        // Update the specific chart's symbol
        // The existing useEffect hooks will automatically update the widgets when chartSymbols changes
        setChartSymbols((prevSymbols) => {
          const newSymbols = [...prevSymbols];
          newSymbols[chartIndex] = selectedSymbol;
          return newSymbols;
        });

        // For the first chart (index 0), also update localStorage for persistence
        if (chartIndex === 0) {
          setCurrentSymbol(selectedSymbol);
          localStorage.setItem("_symbol", selectedSymbol);
        }

        // Close the selector
        updateStockSelectorState(chartIndex, {
          isSearchOpen: false,
          searchInput: "",
        });
      }
    },
    [updateStockSelectorState, chartSymbols],
  );

  // Refs for stock selector elements
  const stockSelectorRefs = useRef({});
  const stockInputRefs = useRef({});

  // Handle popup position and click outside for stock selectors
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(stockSelectorRefs.current).forEach((chartIndex) => {
        const ref = stockSelectorRefs.current[chartIndex];
        const selectorState = stockSelectorState[chartIndex];

        if (ref && selectorState?.isSearchOpen) {
          // Check if click is outside the selector wrapper
          const isClickInsideSelector = ref.contains(event.target);

          // Check if click is inside any popup (check all popups to be safe)
          const popupElements = document.querySelectorAll(
            `.chart-stock-selector-popup`,
          );
          let isClickInsidePopup = false;
          popupElements.forEach((popup) => {
            if (popup.contains(event.target)) {
              isClickInsidePopup = true;
            }
          });

          // Close if click is outside both selector and popup
          if (!isClickInsideSelector && !isClickInsidePopup) {
            updateStockSelectorState(parseInt(chartIndex), {
              isSearchOpen: false,
              searchInput: "",
            });
          }
        }
      });
    };

    const calculatePositions = () => {
      Object.keys(stockSelectorRefs.current).forEach((chartIndex) => {
        const ref = stockSelectorRefs.current[chartIndex];
        const selectorState = stockSelectorState[chartIndex];
        if (ref && selectorState?.isSearchOpen) {
          const rect = ref.getBoundingClientRect();

          // Calculate actual height based on stock count
          const filteredStocks = getFilteredStocks(parseInt(chartIndex));
          const stockCount = filteredStocks.length;
          const closeButtonHeight = 32; // Close button height at top
          // Search input height - removed for CHAIN tab
          const searchInputHeight = 0;
          // Calculate tabs height based on number of tabs (2 tabs per row, 36px per row)
          // Use fixed height to prevent box shaking when tabs change
          const totalTabs = symbolCategoryList.length + 1; // Always include CHAIN tab in calculation
          const tabsRows = Math.ceil(totalTabs / 2); // 2 tabs per row
          const tabRowHeight = isMobile ? 32 : 36; // Smaller tabs on mobile
          const fixedTabsHeight = tabsRows * tabRowHeight + (isMobile ? 6 : 8); // Fixed height to prevent shaking
          const tabsHeight =
            symbolCategoryList.length > 0 ||
            selectedSegment[parseInt(chartIndex)] === "OPTIONS CHAIN"
              ? fixedTabsHeight
              : 0;
          const itemHeight =
            selectedSegment[parseInt(chartIndex)] === "OPTIONS CHAIN" ? 60 : 36;
          const minListHeight = 60; // Reduced minimum
          // Reduce max height for CHAIN tab to make card smaller
          const maxListHeight =
            selectedSegment[parseInt(chartIndex)] === "OPTIONS CHAIN"
              ? isMobile
                ? 200
                : 250 // Smaller for CHAIN tab
              : isMobile
                ? 250
                : 300; // Normal for other tabs

          // Calculate list height based on actual stock count
          let listHeight;
          if (stockCount === 0) {
            listHeight = minListHeight;
          } else {
            // Use actual stock count, not limited to 6
            const calculatedHeight = stockCount * itemHeight;
            listHeight = Math.min(
              Math.max(calculatedHeight, minListHeight),
              maxListHeight,
            );
          }

          const actualPopupHeight =
            closeButtonHeight + searchInputHeight + tabsHeight + listHeight;

          // Always position above the chart card
          const finalTop = rect.top + window.scrollY - actualPopupHeight - 4;

          // Ensure it doesn't go above viewport
          const minTop = window.scrollY + 10;
          const adjustedTop = Math.max(minTop, finalTop);

          // Calculate width based on content - ensure minimum width
          const minWidth = 220;
          const maxWidth = 280;
          const calculatedWidth = Math.max(
            Math.min(rect.width || 240, maxWidth),
            minWidth,
          );

          updateStockSelectorState(parseInt(chartIndex), {
            popupPosition: {
              top: adjustedTop,
              left: rect.left + window.scrollX,
              width: calculatedWidth,
            },
          });
        }
      });
    };

    const hasOpenSelector = Object.values(stockSelectorState).some(
      (state) => state?.isSearchOpen,
    );

    if (hasOpenSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", calculatePositions);
      window.addEventListener("scroll", calculatePositions);
      calculatePositions();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", calculatePositions);
      window.removeEventListener("scroll", calculatePositions);
    };
  }, [
    stockSelectorState,
    updateStockSelectorState,
    getFilteredStocks,
    symbolCategoryList,
  ]);

  // Chart theme state - automatically sync with app theme
  const [chartTheme, setChartTheme] = useState(() => {
    // Get initial theme from multiple sources
    const savedTheme = localStorage.getItem("theme");
    const bodyHasDarkClass = document.body.classList.contains("dark-theme");

    if (savedTheme === "dark" || bodyHasDarkClass) {
      return "Dark";
    }
    return "Light";
  });

  // Sync chart theme with app theme
  useEffect(() => {
    const newChartTheme = themeMode === "dark" ? "Dark" : "Light";

    if (newChartTheme !== chartTheme) {
      setChartTheme(newChartTheme);
    }
  }, [themeMode, chartTheme]);

  // Function to detect current theme from DOM
  const detectCurrentTheme = useCallback(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme;
    }

    // Check body class
    if (document.body.classList.contains("dark-theme")) {
      return "dark";
    }

    // Check if dark theme CSS variables are active
    const computedStyle = getComputedStyle(document.body);
    const bgColor = computedStyle.backgroundColor;

    // If background is dark, assume dark theme
    if (
      bgColor &&
      (bgColor.includes("rgb(26, 26, 26)") ||
        bgColor.includes("rgb(33, 33, 33)"))
    ) {
      return "dark";
    }

    return "light";
  }, []);

  // Auto-detect theme on component mount - Deferred for faster initial load
  useEffect(() => {
    // Defer theme detection to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      const detectedTheme = detectCurrentTheme();
      if (detectedTheme !== themeMode) {
        setThemeMode(detectedTheme);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [detectCurrentTheme, themeMode, setThemeMode]);

  // Watch for chart count changes and apply responsive grid
  useEffect(() => {
    const chartsWrapper = document.querySelector(".charts-wrapper");
    if (chartsWrapper) {
      // Remove existing classes
      chartsWrapper.classList.remove("one", "two", "three", "four");

      // Add appropriate class based on chart count
      if (effectiveChartCount === 1) {
        chartsWrapper.classList.add("one");
      } else if (effectiveChartCount === 2) {
        chartsWrapper.classList.add("two");
      } else if (effectiveChartCount === 3) {
        chartsWrapper.classList.add("three");
      } else if (effectiveChartCount === 4) {
        chartsWrapper.classList.add("four");
      }

      // Special handling for 3 charts - Force landscape on desktop
      if (effectiveChartCount === 3 && !isMobile) {
        setIsPortrait(false);

        // Force chart resize after orientation change
        setTimeout(() => {
          const charts = document.querySelectorAll(".chart-container");
          charts.forEach((chart) => {
            if (chart && chart.clientWidth > 0) {
              const resizeEvent = new Event("resize");
              chart.dispatchEvent(resizeEvent);
            }
          });
        }, 50);
      }

      // Smart tab relocation system
      handleSmartTabRelocation();

      // Force chart resize after count change
      setTimeout(() => {
        const charts = document.querySelectorAll(".chart-container");
        charts.forEach((chart) => {
          if (chart && chart.clientWidth > 0) {
            const resizeEvent = new Event("resize");
            chart.dispatchEvent(resizeEvent);
          }
        });
      }, 100);
    }
  }, [effectiveChartCount, isMobile]);

  // Smart tab relocation function - Header only (no side menu)
  // Tabs move to main header when 3 charts are open, return to order card when <3
  const handleSmartTabRelocation = () => {
    const orderCard = document.querySelector(".order-card");
    const mainHeader =
      document.querySelector(".main-header") ||
      document.querySelector("header") ||
      document.querySelector(".header");

    if (!orderCard || !mainHeader) {
      return;
    }

    // Find order tabs in order card
    const orderTabs = orderCard.querySelector(
      '.order-tabs, .tabs, [class*="tab"], .mobile-bottom-tabs',
    );

    if (!orderTabs) {
      return;
    }

    if (effectiveChartCount >= 3) {
      // Move tabs to main header for 3 charts (no side menu)
      if (!orderTabs.classList.contains("relocated-to-header")) {
        // Clone tabs for header (simple horizontal layout)
        const headerTabs = orderTabs.cloneNode(true);
        headerTabs.classList.add("relocated-to-header", "header-order-tabs");
        headerTabs.style.cssText = `
            display: flex;
            gap: 8px;
            padding: 8px 16px;
            background: rgba(42, 42, 42, 0.9);
            border-radius: 8px;
            margin: 8px;
            backdrop-filter: blur(10px);
            border: 1px solid #333;
            flex-wrap: wrap;
            justify-content: center;
          `;

        // Add to main header
        mainHeader.appendChild(headerTabs);

        // Hide original tabs in order card
        orderTabs.style.display = "none";
        orderTabs.classList.add("tabs-relocated");

        // Add event listeners to header tabs
        addHeaderTabEventListeners(headerTabs, orderTabs);
      }
    } else {
      // Return tabs to order card for <4 charts
      if (orderTabs.classList.contains("tabs-relocated")) {
        // Remove header tabs
        const headerTabs = mainHeader.querySelector(".header-order-tabs");
        if (headerTabs) {
          headerTabs.remove();
        }

        // Show original tabs in order card
        orderTabs.style.display = "";
        orderTabs.classList.remove("tabs-relocated");
      }
    }
  };

  // Add event listeners to header tabs
  const addHeaderTabEventListeners = (headerTabs, originalTabs) => {
    const tabButtons = headerTabs.querySelectorAll(
      'button, [role="tab"], .tab-button, [class*="tab"]',
    );

    tabButtons.forEach((tabButton, index) => {
      tabButton.addEventListener("click", (e) => {
        e.preventDefault();

        // Find corresponding tab in original order card
        const originalTabButtons = originalTabs.querySelectorAll(
          'button, [role="tab"], .tab-button, [class*="tab"]',
        );
        const originalTab = originalTabButtons[index];

        if (originalTab) {
          // Trigger click on original tab
          originalTab.click();

          // Update header tab states
          updateHeaderTabStates(headerTabs, originalTabs);
        }
      });
    });

    // Initial state sync
    updateHeaderTabStates(headerTabs, originalTabs);
  };

  // Update header tab states to match original tabs
  const updateHeaderTabStates = (headerTabs, originalTabs) => {
    const headerTabButtons = headerTabs.querySelectorAll(
      'button, [role="tab"], .tab-button, [class*="tab"]',
    );
    const originalTabButtons = originalTabs.querySelectorAll(
      'button, [role="tab"], .tab-button, [class*="tab"]',
    );

    headerTabButtons.forEach((headerTab, index) => {
      const originalTab = originalTabButtons[index];
      if (originalTab) {
        // Copy active state
        if (
          originalTab.classList.contains("active") ||
          originalTab.getAttribute("aria-selected") === "true"
        ) {
          headerTab.classList.add("active");
          headerTab.setAttribute("aria-selected", "true");
        } else {
          headerTab.classList.remove("active");
          headerTab.setAttribute("aria-selected", "false");
        }

        // Copy disabled state
        if (originalTab.disabled) {
          headerTab.disabled = true;
        } else {
          headerTab.disabled = false;
        }
      }
    });
  };

  // Clear cache when chart symbols change to ensure fresh data
  useEffect(() => {
    chartSymbols.forEach((sym, index) => {
      if (sym) {
        // Clear cache entries for symbols that are no longer active
        // This ensures fresh data when symbols change
        const keysToDelete = [];
        apiCallCache.forEach((value, key) => {
          // Check if this cache key belongs to a symbol not in current chartSymbols
          const keySymbol = key.split("_")[0];
          if (
            keySymbol &&
            !chartSymbols.includes(keySymbol) &&
            keySymbol !== sym
          ) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((key) => apiCallCache.delete(key));
      }
    });
  }, [chartSymbols]);

  // Handle symbol changes from URL (like when navigating from main order page)
  // Only update if first chart only - don't auto-update if user has opened multiple charts
  useEffect(() => {
    // Only update if this is the first chart and no manual chart operations have been done
    const effectiveCount = isMobile ? mobileChartCount : chartCount;
    const isFirstChartOnly = effectiveCount === 1;

    // Only update if symbol changed and it's the first chart only
    // Don't auto-update if user has manually opened multiple charts
    if (symbol && symbol !== chartSymbols[0] && isFirstChartOnly) {
      // Clear cache for old symbol before updating
      const oldSymbol = chartSymbols[0];
      if (oldSymbol && oldSymbol !== symbol) {
        lastBarsCache.delete(oldSymbol);
        const keysToDelete = [];
        apiCallCache.forEach((value, key) => {
          if (key.startsWith(`${oldSymbol}_`)) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach((key) => apiCallCache.delete(key));
      }

      const newSymbols = [...chartSymbols];
      newSymbols[0] = symbol;
      setChartSymbols(newSymbols);
      setCurrentSymbol(symbol);
    }
  }, [symbol, chartSymbols, isMobile, mobileChartCount, chartCount]);

  // Chart options for both charts
  const chartOptions = useMemo(() => {
    // Force chart options to always use the current chartSymbols[0]
    const options = {
      symbol: chartSymbols[0] || symbol, // Always use chartSymbols[0] as priority
      interval:
        localStorage.getItem("tradingview.chart.lastUsedTimeBasedResolution") ??
        "1",
      datafeed: {
        onReady: (callback) => {
          callback({
            supports_time: true,
            supports_marks: true,
            supports_time_scale_marks: true,
            supported_resolutions: [
              "1",
              "5",
              "15",
              "30",
              "60",
              "1D",
              "1W",
              "1M",
            ],
          });
        },
        resolveSymbol: (symbolName, onSymbolResolvedCallback) => {
          onSymbolResolvedCallback({
            session: "0915-1530",
            timezone: "Asia/Kolkata",
            name: symbolName,
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            supported_resolutions: [
              "1",
              "5",
              "15",
              "30",
              "60",
              "1D",
              "1W",
              "1M",
            ],
          });
        },
        getBars: async (
          symbolInfo,
          resolution,
          periodParams,
          onHistoryCallback,
          onErrorCallback,
        ) => {
          // Declare variables outside try block so they're accessible in catch block
          let currentSymbol;
          let url;
          let payload;

          try {
            // Use the symbol from symbolInfo (which comes from chartOptions.symbol)
            currentSymbol = symbolInfo.name || symbol;

            // Check if we have offline timestamp - if so, adjust from time to include offline period
            const offlineTimestamp = networkOfflineTimestampRef.current;
            let fromTime = periodParams.from;

            // If there's an offline timestamp and it's before the requested from time, include it
            if (offlineTimestamp && offlineTimestamp < fromTime) {
              fromTime = offlineTimestamp; // Fetch from offline timestamp to ensure we get missing data
            }

            const cacheKey = `${currentSymbol}_${resolution}_${periodParams.to}_${fromTime}`;

            // Check API call cache first (this stores full bar arrays)
            if (apiCallCache.has(cacheKey)) {
              const cachedPromise = apiCallCache.get(cacheKey);
              const result = await cachedPromise;
              if (result && result.length > 0) {
                onHistoryCallback(result, { noData: false });
                return;
              }
            }

            url = `${REACT_APP_CHART_API_ENDPOINT}/charts`;
            payload = {
              to: periodParams.to,
              from: fromTime, // Use adjusted from time to include offline period
              resolution: parseInt(resolution),
              symbol: currentSymbol,
              bars: periodParams?.countBack || 1000, // Request more bars to cover offline period
            };

            // Create AbortController for this request
            const abortController = new AbortController();
            const signal = abortController.signal;

            // Get cusToken from localStorage, fallback to static token
            const cusToken = Storage.decryptData(
              localStorage.getItem("cusToken"),
            );
            const token = cusToken || REACT_APP_CHART_SECRET_TOKEN;

            const apiPromise = axios
              .post(url, payload, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                timeout: 30000, // Increased timeout to 30 seconds
                signal: signal, // Add abort signal
              })
              .then((response) => {
                // Handle different response formats
                let bars = null;
                if (Array.isArray(response?.data)) {
                  bars = response.data;
                } else if (Array.isArray(response?.data?.result)) {
                  bars = response.data.result;
                } else if (Array.isArray(response?.data?.data)) {
                  bars = response.data.data;
                } else if (response?.data) {
                  bars = response.data;
                }

                // Ensure bars is an array
                if (!Array.isArray(bars)) {
                  return [];
                }

                if (bars && bars.length) {
                  // Ensure bars are sorted by time ascending before formatting
                  const sortedBars = [...bars].sort((a, b) => {
                    const timeA = a.td || a._id || a.time || 0;
                    const timeB = b.td || b._id || b.time || 0;
                    return timeA - timeB;
                  });

                  const formattedBars = sortedBars
                    .map((bar) => ({
                      time: bar.td || bar._id || bar.time,
                      open: bar.op || bar.open,
                      high: bar.hp || bar.high,
                      low: bar.lp || bar.low,
                      close: bar.cp || bar.close,
                      volume: bar.vol || bar.volume || 0,
                    }))
                    .filter(
                      (bar) =>
                        bar.time &&
                        bar.open &&
                        bar.high &&
                        bar.low &&
                        bar.close,
                    );

                  // Remove duplicate timestamps (keep first occurrence)
                  const seenTimes = new Set();
                  const uniqueBars = formattedBars.filter((bar) => {
                    if (seenTimes.has(bar.time)) {
                      return false;
                    }
                    seenTimes.add(bar.time);
                    return true;
                  });

                  // Cache the last bar for real-time updates
                  if (uniqueBars.length > 0) {
                    lastBarsCache.set(
                      currentSymbol,
                      uniqueBars[uniqueBars.length - 1],
                    );
                  }

                  return uniqueBars;
                } else {
                  return [];
                }
              })
              .catch((error) => {
                throw error;
              });

            // Store abort controller for potential cancellation
            const requestId = `${currentSymbol}_${Date.now()}`;
            activeRequests.set(requestId, abortController);

            apiCallCache.set(cacheKey, apiPromise);

            const bars = await apiPromise;

            // Clean up after successful request
            activeRequests.delete(requestId);
            apiCallCache.delete(cacheKey);

            // If we successfully fetched data that included offline period, reset offline timestamp
            if (
              bars &&
              bars.length &&
              offlineTimestamp &&
              fromTime <= offlineTimestamp
            ) {
              // Successfully fetched data including offline period - reset timestamp
              networkOfflineTimestampRef.current = null;
            }

            if (bars && bars.length) {
              onHistoryCallback(bars, { noData: false });
            } else {
              onHistoryCallback([], { noData: true });
            }
          } catch (error) {
            // Use currentSymbol if available, otherwise fallback
            const symbolForError = currentSymbol || symbolInfo?.name || symbol;
            const cacheKey = `${symbolForError}_${resolution}_${periodParams.to}_${periodParams.from}`;
            apiCallCache.delete(cacheKey);

            // Clean up active request
            const requestId = `${symbolForError}_${Date.now()}`;
            activeRequests.delete(requestId);

            // Enhanced error handling
            let errorMessage = "Error loading historical data";

            if (error.name === "AbortError" || error.code === "ERR_CANCELED") {
              return; // Don't show error for cancelled requests
            } else if (error.code === "ECONNABORTED") {
              errorMessage = "Request timeout - please check your connection";
            } else if (error.response?.status === 401) {
              errorMessage = "Authentication failed - please refresh the page";
            } else if (error.response?.status === 404) {
              errorMessage = "Chart data not found for this symbol";
            } else if (error.response?.status >= 500) {
              errorMessage = "Server error - please try again later";
            } else if (error.message) {
              errorMessage = `Error: ${error.message}`;
            }

            // Call error callback but also try to show empty data
            onErrorCallback(errorMessage);
            // Also call history callback with noData to prevent chart from hanging
            onHistoryCallback([], { noData: true });
          }
        },
        subscribeBars: (
          symbolInfo,
          resolution,
          onRealtimeCallback,
          subscriberUID,
          onResetCacheNeededCallback,
        ) => {
          // Unsubscribe from previous subscription if any
          if (unsubscribeOnStream) {
            unsubscribeOnStream(subscriberUID);
          }

          const currentSymbol = symbolInfo.name || symbolInfo.full_name;

          const lastBar = lastBarsCache.get(currentSymbol);

          // Subscribe to realtime data for this symbol
          // This is called by the widget when it needs realtime data
          // It will be called automatically when symbol changes and widget is ready
          if (subscribeOnStream) {
            subscribeOnStream(
              symbolInfo,
              resolution,
              onRealtimeCallback,
              subscriberUID,
              onResetCacheNeededCallback,
              lastBar,
            );
          }
        },
        unsubscribeBars: (subscriberUID) => {
          unsubscribeOnStream(subscriberUID);
        },
        searchSymbols: (
          userInput,
          exchange,
          symbolType,
          onResultReadyCallback,
        ) => {
          onResultReadyCallback([]);
        },
      },
      library_path: "charting_library/",
      timezone: "Asia/Kolkata",
      locale: "en",
      charts_storage_url: "https://saveload.tradingview.com",
      charts_storage_api_version: "1.1",
      client_id: "tradingview.com",
      user_id: "public_user",
      disabled_features: [
        "header_saveload",
        "header_fullscreen_button",
        "countdown",
        "use_localstorage_for_settings",
        "main_series_scale_menu",
        "pane_context_menu",
        "scales_context_menu",
        "timeframes_toolbar",
        "edit_buttons_in_legend",
        "context_menus",
        "control_bar",
        "border_around_the_chart",
        "remove_library_container_border",
        "chart_property_page_style",
        "property_pages",
        "show_logo_on_all_charts",
        "side_toolbar_in_fullscreen_mode",
        "header_in_fullscreen_mode",
        "hide_left_toolbar_by_default",
        "constraint_dialogs_movement",
        "show_interval_dialog_on_key_press",
        "handle_scale",
        "handle_scroll",
        "handle_swipe_touch",
        "narrow_chart_menu",
        "hide_last_na_study_output",
        "symbol_info",
        "header_symbol_search",
        "header_compare",
        "header_screenshot",

        "header_chart_type",
      ],
      enabled_features: [
        "side_toolbar_in_fullscreen_mode",
        "header_in_fullscreen_mode",
        "hide_left_toolbar_by_default",
        "constraint_dialogs_movement",
        "show_interval_dialog_on_key_press",
        "handle_scale",
        "handle_scroll",
        "handle_swipe_touch",
        "narrow_chart_menu",
        "hide_last_na_study_output",
        "symbol_info",
        "side_toolbar",
        "header_widget",
        "header_widget_dom_node",
        "header_widget_controls",
        "header_resolutions",
        "header_indicators",
        "header_settings",
        "header_undo_redo",
        "header_screenshot",
        "header_fullscreen_button",
        "header_compare",
        "header_symbol_search",
        "header_chart_type",
        "header_saveload",
        "create_volume_indicator_by_default",
        "main_series_scale_menu",
        "pane_context_menu",
        "scales_context_menu",
        // "timeframes_toolbar",
        "edit_buttons_in_legend",
        "context_menus",
        "control_bar",
        "border_around_the_chart",
        "remove_library_container_border",
        "chart_property_page_style",
        "property_pages",
        "show_logo_on_all_charts",
        "use_localstorage_for_settings",
        "countdown",
        "header_layout_toggle",
      ],
      fullscreen: false,
      autosize: true,
      height: "100%",
      loading_screen: {
        backgroundColor: chartTheme === "Dark" ? "#1a1a1a" : "#ffffff",
        foregroundColor: chartTheme === "Dark" ? "#ffffff" : "#1a1a1a",
      },
      custom_css_url: "",
      overrides: {
        // Candlestick colors (same for both themes)
        "mainSeriesProperties.candleStyle.upColor": "#26a69a",
        "mainSeriesProperties.candleStyle.downColor": "#ef5350",
        "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
        "mainSeriesProperties.candleStyle.borderUpColor": "#26a69a",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ef5350",

        // Dynamic theme-based colors
        ...(chartTheme === "Dark"
          ? {
              // Dark theme colors
              "paneProperties.background": "#1a1a1a",
              "paneProperties.vertGridProperties.color": "#2a2a2a",
              "paneProperties.horzGridProperties.color": "#2a2a2a",
              "paneProperties.crossHairProperties.color": "#666666",
              "scalesProperties.textColor": "#cccccc",
              "scalesProperties.lineColor": "#2a2a2a",
              "paneProperties.backgroundType": "solid",
              "paneProperties.vertGridProperties.style": 0,
              "paneProperties.horzGridProperties.style": 0,
              "paneProperties.crossHairProperties.width": 1,
              "paneProperties.crossHairProperties.style": 2,
            }
          : {
              // Light theme colors
              "paneProperties.background": "#ffffff",
              "paneProperties.vertGridProperties.color": "#e0e0e0",
              "paneProperties.horzGridProperties.color": "#e0e0e0",
              "paneProperties.crossHairProperties.color": "#999999",
              "scalesProperties.textColor": "#333333",
              "scalesProperties.lineColor": "#e0e0e0",
              "paneProperties.backgroundType": "solid",
              "paneProperties.vertGridProperties.style": 0,
              "paneProperties.horzGridProperties.style": 0,
              "paneProperties.crossHairProperties.width": 1,
              "paneProperties.crossHairProperties.style": 2,
            }),

        // Legend (same for both themes)
        "paneProperties.legendProperties.showLegend": true,
        "paneProperties.legendProperties.showSeriesOHLC": true,
        "paneProperties.legendProperties.showSeriesTitle": false,

        // Volume
        volumePaneSize: "medium",
      },
      theme: chartTheme,
      time_frames: [
        { text: "1D", resolution: "1D", description: "1 Day" },
        { text: "1W", resolution: "1W", description: "1 Week" },
        { text: "1M", resolution: "1M", description: "1 Month" },
      ],
      studies_overrides: {
        // Moving Averages
        "moving average adaptive.length": 14,
        "moving average exponential.length": 20,
        "moving average simple.length": 50,
        "moving average weighted.length": 20,

        // RSI
        "relative strength index.length": 14,
        "relative strength index.levels[0]": 70,
        "relative strength index.levels[1]": 30,

        // MACD
        "macd.fastLength": 12,
        "macd.slowLength": 26,
        "macd.histogram.length": 9,

        // Bollinger Bands
        "bollinger bands.length": 20,
        "bollinger bands.mult": 2,

        // Stochastic
        "stochastic.k": 14,
        "stochastic.d": 3,
        "stochastic.smooth": 3,

        // Volume indicators
        "volume ma.length": 0,
        "volume ma.maType": "SMA",
        "volume.volume.color.0": "#ef5350",
        "volume.volume.color.1": "#26a69a",

        // ATR
        "average true range.length": 14,

        // Williams %R
        "williams r.length": 14,

        // CCI
        "commodity channel index.length": 20,

        // Parabolic SAR
        "parabolic sar.step": 0.02,
        "parabolic sar.maximum": 0.2,
      },
    };

    return options;
  }, [
    chartSymbols,
    symbol,
    subscribeOnStream,
    unsubscribeOnStream,
    chartTheme,
  ]);

  // Chart options for second chart
  const chartOptions2 = useMemo(
    () => ({
      ...chartOptions,
      symbol: chartSymbols[1] || "NIFTY",
    }),
    [chartOptions, chartSymbols],
  );

  const { widget, isReady, isLoading, error, initializeWidget, destroyWidget } =
    useChartWidget(chartContainerRef, chartOptions);

  // Effect to handle chart refresh when theme changes (runs after widget is ready)
  useEffect(() => {
    if (widget && isReady) {
      try {
        widget.chart().executeActionById("chart_reset_zoom");
      } catch (error) {
        // Chart refresh failed
      }
    }
  }, [chartTheme, widget, isReady]);

  // Second chart widget
  const {
    widget: widget2,
    isReady: isReady2,
    isLoading: isLoading2,
    error: error2,
    initializeWidget: initializeWidget2,
    destroyWidget: destroyWidget2,
  } = useChartWidget(chartContainer2Ref, chartOptions2);

  // Third chart widget
  const chart3Ref = useRef();
  const chartOptions3 = useMemo(
    () => ({
      ...chartOptions,
      symbol: chartSymbols[2] || "BANKNIFTY",
    }),
    [chartOptions, chartSymbols],
  );
  const {
    widget: widget3,
    isReady: isReady3,
    isLoading: isLoading3,
    error: error3,
    initializeWidget: initializeWidget3,
    destroyWidget: destroyWidget3,
  } = useChartWidget(chart3Ref, chartOptions3);

  // Fourth chart widget
  const chart4Ref = useRef();
  const chartOptions4 = useMemo(
    () => ({
      ...chartOptions,
      symbol: chartSymbols[3] || "FINNIFTY",
    }),
    [chartOptions, chartSymbols],
  );
  const {
    widget: widget4,
    isReady: isReady4,
    isLoading: isLoading4,
    error: error4,
    initializeWidget: initializeWidget4,
    destroyWidget: destroyWidget4,
  } = useChartWidget(chart4Ref, chartOptions4);

  // Track previous mobileChartCount - used by both cleanup and initialization effects
  const prevMobileChartCountRef = useRef(1);

  // Widget initialization refs
  const lastSymbolUpdateRef = useRef(0);
  const updateTimeoutRef = useRef(null);

  // Widget state tracking refs
  const widgetStatesRef = useRef({
    widget1: null,
    widget2: null,
    widget3: null,
    widget4: null,
  });

  // Desktop initialization debounce refs
  const desktopInitDebounceRef = useRef({
    widget2: null,
    widget3: null,
    widget4: null,
  });

  // Track previous chart count for selective initialization
  const prevChartCountRef = useRef(1);

  // Track if initialization is in progress to prevent double initialization
  const initializationInProgressRef = useRef(false);

  // Function to update chart symbol (used by dialog options)
  // Helper function to check if symbol already exists in charts
  const isSymbolAlreadyOpen = useCallback(
    (symbolToCheck, excludeIndex = -1) => {
      if (!symbolToCheck) return false;
      const effectiveCount = isMobile ? mobileChartCount : chartCount;
      const openSymbols = (chartSymbols || []).slice(0, effectiveCount);
      return openSymbols.some(
        (sym, index) => sym === symbolToCheck && index !== excludeIndex,
      );
    },
    [chartSymbols, isMobile, mobileChartCount, chartCount],
  );

  const updateChartSymbol = useCallback(
    (newSymbol) => {
      // Check if symbol is already open in another chart
      if (isSymbolAlreadyOpen(newSymbol, 0)) {
        errorMsg(
          `This chart is already open: ${newSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        return;
      }

      // Step 1: Destroy and refresh Chart 1 widget completely
      if (widget && destroyWidget) {
        cleanupWidget(widget, "Widget1", destroyWidget);
        widgetInitTrackingRef.current.widget1 = false;
      }

      // Step 2: Clear cache for old symbol
      if (symbol) {
        lastBarsCache.delete(symbol);
        apiCallCache.delete(symbol);
      }

      // Step 3: Unsubscribe from old symbol
      if (subscriptionActiveRef.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart1");
      }
      subscriptionActiveRef.current = false;

      // Step 4: Update chart symbols - this will trigger useChartWidget to reinitialize
      const newSymbols = [...chartSymbols];
      newSymbols[0] = newSymbol;
      setChartSymbols(newSymbols);

      // Step 5: Update current symbol
      setCurrentSymbol(newSymbol);

      // Step 6: Update local storage (like main order page does)
      localStorage.setItem("_symbol", newSymbol);

      // Step 7: Update URL state (like main order page does)
      navigate("/chart", {
        state: { symbol: newSymbol },
        replace: true, // Replace current URL instead of adding to history
      });

      // Step 8: Reinitialize Chart 1 with new symbol (fast refresh)
      // Reset subscription flag so that isReady effect will trigger subscription
      subscriptionActiveRef.current = false;
      if (initializeWidget && chartContainerRef.current) {
        initializeWidget();
      }
    },
    [
      chartSymbols,
      navigate,
      isSymbolAlreadyOpen,
      widget,
      destroyWidget,
      initializeWidget,
      symbol,
      unsubscribeOnStream,
      subscribeOnStream,
      signalRContext,
    ],
  );

  // Chart navigation function with dialog management
  const handleOptionChainChartNavigation = useCallback(
    (newSymbol, optionData = null) => {
      // Check if symbol actually changed to prevent unnecessary updates
      if (newSymbol === symbol) {
        return;
      }

      // Check if symbol is already open - show error immediately on button click
      if (isSymbolAlreadyOpen(newSymbol)) {
        errorMsg(
          `This chart is already open: ${newSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        return;
      }

      // Debounce - prevent multiple updates within 100ms
      const now = Date.now();
      if (now - lastSymbolUpdateRef.current < 100) {
        return;
      }

      // Check if this is an option (CE/PE) - contains CE or PE in the symbol
      const isOption =
        optionData && (newSymbol.includes("CE") || newSymbol.includes("PE"));

      // Subscription-aware max charts (defaults to 1 when no subscription)
      const maxCharts = getMaxChartsAllowed();
      const currentChartCount = isMobile ? mobileChartCount : chartCount;

      // If max charts reached, show replace dialog instead of option dialog
      if (currentChartCount >= maxCharts) {
        // Auto-close options chain popup when dialog opens
        if (showOptionChainPopup) {
          setShowOptionChainPopup(false);
        }
        setPendingSymbol(newSymbol);
        setShowChartDialog(true);
        lastSymbolUpdateRef.current = now;
        return;
      }

      if (isOption) {
        // Extract main symbol from option (e.g., NIFTY25AUG2500CE -> NIFTY)
        let baseSymbol = optionData.baseSymbol;
        if (!baseSymbol) {
          // Try to extract from the option symbol
          const match = newSymbol.match(/^([A-Z]+)/);
          baseSymbol = match ? match[1] : newSymbol.replace(/CE|PE.*/, "");
        }

        // Mobile view: always show dialog to ask which chart to open on
        if (isMobile) {
          setPendingOptionData({
            symbol: newSymbol,
            optionData: optionData,
            baseSymbol: baseSymbol,
          });
          setShowOptionDialog(true);
          // Auto-close options chain popup when dialog opens
          if (showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
          lastSymbolUpdateRef.current = now;
          return;
        }

        // Desktop view: always show CE/PE option dialog
        // Auto-close options chain popup when dialog opens
        if (showOptionChainPopup) {
          setShowOptionChainPopup(false);
        }
        setPendingOptionData({
          symbol: newSymbol,
          optionData: optionData,
          baseSymbol: baseSymbol,
        });
        setShowOptionDialog(true);
        lastSymbolUpdateRef.current = now;
        return;
      }

      // Always show dialog to ask which chart to open on (both mobile and desktop)
      // Auto-close options chain popup when dialog opens
      if (showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
      setPendingSymbol(newSymbol);
      setShowChartDialog(true);

      // Update isFirstChartOpen state if this is the first time
      if (!isFirstChartOpen) {
        setIsFirstChartOpen(true);
      }

      // Update timestamp
      lastSymbolUpdateRef.current = now;
    },
    [
      chartSymbols,
      symbol,
      navigate,
      isFirstChartOpen,
      updateChartSymbol,
      isMobile,
      mobileChartCount,
      chartCount,
      showOptionChainPopup,
      isMinimized,
      isSymbolAlreadyOpen,
      getMaxChartsAllowed,
    ],
  );

  // Dialog handlers
  const handleOpenNewChart = useCallback(() => {
    const maxCharts = getMaxChartsAllowed();
    const currentChartCount = isMobile ? mobileChartCount : chartCount;

    if (pendingSymbol && currentChartCount < maxCharts) {
      // Check if symbol is already open
      if (isSymbolAlreadyOpen(pendingSymbol)) {
        errorMsg(
          `This chart is already open: ${pendingSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowChartDialog(false);
        setPendingSymbol(null);
        return;
      }

      // Create new symbols array, preserving existing symbols
      const newSymbols = [...chartSymbols];

      // If no charts are open, open in Chart 2 (index 1)
      // Otherwise, open in the next available chart slot
      let newChartIndex;
      if (currentChartCount === 0) {
        // No charts open - open in Chart 2 (index 1)
        newChartIndex = 1;
        // Set Chart 1 to empty or keep it empty
        if (newSymbols.length === 0) {
          newSymbols[0] = null; // Keep Chart 1 empty
        }
      } else {
        // Charts are open - open in the next available slot
        newChartIndex = currentChartCount;
      }

      // Increase chart count to add a new chart slot
      if (isMobile) {
        setMobileChartCount((prev) => {
          // If opening Chart 2 when no charts are open, set count to 2
          if (prev === 0) return 2;
          return prev + 1;
        });
      } else {
        setChartCount((prev) => {
          // If opening Chart 2 when no charts are open, set count to 2
          if (prev === 0) return 2;
          return prev + 1;
        });
      }

      // Only set the new symbol at the new position, don't modify existing ones
      if (newChartIndex < newSymbols.length) {
        newSymbols[newChartIndex] = pendingSymbol;
      } else {
        // If we need to extend the array, push the new symbol
        // Ensure we have enough slots
        while (newSymbols.length < newChartIndex) {
          newSymbols.push(null);
        }
        newSymbols.push(pendingSymbol);
      }

      // Step 1: Destroy and refresh the target chart widget completely before setting new symbol
      if (newChartIndex === 1 && widget2 && destroyWidget2) {
        cleanupWidget(widget2, "Widget2", destroyWidget2);
        widgetInitTrackingRef.current.widget2 = false;
        // Clear cache for old symbol if exists
        const oldSymbol = chartSymbols[1];
        if (oldSymbol) {
          lastBarsCache.delete(oldSymbol);
          apiCallCache.delete(oldSymbol);
        }
        // Unsubscribe from old symbol
        if (subscriptionActive2Ref.current && unsubscribeOnStream) {
          unsubscribeOnStream("chart2");
        }
        subscriptionActive2Ref.current = false;
      } else if (newChartIndex === 2 && widget3 && destroyWidget3) {
        cleanupWidget(widget3, "Widget3", destroyWidget3);
        widgetInitTrackingRef.current.widget3 = false;
        // Clear cache for old symbol if exists
        const oldSymbol = chartSymbols[2];
        if (oldSymbol) {
          lastBarsCache.delete(oldSymbol);
          apiCallCache.delete(oldSymbol);
        }
        // Unsubscribe from old symbol
        if (subscriptionActive3Ref.current && unsubscribeOnStream) {
          unsubscribeOnStream("chart3");
        }
        subscriptionActive3Ref.current = false;
      } else if (newChartIndex === 3 && widget4 && destroyWidget4) {
        cleanupWidget(widget4, "Widget4", destroyWidget4);
        widgetInitTrackingRef.current.widget4 = false;
        // Clear cache for old symbol if exists
        const oldSymbol = chartSymbols[3];
        if (oldSymbol) {
          lastBarsCache.delete(oldSymbol);
          apiCallCache.delete(oldSymbol);
        }
        // Unsubscribe from old symbol
        if (subscriptionActive4Ref.current && unsubscribeOnStream) {
          unsubscribeOnStream("chart4");
        }
        subscriptionActive4Ref.current = false;
      }

      setChartSymbols(newSymbols);

      // Step 2: Reinitialize the target chart widget with new symbol (fast refresh)
      // Reset subscription flags so that isReady effects will trigger subscriptions
      if (newChartIndex === 1) {
        subscriptionActive2Ref.current = false;
        if (initializeWidget2 && chartContainer2Ref.current) {
          initializeWidget2();
        }
      } else if (newChartIndex === 2) {
        subscriptionActive3Ref.current = false;
        if (initializeWidget3 && chart3Ref.current) {
          initializeWidget3();
        }
      } else if (newChartIndex === 3) {
        subscriptionActive4Ref.current = false;
        if (initializeWidget4 && chart4Ref.current) {
          initializeWidget4();
        }
      }

      // Auto-close options chain popup when chart is opened (if 2+ charts are already open)
      if (currentChartCount >= 1 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }

      setShowChartDialog(false);
      setPendingSymbol(null);
    } else if (currentChartCount >= maxCharts) {
      setSubscriptionUpgradeMessage(
        `You have reached the maximum chart limit (${maxCharts}). Please upgrade your subscription to add more charts.`,
      );
      setSubscriptionUpgradeOpen(true);
      setShowChartDialog(false);
      setPendingSymbol(null);
    }
  }, [
    pendingSymbol,
    chartCount,
    chartSymbols,
    isMobile,
    mobileChartCount,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget2,
    destroyWidget2,
    initializeWidget2,
    widget3,
    destroyWidget3,
    initializeWidget3,
    widget4,
    destroyWidget4,
    initializeWidget4,
    unsubscribeOnStream,
    subscribeOnStream,
    signalRContext,
    getMaxChartsAllowed,
  ]);

  const handleReplaceFirstChart = useCallback(() => {
    if (pendingSymbol) {
      // Check if symbol is already open in another chart (except first chart)
      if (isSymbolAlreadyOpen(pendingSymbol, 0)) {
        errorMsg(
          `This chart is already open: ${pendingSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowChartDialog(false);
        setPendingSymbol(null);
        return;
      }

      // Step 1: Destroy and refresh Chart 1 widget completely
      if (widget && destroyWidget) {
        cleanupWidget(widget, "Widget1", destroyWidget);
        widgetInitTrackingRef.current.widget1 = false;
      }

      // Step 2: Clear cache for old symbol
      if (symbol) {
        lastBarsCache.delete(symbol);
        apiCallCache.delete(symbol);
      }

      // Step 3: Unsubscribe from old symbol
      if (subscriptionActiveRef.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart1");
      }
      subscriptionActiveRef.current = false;

      // Step 4: Update the first chart (index 0) with the new symbol
      const newSymbols = [...chartSymbols];
      newSymbols[0] = pendingSymbol;
      setChartSymbols(newSymbols);

      // If no charts are open, set chart count to 1
      const currentChartCount = isMobile ? mobileChartCount : chartCount;
      if (currentChartCount === 0) {
        if (isMobile) {
          setMobileChartCount(1);
        } else {
          setChartCount(1);
        }
      }

      // Step 5: Update current symbol and navigation
      setCurrentSymbol(pendingSymbol);
      localStorage.setItem("_symbol", pendingSymbol);
      navigate("/chart", {
        state: { symbol: pendingSymbol },
        replace: true,
      });

      // Step 6: Reinitialize Chart 1 with new symbol (fast refresh)
      // Reset subscription flag so that isReady effect will trigger subscription
      subscriptionActiveRef.current = false;
      if (initializeWidget && chartContainerRef.current) {
        initializeWidget();
      }

      // Auto-close options chain popup when chart is replaced (if 2+ charts are open)
      if (currentChartCount >= 2 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowChartDialog(false);
    setPendingSymbol(null);
  }, [
    pendingSymbol,
    chartSymbols,
    navigate,
    isMobile,
    mobileChartCount,
    chartCount,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget,
    destroyWidget,
    initializeWidget,
    symbol,
    unsubscribeOnStream,
    subscribeOnStream,
    signalRContext,
  ]);

  const handleReplaceCurrentChart = useCallback(() => {
    if (pendingSymbol) {
      // Check if symbol is already open in another chart
      if (isSymbolAlreadyOpen(pendingSymbol, 0)) {
        errorMsg(
          `This chart is already open: ${pendingSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowChartDialog(false);
        setPendingSymbol(null);
        return;
      }

      // Step 1: Destroy and refresh Chart 1 widget completely
      if (widget && destroyWidget) {
        cleanupWidget(widget, "Widget1", destroyWidget);
        widgetInitTrackingRef.current.widget1 = false;
      }

      // Step 2: Clear cache for old symbol
      if (symbol) {
        lastBarsCache.delete(symbol);
        apiCallCache.delete(symbol);
      }

      // Step 3: Unsubscribe from old symbol
      if (subscriptionActiveRef.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart1");
      }
      subscriptionActiveRef.current = false;

      // Step 4: Update chart symbol
      updateChartSymbol(pendingSymbol);

      // Step 5: Reinitialize Chart 1 with new symbol (fast refresh)
      requestAnimationFrame(() => {
        if (initializeWidget && chartContainerRef.current) {
          initializeWidget();
        }
      });

      // Auto-close options chain popup when chart is replaced (if 2+ charts are open)
      const currentChartCount = isMobile ? mobileChartCount : chartCount;
      if (currentChartCount >= 2 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowChartDialog(false);
    setPendingSymbol(null);
  }, [
    pendingSymbol,
    updateChartSymbol,
    isMobile,
    mobileChartCount,
    chartCount,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget,
    destroyWidget,
    initializeWidget,
    symbol,
    unsubscribeOnStream,
  ]);

  const handleReplaceSecondChart = useCallback(() => {
    if (pendingSymbol) {
      // Check if symbol is already open in another chart
      if (isSymbolAlreadyOpen(pendingSymbol, 1)) {
        errorMsg(
          `This chart is already open: ${pendingSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowChartDialog(false);
        setPendingSymbol(null);
        return;
      }

      // Step 1: Destroy and refresh Chart 2 widget completely
      if (widget2 && destroyWidget2) {
        cleanupWidget(widget2, "Widget2", destroyWidget2);
        widgetInitTrackingRef.current.widget2 = false;
      }

      // Step 2: Clear cache for old symbol
      const oldSymbol = chartSymbols[1];
      if (oldSymbol) {
        lastBarsCache.delete(oldSymbol);
        apiCallCache.delete(oldSymbol);
      }

      // Step 3: Unsubscribe from old symbol
      if (subscriptionActive2Ref.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart2");
      }
      subscriptionActive2Ref.current = false;

      // Step 4: Update the second chart (index 1) with the new symbol
      const newSymbols = [...chartSymbols];
      newSymbols[1] = pendingSymbol;
      setChartSymbols(newSymbols);

      // Step 5: Reinitialize Chart 2 with new symbol (fast refresh)
      // Reset subscription flag so that isReady2 effect will trigger subscription
      subscriptionActive2Ref.current = false;
      if (initializeWidget2 && chartContainer2Ref.current) {
        initializeWidget2();
      }

      // Auto-close options chain popup when chart is replaced
      const currentChartCount = isMobile ? mobileChartCount : chartCount;
      if (currentChartCount >= 2 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowChartDialog(false);
    setPendingSymbol(null);
  }, [
    pendingSymbol,
    chartSymbols,
    isMobile,
    mobileChartCount,
    chartCount,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget2,
    destroyWidget2,
    initializeWidget2,
    unsubscribeOnStream,
    subscribeOnStream,
    signalRContext,
  ]);

  const handleReplaceThirdChart = useCallback(() => {
    if (pendingSymbol) {
      // Check if symbol is already open in another chart
      if (isSymbolAlreadyOpen(pendingSymbol, 2)) {
        errorMsg(
          `This chart is already open: ${pendingSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowChartDialog(false);
        setPendingSymbol(null);
        return;
      }

      // Step 1: Destroy and refresh Chart 3 widget completely
      if (widget3 && destroyWidget3) {
        cleanupWidget(widget3, "Widget3", destroyWidget3);
        widgetInitTrackingRef.current.widget3 = false;
      }

      // Step 2: Clear cache for old symbol
      const oldSymbol = chartSymbols[2];
      if (oldSymbol) {
        lastBarsCache.delete(oldSymbol);
        apiCallCache.delete(oldSymbol);
      }

      // Step 3: Unsubscribe from old symbol
      if (subscriptionActive3Ref.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart3");
      }
      subscriptionActive3Ref.current = false;

      // Step 4: Update the third chart (index 2) with the new symbol
      const newSymbols = [...chartSymbols];
      newSymbols[2] = pendingSymbol;
      setChartSymbols(newSymbols);

      // Step 5: Reinitialize Chart 3 with new symbol (fast refresh)
      // Reset subscription flag so that isReady3 effect will trigger subscription
      subscriptionActive3Ref.current = false;
      if (initializeWidget3 && chart3Ref.current) {
        initializeWidget3();
      }

      // Auto-close options chain popup when chart is replaced
      if (chartCount >= 2 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowChartDialog(false);
    setPendingSymbol(null);
  }, [
    pendingSymbol,
    chartSymbols,
    chartCount,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget3,
    destroyWidget3,
    initializeWidget3,
    unsubscribeOnStream,
    subscribeOnStream,
    signalRContext,
  ]);

  const handleCancelChartDialog = useCallback(() => {
    setShowChartDialog(false);
    setPendingSymbol(null);
  }, []);

  // CE/PE Option Dialog handlers
  const handleOpenOnlyCE = useCallback(() => {
    if (pendingOptionData) {
      const ceSymbol = pendingOptionData.symbol;
      const maxCharts = getMaxChartsAllowed();
      const currentChartCount = isMobile ? mobileChartCount : chartCount;

      // Check if CE symbol is already open
      if (isSymbolAlreadyOpen(ceSymbol)) {
        errorMsg(
          `This chart is already open: ${ceSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowOptionDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (!isFirstChartOpen) {
        // First time opening - directly update the chart
        updateChartSymbol(ceSymbol);
        setIsFirstChartOpen(true);
      } else {
        // Mobile: if 1 chart open, open 2nd chart directly
        if (isMobile && currentChartCount === 1) {
          // Step 1: Destroy and refresh Chart 2 widget completely
          if (widget2 && destroyWidget2) {
            cleanupWidget(widget2, "Widget2", destroyWidget2);
            widgetInitTrackingRef.current.widget2 = false;
            // Clear cache for old symbol if exists
            const oldSymbol = chartSymbols[1];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            // Unsubscribe from old symbol
            if (subscriptionActive2Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart2");
            }
            subscriptionActive2Ref.current = false;
          }

          const newSymbols = [...chartSymbols];
          newSymbols[1] = ceSymbol;
          setChartSymbols(newSymbols);
          setMobileChartCount(2);

          // Step 2: Reinitialize Chart 2 with new symbol (fast refresh)
          // Reset subscription flag so that isReady2 effect will trigger subscription
          subscriptionActive2Ref.current = false;
          requestAnimationFrame(() => {
            if (initializeWidget2 && chartContainer2Ref.current) {
              initializeWidget2();
            }
          });

          // Auto-close options chain popup when chart is opened
          if (showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
        } else if (currentChartCount < maxCharts) {
          // Add new chart for CE
          const newChartIndex = currentChartCount;
          const newCount = currentChartCount + 1;

          // Check limit before increasing
          const chartsCount =
            activeSubscriptionFeatures?.liveCharts?.chartsCount;
          // If chartsCount is 0 or undefined, default to 1 chart allowed
          const maxChartsCount =
            chartsCount === 0 || chartsCount === undefined ? 1 : chartsCount;
          if (newCount > maxChartsCount) {
            setSubscriptionUpgradeMessage(
              `You have reached the maximum chart limit (${maxChartsCount}). Please upgrade your subscription to add more charts.`,
            );
            setSubscriptionUpgradeOpen(true);
            return;
          }

          if (isMobile) {
            setMobileChartCount(newCount);
          } else {
            setChartCount(newCount);
          }

          // Step 1: Destroy and refresh the target chart widget completely
          if (newChartIndex === 1 && widget2 && destroyWidget2) {
            cleanupWidget(widget2, "Widget2", destroyWidget2);
            widgetInitTrackingRef.current.widget2 = false;
            const oldSymbol = chartSymbols[1];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive2Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart2");
            }
            subscriptionActive2Ref.current = false;
          } else if (newChartIndex === 2 && widget3 && destroyWidget3) {
            cleanupWidget(widget3, "Widget3", destroyWidget3);
            widgetInitTrackingRef.current.widget3 = false;
            const oldSymbol = chartSymbols[2];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive3Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart3");
            }
            subscriptionActive3Ref.current = false;
          } else if (newChartIndex === 3 && widget4 && destroyWidget4) {
            cleanupWidget(widget4, "Widget4", destroyWidget4);
            widgetInitTrackingRef.current.widget4 = false;
            const oldSymbol = chartSymbols[3];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive4Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart4");
            }
            subscriptionActive4Ref.current = false;
          }

          const newSymbols = [...chartSymbols];
          if (newChartIndex < newSymbols.length) {
            newSymbols[newChartIndex] = ceSymbol;
          } else {
            newSymbols.push(ceSymbol);
          }
          setChartSymbols(newSymbols);

          // Step 2: Reinitialize the target chart widget with new symbol (fast refresh)
          // Reset subscription flags so that isReady effects will trigger subscriptions
          if (newChartIndex === 1) {
            subscriptionActive2Ref.current = false;
            if (initializeWidget2 && chartContainer2Ref.current) {
              initializeWidget2();
            }
          } else if (newChartIndex === 2) {
            subscriptionActive3Ref.current = false;
            if (initializeWidget3 && chart3Ref.current) {
              initializeWidget3();
            }
          } else if (newChartIndex === 3) {
            subscriptionActive4Ref.current = false;
            if (initializeWidget4 && chart4Ref.current) {
              initializeWidget4();
            }
          }

          // Auto-close options chain popup when chart is opened (if 2+ charts are already open)
          if (currentChartCount >= 1 && showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
        }
      }
    }
    setShowOptionDialog(false);
    setPendingOptionData(null);
  }, [
    pendingOptionData,
    isFirstChartOpen,
    chartCount,
    chartSymbols,
    updateChartSymbol,
    isMobile,
    mobileChartCount,
    activeSubscriptionFeatures,
    getMaxChartsAllowed,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget2,
    destroyWidget2,
    initializeWidget2,
    widget3,
    destroyWidget3,
    initializeWidget3,
    widget4,
    destroyWidget4,
    initializeWidget4,
    unsubscribeOnStream,
  ]);

  // PE Option Dialog handler
  const handleOpenOnlyPE = useCallback(() => {
    if (pendingOptionData) {
      const peSymbol = pendingOptionData.symbol;
      const maxCharts = getMaxChartsAllowed();
      const currentChartCount = isMobile ? mobileChartCount : chartCount;

      // Check if PE symbol is already open
      if (isSymbolAlreadyOpen(peSymbol)) {
        errorMsg(
          `This chart is already open: ${peSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowOptionDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (!isFirstChartOpen) {
        // First time opening - directly update the chart
        updateChartSymbol(peSymbol);
        setIsFirstChartOpen(true);
      } else {
        // Mobile: if 1 chart open, open 2nd chart directly
        if (isMobile && currentChartCount === 1) {
          // Step 1: Destroy and refresh Chart 2 widget completely
          if (widget2 && destroyWidget2) {
            cleanupWidget(widget2, "Widget2", destroyWidget2);
            widgetInitTrackingRef.current.widget2 = false;
            // Clear cache for old symbol if exists
            const oldSymbol = chartSymbols[1];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            // Unsubscribe from old symbol
            if (subscriptionActive2Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart2");
            }
            subscriptionActive2Ref.current = false;
          }

          const newSymbols = [...chartSymbols];
          newSymbols[1] = peSymbol;
          setChartSymbols(newSymbols);
          setMobileChartCount(2);

          // Step 2: Reinitialize Chart 2 with new symbol (fast refresh)
          // Reset subscription flag so that isReady2 effect will trigger subscription
          subscriptionActive2Ref.current = false;
          requestAnimationFrame(() => {
            if (initializeWidget2 && chartContainer2Ref.current) {
              initializeWidget2();
            }
          });

          // Auto-close options chain popup when chart is opened
          if (showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
        } else if (currentChartCount < maxCharts) {
          // Add new chart for PE
          const newChartIndex = currentChartCount;
          const newCount = currentChartCount + 1;

          // Check limit before increasing
          const chartsCount =
            activeSubscriptionFeatures?.liveCharts?.chartsCount;
          // If chartsCount is 0 or undefined, default to 1 chart allowed
          const maxChartsCount =
            chartsCount === 0 || chartsCount === undefined ? 1 : chartsCount;
          if (newCount > maxChartsCount) {
            setSubscriptionUpgradeMessage(
              `You have reached the maximum chart limit (${maxChartsCount}). Please upgrade your subscription to add more charts.`,
            );
            setSubscriptionUpgradeOpen(true);
            return;
          }

          if (isMobile) {
            setMobileChartCount(newCount);
          } else {
            setChartCount(newCount);
          }

          // Step 1: Destroy and refresh the target chart widget completely
          if (newChartIndex === 1 && widget2 && destroyWidget2) {
            cleanupWidget(widget2, "Widget2", destroyWidget2);
            widgetInitTrackingRef.current.widget2 = false;
            const oldSymbol = chartSymbols[1];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive2Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart2");
            }
            subscriptionActive2Ref.current = false;
          } else if (newChartIndex === 2 && widget3 && destroyWidget3) {
            cleanupWidget(widget3, "Widget3", destroyWidget3);
            widgetInitTrackingRef.current.widget3 = false;
            const oldSymbol = chartSymbols[2];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive3Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart3");
            }
            subscriptionActive3Ref.current = false;
          } else if (newChartIndex === 3 && widget4 && destroyWidget4) {
            cleanupWidget(widget4, "Widget4", destroyWidget4);
            widgetInitTrackingRef.current.widget4 = false;
            const oldSymbol = chartSymbols[3];
            if (oldSymbol) {
              lastBarsCache.delete(oldSymbol);
              apiCallCache.delete(oldSymbol);
            }
            if (subscriptionActive4Ref.current && unsubscribeOnStream) {
              unsubscribeOnStream("chart4");
            }
            subscriptionActive4Ref.current = false;
          }

          const newSymbols = [...chartSymbols];
          if (newChartIndex < newSymbols.length) {
            newSymbols[newChartIndex] = peSymbol;
          } else {
            newSymbols.push(peSymbol);
          }
          setChartSymbols(newSymbols);

          // Step 2: Reinitialize the target chart widget with new symbol (fast refresh)
          // Reset subscription flags so that isReady effects will trigger subscriptions
          if (newChartIndex === 1) {
            subscriptionActive2Ref.current = false;
            if (initializeWidget2 && chartContainer2Ref.current) {
              initializeWidget2();
            }
          } else if (newChartIndex === 2) {
            subscriptionActive3Ref.current = false;
            if (initializeWidget3 && chart3Ref.current) {
              initializeWidget3();
            }
          } else if (newChartIndex === 3) {
            subscriptionActive4Ref.current = false;
            if (initializeWidget4 && chart4Ref.current) {
              initializeWidget4();
            }
          }

          // Auto-close options chain popup when chart is opened (if 2+ charts are already open)
          if (currentChartCount >= 1 && showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
        }
      }
    }
    setShowOptionDialog(false);
    setPendingOptionData(null);
  }, [
    pendingOptionData,
    isFirstChartOpen,
    chartCount,
    chartSymbols,
    updateChartSymbol,
    isMobile,
    mobileChartCount,
    activeSubscriptionFeatures,
    getMaxChartsAllowed,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
    widget2,
    destroyWidget2,
    initializeWidget2,
    widget3,
    destroyWidget3,
    initializeWidget3,
    widget4,
    destroyWidget4,
    initializeWidget4,
    unsubscribeOnStream,
  ]);

  const handleOpenCEAndPE = useCallback(() => {
    if (pendingOptionData) {
      const ceSymbol = pendingOptionData.symbol;
      // Get PE symbol - try from pendingOptionData if available, otherwise derive from CE
      const peSymbol =
        pendingOptionData.peIdentifier || ceSymbol.replace("CE", "PE");

      // Check if CE or PE is already open
      if (isSymbolAlreadyOpen(ceSymbol)) {
        errorMsg(
          `This chart is already open: ${ceSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowOptionDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (isSymbolAlreadyOpen(peSymbol)) {
        errorMsg(
          `This chart is already open: ${peSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowOptionDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (!isFirstChartOpen) {
        // First time opening - open both CE and PE
        updateChartSymbol(ceSymbol);
        setIsFirstChartOpen(true);

        // Add second chart for PE
        if (chartCount < 3) {
          const newCount = chartCount + 1;

          // Check limit before increasing
          const chartsCount =
            activeSubscriptionFeatures?.liveCharts?.chartsCount;
          // If chartsCount is 0 or undefined, default to 1 chart allowed
          const maxChartsCount =
            chartsCount === 0 || chartsCount === undefined ? 1 : chartsCount;
          if (newCount > maxChartsCount) {
            setSubscriptionUpgradeMessage(
              `You have reached the maximum chart limit (${maxChartsCount}). Please upgrade your subscription to add more charts.`,
            );
            setSubscriptionUpgradeOpen(true);
            return;
          }

          setChartCount(newCount);
          const newSymbols = [...chartSymbols];
          newSymbols[1] = peSymbol;
          setChartSymbols(newSymbols);

          // Auto-close options chain popup when charts are opened
          if (showOptionChainPopup) {
            setShowOptionChainPopup(false);
          }
        }
      } else {
        // Show sub-dialog for CE+PE options
        setShowOptionDialog(false);
        setShowCEPESubDialog(true);
        return;
      }
    }
    setShowOptionDialog(false);
    setPendingOptionData(null);
  }, [
    pendingOptionData,
    isFirstChartOpen,
    chartCount,
    chartSymbols,
    updateChartSymbol,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
  ]);

  // CE+PE Sub-dialog handlers
  const handleOpenCEPEWithMainSymbol = useCallback(() => {
    if (pendingOptionData) {
      const baseSymbol = pendingOptionData.baseSymbol;
      const ceSymbol = pendingOptionData.symbol;
      // Get PE symbol - try from pendingOptionData if available, otherwise derive from CE
      const peSymbol =
        pendingOptionData.peIdentifier || ceSymbol.replace("CE", "PE");

      // Check if CE or PE is already open
      if (isSymbolAlreadyOpen(ceSymbol)) {
        errorMsg(
          `This chart is already open: ${ceSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowCEPESubDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (isSymbolAlreadyOpen(peSymbol)) {
        errorMsg(
          `This chart is already open: ${peSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowCEPESubDialog(false);
        setPendingOptionData(null);
        return;
      }

      // Ensure main symbol is in first chart, then add CE+PE
      const newSymbols = [...chartSymbols];

      // Set main symbol in first chart if not already there
      if (newSymbols[0] !== baseSymbol) {
        newSymbols[0] = baseSymbol;
      }

      // Add CE and PE to next available positions
      let currentChartCount = chartCount;

      // Add CE chart
      if (currentChartCount < 3) {
        newSymbols[currentChartCount] = ceSymbol;
        currentChartCount++;
      }

      // Add PE chart
      if (currentChartCount < 3) {
        newSymbols[currentChartCount] = peSymbol;
        currentChartCount++;
      }

      // Update chart count and symbols
      setChartCount(currentChartCount);
      setChartSymbols(newSymbols);
      setCurrentSymbol(baseSymbol); // Set main symbol as current

      // Auto-close options chain popup when charts are opened (if 2+ charts are already open)
      if (currentChartCount >= 2 && showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowCEPESubDialog(false);
    setPendingOptionData(null);
  }, [
    pendingOptionData,
    chartCount,
    chartSymbols,
    showOptionChainPopup,
    isSymbolAlreadyOpen,
  ]);

  const handleOpenOnlyCEPE = useCallback(() => {
    if (pendingOptionData) {
      const ceSymbol = pendingOptionData.symbol;
      // Get PE symbol - try from pendingOptionData if available, otherwise derive from CE
      const peSymbol =
        pendingOptionData.peIdentifier || ceSymbol.replace("CE", "PE");

      // Ensure PE symbol is different from CE symbol
      if (peSymbol === ceSymbol) {
        return;
      }

      // Check if CE or PE is already open
      if (isSymbolAlreadyOpen(ceSymbol)) {
        errorMsg(
          `This chart is already open: ${ceSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowCEPESubDialog(false);
        setPendingOptionData(null);
        return;
      }

      if (isSymbolAlreadyOpen(peSymbol)) {
        errorMsg(
          `This chart is already open: ${peSymbol.replace(/^[A-Z]+:/, "")}`,
        );
        setShowCEPESubDialog(false);
        setPendingOptionData(null);
        return;
      }

      // Replace existing charts with only CE+PE
      setChartCount(2); // Set to 2 charts
      const newSymbols = [ceSymbol, peSymbol, "NIFTY", "BANKNIFTY"];
      setChartSymbols(newSymbols);
      setCurrentSymbol(ceSymbol); // Set CE as current symbol

      // Auto-close options chain popup when charts are opened
      if (showOptionChainPopup) {
        setShowOptionChainPopup(false);
      }
    }
    setShowCEPESubDialog(false);
    setPendingOptionData(null);
  }, [pendingOptionData, showOptionChainPopup, isSymbolAlreadyOpen]);

  const handleCancelOptionDialog = useCallback(() => {
    setShowOptionDialog(false);
    setPendingOptionData(null);
  }, []);

  // Handler to open ATM CE+PE for current symbol
  const handleOpenATMCEPE = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const currentSymbol = chartSymbols[0] || symbol;
      if (!currentSymbol) {
        errorMsg("No symbol selected. Please select a symbol first.");
        return;
      }

      // Only open option chain panel/popup – do not auto-open CE/PE charts
      if (chartCount >= 2) {
        setShowOptionChainPopup(true);
        setShowOptionChain(false);
        setShowLeftSlidePanel(false);
        setPopupPosition({ x: 0, y: 0 });
      } else {
        setShowLeftSlidePanel(true);
        setShowOptionChain(false);
        setShowOptionChainPopup(false);
      }
    },
    [chartSymbols, symbol, chartCount],
  );

  // Callback to receive ATM CE/PE identifiers from ChartOptionChain
  const handleReceiveATMCEPE = useCallback(
    (ceIdentifier, peIdentifier, baseSymbol) => {
      setShouldOpenATMCEPE(false);

      // Close option chain panels after opening charts
      setShowLeftSlidePanel(false);
      setShowOptionChain(false);
      setShowOptionChainPopup(false);

      if (!ceIdentifier || !peIdentifier) {
        // ATM options not found - show alert or message
        errorMsg(
          "ATM CE+PE options not found. Please ensure the option chain is loaded for the current symbol.",
        );
        return;
      }

      // Get the current symbol from first chart (this is the base symbol like BANKNIFTY)
      const currentBaseSymbol = chartSymbols[0] || symbol;

      // Verify that the CE/PE identifiers match the current symbol
      // Extract base symbol from CE/PE identifiers (e.g., BANKNIFTY25110425750CE -> BANKNIFTY)
      // Pattern: Symbol followed by numbers, date, strike, CE/PE
      const ceBaseMatch = ceIdentifier.match(/^([A-Z]+)/);
      const peBaseMatch = peIdentifier.match(/^([A-Z]+)/);

      const ceBaseSymbol = ceBaseMatch ? ceBaseMatch[1] : "";
      const peBaseSymbol = peBaseMatch ? peBaseMatch[1] : "";

      // Check if CE/PE match the current symbol (case-insensitive comparison)
      // Also check if current symbol is contained in the identifier or vice versa
      const currentSymbolUpper = currentBaseSymbol.toUpperCase();

      // More lenient matching - check if identifier starts with current symbol or contains it
      const ceMatches =
        ceBaseSymbol &&
        (ceBaseSymbol === currentSymbolUpper ||
          ceIdentifier.toUpperCase().startsWith(currentSymbolUpper) ||
          currentSymbolUpper.startsWith(ceBaseSymbol) ||
          ceBaseSymbol.includes(currentSymbolUpper) ||
          currentSymbolUpper.includes(ceBaseSymbol));
      const peMatches =
        peBaseSymbol &&
        (peBaseSymbol === currentSymbolUpper ||
          peIdentifier.toUpperCase().startsWith(currentSymbolUpper) ||
          currentSymbolUpper.startsWith(peBaseSymbol) ||
          peBaseSymbol.includes(currentSymbolUpper) ||
          currentSymbolUpper.includes(peBaseSymbol));

      // Only warn but don't block if symbols don't match exactly
      // Open charts anyway as user requested
      if (!ceMatches || !peMatches) {
        // Don't return - proceed to open charts
      }

      // Check if CE or PE is already open
      if (isSymbolAlreadyOpen(ceIdentifier)) {
        errorMsg(
          `This chart is already open: ${ceIdentifier.replace(/^[A-Z]+:/, "")}`,
        );
        return;
      }

      if (isSymbolAlreadyOpen(peIdentifier)) {
        errorMsg(
          `This chart is already open: ${peIdentifier.replace(/^[A-Z]+:/, "")}`,
        );
        return;
      }

      // Directly open: Keep base symbol in first chart, add CE in second, PE in third
      const newSymbols = [...chartSymbols];

      // Ensure we have 3 charts total
      const targetChartCount = 3;
      if (chartCount !== targetChartCount) {
        setChartCount(targetChartCount);
      }

      // Chart 1: Keep the base symbol (BANKNIFTY, NIFTY, etc.)
      newSymbols[0] = currentBaseSymbol;

      // Chart 2: CE option
      newSymbols[1] = ceIdentifier;

      // Chart 3: PE option
      newSymbols[2] = peIdentifier;

      setChartSymbols(newSymbols);
      setCurrentSymbol(currentBaseSymbol); // Keep base symbol as current
      setIsFirstChartOpen(true);

      // Update chart symbols directly - this will trigger chart updates
      // The chart components will automatically re-render with new symbols
    },
    [chartSymbols, chartCount, symbol, isSymbolAlreadyOpen],
  );

  // Mobile popup handlers
  const handleMobilePopupOpen = useCallback((type, title, icon) => {
    setMobilePopupType(type);
    setMobilePopupTitle(title);
    setMobilePopupIcon(icon);
    setShowMobilePopup(true);
  }, []);

  const handleMobilePopupClose = useCallback(() => {
    setShowMobilePopup(false);
    setMobilePopupType("");
    setMobilePopupTitle("");
    setMobilePopupIcon("");
  }, []);

  // TradingBox toggle handler - directly add box if needed
  const handleTradingBoxToggle = useCallback(
    async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      const newState = !showTradingBox;
      setShowTradingBox(newState);

      // If opening and no boxes exist, add one immediately
      if (newState && tradingBoxes.length === 0 && !isAddingBoxRef.current) {
        isAddingBoxRef.current = true;
        try {
          // If current symbol is an option identifier (CE/PE), use underlying (BANKNIFTY/NIFTY/etc.)
          const raw = currentSymbol || chartSymbols?.[0] || symbol || "NIFTY";
          const underlyingMatch = String(raw)
            .toUpperCase()
            .match(/^([A-Z]+)/);
          const underlying = underlyingMatch?.[1] || raw || "NIFTY";
          await addTradingBox(underlying);
        } catch (error) {
          // Error adding trading box
        } finally {
          isAddingBoxRef.current = false;
        }
      }
    },
    [
      showTradingBox,
      tradingBoxes.length,
      addTradingBox,
      currentSymbol,
      chartSymbols,
      symbol,
    ],
  );

  // Keyboard support for dialog and chart controls
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Chart navigation shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "=":
          case "+":
            event.preventDefault();
            // Zoom in
            if (widget && widget.chart) {
              widget.chart().executeActionById("chart_zoom_in");
            }
            break;
          case "-":
            event.preventDefault();
            // Zoom out
            if (widget && widget.chart) {
              widget.chart().executeActionById("chart_zoom_out");
            }
            break;
          case "0":
            event.preventDefault();
            // Reset zoom
            if (widget && widget.chart) {
              widget.chart().executeActionById("chart_reset_zoom");
            }
            break;
          case "f":
            event.preventDefault();
            // Fit content
            if (widget && widget.chart) {
              widget.chart().executeActionById("chart_fit_content");
            }
            break;
          case "r":
            event.preventDefault();
            // Add RSI
            if (widget && widget.chart) {
              widget
                .chart()
                .createStudy("Relative Strength Index", false, false, [14]);
            }
            break;
          case "m":
            event.preventDefault();
            // Add MACD
            if (widget && widget.chart) {
              widget.chart().createStudy("MACD", false, false, [12, 26, 9]);
            }
            break;
          case "b":
            event.preventDefault();
            // Add Bollinger Bands
            if (widget && widget.chart) {
              widget
                .chart()
                .createStudy("Bollinger Bands", false, false, [20, 2]);
            }
            break;
          case "a":
            event.preventDefault();
            // Add Moving Average
            if (widget && widget.chart) {
              widget.chart().createStudy("Moving Average", false, false, [20]);
            }
            break;
        }
      }

      // Dialog shortcuts
      if (!showChartDialog) return;

      if (event.key === "Escape") {
        handleCancelChartDialog();
      } else if (event.key === "Enter") {
        handleReplaceCurrentChart();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    showChartDialog,
    handleCancelChartDialog,
    handleReplaceCurrentChart,
    widget,
  ]);

  // Cleanup timeouts and widgets on component unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Cancel all active API requests
      activeRequests.forEach((abortController, requestId) => {
        abortController.abort();
      });
      activeRequests.clear();

      cleanupWidget(widget, "Widget1", destroyWidget);
      cleanupWidget(widget2, "Widget2", destroyWidget2);
      cleanupWidget(widget3, "Widget3", destroyWidget3);
      cleanupWidget(widget4, "Widget4", destroyWidget4);
    };
  }, []);

  // Individual chart library loaders
  const chartLoaders = useRef({
    chart1: null,
    chart2: null,
    chart3: null,
    chart4: null,
  });

  // Load chart library for specific chart
  const loadChartLibrary = useCallback(async (chartId) => {
    if (chartLoaders.current[chartId]) {
      return chartLoaders.current[chartId];
    }

    try {
      const loader = createIndividualChartLoader(chartId);
      chartLoaders.current[chartId] = loader;
      return await loader;
    } catch (error) {
      throw error;
    }
  }, []);

  // Set first chart as open when component mounts
  useEffect(() => {
    if (symbol && !isFirstChartOpen) {
      setIsFirstChartOpen(true);
    }
  }, [symbol, isFirstChartOpen]);

  // Initialize new charts when chart count increases (desktop only)
  useEffect(() => {
    if (chartCount > 1 && !isMobile && !initializationInProgressRef.current) {
      const prevCount = prevChartCountRef.current;
      const newCount = chartCount;

      if (prevCount === newCount) {
        return;
      }

      // Only initialize the specific chart that was added
      const initializeSpecificChart = () => {
        // Check if initialization is already in progress
        if (initializationInProgressRef.current) {
          return;
        }

        // Check which widget needs to be initialized based on current state
        let widgetToInitialize = null;

        if (
          newCount >= 2 &&
          !widgetInitTrackingRef.current.widget2 &&
          !isLoading2 &&
          !widget2
        ) {
          widgetToInitialize = "widget2";
        } else if (
          newCount >= 3 &&
          !widgetInitTrackingRef.current.widget3 &&
          !isLoading3 &&
          !widget3
        ) {
          widgetToInitialize = "widget3";
        } else if (
          newCount >= 4 &&
          !widgetInitTrackingRef.current.widget4 &&
          !isLoading4 &&
          !widget4
        ) {
          widgetToInitialize = "widget4";
        }

        if (widgetToInitialize === "widget2") {
          // Set tracking immediately to prevent double initialization
          initializationInProgressRef.current = true;
          widgetInitTrackingRef.current.widget2 = true;

          // Clear any existing debounce timer
          if (desktopInitDebounceRef.current.widget2) {
            clearTimeout(desktopInitDebounceRef.current.widget2);
          }

          // Initialize immediately without delay
          (async () => {
            try {
              await loadChartLibrary("chart2");
              initializeWidget2();
            } catch (error) {
              // Failed to load chart library for widget2
            }
            desktopInitDebounceRef.current.widget2 = null;
            // Reset progress flag after initialization
            initializationInProgressRef.current = false;
            // Update previous count after successful initialization
            prevChartCountRef.current = newCount;
          })();
        } else if (widgetToInitialize === "widget3") {
          // Set tracking immediately to prevent double initialization
          initializationInProgressRef.current = true;
          widgetInitTrackingRef.current.widget3 = true;

          // Clear any existing debounce timer
          if (desktopInitDebounceRef.current.widget3) {
            clearTimeout(desktopInitDebounceRef.current.widget3);
          }

          // Initialize immediately without delay
          (async () => {
            try {
              await loadChartLibrary("chart3");
              initializeWidget3();
            } catch (error) {
              // Failed to load chart library for widget3
            }
            desktopInitDebounceRef.current.widget3 = null;
            // Reset progress flag after initialization
            initializationInProgressRef.current = false;
            // Update previous count after successful initialization
            prevChartCountRef.current = newCount;
          })();
        } else if (widgetToInitialize === "widget4") {
          // Set tracking immediately to prevent double initialization
          initializationInProgressRef.current = true;
          widgetInitTrackingRef.current.widget4 = true;

          // Clear any existing debounce timer
          if (desktopInitDebounceRef.current.widget4) {
            clearTimeout(desktopInitDebounceRef.current.widget4);
          }

          // Initialize immediately without delay
          (async () => {
            try {
              await loadChartLibrary("chart4");
              initializeWidget4();
            } catch (error) {
              // Failed to load chart library for widget4
            }
            desktopInitDebounceRef.current.widget4 = null;
            // Reset progress flag after initialization
            initializationInProgressRef.current = false;
            // Update previous count after successful initialization
            prevChartCountRef.current = newCount;
          })();
        }
      };

      // Initialize immediately without delay
      initializeSpecificChart();
    }
  }, [
    chartCount,
    isMobile,
    widget2,
    widget3,
    widget4,
    isLoading2,
    isLoading3,
    isLoading4,
    initializeWidget2,
    initializeWidget3,
    initializeWidget4,
    loadChartLibrary,
  ]);

  // Mobile initialization logic - only run once on mount or when switching to mobile
  const mobileInitializedRef = useRef(false);
  const initializeMobileCharts = useCallback(() => {
    if (isMobile && !mobileInitializedRef.current) {
      // Only set initial state once, don't reset if user has already opened charts
      // Don't change mobileChartCount - preserve user's choice
      mobileInitializedRef.current = true;
    }
    // Reset flag when switching away from mobile
    if (!isMobile && mobileInitializedRef.current) {
      mobileInitializedRef.current = false;
    }
  }, [isMobile]);

  // Handle mobile chart count changes - only when count actually changes
  useEffect(() => {
    // Only run if count actually changed
    if (prevMobileChartCountRef.current === mobileChartCount) {
      return;
    }

    const was2 = prevMobileChartCountRef.current === 2;
    const isNow1 = mobileChartCount === 1;

    if (isMobile && mobileChartCount === 2) {
      // Initialize second chart when mobile chart count is set to 2
      // Only initialize if not already initialized and not currently loading
      const shouldInitialize =
        !widgetInitTrackingRef.current.widget2 && !isLoading2 && !widget2;

      if (shouldInitialize) {
        // Mark as initializing to prevent multiple initializations
        widgetInitTrackingRef.current.widget2 = true;

        // Initialize immediately, no delay
        if (chartContainer2Ref.current) {
          loadChartLibrary("chart2")
            .then(() => {
              initializeWidget2();
            })
            .catch(() => {
              widgetInitTrackingRef.current.widget2 = false;
            });
        }
      }
    } else if (isMobile && was2 && isNow1) {
      // Only cleanup if actually changed from 2 to 1
      if (widget2 && destroyWidget2) {
        cleanupWidget(widget2, "Widget2", destroyWidget2);
        widgetInitTrackingRef.current.widget2 = false;
      } else {
        widgetStatesRef.current.widget2 = null;
        widgetInitTrackingRef.current.widget2 = false;
      }
    }

    prevMobileChartCountRef.current = mobileChartCount;
  }, [
    isMobile,
    mobileChartCount,
    widget2,
    isLoading2,
    initializeWidget2,
    destroyWidget2,
    loadChartLibrary,
  ]);

  // Cleanup effect for chart count changes (desktop only)
  useEffect(() => {
    if (!isMobile) {
      // Cleanup widgets that are no longer needed
      if (effectiveChartCount < 2 && widget2) {
        cleanupWidget(widget2, "Widget2", destroyWidget2);
        widgetInitTrackingRef.current.widget2 = false; // Reset tracking
        initializationInProgressRef.current = false; // Reset progress flag

        if (desktopInitDebounceRef.current.widget2) {
          clearTimeout(desktopInitDebounceRef.current.widget2);
          desktopInitDebounceRef.current.widget2 = null;
        }

        prevChartCountRef.current = Math.max(1, effectiveChartCount);
      }
      if (effectiveChartCount < 3 && widget4) {
        cleanupWidget(widget4, "Widget4", destroyWidget4);
        widgetInitTrackingRef.current.widget4 = false; // Reset tracking
        initializationInProgressRef.current = false; // Reset progress flag

        if (desktopInitDebounceRef.current.widget4) {
          clearTimeout(desktopInitDebounceRef.current.widget4);
          desktopInitDebounceRef.current.widget4 = null;
        }

        prevChartCountRef.current = Math.max(1, effectiveChartCount);
      }
    }
  }, [effectiveChartCount, widget2, widget3, widget4, isMobile]);

  // Track chart initialization to prevent unnecessary re-initializations
  const chartInitRef = useRef({
    chart1: false,
    chart2: false,
    chart3: false,
    chart4: false,
  });

  // Optimized chart initialization - only initialize visible charts
  useEffect(() => {
    if (!symbol) {
      return;
    }

    // Reset initialization flag when symbol changes
    const symbolChanged = lastSymbolUpdateRef.current !== symbol;
    if (symbolChanged) {
      lastSymbolUpdateRef.current = symbol;
      // Reset init flags only for charts that need symbol change handling
    }

    const initializeCharts = async () => {
      // Initialize Chart 1 immediately - Priority 1
      if (
        !widget &&
        !isLoading &&
        chartContainerRef.current &&
        (!chartInitRef.current.chart1 || symbolChanged)
      ) {
        try {
          await loadChartLibrary("chart1");
          initializeWidget();
          chartInitRef.current.chart1 = true;
        } catch (error) {
          chartInitRef.current.chart1 = false;
        }
      }

      // Defer other charts to load after first chart is ready - Priority 2
      if (!isMobile && chartCount > 1 && chartInitRef.current.chart1) {
        // Use requestIdleCallback for non-critical charts
        const loadOtherCharts = () => {
          const initPromises = [];

          // Initialize Chart 2
          if (
            !widget2 &&
            !isLoading2 &&
            chartContainer2Ref.current &&
            !chartInitRef.current.chart2
          ) {
            initPromises.push(
              (async () => {
                try {
                  await loadChartLibrary("chart2");
                  initializeWidget2();
                  chartInitRef.current.chart2 = true;
                } catch (error) {
                  chartInitRef.current.chart2 = false;
                }
              })(),
            );
          }

          // Initialize Chart 3
          if (
            chartCount > 2 &&
            !widget3 &&
            !isLoading3 &&
            chart3Ref.current &&
            !chartInitRef.current.chart3
          ) {
            initPromises.push(
              (async () => {
                try {
                  await loadChartLibrary("chart3");
                  initializeWidget3();
                  chartInitRef.current.chart3 = true;
                } catch (error) {
                  chartInitRef.current.chart3 = false;
                }
              })(),
            );
          }

          // Initialize Chart 4
          if (
            chartCount > 3 &&
            !widget4 &&
            !isLoading4 &&
            chart4Ref.current &&
            !chartInitRef.current.chart4
          ) {
            initPromises.push(
              (async () => {
                try {
                  await loadChartLibrary("chart4");
                  initializeWidget4();
                  chartInitRef.current.chart4 = true;
                } catch (error) {
                  chartInitRef.current.chart4 = false;
                }
              })(),
            );
          }

          if (initPromises.length > 0) {
            Promise.all(initPromises);
          }
        };

        // Load other charts immediately (no delay)
        loadOtherCharts();
      }
    };

    // Only initialize mobile charts once, not on every render
    if (isMobile && !mobileInitializedRef.current) {
      initializeMobileCharts();
    }

    // Initialize immediately if container is ready
    if (chartContainerRef.current) {
      initializeCharts();
    }

    if (isReady2 && widget2) {
      widgetInitTrackingRef.current.widget2 = true;
    }
    if (isReady3 && widget3) {
      widgetInitTrackingRef.current.widget3 = true;
    }
    if (isReady4 && widget4) {
      widgetInitTrackingRef.current.widget4 = true;
    }
  }, [
    symbol,
    isReady,
    widget,
    widget2,
    widget3,
    widget4,
    isLoading,
    isLoading2,
    isLoading3,
    isLoading4,
    isMobile,
    chartCount,
    initializeWidget,
    initializeWidget2,
    initializeWidget3,
    initializeWidget4,
    loadChartLibrary,
    initializeMobileCharts,
  ]);

  // Handle realtime subscription when symbol changes or widget becomes ready
  // This ensures subscription happens when clicking from option chain
  const prevSymbolRef = useRef(symbol);
  const prevSymbol2Ref = useRef(chartSymbols[1]);
  const prevSymbol3Ref = useRef(chartSymbols[2]);
  const prevSymbol4Ref = useRef(chartSymbols[3]);
  const subscriptionActiveRef = useRef(false);
  const subscriptionActive2Ref = useRef(false);
  const subscriptionActive3Ref = useRef(false);
  const subscriptionActive4Ref = useRef(false);

  // Subscribe ALL charts simultaneously when ready (parallel, not sequential)
  useEffect(() => {
    if (!signalRContext?.isConnectionActive || !subscribeOnStream) {
      return;
    }

    // Subscribe all charts simultaneously (parallel subscription)
    const subscribeAllCharts = () => {
      // Chart 1
      if (isReady && widget && symbol && !subscriptionActiveRef.current) {
        try {
          subscribeOnStream(
            { full_name: symbol },
            "1D",
            (bar) => {
              // Real-time update callback
            },
            "chart1",
            () => {
              lastBarsCache.delete(symbol);
            },
            lastBarsCache.get(symbol),
          );
          subscriptionActiveRef.current = true;
        } catch (error) {
          subscriptionActiveRef.current = false;
        }
      }

      // Chart 2
      if (
        isReady2 &&
        widget2 &&
        chartSymbols[1] &&
        !subscriptionActive2Ref.current
      ) {
        try {
          subscribeOnStream(
            { full_name: chartSymbols[1] },
            "1D",
            (bar) => {
              // Real-time update callback
            },
            "chart2",
            () => {
              lastBarsCache.delete(chartSymbols[1]);
            },
            lastBarsCache.get(chartSymbols[1]),
          );
          subscriptionActive2Ref.current = true;
        } catch (error) {
          subscriptionActive2Ref.current = false;
        }
      }

      // Chart 3
      if (
        isReady3 &&
        widget3 &&
        chartSymbols[2] &&
        !subscriptionActive3Ref.current
      ) {
        try {
          subscribeOnStream(
            { full_name: chartSymbols[2] },
            "1D",
            (bar) => {
              // Real-time update callback
            },
            "chart3",
            () => {
              lastBarsCache.delete(chartSymbols[2]);
            },
            lastBarsCache.get(chartSymbols[2]),
          );
          subscriptionActive3Ref.current = true;
        } catch (error) {
          subscriptionActive3Ref.current = false;
        }
      }

      // Chart 4
      if (
        isReady4 &&
        widget4 &&
        chartSymbols[3] &&
        !subscriptionActive4Ref.current
      ) {
        try {
          subscribeOnStream(
            { full_name: chartSymbols[3] },
            "1D",
            (bar) => {
              // Real-time update callback
            },
            "chart4",
            () => {
              lastBarsCache.delete(chartSymbols[3]);
            },
            lastBarsCache.get(chartSymbols[3]),
          );
          subscriptionActive4Ref.current = true;
        } catch (error) {
          subscriptionActive4Ref.current = false;
        }
      }
    };

    // Subscribe all charts immediately (parallel)
    subscribeAllCharts();
  }, [
    isReady,
    widget,
    symbol,
    isReady2,
    widget2,
    chartSymbols[1],
    isReady3,
    widget3,
    chartSymbols[2],
    isReady4,
    widget4,
    chartSymbols[3],
    subscribeOnStream,
    signalRContext?.isConnectionActive,
  ]);

  // Handle symbol changes - unsubscribe old symbol when symbol changes
  // Subscription will be handled automatically by the subscription effect when widget is ready
  useEffect(() => {
    // Chart 1 - Handle symbol change
    if (prevSymbolRef.current !== symbol) {
      // Unsubscribe old symbol
      if (subscriptionActiveRef.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart1");
      }
      subscriptionActiveRef.current = false;
      prevSymbolRef.current = symbol;
    }

    // Chart 2 - Handle symbol change
    if (prevSymbol2Ref.current !== chartSymbols[1]) {
      if (subscriptionActive2Ref.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart2");
      }
      subscriptionActive2Ref.current = false;
      prevSymbol2Ref.current = chartSymbols[1];
    }

    // Chart 3 - Handle symbol change
    if (prevSymbol3Ref.current !== chartSymbols[2]) {
      if (subscriptionActive3Ref.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart3");
      }
      subscriptionActive3Ref.current = false;
      prevSymbol3Ref.current = chartSymbols[2];
    }

    // Chart 4 - Handle symbol change
    if (prevSymbol4Ref.current !== chartSymbols[3]) {
      if (subscriptionActive4Ref.current && unsubscribeOnStream) {
        unsubscribeOnStream("chart4");
      }
      subscriptionActive4Ref.current = false;
      prevSymbol4Ref.current = chartSymbols[3];
    }
  }, [symbol, chartSymbols, unsubscribeOnStream]);

  // Fix empty grey bars above charts - Continuous monitoring with MutationObserver
  useEffect(() => {
    const hideEmptyBars = () => {
      const containers = [
        chartContainerRef.current,
        chartContainer2Ref.current,
        chart3Ref.current,
        chart4Ref.current,
      ].filter(Boolean);

      containers.forEach((container) => {
        try {
          // Find all divs with grey backgrounds that are empty or have no content
          const allDivs = container.querySelectorAll(
            'div[style*="background"]',
          );
          allDivs.forEach((div) => {
            const bgColor =
              div.style.background || div.style.backgroundColor || "";
            const isGrey =
              bgColor.includes("#f") ||
              bgColor.includes("#e") ||
              bgColor.includes("#d") ||
              bgColor.includes("rgb(245") ||
              bgColor.includes("rgb(238") ||
              bgColor.includes("rgb(240") ||
              bgColor.includes("rgb(250") ||
              bgColor.includes("rgb(249") ||
              bgColor.includes("rgb(252") ||
              bgColor.includes("rgb(233") ||
              bgColor.includes("rgb(213") ||
              bgColor.includes("rgb(204") ||
              bgColor.includes("rgb(224") ||
              bgColor.includes("rgb(248") ||
              bgColor.includes("rgb(252");

            if (isGrey) {
              const hasContent =
                div.textContent?.trim() || div.querySelector("*");
              const computedHeight = window.getComputedStyle(div).height;
              const heightValue = parseFloat(computedHeight);

              // Hide if empty or has very small height (likely empty bar)
              if (
                !hasContent ||
                (heightValue > 0 &&
                  heightValue < 50 &&
                  !div.textContent?.trim())
              ) {
                div.style.display = "none";
                div.style.height = "0";
                div.style.minHeight = "0";
                div.style.maxHeight = "0";
                div.style.padding = "0";
                div.style.margin = "0";
                div.style.overflow = "hidden";
              }
            }
          });
        } catch (e) {
          // Silent error
        }
      });
    };

    // Run immediately
    hideEmptyBars();

    // Set up MutationObserver to watch for new elements
    const observers = [];
    const containers = [
      chartContainerRef.current,
      chartContainer2Ref.current,
      chart3Ref.current,
      chart4Ref.current,
    ].filter(Boolean);

    containers.forEach((container) => {
      try {
        const observer = new MutationObserver(() => {
          hideEmptyBars();
        });
        observer.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["style", "class"],
        });
        observers.push(observer);
      } catch (e) {
        // Silent error
      }
    });

    // Also run periodically to catch any missed elements (reduced frequency)
    const intervalId = setInterval(hideEmptyBars, 1000);

    return () => {
      observers.forEach((observer) => observer.disconnect());
      clearInterval(intervalId);
    };
  }, [
    isReady,
    isReady2,
    isReady3,
    isReady4,
    widget,
    widget2,
    widget3,
    widget4,
  ]);

  // Handle wake-up from sleep mode - re-subscribe and clear cache
  const prevConnectionStatusRef = useRef(
    signalRContext?.isConnectionActive || false,
  );
  const lastVisibilityTimeRef = useRef(Date.now());

  useEffect(() => {
    // Detect wake-up from sleep mode
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastVisible = Date.now() - lastVisibilityTimeRef.current;

        // If tab was hidden for more than 5 seconds, consider it a wake-up scenario
        // (sleep mode usually causes longer gaps)
        if (timeSinceLastVisible > 5000) {
          // Clear caches to force fresh data
          lastBarsCache.clear();
          apiCallCache.clear();

          // Reset subscription status to force re-subscription
          subscriptionActiveRef.current = false;

          // Force widget to refresh data if widget is ready
          if (widget && isReady && symbol) {
            try {
              // Unsubscribe first
              if (unsubscribeOnStream) {
                unsubscribeOnStream("chart1");
              }

              // Clear subscription status
              subscriptionActiveRef.current = false;

              // Widget will automatically call subscribeBars when it needs data
              // The widget's datafeed will handle getting fresh data
            } catch (error) {
              // Error during wake-up cleanup
            }
          }
        }

        lastVisibilityTimeRef.current = Date.now();
      } else {
        // Tab became hidden - record the time
        lastVisibilityTimeRef.current = Date.now();
      }
    };

    // Detect reconnection after sleep or network recovery - immediate refresh
    const wasDisconnected = !prevConnectionStatusRef.current;
    const isNowConnected = signalRContext?.isConnectionActive || false;

    if (wasDisconnected && isNowConnected) {
      // Connection was restored - clear cache and re-subscribe immediately
      // Clear caches to force fresh data
      lastBarsCache.clear();
      apiCallCache.clear();

      // Reset subscription status
      subscriptionActiveRef.current = false;

      // Re-subscribe immediately when widget is ready (no delay)
      if (widget && isReady && symbol && subscribeOnStream) {
        try {
          // Unsubscribe first to clean up
          if (unsubscribeOnStream) {
            unsubscribeOnStream("chart1");
          }

          // Re-subscribe immediately with fresh connection
          subscribeOnStream(
            { full_name: symbol },
            "1D",
            (bar) => {
              // Real-time update callback - widget handles chart updates
            },
            "chart1",
            () => {
              // Reset cache callback
              lastBarsCache.delete(symbol);
            },
            undefined, // No cached bar - get fresh data
          );
          subscriptionActiveRef.current = true;
        } catch (error) {
          // Error re-subscribing - will retry when connection becomes active
        }
      }
    }

    // Update previous connection status
    prevConnectionStatusRef.current = isNowConnected;

    // Add visibility change listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    signalRContext?.isConnectionActive,
    widget,
    isReady,
    symbol,
    subscribeOnStream,
    unsubscribeOnStream,
  ]);

  // Track network offline timestamp
  const networkOfflineTimestampRef = useRef(null);

  // Network online/offline detection - Single proper solution for all charts
  useEffect(() => {
    const handleNetworkOnline = () => {
      // Network came back - Proper single solution: Clean unsubscribe, clear cache, refresh all charts

      // Step 1: Unsubscribe ALL charts from live data
      if (unsubscribeOnStream) {
        try {
          unsubscribeOnStream("chart1");
          unsubscribeOnStream("chart2");
          unsubscribeOnStream("chart3");
          unsubscribeOnStream("chart4");
        } catch (error) {
          // Silent error
        }
      }

      // Step 2: Clear ALL caches to force fresh data
      lastBarsCache.clear();
      apiCallCache.clear();
      subscriptionActiveRef.current = false;
      subscriptionActive2Ref.current = false;
      subscriptionActive3Ref.current = false;
      subscriptionActive4Ref.current = false;

      // Step 3: Refresh ALL charts simultaneously and subscribe immediately (parallel, not sequential)
      const refreshAllChartsProperly = () => {
        // Reset all subscription flags to force re-subscription
        subscriptionActiveRef.current = false;
        subscriptionActive2Ref.current = false;
        subscriptionActive3Ref.current = false;
        subscriptionActive4Ref.current = false;

        // Refresh ALL charts simultaneously (parallel refresh) - Force full chart reload
        if (widget && isReady && symbol) {
          try {
            // Force full chart refresh to fix empty bars
            if (widget.chart) {
              try {
                widget.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            if (widget.setSymbol) {
              widget.setSymbol(symbol, 0);
            }
            // Force chart to redraw
            if (widget.chart) {
              try {
                widget.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            // Hide empty grey bars after chart loads
            setTimeout(() => {
              try {
                const container = chartContainerRef.current;
                if (container) {
                  const emptyBars = container.querySelectorAll(
                    'div[style*="background"]:empty, div[style*="background: #f"], div[style*="background: #e"], div[style*="background: #d"]',
                  );
                  emptyBars.forEach((bar) => {
                    if (!bar.textContent && !bar.querySelector("*")) {
                      bar.style.display = "none";
                      bar.style.height = "0";
                      bar.style.minHeight = "0";
                      bar.style.maxHeight = "0";
                    }
                  });
                }
              } catch (e) {}
            }, 500);
          } catch (error) {}
        }

        if (widget2 && isReady2 && chartSymbols[1]) {
          try {
            if (widget2.chart) {
              try {
                widget2.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            if (widget2.setSymbol) {
              widget2.setSymbol(chartSymbols[1], 0);
            }
            if (widget2.chart) {
              try {
                widget2.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            // Hide empty grey bars after chart loads
            setTimeout(() => {
              try {
                const container = chartContainer2Ref.current;
                if (container) {
                  const emptyBars = container.querySelectorAll(
                    'div[style*="background"]:empty, div[style*="background: #f"], div[style*="background: #e"], div[style*="background: #d"]',
                  );
                  emptyBars.forEach((bar) => {
                    if (!bar.textContent && !bar.querySelector("*")) {
                      bar.style.display = "none";
                      bar.style.height = "0";
                      bar.style.minHeight = "0";
                      bar.style.maxHeight = "0";
                    }
                  });
                }
              } catch (e) {}
            }, 500);
          } catch (error) {}
        }

        if (widget3 && isReady3 && chartSymbols[2]) {
          try {
            if (widget3.chart) {
              try {
                widget3.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            if (widget3.setSymbol) {
              widget3.setSymbol(chartSymbols[2], 0);
            }
            if (widget3.chart) {
              try {
                widget3.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            // Hide empty grey bars after chart loads
            setTimeout(() => {
              try {
                const container = chart3Ref.current;
                if (container) {
                  const emptyBars = container.querySelectorAll(
                    'div[style*="background"]:empty, div[style*="background: #f"], div[style*="background: #e"], div[style*="background: #d"]',
                  );
                  emptyBars.forEach((bar) => {
                    if (!bar.textContent && !bar.querySelector("*")) {
                      bar.style.display = "none";
                      bar.style.height = "0";
                      bar.style.minHeight = "0";
                      bar.style.maxHeight = "0";
                    }
                  });
                }
              } catch (e) {}
            }, 500);
          } catch (error) {}
        }

        if (widget4 && isReady4 && chartSymbols[3]) {
          try {
            if (widget4.chart) {
              try {
                widget4.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            if (widget4.setSymbol) {
              widget4.setSymbol(chartSymbols[3], 0);
            }
            if (widget4.chart) {
              try {
                widget4.chart().executeActionById("chart_reset_zoom");
              } catch (e) {}
            }
            // Hide empty grey bars after chart loads
            setTimeout(() => {
              try {
                const container = chart4Ref.current;
                if (container) {
                  const emptyBars = container.querySelectorAll(
                    'div[style*="background"]:empty, div[style*="background: #f"], div[style*="background: #e"], div[style*="background: #d"]',
                  );
                  emptyBars.forEach((bar) => {
                    if (!bar.textContent && !bar.querySelector("*")) {
                      bar.style.display = "none";
                      bar.style.height = "0";
                      bar.style.minHeight = "0";
                      bar.style.maxHeight = "0";
                    }
                  });
                }
              } catch (e) {}
            }, 500);
          } catch (error) {}
        }

        // Subscribe ALL charts simultaneously (parallel subscription - no delay)
        if (subscribeOnStream && signalRContext?.isConnectionActive) {
          // Chart 1
          if (isReady && widget && symbol) {
            try {
              subscribeOnStream(
                { full_name: symbol },
                "1D",
                (bar) => {},
                "chart1",
                () => {
                  lastBarsCache.delete(symbol);
                },
                undefined,
              );
              subscriptionActiveRef.current = true;
            } catch (error) {}
          }

          // Chart 2
          if (isReady2 && widget2 && chartSymbols[1]) {
            try {
              subscribeOnStream(
                { full_name: chartSymbols[1] },
                "1D",
                (bar) => {},
                "chart2",
                () => {
                  lastBarsCache.delete(chartSymbols[1]);
                },
                undefined,
              );
              subscriptionActive2Ref.current = true;
            } catch (error) {}
          }

          // Chart 3
          if (isReady3 && widget3 && chartSymbols[2]) {
            try {
              subscribeOnStream(
                { full_name: chartSymbols[2] },
                "1D",
                (bar) => {},
                "chart3",
                () => {
                  lastBarsCache.delete(chartSymbols[2]);
                },
                undefined,
              );
              subscriptionActive3Ref.current = true;
            } catch (error) {}
          }

          // Chart 4
          if (isReady4 && widget4 && chartSymbols[3]) {
            try {
              subscribeOnStream(
                { full_name: chartSymbols[3] },
                "1D",
                (bar) => {},
                "chart4",
                () => {
                  lastBarsCache.delete(chartSymbols[3]);
                },
                undefined,
              );
              subscriptionActive4Ref.current = true;
            } catch (error) {}
          }
        }
      };

      // Wait for socket connection (max 1 second), then refresh all charts once
      if (signalRContext?.isConnectionActive) {
        // Socket already connected - refresh immediately
        refreshAllChartsProperly();
      } else {
        // Wait for socket to connect, then refresh once
        let timeoutId = null;
        let intervalId = null;

        timeoutId = setTimeout(() => {
          if (intervalId) clearInterval(intervalId);
          refreshAllChartsProperly();
        }, 1000); // Max 1 second wait

        // Check when connection becomes active
        intervalId = setInterval(() => {
          if (signalRContext?.isConnectionActive) {
            if (timeoutId) clearTimeout(timeoutId);
            clearInterval(intervalId);
            refreshAllChartsProperly();
          }
        }, 100); // Check every 100ms

        // Cleanup after 1 second
        setTimeout(() => {
          if (intervalId) clearInterval(intervalId);
        }, 1000);
      }
    };

    const handleNetworkOffline = () => {
      // Network went offline - store timestamp and mark subscription as inactive
      networkOfflineTimestampRef.current = Math.floor(Date.now() / 1000); // Store in seconds
      subscriptionActiveRef.current = false;
    };

    // Add network event listeners
    window.addEventListener("online", handleNetworkOnline);
    window.addEventListener("offline", handleNetworkOffline);

    return () => {
      window.removeEventListener("online", handleNetworkOnline);
      window.removeEventListener("offline", handleNetworkOffline);
    };
  }, [
    widget,
    isReady,
    symbol,
    widget2,
    isReady2,
    widget3,
    isReady3,
    widget4,
    isReady4,
    chartSymbols,
    signalRContext?.isConnectionActive,
    subscribeOnStream,
    unsubscribeOnStream,
  ]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;

      if (mobile !== isMobile) {
        setIsMobile(mobile);

        if (mobile && chartCount < 1) {
          setChartCount(1);
          setMobileChartCount(1);
        }

        if (mobile) {
          setShowOrders(false);
          setShowOptionChain(false);
          // Keep symbols array aligned to actual open charts (1 by default on mobile).
          setChartSymbols((prev) => {
            const count = 1;
            const next = Array.isArray(prev) ? [...prev] : [];
            if (next.length === 0) next.push(symbol);
            // Trim to actual open chart count to avoid extra background work.
            return next.slice(0, count);
          });
        }
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Retry mechanism for failed chart loads
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);

    // Reinitialize all widgets that have errors
    if (error && chartContainerRef.current) {
      initializeWidget();
    }
    if (error2 && chartContainer2Ref.current) {
      initializeWidget2();
    }
    if (error3 && chart3Ref.current) {
      initializeWidget3();
    }
    if (error4 && chart4Ref.current) {
      initializeWidget4();
    }
  }, [
    error,
    error2,
    error3,
    error4,
    initializeWidget,
    initializeWidget2,
    initializeWidget3,
    initializeWidget4,
  ]);

  // Chart management functions
  const addChart = useCallback(() => {
    if (chartCount < 3) {
      // If 2+ charts are open and option chain popup is open, minimize it before adding chart
      if (chartCount >= 2 && showOptionChainPopup && !isMinimized) {
        setIsMinimized(true);
        setIsMaximized(false);
      }

      setChartCount((prev) => {
        const newCount = prev + 1;
        // Ensure we have enough symbols for the new chart
        setChartSymbols((prevSymbols) => {
          const newSymbols = [...prevSymbols];
          // Add default symbol if needed
          while (newSymbols.length < newCount) {
            const defaultSymbols = ["NIFTY", "BANKNIFTY", "FINNIFTY"];
            newSymbols.push(
              defaultSymbols[newSymbols.length % defaultSymbols.length],
            );
          }
          return newSymbols;
        });
        return newCount;
      });
    }
  }, [chartCount, showOptionChainPopup, isMinimized]);

  const removeChart = useCallback(() => {
    if (chartCount > 1) {
      // Destroy the last widget
      const lastIndex = chartCount - 1;
      if (lastIndex === 1 && destroyWidget2) {
        cleanupWidget(widget2, "Widget2", destroyWidget2);
      } else if (lastIndex === 2 && destroyWidget3) {
        cleanupWidget(widget3, "Widget3", destroyWidget3);
      } else if (lastIndex === 3 && destroyWidget4) {
        cleanupWidget(widget4, "Widget4", destroyWidget4);
      }

      setChartCount((prev) => {
        const newCount = prev - 1;
        // Update symbols array - remove the last chart's symbol
        setChartSymbols((prevSymbols) => {
          const newSymbols = [...prevSymbols];
          if (newSymbols.length > newCount) {
            newSymbols.splice(newCount, 1);
          }
          return newSymbols;
        });

        // Reset tracking for removed widget
        if (lastIndex === 1) {
          widgetInitTrackingRef.current.widget2 = false;
          if (desktopInitDebounceRef.current.widget2) {
            clearTimeout(desktopInitDebounceRef.current.widget2);
            desktopInitDebounceRef.current.widget2 = null;
          }
        } else if (lastIndex === 2) {
          widgetInitTrackingRef.current.widget3 = false;
          if (desktopInitDebounceRef.current.widget3) {
            clearTimeout(desktopInitDebounceRef.current.widget3);
            desktopInitDebounceRef.current.widget3 = null;
          }
        } else if (lastIndex === 3) {
          widgetInitTrackingRef.current.widget4 = false;
          if (desktopInitDebounceRef.current.widget4) {
            clearTimeout(desktopInitDebounceRef.current.widget4);
            desktopInitDebounceRef.current.widget4 = null;
          }
        }

        prevChartCountRef.current = newCount;
        return newCount;
      });
    }
  }, [chartCount, destroyWidget2, destroyWidget3, destroyWidget4]);

  // Handle OptionChain toggle and popup
  const handleOptionChainToggle = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (chartCount >= 2) {
        // Show popup when multi chart (2+ charts) is open
        // Don't set showOptionChain to true - only use popup
        const newState = !showOptionChainPopup;
        setShowOptionChainPopup(newState);
        // Keep showOptionChain false when multi chart is open to prevent chart card from showing
        setShowOptionChain(false);
        setShowLeftSlidePanel(false);
        // Reset popup position when opening
        if (newState) {
          setPopupPosition({ x: 0, y: 0 });
        }
      } else {
        // Show left slide panel for single chart only (not inline option chain card)
        const newState = !showLeftSlidePanel;
        setShowLeftSlidePanel(newState);
        setShowOptionChain(false); // Never show inline option chain card
        setShowOptionChainPopup(false);
      }
    },
    [chartCount, showLeftSlidePanel, showOptionChainPopup],
  );

  // Callback to close options chain popup
  const handleCloseOptionChainPopup = useCallback(() => {
    if (showOptionChainPopup) {
      setShowOptionChainPopup(false);
    }
  }, [showOptionChainPopup]);

  // Drag and drop handlers
  const handleMouseDown = (e) => {
    if (e.target.closest(".popup-close-btn")) return; // Don't drag when clicking close button

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    e.currentTarget.style.cursor = "grabbing";
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Get popup dimensions based on state
    let popupWidth, popupHeight;
    if (isMaximized) {
      popupWidth = window.innerWidth - 40;
      popupHeight = window.innerHeight - 40;
    } else if (isMinimized) {
      popupWidth = 300;
      popupHeight = 60;
    } else {
      popupWidth = 1200;
      popupHeight = window.innerHeight * 0.75;
    }

    // Calculate boundaries
    const maxX = window.innerWidth - popupWidth - 20;
    const maxY = window.innerHeight - popupHeight - 20;

    setPopupPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const popupElement = document.querySelector(".option-chain-popup");
    if (popupElement) {
      popupElement.style.cursor = "move";
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    setIsMinimized(false);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsMaximized(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (showOptionChainPopup) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [showOptionChainPopup, isDragging, dragOffset]);

  // Smart card management - hide OptionChain when multiple charts are open
  // When chartCount >= 2 (multi chart), only show in popup, not in chart card
  const shouldShowOptionChain =
    showOptionChain && chartCount === 1 && !isMobile;
  const shouldShowLeftSlidePanel =
    showLeftSlidePanel && chartCount === 1 && !isMobile;

  // Auto-hide OptionChain only when chart count increases from 1 to 2+ (multi chart opens)
  // This allows manual opening via button click even when multi chart is open (but only in popup)
  useEffect(() => {
    const prevCount = prevChartCountForOptionChainRef.current;
    // Only auto-close when chartCount increases from < 2 to >= 2
    if (
      prevCount < 2 &&
      chartCount >= 2 &&
      (showOptionChain || showLeftSlidePanel || showOptionChainPopup)
    ) {
      // When multi chart opens, close chart card option chain completely
      // User can still open it via button click but it will only open in popup
      setShowOptionChain(false);
      setShowLeftSlidePanel(false);
      // Close popup as well when multi chart opens automatically
      setShowOptionChainPopup(false);
    }
    // Ensure showOptionChain stays false always - we never want inline option chain card
    // Only use popup (for chartCount >= 2) or left slide panel (for chartCount === 1)
    if (showOptionChain) {
      setShowOptionChain(false);
    }

    // Ensure showLeftSlidePanel stays false when chartCount >= 2 (use popup instead)
    if (chartCount >= 2 && showLeftSlidePanel) {
      setShowLeftSlidePanel(false);
    }

    // Update ref after checking
    prevChartCountForOptionChainRef.current = chartCount;
  }, [chartCount, showOptionChain, showLeftSlidePanel, showOptionChainPopup]);

  // Auto-close option chain popup when chart symbols change (chart opened) and 2+ charts are open
  const prevChartSymbolsForPopupRef = useRef(JSON.stringify(chartSymbols));
  const prevEffectiveChartCountForPopupRef = useRef(
    isMobile ? mobileChartCount : chartCount,
  );

  useEffect(() => {
    const effectiveCount = isMobile ? mobileChartCount : chartCount;
    const currentSymbolsStr = JSON.stringify(chartSymbols);

    // Check if chart symbols actually changed (chart was opened)
    const symbolsChanged =
      prevChartSymbolsForPopupRef.current !== currentSymbolsStr;

    // Check if chart count changed
    const countChanged =
      prevEffectiveChartCountForPopupRef.current !== effectiveCount;

    // Auto-close popup when:
    // 1. Chart symbols changed OR chart count increased (chart was opened)
    // 2. 2+ charts are open (or will be open after this change)
    // 3. Popup is currently open
    if (
      (symbolsChanged || countChanged) &&
      effectiveCount >= 2 &&
      showOptionChainPopup
    ) {
      // Close immediately when charts are opened
      setShowOptionChainPopup(false);
    }

    // Update refs
    prevChartSymbolsForPopupRef.current = currentSymbolsStr;
    prevEffectiveChartCountForPopupRef.current = effectiveCount;
  }, [
    chartSymbols,
    isMobile,
    mobileChartCount,
    chartCount,
    showOptionChainPopup,
  ]);

  // Auto-hide one card when both are open to maintain balance
  useEffect(() => {
    if (
      (showOptionChain || showLeftSlidePanel) &&
      showOrders &&
      chartCount >= 2
    ) {
      setShowOptionChain(false);
      setShowLeftSlidePanel(false);
    }
  }, [showOptionChain, showLeftSlidePanel, showOrders, chartCount]);

  // Track previous chart count for auto-close option chain logic
  const prevChartCountForOptionChainRef = useRef(1);

  // Track previous showTradingBox state to detect when it changes from false to true
  const prevShowTradingBoxRef = useRef(false);
  const isAddingBoxRef = useRef(false);

  useEffect(() => {
    // Update the ref for tracking
    prevShowTradingBoxRef.current = showTradingBox;
  }, [showTradingBox]);

  // Market status state
  const [marketStatus, setMarketStatus] = useState({
    isOpen: false,
    nextOpen: null,
    nextClose: null,
    timeToOpen: null,
    timeToClose: null,
  });

  // Market status calculation
  const calculateMarketStatus = useCallback(() => {
    const now = new Date();
    const istTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    );

    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = new Date(istTime);
    marketOpen.setHours(9, 15, 0, 0);

    const marketClose = new Date(istTime);
    marketClose.setHours(15, 30, 0, 0);

    const isOpen = istTime >= marketOpen && istTime <= marketClose;

    let nextOpen, nextClose, timeToOpen, timeToClose;

    if (isOpen) {
      nextClose = marketClose;
      timeToClose = Math.max(0, marketClose - istTime);

      // Next open is tomorrow
      nextOpen = new Date(marketOpen);
      nextOpen.setDate(nextOpen.getDate() + 1);
      timeToOpen = nextOpen - istTime;
    } else {
      if (istTime < marketOpen) {
        // Before market opens today
        nextOpen = marketOpen;
        timeToOpen = marketOpen - istTime;
      } else {
        // After market closes today
        nextOpen = new Date(marketOpen);
        nextOpen.setDate(nextOpen.getDate() + 1);
        timeToOpen = nextOpen - istTime;
      }

      nextClose = new Date(marketClose);
      if (istTime > marketClose) {
        nextClose.setDate(nextClose.getDate() + 1);
      }
      timeToClose = nextClose - istTime;
    }

    setMarketStatus({
      isOpen,
      nextOpen,
      nextClose,
      timeToOpen,
      timeToClose,
    });
  }, []);

  // Update market status every minute
  useEffect(() => {
    calculateMarketStatus();
    const interval = setInterval(calculateMarketStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [calculateMarketStatus]);

  // Get real-time symbol details for price updates
  const allActiveOrders = useMemo(() => {
    return Object.values(chartOrders).flat();
  }, [chartOrders]);

  const symbolActiveOrder = useSymbolDetails(allActiveOrders, "order");

  // Fetch active orders for a specific symbol
  const refreshOpenChartOrders = useCallback(async () => {
    const effectiveCount = isMobile ? mobileChartCount : chartCount;
    const openSymbols = (chartSymbols || [])
      .slice(0, effectiveCount)
      .filter(Boolean);
    if (openSymbols.length === 0) return;

    try {
      const result = await asyncGetOrderListActive({
        AutoOrder: 0,
        indentifier: "",
        Pl: 0,
        CategoryId: 0,
      });

      const list = Array.isArray(result?.data?.result)
        ? result.data.result
        : [];
      const byIdentifier = {};
      openSymbols.forEach((s) => {
        byIdentifier[s] = [];
      });

      list.forEach((order) => {
        const id = order?.identifier;
        if (id && byIdentifier[id]) {
          byIdentifier[id].push(order);
        }
      });

      setChartOrders(byIdentifier);
    } catch (err) {
      handleCatchErrors(err, navigate);
      // Clear orders only for open charts to keep UI consistent.
      const effectiveCount = isMobile ? mobileChartCount : chartCount;
      const openSymbols = (chartSymbols || [])
        .slice(0, effectiveCount)
        .filter(Boolean);
      const cleared = {};
      openSymbols.forEach((s) => {
        cleared[s] = [];
      });
      setChartOrders(cleared);
    }
  }, [chartSymbols, isMobile, mobileChartCount, chartCount, navigate]);

  // Fetch + poll orders ONLY when user explicitly opens Orders UI.
  // This prevents unnecessary background API calls on default chart page load.
  useEffect(() => {
    const shouldPollOrders = showOrders || orderDialogState?.open;
    if (!shouldPollOrders) {
      return;
    }

    refreshOpenChartOrders();
    const interval = setInterval(refreshOpenChartOrders, 30000);
    return () => clearInterval(interval);
  }, [refreshOpenChartOrders, showOrders, orderDialogState?.open]);

  // Handle opening order details dialog
  const handleOpenOrderDetails = useCallback(
    (symbol) => {
      const orders = chartOrders[symbol] || [];
      if (orders.length > 0) {
        setOrderDialogState({
          open: true,
          orderData: orders[0],
          symbol: symbol,
        });
      }
    },
    [chartOrders],
  );

  // Handle closing order details dialog
  const handleCloseOrderDialog = useCallback(() => {
    setOrderDialogState((prev) => {
      const symbol = prev.symbol;
      // Refresh orders after dialog closes
      if (symbol) {
        refreshOpenChartOrders();
      }
      return {
        open: false,
        orderData: null,
        symbol: null,
      };
    });
  }, [refreshOpenChartOrders]);

  // Only show error dialog if the main/first chart fails (critical error)
  // Other charts can fail individually without blocking the entire page
  // Don't show error if chart is still loading (give it time to initialize)
  if (error && !isLoading) {
    return (
      <div className="chart-page-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Chart Loading Error</h3>
          <p>Unable to load chart data. This might be due to:</p>
          <ul>
            <li>Network connection issues</li>
            <li>Server temporarily unavailable</li>
            <li>Invalid symbol or data</li>
          </ul>
          <div className="error-actions">
            <button onClick={handleRetry} className="retry-btn primary">
              🔄 Retry Loading
            </button>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn secondary"
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-page symbol-dropdown">
      <div
        className={`chart-page-content symbol-dropdown ${
          showOrders ? "right-panel-open" : ""
        }`}
      >
        <div
          className={`main-layout-container ${chartLayout} symbol-dropdown chart-count-${chartCount} ${
            shouldShowOptionChain || shouldShowLeftSlidePanel
              ? "with-sidebar"
              : ""
          }`}
        >
          {/* Left Sidebar Header */}
          <div className="left-sidebar-header">
            {/* Chart Controls */}
            {!isMobile && (
              <div className="chart-controls-section">
                <div className="control-group">
                  <button
                    className={`control-btn ${
                      showOptionChainPopup ||
                      shouldShowOptionChain ||
                      shouldShowLeftSlidePanel
                        ? "active"
                        : ""
                    }`}
                    onClick={handleOptionChainToggle}
                    title="Options Chain"
                  >
                    <IconRegistry name="bar-chart" />
                    <span className="control-tooltip">Options Chain</span>
                  </button>
                  <button
                    className={`control-btn ${showOrders ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowOrders(true);
                    }}
                    title="Active Strategies"
                  >
                    <IconRegistry name="timeline" />
                    <span className="control-tooltip">Active Strategies</span>
                  </button>
                  <button
                    className="control-btn"
                    onClick={handleOpenATMCEPE}
                    title="Open ATM CE + PE"
                  >
                    <IconRegistry name="timeline" />
                    <span className="control-tooltip">ATM CE+PE</span>
                  </button>
                  {/* <button
                    className={`control-btn ${showTradingBox ? "active" : ""}`}
                    onClick={handleTradingBoxToggle}
                    title="Trade Box"
                  >
                    <IconRegistry name="swap-horiz" />
                    <span className="control-tooltip">Trade Box</span>
                  </button> */}
                </div>

                <div className="chart-count-section">
                  <button
                    className="count-btn"
                    onClick={addChart}
                    disabled={chartCount >= 3}
                    title="Add Chart"
                  >
                    +
                  </button>
                  <span className="count-display">{chartCount}/3</span>
                  <button
                    className="count-btn"
                    onClick={removeChart}
                    disabled={chartCount <= 1}
                    title="Remove Chart"
                  >
                    −
                  </button>
                </div>
              </div>
            )}
          </div>

          {shouldShowOptionChain && (
            <div className="option-chain-section">
              <ChartOptionChain
                onNavigateToChart={handleOptionChainChartNavigation}
                shouldOpenATMCEPE={shouldOpenATMCEPE}
                onReceiveATMCEPE={handleReceiveATMCEPE}
                currentSymbol={chartSymbols[0] || symbol}
                onClosePopup={handleCloseOptionChainPopup}
                isSymbolAlreadyOpen={isSymbolAlreadyOpen}
              />
            </div>
          )}

          {/* Hidden ChartOptionChain for ATM CE+PE when option chain is not visible */}
          {!shouldShowOptionChain &&
            !shouldShowLeftSlidePanel &&
            !showOptionChainPopup &&
            shouldOpenATMCEPE && (
              <div style={{ display: "none" }}>
                <ChartOptionChain
                  onNavigateToChart={handleOptionChainChartNavigation}
                  shouldOpenATMCEPE={shouldOpenATMCEPE}
                  onReceiveATMCEPE={handleReceiveATMCEPE}
                  currentSymbol={chartSymbols[0] || symbol}
                  onClosePopup={handleCloseOptionChainPopup}
                  isSymbolAlreadyOpen={isSymbolAlreadyOpen}
                />
              </div>
            )}

          {/* Left Slide Panel for Option Chain */}
          {shouldShowLeftSlidePanel && (
            <div className="left-slide-panel">
              <div className="slide-panel-header">
                <div className="panel-title">
                  {/* <span className="panel-icon">🔗</span> */}
                  <span>Options Chain</span>
                </div>
                <button
                  className="panel-close-btn"
                  onClick={() => setShowLeftSlidePanel(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="slide-panel-content">
                <ChartOptionChain
                  onNavigateToChart={handleOptionChainChartNavigation}
                  shouldOpenATMCEPE={shouldOpenATMCEPE}
                  onReceiveATMCEPE={handleReceiveATMCEPE}
                  currentSymbol={chartSymbols[0] || symbol}
                  onClosePopup={handleCloseOptionChainPopup}
                  isSymbolAlreadyOpen={isSymbolAlreadyOpen}
                />
              </div>
            </div>
          )}

          {/* Right Slide Panel for Active Strategies */}
          {showOrders && (
            <div className="right-slide-panel">
              <div className="slide-panel-header">
                <div className="panel-title">
                  {/* <span className="panel-icon">📋</span> */}
                  <span>Active Strategies</span>
                </div>
                <button
                  className="panel-close-btn"
                  onClick={() => setShowOrders(false)}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="slide-panel-content">
                <ActiveStrategies />
              </div>
            </div>
          )}

          <div className="charts-section">
            <div
              className={`charts-wrapper chart-count-${effectiveChartCount} ${chartLayout} symbol-dropdown`}
              style={{
                width: `${
                  effectiveChartCount === 1 &&
                  (showOptionChainPopup || showLeftSlidePanel)
                    ? "91"
                    : effectiveChartCount >= 2
                      ? "91"
                      : "100"
                }% !important`,
                height: "100% !important",
                gap: "0px !important",
                padding: "0px !important",
              }}
            >
              {Array.from(
                { length: Math.min(effectiveChartCount, isMobile ? 2 : 3) },
                (_, index) => (
                  <div
                    key={index}
                    className="chart-item"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      overflow: isMobile ? "visible" : "hidden",
                      overflowY: isMobile ? "auto" : undefined,
                      background: "transparent",
                    }}
                  >
                    <>
                      <div
                        style={{
                          position: "relative",
                          flex: 1,
                          minHeight: "300px",
                          width: "100%",
                        }}
                      >
                        <div
                          ref={
                            index === 0
                              ? chartContainerRef
                              : index === 1
                                ? chartContainer2Ref
                                : index === 2
                                  ? chart3Ref
                                  : index === 3
                                    ? chart4Ref
                                    : null
                          }
                          className="chart-container symbol-dropdown"
                          data-chart-index={index}
                          id={`chart-container-${index}`}
                          style={{
                            flex: 1,
                            minHeight: "300px",
                            width: "100%",
                            background: "transparent",
                            position: "relative",
                          }}
                        >
                          {/* Chart Toolbar Overlay - Hidden */}
                          {false &&
                            ((index === 0 && isReady) ||
                              (index === 1 && isReady2) ||
                              (index === 2 && isReady3) ||
                              (index === 3 && isReady4)) &&
                            (() => {
                              const currentWidget =
                                index === 0
                                  ? widget
                                  : index === 1
                                    ? widget2
                                    : index === 2
                                      ? widget3
                                      : widget4;
                              return (
                                <div className="chart-toolbar-overlay">
                                  <button
                                    className="quick-action-btn"
                                    onClick={() => {
                                      // Add RSI indicator
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Relative Strength Index",
                                            false,
                                            false,
                                            [14],
                                          );
                                      }
                                    }}
                                    title="Add RSI"
                                  >
                                    📊 RSI
                                  </button>
                                  <button
                                    className="quick-action-btn"
                                    onClick={() => {
                                      // Add MACD indicator
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "MACD",
                                            false,
                                            false,
                                            [12, 26, 9],
                                          );
                                      }
                                    }}
                                    title="Add MACD"
                                  >
                                    📈 MACD
                                  </button>
                                  <button
                                    className="quick-action-btn"
                                    onClick={() => {
                                      // Add Bollinger Bands
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Bollinger Bands",
                                            false,
                                            false,
                                            [20, 2],
                                          );
                                      }
                                    }}
                                    title="Add Bollinger Bands"
                                  >
                                    📉 BB
                                  </button>
                                  <button
                                    className="quick-action-btn"
                                    onClick={() => {
                                      // Add Moving Average
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Moving Average",
                                            false,
                                            false,
                                            [20],
                                          );
                                      }
                                    }}
                                    title="Add MA"
                                  >
                                    📊 MA
                                  </button>
                                </div>
                              );
                            })()}

                          {/* Chart Indicators Panel - Hidden */}
                          {false &&
                            ((index === 0 && isReady) ||
                              (index === 1 && isReady2) ||
                              (index === 2 && isReady3) ||
                              (index === 3 && isReady4)) &&
                            (() => {
                              const currentWidget =
                                index === 0
                                  ? widget
                                  : index === 1
                                    ? widget2
                                    : index === 2
                                      ? widget3
                                      : widget4;
                              return (
                                <div className="chart-indicators-panel">
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Relative Strength Index",
                                            false,
                                            false,
                                            [14],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📊</span>
                                    <span>RSI</span>
                                  </div>
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "MACD",
                                            false,
                                            false,
                                            [12, 26, 9],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📈</span>
                                    <span>MACD</span>
                                  </div>
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Bollinger Bands",
                                            false,
                                            false,
                                            [20, 2],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📉</span>
                                    <span>Bollinger</span>
                                  </div>
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Moving Average",
                                            false,
                                            false,
                                            [20],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📊</span>
                                    <span>MA</span>
                                  </div>
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Stochastic",
                                            false,
                                            false,
                                            [14, 3, 3],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📊</span>
                                    <span>Stochastic</span>
                                  </div>
                                  <div
                                    className="indicator-item"
                                    onClick={() => {
                                      if (
                                        currentWidget &&
                                        currentWidget.chart
                                      ) {
                                        currentWidget
                                          .chart()
                                          .createStudy(
                                            "Average True Range",
                                            false,
                                            false,
                                            [14],
                                          );
                                      }
                                    }}
                                  >
                                    <span className="indicator-icon">📊</span>
                                    <span>ATR</span>
                                  </div>
                                </div>
                              );
                            })()}
                        </div>
                      </div>

                      {/* Chart Header Below Chart */}
                      {(() => {
                        const currentSymbol = chartSymbols[index] || "";

                        const ordersForSymbol = currentSymbol
                          ? chartOrders[currentSymbol] || []
                          : [];
                        const hasOrders = ordersForSymbol.length > 0;

                        // Calculate total P&L if orders exist
                        let totalPL = 0;
                        let isProfit = false;

                        if (hasOrders) {
                          ordersForSymbol.forEach((order) => {
                            const realTimeData =
                              symbolActiveOrder?.[order?.identifier];
                            let pl = 0;
                            if (realTimeData) {
                              const currentPrice =
                                realTimeData?.lastBuyPrice ||
                                realTimeData?.lastTradedPrice ||
                                0;
                              const entryPrice =
                                realTimeData?.entryPrice ||
                                order?.entryPrice ||
                                0;
                              const quantity =
                                realTimeData?.quantity || order?.quantity || 0;
                              if (order?.orderType === 1) {
                                pl = (currentPrice - entryPrice) * quantity;
                              } else if (order?.orderType === 2) {
                                pl = (entryPrice - currentPrice) * quantity;
                              }
                            } else {
                              const currentPrice =
                                order?.lastBuyPrice ||
                                order?.lastTradedPrice ||
                                order?.currentPrice ||
                                order?.entryPrice ||
                                0;
                              const entryPrice = order?.entryPrice || 0;
                              const quantity = order?.quantity || 0;
                              if (order?.orderType === 1) {
                                pl = (currentPrice - entryPrice) * quantity;
                              } else if (order?.orderType === 2) {
                                pl = (entryPrice - currentPrice) * quantity;
                              }
                            }
                            totalPL += pl;
                          });
                          isProfit = totalPL >= 0;
                        }

                        return (
                          <div
                            className="chart-header"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: isMobile ? "6px 8px" : "6px 10px",
                              background: "var(--card_box_bg, #ffffff)",
                              borderTop: `1px solid var(--border-color, #e0e0e0)`,
                              minHeight: isMobile ? "36px" : "40px",
                              gap: isMobile ? "6px" : "8px",
                              flexWrap: "wrap",
                              width: "100%",
                              overflow: "visible",
                              color: "var(--text-color-primary, #172b4c)",
                            }}
                          >
                            <div
                              className="chart-header-content-wrapper"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: isMobile ? "6px" : "8px",
                                flex: "1 1 0%",
                                minWidth: "0px",
                                flexWrap: "wrap",
                              }}
                            >
                              {/* Stock Selector - Always visible at the start */}
                              <div
                                className="chart-stock-selector-wrapper"
                                ref={(el) => {
                                  if (el) {
                                    stockSelectorRefs.current[index] = el;
                                    if (!stockSelectorState[index]) {
                                      initializeStockSelector(index);
                                    }
                                  }
                                }}
                                style={{
                                  position: "relative",
                                  flex: "0 0 auto",
                                  width: "auto",
                                  zIndex: 10,
                                }}
                              >
                                <div className="chart-stock-selector-main">
                                  {/* Icon Button - Click to open stock list */}
                                  <button
                                    type="button"
                                    className="chart-stock-selector-icon-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Lazy-load categories + watchlists only when user opens selector
                                      ensureSymbolCatalogLoaded();
                                      const isOpen =
                                        stockSelectorState[index]
                                          ?.isSearchOpen || false;
                                      updateStockSelectorState(index, {
                                        isSearchOpen: !isOpen,
                                        searchInput: "", // Clear search input
                                      });
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      padding: "4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: "0",
                                      color:
                                        "var(--text-color-primary, #172b4c)",
                                      borderRadius: "4px",
                                      transition: "all 0.2s ease",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--box-hover, #f3f3f3)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                    }}
                                    title="Stock List"
                                  >
                                    <IconRegistry
                                      name="search"
                                      size={18}
                                      style={{
                                        color:
                                          "var(--text-color-primary, #172b4c)",
                                      }}
                                    />
                                  </button>
                                </div>

                                {/* Stock List Dropdown */}
                                {stockSelectorState[index]?.isSearchOpen &&
                                  (() => {
                                    const filteredStocks =
                                      getFilteredStocks(index);
                                    const stockCount = filteredStocks.length;
                                    const closeButtonHeight = 32; // Close button height at top
                                    // Search input height - removed for CHAIN tab
                                    const searchInputHeight = 0;
                                    // Calculate tabs height based on number of tabs (2 tabs per row, 36px per row)
                                    // Use fixed height to prevent box shaking when tabs change
                                    const totalTabs =
                                      symbolCategoryList.length + 1; // Always include CHAIN tab in calculation
                                    const tabsRows = Math.ceil(totalTabs / 2); // 2 tabs per row
                                    const tabRowHeight = isMobile ? 32 : 36; // Smaller tabs on mobile
                                    const fixedTabsHeight =
                                      tabsRows * tabRowHeight +
                                      (isMobile ? 6 : 8); // Fixed height to prevent shaking
                                    const tabsHeight =
                                      symbolCategoryList.length > 0 ||
                                      selectedSegment[index] === "OPTIONS CHAIN"
                                        ? fixedTabsHeight
                                        : 0;
                                    const itemHeight =
                                      selectedSegment[index] === "OPTIONS CHAIN"
                                        ? 60
                                        : 36; // Height per stock item (60px for CHAIN tab, 36px for others)
                                    const minListHeight = 60; // Reduced minimum for small lists
                                    // Reduce max height for CHAIN tab to make card smaller
                                    const maxListHeight =
                                      selectedSegment[index] === "OPTIONS CHAIN"
                                        ? isMobile
                                          ? 200
                                          : 250 // Smaller for CHAIN tab
                                        : isMobile
                                          ? 250
                                          : 300; // Normal for other tabs

                                    // Calculate list height based on actual stock count
                                    let listHeight;
                                    if (stockCount === 0) {
                                      listHeight = minListHeight;
                                    } else {
                                      // Use actual stock count - no artificial limit
                                      const calculatedHeight =
                                        stockCount * itemHeight;
                                      listHeight = Math.min(
                                        Math.max(
                                          calculatedHeight,
                                          minListHeight,
                                        ),
                                        maxListHeight,
                                      );
                                    }

                                    // Total popup height = close button + search input + tabs + list
                                    const totalHeight =
                                      closeButtonHeight +
                                      searchInputHeight +
                                      tabsHeight +
                                      listHeight;

                                    return (
                                      <div
                                        className="chart-stock-selector-popup"
                                        style={{
                                          position: "fixed",
                                          top: `${
                                            stockSelectorState[index]
                                              ?.popupPosition?.top || 0
                                          }px`,
                                          left: `${
                                            stockSelectorState[index]
                                              ?.popupPosition?.left || 0
                                          }px`,
                                          width: `${Math.max(
                                            stockSelectorState[index]
                                              ?.popupPosition?.width || 240,
                                            220,
                                          )}px`,
                                          maxWidth: "280px",
                                          minWidth: "220px",
                                          height: `${totalHeight}px`,
                                          minHeight: `${
                                            closeButtonHeight +
                                            searchInputHeight +
                                            tabsHeight +
                                            60
                                          }px`,
                                          maxHeight: `${
                                            closeButtonHeight +
                                            searchInputHeight +
                                            tabsHeight +
                                            maxListHeight
                                          }px`,
                                          overflow: "hidden",
                                          zIndex: 99999,
                                          background:
                                            "var(--card_box_bg, #ffffff)",
                                          border: `1px solid var(--border-color, #e0e0e0)`,
                                          borderRadius: "6px",
                                          boxShadow:
                                            "0 -4px 12px rgba(0, 0, 0, 0.15)",
                                          bottom: "auto",
                                          display: "flex",
                                          flexDirection: "column",
                                          transition: "none", // Prevent box shaking
                                          willChange: "auto", // Optimize rendering
                                        }}
                                      >
                                        {/* Close Button at Top */}
                                        <div
                                          style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            padding: "6px 10px",
                                            borderBottom: `1px solid #28B4CA`,
                                            background: "#E8FAFD",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: "12px",
                                              fontWeight: "500",
                                              color: "#2C3131",
                                            }}
                                          >
                                            Select Symbol
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              updateStockSelectorState(index, {
                                                isSearchOpen: false,
                                                searchInput: "",
                                              });
                                            }}
                                            style={{
                                              background:
                                                "rgba(var(--color-danger-rgb, 246, 78, 96), 0.1)",
                                              border: `1px solid rgba(var(--color-danger-rgb, 246, 78, 96), 0.3)`,
                                              cursor: "pointer",
                                              padding: "4px 8px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              gap: "4px",
                                              color:
                                                "var(--color-danger, #f64e60)",
                                              borderRadius: "4px",
                                              transition: "all 0.2s ease",
                                              fontSize: "12px",
                                              fontWeight: "500",
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.background =
                                                "var(--color-danger, #f64e60)";
                                              e.currentTarget.style.color =
                                                "var(--color-text, #fff)";
                                              e.currentTarget.style.borderColor =
                                                "var(--color-danger, #f64e60)";
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.background =
                                                "rgba(var(--color-danger-rgb, 246, 78, 96), 0.1)";
                                              e.currentTarget.style.color =
                                                "var(--color-danger, #f64e60)";
                                              e.currentTarget.style.borderColor =
                                                "rgba(var(--color-danger-rgb, 246, 78, 96), 0.3)";
                                            }}
                                            title="Close"
                                          >
                                            <IconRegistry name="x" size={16} />
                                            <span>Close</span>
                                          </button>
                                        </div>

                                        {/* Segment Tabs - Using actual categories from API */}
                                        {(symbolCategoryList.length > 0 ||
                                          selectedSegment[index] ===
                                            "OPTIONS CHAIN") && (
                                          <div
                                            className="chart-stock-segment-tabs"
                                            style={{
                                              display: "flex",
                                              flexWrap: "wrap",
                                              borderBottom: `1px solid #28B4CA`,
                                              background: "#E1E7EF",
                                              position: "sticky",
                                              top: 0,
                                              zIndex: 10,
                                              height: (() => {
                                                const totalTabs =
                                                  symbolCategoryList.length + 1;
                                                const tabsRows = Math.ceil(
                                                  totalTabs / 2,
                                                );
                                                const tabRowHeight = isMobile
                                                  ? 32
                                                  : 36;
                                                return `${
                                                  tabsRows * tabRowHeight +
                                                  (isMobile ? 6 : 8)
                                                }px`;
                                              })(),
                                              minHeight: isMobile
                                                ? "32px"
                                                : "36px",
                                              alignItems: "stretch",
                                              justifyContent: "flex-start",
                                              alignContent: "flex-start",
                                              gap: isMobile ? "1px" : "2px",
                                              padding: isMobile
                                                ? "3px 2px"
                                                : "4px 2px",
                                              transition: "none", // Prevent layout shift
                                            }}
                                          >
                                            {symbolCategoryList.map(
                                              (category) => {
                                                const categoryName =
                                                  category?.symbolCategoryName;
                                                const isActive =
                                                  (selectedSegment[index] ||
                                                    symbolCategoryList[0]
                                                      ?.symbolCategoryName) ===
                                                  categoryName;
                                                const hasStocks =
                                                  stocksBySegment[
                                                    categoryName
                                                  ] &&
                                                  stocksBySegment[categoryName]
                                                    .length > 0;
                                                const stockCount =
                                                  stocksBySegment[categoryName]
                                                    ?.length || 0;

                                                return (
                                                  <button
                                                    key={categoryName}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      setSelectedSegment(
                                                        (prev) => ({
                                                          ...prev,
                                                          [index]: categoryName,
                                                        }),
                                                      );
                                                      updateStockSelectorState(
                                                        index,
                                                        {
                                                          searchInput: "",
                                                        },
                                                      );
                                                    }}
                                                    style={{
                                                      flex: "0 0 auto",
                                                      minWidth: isMobile
                                                        ? "50px"
                                                        : "60px",
                                                      width: "calc(50% - 1px)",
                                                      padding: isMobile
                                                        ? "4px 6px"
                                                        : "6px 8px",
                                                      whiteSpace: "nowrap",
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      fontSize: isMobile
                                                        ? "9px"
                                                        : "10px",
                                                      background: isActive
                                                        ? "#28B4CA"
                                                        : "transparent",
                                                      color: isActive
                                                        ? "var(--color-text, #fff)"
                                                        : "var(--text-color-secondary, #7e8299)",
                                                      border: "none",
                                                      borderBottom: isActive
                                                        ? `2px solid #28B4CA`
                                                        : "2px solid transparent",
                                                      cursor: hasStocks
                                                        ? "pointer"
                                                        : "not-allowed",
                                                      fontSize: "10px",
                                                      fontWeight: isActive
                                                        ? "600"
                                                        : "400",
                                                      transition:
                                                        "all 0.2s ease",
                                                      opacity: hasStocks
                                                        ? 1
                                                        : 0.5,
                                                      lineHeight: "1.2",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (
                                                        !isActive &&
                                                        hasStocks
                                                      ) {
                                                        e.currentTarget.style.background =
                                                          "var(--box-hover, #f3f3f3)";
                                                      }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (!isActive) {
                                                        e.currentTarget.style.background =
                                                          "transparent";
                                                      }
                                                    }}
                                                    disabled={!hasStocks}
                                                  >
                                                    {categoryName}
                                                    {hasStocks && (
                                                      <span
                                                        style={{
                                                          marginLeft: "3px",
                                                          fontSize: "9px",
                                                          opacity: 0.7,
                                                        }}
                                                      >
                                                        ({stockCount})
                                                      </span>
                                                    )}
                                                  </button>
                                                );
                                              },
                                            )}

                                            {/* CHAIN Tab */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setSelectedSegment((prev) => ({
                                                  ...prev,
                                                  [index]: "OPTIONS CHAIN",
                                                }));
                                                updateStockSelectorState(
                                                  index,
                                                  {
                                                    searchInput: "",
                                                  },
                                                );
                                                // Fetch option strikes ONLY for this chart's underlying (3 calls max)
                                                if (!optionsChainLoading) {
                                                  fetchOptionsChainForChartIndex(
                                                    index,
                                                  );
                                                }
                                              }}
                                              style={{
                                                flex: "0 0 auto",
                                                minWidth: isMobile
                                                  ? "50px"
                                                  : "60px",
                                                width: "calc(50% - 1px)",
                                                padding: isMobile
                                                  ? "4px 6px"
                                                  : "6px 8px",
                                                whiteSpace: "nowrap",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: isMobile
                                                  ? "9px"
                                                  : "10px",
                                                background:
                                                  selectedSegment[index] ===
                                                  "OPTIONS CHAIN"
                                                    ? "var(--color-primary, #6993ff)"
                                                    : "transparent",
                                                color:
                                                  selectedSegment[index] ===
                                                  "OPTIONS CHAIN"
                                                    ? "var(--color-text, #fff)"
                                                    : "var(--text-color-secondary, #7e8299)",
                                                border: "none",
                                                borderBottom:
                                                  selectedSegment[index] ===
                                                  "OPTIONS CHAIN"
                                                    ? `2px solid var(--color-primary, #6993ff)`
                                                    : "2px solid transparent",
                                                cursor: "pointer",
                                                fontSize: "10px",
                                                fontWeight:
                                                  selectedSegment[index] ===
                                                  "OPTIONS CHAIN"
                                                    ? "600"
                                                    : "400",
                                                transition: "all 0.2s ease",
                                                lineHeight: "1.2",
                                              }}
                                              onMouseEnter={(e) => {
                                                if (
                                                  selectedSegment[index] !==
                                                  "OPTIONS CHAIN"
                                                ) {
                                                  e.currentTarget.style.background =
                                                    "var(--box-hover, #f3f3f3)";
                                                }
                                              }}
                                              onMouseLeave={(e) => {
                                                if (
                                                  selectedSegment[index] !==
                                                  "OPTIONS CHAIN"
                                                ) {
                                                  e.currentTarget.style.background =
                                                    "transparent";
                                                }
                                              }}
                                            >
                                              CHAIN
                                              {optionsChainData.length > 0 &&
                                                optionsChainMeta?.baseSymbol && (
                                                  <span
                                                    style={{
                                                      marginLeft: "3px",
                                                      fontSize: "9px",
                                                      opacity: 0.7,
                                                    }}
                                                  >
                                                    ({optionsChainData.length})
                                                  </span>
                                                )}
                                            </button>
                                          </div>
                                        )}

                                        {/* Stock List - Dynamic height based on stock count */}
                                        <div
                                          className="chart-stock-popup-list"
                                          style={{
                                            height: `${listHeight}px`,
                                            overflowY:
                                              stockCount > 0
                                                ? "auto"
                                                : "hidden",
                                            background:
                                              "var(--card_box_bg, #ffffff)",
                                          }}
                                        >
                                          {categoryLoading ||
                                          (selectedSegment[index] ===
                                            "OPTIONS CHAIN" &&
                                            optionsChainLoading) ? (
                                            <div
                                              style={{
                                                padding: "20px",
                                                textAlign: "center",
                                                color:
                                                  "var(--text-color-secondary, #7e8299)",
                                              }}
                                            >
                                              Loading{" "}
                                              {selectedSegment[index] ===
                                              "OPTIONS CHAIN"
                                                ? "options chain data"
                                                : "stocks"}
                                              ...
                                            </div>
                                          ) : getFilteredStocks(index).length >
                                            0 ? (
                                            getFilteredStocks(index).map(
                                              (stock, stockIndex) => {
                                                const isCurrent =
                                                  stock?.identifier ===
                                                    chartSymbols[index] ||
                                                  stock?.product ===
                                                    chartSymbols[index];
                                                const isOptionsChain =
                                                  selectedSegment[index] ===
                                                  "OPTIONS CHAIN";

                                                return (
                                                  <div
                                                    key={`${stock?.identifier}-${stockIndex}`}
                                                    className={`chart-stock-popup-item ${
                                                      isCurrent ? "active" : ""
                                                    }`}
                                                    onClick={() =>
                                                      handleStockSelect(
                                                        index,
                                                        stock,
                                                      )
                                                    }
                                                    style={{
                                                      padding: isOptionsChain
                                                        ? "8px 10px"
                                                        : "6px 10px",
                                                      cursor: "pointer",
                                                      background: isCurrent
                                                        ? "#E8FAFD"
                                                        : "transparent",
                                                      borderBottom: `1px solid #28B4CA`,
                                                      color: isCurrent
                                                        ? "#28B4CA"
                                                        : "var(--text-color-primary, #172b4c)",
                                                      fontSize: "12px",
                                                      transition:
                                                        "all 0.2s ease",
                                                      minHeight: isOptionsChain
                                                        ? "60px"
                                                        : "36px",
                                                      display: "flex",
                                                      alignItems: isOptionsChain
                                                        ? "flex-start"
                                                        : "center",
                                                      justifyContent:
                                                        "space-between",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (!isCurrent) {
                                                        e.currentTarget.style.background =
                                                          "var(--box-hover, #f3f3f3)";
                                                      }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (!isCurrent) {
                                                        e.currentTarget.style.background =
                                                          "transparent";
                                                      }
                                                    }}
                                                  >
                                                    <div
                                                      className="chart-stock-popup-symbol"
                                                      style={{
                                                        fontWeight: isCurrent
                                                          ? "600"
                                                          : "400",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "4px",
                                                        flex: 1,
                                                      }}
                                                    >
                                                      {isOptionsChain ? (
                                                        <>
                                                          {/* CE Option - First Line */}
                                                          {stock?.ce && (
                                                            <div
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStockSelect(
                                                                  index,
                                                                  {
                                                                    ...stock,
                                                                    identifier:
                                                                      stock.ce
                                                                        .identifier,
                                                                    optionType:
                                                                      "CE",
                                                                  },
                                                                );
                                                              }}
                                                              style={{
                                                                display: "flex",
                                                                alignItems:
                                                                  "center",
                                                                gap: "8px",
                                                                cursor:
                                                                  "pointer",
                                                                padding:
                                                                  "2px 0",
                                                              }}
                                                            >
                                                              <span
                                                                style={{
                                                                  fontWeight:
                                                                    "500",
                                                                }}
                                                              >
                                                                {stock?.stockName ||
                                                                  stock?.product}
                                                              </span>
                                                              <span
                                                                style={{
                                                                  opacity: 0.8,
                                                                  fontSize:
                                                                    "11px",
                                                                }}
                                                              >
                                                                {
                                                                  stock?.strikePrice
                                                                }
                                                              </span>
                                                              <span
                                                                style={{
                                                                  padding:
                                                                    "2px 6px",
                                                                  borderRadius:
                                                                    "3px",
                                                                  fontSize:
                                                                    "10px",
                                                                  fontWeight:
                                                                    "600",
                                                                  background:
                                                                    "rgba(var(--color-success-rgb, 27, 197, 189), 0.1)",
                                                                  color:
                                                                    "var(--color-success, #1bc5bd)",
                                                                  transition:
                                                                    "all 0.2s ease",
                                                                }}
                                                              >
                                                                CE
                                                              </span>
                                                            </div>
                                                          )}

                                                          {/* PE Option - Second Line */}
                                                          {stock?.pe && (
                                                            <div
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStockSelect(
                                                                  index,
                                                                  {
                                                                    ...stock,
                                                                    identifier:
                                                                      stock.pe
                                                                        .identifier,
                                                                    optionType:
                                                                      "PE",
                                                                  },
                                                                );
                                                              }}
                                                              style={{
                                                                display: "flex",
                                                                alignItems:
                                                                  "center",
                                                                gap: "8px",
                                                                cursor:
                                                                  "pointer",
                                                                padding:
                                                                  "2px 0",
                                                              }}
                                                            >
                                                              <span
                                                                style={{
                                                                  fontWeight:
                                                                    "500",
                                                                }}
                                                              >
                                                                {stock?.stockName ||
                                                                  stock?.product}
                                                              </span>
                                                              <span
                                                                style={{
                                                                  opacity: 0.8,
                                                                  fontSize:
                                                                    "11px",
                                                                }}
                                                              >
                                                                {
                                                                  stock?.strikePrice
                                                                }
                                                              </span>
                                                              <span
                                                                style={{
                                                                  padding:
                                                                    "2px 6px",
                                                                  borderRadius:
                                                                    "3px",
                                                                  fontSize:
                                                                    "10px",
                                                                  fontWeight:
                                                                    "600",
                                                                  background:
                                                                    "rgba(var(--color-danger-rgb, 246, 78, 96), 0.1)",
                                                                  color:
                                                                    "var(--color-danger, #f64e60)",
                                                                  transition:
                                                                    "all 0.2s ease",
                                                                }}
                                                              >
                                                                PE
                                                              </span>
                                                            </div>
                                                          )}
                                                        </>
                                                      ) : (
                                                        // Show correct stock name - prioritize identifier over product to avoid "EQUITY" issue
                                                        stock?.identifier ||
                                                        stock?.identifierName ||
                                                        stock?.symbolName ||
                                                        (stock?.product &&
                                                        stock?.product !==
                                                          "EQUITY"
                                                          ? stock.product
                                                          : null) ||
                                                        stock?.product ||
                                                        "Unknown"
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              },
                                            )
                                          ) : (
                                            <div
                                              className="chart-stock-popup-empty"
                                              style={{
                                                padding: "30px 20px",
                                                textAlign: "center",
                                                color:
                                                  "var(--text-color-secondary, #7e8299)",
                                              }}
                                            >
                                              <IconRegistry
                                                name="search"
                                                size={32}
                                              />
                                              <p
                                                style={{
                                                  margin: "12px 0 6px",
                                                  fontSize: "14px",
                                                  fontWeight: "500",
                                                }}
                                              >
                                                No stocks found
                                              </p>
                                              <span
                                                style={{
                                                  fontSize: "12px",
                                                  opacity: 0.8,
                                                }}
                                              >
                                                No stocks available in this
                                                segment
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()}
                              </div>

                              {/* P&L Display with Exit Button - Always visible */}
                              <div
                                style={{
                                  background: hasOrders
                                    ? isProfit
                                      ? "rgba(var(--color-success-rgb, 27, 197, 189), 0.15)"
                                      : "rgba(var(--color-danger-rgb, 246, 78, 96), 0.15)"
                                    : "rgba(var(--text-color-secondary-rgb, 126, 130, 153), 0.1)",
                                  color: hasOrders
                                    ? isProfit
                                      ? "var(--color-success, #1bc5bd)"
                                      : "var(--color-danger, #f64e60)"
                                    : "var(--text-color-secondary, #7e8299)",
                                  padding: isMobile ? "3px 6px" : "4px 8px",
                                  borderRadius: "4px",
                                  fontSize: isMobile ? "11px" : "12px",
                                  fontWeight: "700",
                                  border: hasOrders
                                    ? `1px solid ${
                                        isProfit
                                          ? "rgba(var(--color-success-rgb, 27, 197, 189), 0.3)"
                                          : "rgba(var(--color-danger-rgb, 246, 78, 96), 0.3)"
                                      }`
                                    : `1px solid rgba(var(--text-color-secondary-rgb, 126, 130, 153), 0.3)`,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: isMobile ? "4px" : "6px",
                                  flex: "0 0 auto",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span>
                                  P&L: {hasOrders ? (isProfit ? "+" : "") : ""}₹
                                  {totalPL.toFixed(2)}
                                </span>
                                {hasOrders && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      e.preventDefault();

                                      // Exit all orders for this symbol
                                      try {
                                        const exitPromises =
                                          ordersForSymbol.map((order) => {
                                            if (order?.orderID) {
                                              return asyncOrderExit({
                                                orderID: order.orderID,
                                              });
                                            }
                                            return Promise.resolve();
                                          });

                                        await Promise.all(exitPromises);

                                        // Close chart after exit
                                        const newSymbols = [...chartSymbols];
                                        const chartIndex = newSymbols.findIndex(
                                          (sym) => sym === currentSymbol,
                                        );

                                        if (chartIndex !== -1) {
                                          newSymbols[chartIndex] = null;
                                          const filteredSymbols =
                                            newSymbols.filter(
                                              (sym) => sym !== null,
                                            );

                                          if (filteredSymbols.length === 0) {
                                            filteredSymbols.push("");
                                          }

                                          setChartSymbols(filteredSymbols);

                                          const newCount =
                                            filteredSymbols.length;
                                          if (isMobile) {
                                            setMobileChartCount(
                                              Math.max(1, newCount),
                                            );
                                          } else {
                                            setChartCount(
                                              Math.max(1, newCount),
                                            );
                                          }

                                          if (
                                            chartIndex === 0 &&
                                            filteredSymbols[0]
                                          ) {
                                            setCurrentSymbol(
                                              filteredSymbols[0],
                                            );
                                          }
                                        }

                                        refreshOpenChartOrders();
                                      } catch (error) {
                                        handleCatchErrors(error, navigate);
                                      }
                                    }}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--color-danger, #f64e60)",
                                      cursor: "pointer",
                                      padding: "2px 4px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: isMobile ? "18px" : "20px",
                                      fontWeight: "700",
                                      borderRadius: "4px",
                                      transition: "all 0.2s ease",
                                      lineHeight: "1",
                                      gap: "3px",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "rgba(var(--color-danger-rgb, 246, 78, 96), 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                    }}
                                    title="Exit Order"
                                  >
                                    <span
                                      style={{
                                        color: "var(--color-danger, #f64e60)",
                                      }}
                                    >
                                      ×
                                    </span>
                                    <span
                                      style={{
                                        fontSize: isMobile ? "14px" : "16px",
                                        fontWeight: "500",
                                        color: "var(--color-danger, #f64e60)",
                                      }}
                                    >
                                      Exit
                                    </span>
                                  </button>
                                )}
                              </div>

                              {/* Close Button - Always visible */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();

                                  // Destroy widget based on index
                                  if (index === 0 && destroyWidget) {
                                    cleanupWidget(
                                      widget,
                                      "Widget",
                                      destroyWidget,
                                    );
                                  } else if (index === 1 && destroyWidget2) {
                                    cleanupWidget(
                                      widget2,
                                      "Widget2",
                                      destroyWidget2,
                                    );
                                  } else if (index === 2 && destroyWidget3) {
                                    cleanupWidget(
                                      widget3,
                                      "Widget3",
                                      destroyWidget3,
                                    );
                                  } else if (index === 3 && destroyWidget4) {
                                    cleanupWidget(
                                      widget4,
                                      "Widget4",
                                      destroyWidget4,
                                    );
                                  }

                                  if (isMobile) {
                                    setMobileChartCount((prev) => {
                                      const newCount = Math.max(1, prev - 1);
                                      setChartSymbols((prevSymbols) => {
                                        const newSymbols = [...prevSymbols];
                                        newSymbols.splice(index, 1);
                                        if (newSymbols.length === 0) {
                                          newSymbols.push(symbol);
                                        }
                                        return newSymbols;
                                      });
                                      return newCount;
                                    });
                                  } else {
                                    setChartCount((prev) => {
                                      const newCount = Math.max(1, prev - 1);
                                      setChartSymbols((prevSymbols) => {
                                        const newSymbols = [...prevSymbols];
                                        newSymbols.splice(index, 1);
                                        if (newSymbols.length === 0) {
                                          newSymbols.push(symbol);
                                        }
                                        return newSymbols;
                                      });
                                      return newCount;
                                    });
                                  }
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--color-danger, #f64e60)",
                                  cursor: "pointer",
                                  fontSize: isMobile ? "16px" : "18px",
                                  padding: isMobile ? "4px 6px" : "4px 8px",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  minWidth: isMobile ? "28px" : "32px",
                                  minHeight: isMobile ? "28px" : "32px",
                                  transition: "all 0.2s ease",
                                  flex: "0 0 auto",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(var(--color-danger-rgb, 246, 78, 96), 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                                title="Close Chart"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation - Clean Design with Existing Content */}
        <div className="mobile-bottom-navigation">
          {/* Options Chain Tab */}
          <div
            className={`mobile-nav-item ${showOptionChain ? "active" : ""}`}
            onClick={() =>
              handleMobilePopupOpen("optionChain", "Options Chain", "⚡")
            }
          >
            <div className="nav-icon">
              <div className="icon-bg">
                <span className="icon">⚡</span>
              </div>
            </div>
            <span className="nav-label">Options</span>
          </div>

          {/* Active Strategies Tab */}
          <div
            className={`mobile-nav-item ${showOrders ? "active" : ""}`}
            onClick={() =>
              handleMobilePopupOpen(
                "active-strategies",
                "Active Strategies",
                "📊",
              )
            }
          >
            <div className="nav-icon">
              <span className="icon">📊</span>
            </div>
            <span className="nav-label">Active</span>
          </div>

          {/* Chart Toggle Tab - Mobile Only */}
          <div className="mobile-nav-item" onClick={toggleMobileChartCount}>
            <div className="nav-icon">
              <span className="icon">📊</span>
            </div>
            <span className="nav-label">Charts</span>
            <div className="nav-value">{mobileChartCount}/2</div>
          </div>

        </div>

        {/* Chart Management Dialog */}
        {showChartDialog && (
          <div className="chart-dialog-overlay">
            <div className="chart-dialog">
              <div className="chart-dialog-header">
                <h3>Chart Management</h3>
                <button
                  className="chart-dialog-close"
                  onClick={handleCancelChartDialog}
                >
                  ×
                </button>
              </div>
              <div className="chart-dialog-content">
                <p>
                  You want to open <strong>{pendingSymbol}</strong> chart.
                </p>
                <p>What would you like to do?</p>
                {(isMobile ? mobileChartCount : chartCount) > 1 && (
                  <p className="chart-dialog-info">
                    📊 Currently open: <strong>{chartSymbols[0]}</strong> (Chart
                    1)
                    {(isMobile ? mobileChartCount : chartCount) > 1 &&
                      chartSymbols[1] &&
                      `, ${chartSymbols[1]} (Chart 2)`}
                    {!isMobile &&
                      (isMobile ? mobileChartCount : chartCount) > 2 &&
                      chartSymbols[2] &&
                      `, ${chartSymbols[2]} (Chart 3)`}
                  </p>
                )}
                {(isMobile ? mobileChartCount >= 2 : chartCount >= 3) && (
                  <p className="chart-dialog-warning">
                    ⚠️ Maximum {isMobile ? 2 : 3} charts reached. You can only
                    replace existing charts.
                  </p>
                )}
              </div>
              <div className="chart-dialog-actions">
                {isMobile && mobileChartCount === 0 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Open in Chart 1
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleOpenNewChart}
                    >
                      Open in Chart 2
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : isMobile && mobileChartCount >= 2 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Replace Chart 1 ({chartSymbols[0] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleReplaceSecondChart}
                    >
                      Replace Chart 2 ({chartSymbols[1] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : isMobile && mobileChartCount === 1 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Replace Chart 1 ({chartSymbols[0]})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleOpenNewChart}
                    >
                      Open in Chart 2
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : !isMobile && chartCount === 0 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Open in Chart 1
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleOpenNewChart}
                    >
                      Open in Chart 2
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : !isMobile && chartCount === 1 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Replace Chart 1 ({chartSymbols[0]})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleOpenNewChart}
                    >
                      Open in Chart 2
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : !isMobile && chartCount >= 3 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Replace Chart 1 ({chartSymbols[0] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleReplaceSecondChart}
                    >
                      Replace Chart 2 ({chartSymbols[1] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-tertiary"
                      onClick={handleReplaceThirdChart}
                    >
                      Replace Chart 3 ({chartSymbols[2] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : !isMobile && chartCount === 2 ? (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Replace Chart 1 ({chartSymbols[0]})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleReplaceSecondChart}
                    >
                      Replace Chart 2 ({chartSymbols[1] || "Empty"})
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-tertiary"
                      onClick={handleOpenNewChart}
                    >
                      Open in Chart 3
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-primary"
                      onClick={handleReplaceFirstChart}
                    >
                      Open in First Chart
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-secondary"
                      onClick={handleReplaceCurrentChart}
                    >
                      Replace Current Chart
                    </button>
                    <button
                      className={`chart-dialog-btn chart-dialog-btn-tertiary ${
                        (isMobile ? mobileChartCount : chartCount) >=
                        (isMobile ? 2 : 3)
                          ? "disabled"
                          : ""
                      }`}
                      onClick={handleOpenNewChart}
                      disabled={
                        (isMobile ? mobileChartCount : chartCount) >=
                        (isMobile ? 2 : 3)
                      }
                    >
                      Open New Chart{" "}
                      {(isMobile ? mobileChartCount : chartCount) >=
                      (isMobile ? 2 : 3)
                        ? "(Max Reached)"
                        : ""}
                    </button>
                    <button
                      className="chart-dialog-btn chart-dialog-btn-cancel"
                      onClick={handleCancelChartDialog}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CE/PE Option Dialog */}
        {showOptionDialog && (
          <div className="chart-dialog-overlay">
            <div className="chart-dialog option-dialog">
              <div className="chart-dialog-header">
                <h3>Option Chart Selection</h3>
                <button
                  className="chart-dialog-close"
                  onClick={handleCancelOptionDialog}
                >
                  ×
                </button>
              </div>
              <div className="chart-dialog-content">
                <p>
                  You want to open <strong>{pendingOptionData?.symbol}</strong>{" "}
                  option chart.
                </p>
                <p>What would you like to do?</p>
                {(isMobile ? mobileChartCount : chartCount) >=
                  (isMobile ? 2 : 3) && (
                  <p className="chart-dialog-warning">
                    ⚠️ Limited chart space. CE+PE may not fit if you have many
                    charts open.
                  </p>
                )}
              </div>
              <div className="chart-dialog-actions">
                {pendingOptionData?.optionData?.optionType === "PE" ? (
                  <>
                    {/* Mobile view: Show chart selection options */}
                    {isMobile ? (
                      <>
                        {mobileChartCount === 0 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(1);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 1
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 2
                            </button>
                          </>
                        ) : mobileChartCount === 1 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with PE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 2
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with PE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 2 with PE (
                              {chartSymbols[1] || "Empty"})
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Desktop view: Show chart selection options */}
                        {chartCount === 0 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(1);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 1
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 2
                            </button>
                          </>
                        ) : chartCount === 1 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with PE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const peSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = peSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open PE in Chart 2
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={handleOpenOnlyPE}
                            >
                              Open Only PE
                            </button>
                            <button
                              className={`chart-dialog-btn chart-dialog-btn-secondary ${
                                chartCount >= 3 ? "disabled" : ""
                              }`}
                              onClick={handleOpenCEAndPE}
                              disabled={chartCount >= 3}
                            >
                              Open CE + PE {chartCount >= 3 ? "(No Space)" : ""}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Mobile view: Show chart selection options */}
                    {isMobile ? (
                      <>
                        {mobileChartCount === 0 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(1);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 1
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 2
                            </button>
                          </>
                        ) : mobileChartCount === 1 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with CE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setMobileChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 2
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with CE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 2 with CE (
                              {chartSymbols[1] || "Empty"})
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Desktop view: Show chart selection options */}
                        {chartCount === 0 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(1);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 1
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 2
                            </button>
                          </>
                        ) : chartCount === 1 ? (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[0] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Replace Chart 1 with CE ({chartSymbols[0]})
                            </button>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-secondary"
                              onClick={() => {
                                if (pendingOptionData) {
                                  const ceSymbol = pendingOptionData.symbol;
                                  const newSymbols = [...chartSymbols];
                                  newSymbols[1] = ceSymbol;
                                  setChartSymbols(newSymbols);
                                  setChartCount(2);
                                  setShowOptionDialog(false);
                                  setPendingOptionData(null);
                                }
                              }}
                            >
                              Open CE in Chart 2
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="chart-dialog-btn chart-dialog-btn-primary"
                              onClick={handleOpenOnlyCE}
                            >
                              Open Only CE
                            </button>
                            <button
                              className={`chart-dialog-btn chart-dialog-btn-secondary ${
                                chartCount >= 3 ? "disabled" : ""
                              }`}
                              onClick={handleOpenCEAndPE}
                              disabled={chartCount >= 3}
                            >
                              Open CE + PE {chartCount >= 3 ? "(No Space)" : ""}
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
                <button
                  className="chart-dialog-btn chart-dialog-btn-cancel"
                  onClick={handleCancelOptionDialog}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CE+PE Sub-Dialog */}
        {showCEPESubDialog && (
          <div className="chart-dialog-overlay">
            <div className="chart-dialog option-dialog cepe-sub-dialog">
              <div className="chart-dialog-header">
                <h3>CE + PE Chart Options</h3>
                <button
                  className="chart-dialog-close"
                  onClick={() => {
                    setShowCEPESubDialog(false);
                    setPendingOptionData(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="chart-dialog-content">
                <p>
                  You want to open <strong>CE + PE</strong> for{" "}
                  <strong>{pendingOptionData?.symbol}</strong>.
                </p>
                <p>How would you like to arrange the charts?</p>
                {chartCount >= 3 && (
                  <p className="chart-dialog-warning">
                    ⚠️ Limited chart space. Some charts may be replaced.
                  </p>
                )}
              </div>
              <div className="chart-dialog-actions">
                <button
                  className="chart-dialog-btn chart-dialog-btn-primary"
                  onClick={handleOpenCEPEWithMainSymbol}
                >
                  Keep Main + Add CE+PE
                </button>
                <button
                  className="chart-dialog-btn chart-dialog-btn-secondary"
                  onClick={handleOpenOnlyCEPE}
                >
                  Replace All with CE+PE
                </button>
                <button
                  className="chart-dialog-btn chart-dialog-btn-cancel"
                  onClick={() => {
                    setShowCEPESubDialog(false);
                    setPendingOptionData(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* OptionChain Popup Modal */}
        {showOptionChainPopup && (
          <div
            className="option-chain-popup-overlay"
            onClick={(e) => {
              // Close popup when clicking on overlay (outside the popup)
              if (e.target.className === "option-chain-popup-overlay") {
                setShowOptionChainPopup(false);
                // Ensure option chain doesn't open in chart when popup is closed
                setShowOptionChain(false);
                setShowLeftSlidePanel(false);
              }
            }}
          >
            <div
              className={`option-chain-popup ${
                isMinimized ? "minimized" : ""
              } ${isMaximized ? "maximized" : ""}`}
              style={{
                top: isMaximized ? "20px" : `${popupPosition.y}px`,
                left: isMaximized ? "20px" : `${popupPosition.x}px`,
                right: isMaximized ? "20px" : "auto",
                bottom: isMaximized ? "20px" : "auto",
                width: isMaximized ? "auto" : "auto",
                height: isMaximized ? "auto" : "auto",
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {/* Popup Header */}
              <div className="popup-header">
                <div className="popup-title">
                  <span className="popup-icon">📊</span>
                  <span>Options Chain</span>
                </div>
                <div className="popup-controls">
                  <button
                    className="popup-control-btn minimize-btn"
                    onClick={handleMinimize}
                    title="Minimize"
                  >
                    −
                  </button>
                  <button
                    className="popup-control-btn maximize-btn"
                    onClick={isMaximized ? handleRestore : handleMaximize}
                    title={isMaximized ? "Restore" : "Maximize"}
                  >
                    {isMaximized ? "⧉" : "⧉"}
                  </button>
                  <button
                    className="popup-close-btn"
                    onClick={() => {
                      setShowOptionChainPopup(false);
                      // Ensure option chain doesn't open in chart when popup is closed
                      setShowOptionChain(false);
                      setShowLeftSlidePanel(false);
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Options Chain Table */}
              <div className="options-table-container">
                <ChartOptionChain
                  onNavigateToChart={handleOptionChainChartNavigation}
                  shouldOpenATMCEPE={shouldOpenATMCEPE}
                  onReceiveATMCEPE={handleReceiveATMCEPE}
                  currentSymbol={chartSymbols[0] || symbol}
                  isMultiChartMode={effectiveChartCount >= 2}
                  onClosePopup={handleCloseOptionChainPopup}
                  isSymbolAlreadyOpen={isSymbolAlreadyOpen}
                />
              </div>
            </div>
          </div>
        )}

        {/* Mobile Popup - Only show when explicitly opened */}
        {showMobilePopup && (
          <div
            className="mobile-popup-overlay"
            onClick={handleMobilePopupClose}
          >
            <div className="mobile-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-header">
                <div className="popup-title">
                  <span className="popup-icon">{mobilePopupIcon}</span>
                  <span>{mobilePopupTitle}</span>
                </div>
                <button
                  className="popup-close"
                  onClick={handleMobilePopupClose}
                >
                  ×
                </button>
              </div>
              <div className="popup-content">
                {mobilePopupType === "optionChain" && (
                  <ChartOptionChain
                    onNavigateToChart={handleOptionChainChartNavigation}
                    shouldOpenATMCEPE={shouldOpenATMCEPE}
                    onReceiveATMCEPE={handleReceiveATMCEPE}
                    currentSymbol={chartSymbols[0] || symbol}
                    isMultiChartMode={effectiveChartCount >= 2}
                    onClosePopup={handleCloseOptionChainPopup}
                    isSymbolAlreadyOpen={isSymbolAlreadyOpen}
                  />
                )}
                {mobilePopupType === "active-strategies" && (
                  <ActiveStrategies />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {showTradingBox && (
        <TradingBoxContainer
          onAllBoxesClosed={() => setShowTradingBox(false)}
          autoInitializeDefaultBox={false}
        />
      )}

      {/* Order Details Dialog */}
      {orderDialogState.open && orderDialogState.orderData && (
        <EditOrderDialog
          open={orderDialogState.open}
          handleClose={handleCloseOrderDialog}
          orderData={orderDialogState.orderData}
          defaultTab="details"
          isEditable={1}
          resetFilter={() => {}}
          symbolActiveOrder={symbolActiveOrder}
          onNavigateToChart={handleOptionChainChartNavigation}
          onOrderExit={() => {
            // Refresh orders after exit
            if (orderDialogState.symbol) {
              refreshOpenChartOrders();
            }
          }}
          hideExitButton={
            // Hide action buttons for closed or rejected orders
            (orderDialogState.orderData?.closedPrice !== undefined &&
              orderDialogState.orderData?.closedPrice !== null &&
              orderDialogState.orderData?.closedPrice !== "") ||
            orderDialogState.orderData?.orderStatus === 3 || // Closed
            orderDialogState.orderData?.orderStatus === 4 || // Rejected
            orderDialogState.orderData?.orderStatusName?.toLowerCase() ===
              "closed" ||
            orderDialogState.orderData?.orderStatusName?.toLowerCase() ===
              "rejected"
          }
        />
      )}
      {subscriptionUpgradeOpen && (
        <SubscriptionDialog
          open={subscriptionUpgradeOpen}
          handleClose={() => setSubscriptionUpgradeOpen(false)}
          message={subscriptionUpgradeMessage}
        />
      )}
    </div>
  );
};

export default ChartPage;
