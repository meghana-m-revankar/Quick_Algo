import { IconRegistry } from "#components";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import { ThemeContext } from "../../context";
import { tooltipDesign } from "#constant/index";
import Tooltip from "@mui/material/Tooltip";
import { TbListDetails } from "react-icons/tb";
import { EditOrderDialog, SubscriptionDialog, TableShimmer } from "#components";
import useSymbolDetails from "#hooks/useSymbol";
import { convertNumeric } from "#helpers";
import { HiOutlineLogout } from "react-icons/hi";
import { useGlobalServices } from "#services/global";

import { useNavigate } from "react-router-dom";
import {
  asyncGetDayOrderProfitLoss,
  asyncGetOrderListActive,
  asyncGetOrderListClosed,
  asyncGetOrderListRejected,
  asyncGetOrderListPending,
  asyncOrderExit,
} from "#redux/order/action.js";
import "./OrderCard.scss";

import { handleCatchErrors } from "#utils/validation";

const OrderCard = React.memo(
  ({ currentSymbol, onNavigateToChart, onOrderDataUpdate }) => {
    const navigate = useNavigate();
    const { themeMode } = useContext(ThemeContext);
    const { activeSubscriptionFeatures: globalActiveSubscriptionFeatures } =
      useGlobalServices();

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };
      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Consolidated loading and data states
    const [dataState, setDataState] = useState({
      isLoading: true,
      todayPL: 0,
      activeOrderList: [],
      closedOrderList: [],
      rejectedOrderList: [],
      pendingOrderList: [],
    });

    // Consolidated filter and pagination states
    const [uiState, setUiState] = useState({
      filterData: {
        AutoOrder: 0,
        indentifier: "",
        Pl: 0,
        CategoryId: 0,
      },
      activeTab: "",
      currentPage: 1,
      sortColumn: null,
      sortOrder: "asc",
      headerCanScroll: false,
      tableCanScroll: false,
      isPageChanging: false,
    });

    // Consolidated dialog states
    const [dialogState, setDialogState] = useState({
      dialogOpen: false,
      singleOrderData: "",
      defaultTabOpen: "",
      dialogSubOpen: false,
    });

    // Portfolio state
    const [portfolio, setPortfolio] = useState({
      totalActiveprice1: 0,
      totalActiveprice: 0,
      totalisTakeProfit: 0,
      todaysPL: 0,
      totalisTakeProfit1: 0,
      currentValue: 0,
    });

    // Subscription feature flags for this component - derived from global subscription features
    const activeSubscriptionFeatures = useMemo(
      () => ({
        charting:
          globalActiveSubscriptionFeatures?.liveCharts?.enabled === true,
        exitButton:
          globalActiveSubscriptionFeatures?.manualTradeExitButton === true,
        editOrder: true,
        orderDetails: true,
      }),
      [globalActiveSubscriptionFeatures],
    );

    // Real-time symbol details for price updates
    const symbolActiveOrder = useSymbolDetails(
      dataState.activeOrderList,
      "order",
    );

    // Constants
    const itemsPerPage = 10;

    // Scroll detection refs
    const headerScrollRef = useRef(null);
    const tableScrollRef = useRef(null);

    // Track if initial tab selection has been done
    const hasInitialTabSelected = useRef(false);

    // Check if scrolling is needed - memoized callback
    const checkScrollNeeded = useCallback(() => {
      if (headerScrollRef.current) {
        const { scrollWidth, clientWidth } = headerScrollRef.current;
        const canScroll = scrollWidth > clientWidth;
        setUiState((prev) => ({ ...prev, headerCanScroll: canScroll }));
      }

      if (tableScrollRef.current) {
        const { scrollWidth, clientWidth, scrollHeight, clientHeight } =
          tableScrollRef.current;
        const canScroll =
          scrollWidth > clientWidth || scrollHeight > clientHeight;
        setUiState((prev) => ({ ...prev, tableCanScroll: canScroll }));
      }
    }, []);

    // Check scroll on window resize
    useEffect(() => {
      const handleResize = () => {
        setTimeout(checkScrollNeeded, 100); // Small delay to ensure DOM is updated
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, [checkScrollNeeded]);

    // Check scroll when data changes
    useEffect(() => {
      setTimeout(checkScrollNeeded, 100);
    }, [
      dataState.activeOrderList,
      dataState.closedOrderList,
      dataState.rejectedOrderList,
      dataState.pendingOrderList,
      checkScrollNeeded,
    ]);

    // Refs check
    useEffect(() => {
      // Header and table refs
    }, []);

    const getActiveOrderList = useCallback(async () => {
      setDataState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await asyncGetOrderListActive(uiState.filterData);

        if (Array.isArray(result?.data?.result)) {
          setDataState((prev) => ({
            ...prev,
            activeOrderList: result.data.result,
          }));
        } else {
          setDataState((prev) => ({ ...prev, activeOrderList: [] }));
        }
      } catch (err) {
        handleCatchErrors(err, navigate);
        setDataState((prev) => ({ ...prev, activeOrderList: [] }));
      } finally {
        setDataState((prev) => ({ ...prev, isLoading: false }));
      }
    }, [uiState.filterData, navigate]);

    const handleOrderExit = useCallback(
      (orderId) => {
        asyncOrderExit({ orderID: orderId })
          .then((result) => {
            getActiveOrderList();
          })
          .catch((err) => {
            handleCatchErrors(err, navigate);
          });
      },
      [getActiveOrderList, navigate],
    );

    const resetFilter = useCallback(() => {
      setUiState((prev) => ({
        ...prev,
        filterData: {
          AutoOrder: 0,
          indentifier: "",
          Pl: 0,
          CategoryId: 0,
        },
      }));
    }, []);

    const closedData = useCallback(
      async (filterData = "") => {
        try {
          const result = await asyncGetOrderListClosed(filterData);

          if (Array.isArray(result?.data?.result)) {
            setDataState((prev) => ({
              ...prev,
              closedOrderList: result.data.result,
            }));
          } else {
            setDataState((prev) => ({ ...prev, closedOrderList: [] }));
          }
        } catch (err) {
          handleCatchErrors(err, navigate);
          setDataState((prev) => ({ ...prev, closedOrderList: [] }));
        }
      },
      [navigate],
    );

    const getRejectedOrderList = useCallback(async () => {
      setDataState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await asyncGetOrderListRejected(uiState.filterData);

        if (Array.isArray(result?.data?.result)) {
          setDataState((prev) => ({
            ...prev,
            rejectedOrderList: result.data.result,
          }));
        } else {
          setDataState((prev) => ({ ...prev, rejectedOrderList: [] }));
        }
      } catch (err) {
        handleCatchErrors(err, navigate);
        setDataState((prev) => ({ ...prev, rejectedOrderList: [] }));
      } finally {
        setDataState((prev) => ({ ...prev, isLoading: false }));
      }
    }, [uiState.filterData, navigate]);

    const getPendingOrderList = useCallback(async () => {
      setDataState((prev) => ({ ...prev, isLoading: true }));

      try {
        const result = await asyncGetOrderListPending(uiState.filterData);

        if (Array.isArray(result?.data?.result)) {
          setDataState((prev) => ({
            ...prev,
            pendingOrderList: result.data.result,
          }));
        } else {
          setDataState((prev) => ({ ...prev, pendingOrderList: [] }));
        }
      } catch (err) {
        handleCatchErrors(err, navigate);
        setDataState((prev) => ({ ...prev, pendingOrderList: [] }));
      } finally {
        setDataState((prev) => ({ ...prev, isLoading: false }));
      }
    }, [uiState.filterData, navigate]);

    const handleClickDialogOpen = useCallback((data, tab) => {
      setDialogState((prev) => ({
        ...prev,
        dialogOpen: true,
        singleOrderData: data,
        defaultTabOpen: tab,
      }));
    }, []);

    const handleDialogClose = useCallback(() => {
      setDialogState((prev) => ({
        ...prev,
        dialogOpen: false,
        singleOrderData: "",
        defaultTabOpen: "",
      }));
    }, []);

    const handleClickSubDialogOpen = useCallback(() => {
      setDialogState((prev) => ({ ...prev, dialogSubOpen: true }));
    }, []);

    const handleDialogSubClose = useCallback(() => {
      setDialogState((prev) => ({ ...prev, dialogSubOpen: false }));
    }, []);

    // Tab filter function - memoized
    const getFilteredDataByTab = useCallback(
      (tab) => {
        switch (tab) {
          case "active":
            return dataState.activeOrderList || [];
          case "closed":
            return dataState.closedOrderList || [];
          case "rejected":
            return dataState.rejectedOrderList || [];
          case "pending":
            return dataState.pendingOrderList || [];
          case "unrealized":
            return dataState.activeOrderList || []; // Show active orders for unrealized P/L
          default:
            return dataState.activeOrderList || [];
        }
      },
      [dataState],
    );

    // Get filtered data by tab - memoized
    const filteredData = useMemo(() => {
      return getFilteredDataByTab(uiState.activeTab);
    }, [uiState.activeTab, getFilteredDataByTab]);

    // Sorting - memoized
    const sortedData = useMemo(() => {
      if (!uiState.sortColumn) return filteredData;
      const sorted = [...filteredData].sort((a, b) => {
        if (a[uiState.sortColumn] < b[uiState.sortColumn])
          return uiState.sortOrder === "asc" ? -1 : 1;
        if (a[uiState.sortColumn] > b[uiState.sortColumn])
          return uiState.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
      return sorted;
    }, [filteredData, uiState.sortColumn, uiState.sortOrder]);

    // Pagination - memoized
    const paginatedData = useMemo(() => {
      const start = (uiState.currentPage - 1) * itemsPerPage;
      const paginated = sortedData?.slice(start, start + itemsPerPage);
      return paginated;
    }, [sortedData, uiState.currentPage, itemsPerPage]);

    const totalPages = useMemo(
      () => Math.ceil((sortedData?.length || 0) / itemsPerPage),
      [sortedData?.length, itemsPerPage],
    );

    const handleSort = useCallback((col) => {
      setUiState((prev) => ({
        ...prev,
        sortColumn: col === prev.sortColumn ? prev.sortColumn : col,
        sortOrder:
          col === prev.sortColumn
            ? prev.sortOrder === "asc"
              ? "desc"
              : "asc"
            : "asc",
      }));
    }, []);

    // Reset pagination when tab changes
    useEffect(() => {
      setUiState((prev) => ({ ...prev, currentPage: 1 }));
    }, [uiState.activeTab]);

    // Auto-scroll to top when page changes
    useEffect(() => {
      if (uiState.currentPage > 1) {
        const tableSection = document.querySelector(".table-section");
        if (tableSection) {
          tableSection.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }, [uiState.currentPage]);

    const handlePageChange = useCallback((newPage) => {
      setUiState((prev) => ({
        ...prev,
        currentPage: newPage,
        isPageChanging: true,
      }));

      // Remove the effect after animation
      setTimeout(() => {
        setUiState((prev) => ({ ...prev, isPageChanging: false }));
      }, 300);
    }, []);

    // Horizontal scroll functions - memoized
    const scrollTableLeft = useCallback(() => {
      const tableContainer = document.querySelector(".table-container");
      if (tableContainer) {
        tableContainer.scrollBy({ left: -300, behavior: "smooth" });
      }
    }, []);

    const scrollTableRight = useCallback(() => {
      const tableContainer = document.querySelector(".table-container");
      if (tableContainer) {
        tableContainer.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, []);

    // Keyboard navigation for pagination and horizontal scrolling
    useEffect(() => {
      const handleKeyPress = (event) => {
        // Pagination navigation
        if (event.key === "ArrowLeft" && uiState.currentPage > 1) {
          handlePageChange(uiState.currentPage - 1);
        } else if (
          event.key === "ArrowRight" &&
          uiState.currentPage < totalPages
        ) {
          handlePageChange(uiState.currentPage + 1);
        }

        // Horizontal scrolling with Ctrl + Arrow keys
        if (event.ctrlKey) {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            scrollTableLeft();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            scrollTableRight();
          }
        }
      };

      document.addEventListener("keydown", handleKeyPress);
      return () => document.removeEventListener("keydown", handleKeyPress);
    }, [
      uiState.currentPage,
      totalPages,
      handlePageChange,
      scrollTableLeft,
      scrollTableRight,
    ]);

    const getPaginationRange = (current, total) => {
      if (total <= 7) {
        // If total pages <= 7, show all pages
        return Array.from({ length: total }, (_, i) => i + 1);
      }

      const range = [];

      if (current <= 3) {
        // Near start: show 1, 2, 3, 4, 5, ..., total
        for (let i = 1; i <= 5; i++) {
          range.push(i);
        }
        if (total > 5) {
          range.push("...");
          range.push(total);
        }
      } else if (current >= total - 2) {
        // Near end: show 1, ..., total-4, total-3, total-2, total-1, total
        range.push(1);
        range.push("...");
        for (let i = total - 4; i <= total; i++) {
          range.push(i);
        }
      } else {
        // Middle: show 1, ..., current-1, current, current+1, ..., total
        range.push(1);
        range.push("...");
        for (let i = current - 1; i <= current + 1; i++) {
          range.push(i);
        }
        range.push("...");
        range.push(total);
      }

      return range;
    };

    // Memoized calculation functions
    const calculateCumulative = useMemo(() => {
      return convertNumeric(
        parseFloat(dataState.todayPL) + parseFloat(portfolio?.todaysPL || 0),
      );
    }, [dataState.todayPL, portfolio?.todaysPL]);

    const calculateUnrealizedPL = useMemo(() => {
      if (!dataState.activeOrderList || dataState.activeOrderList.length === 0)
        return 0;

      try {
        let totalUnrealizedPL = 0;

        dataState.activeOrderList.forEach((order) => {
          if (!order || !order.identifier) return;

          // Use real-time data if available
          const realTimeData = symbolActiveOrder?.[order.identifier];
          if (realTimeData) {
            const currentPrice =
              realTimeData?.lastBuyPrice || realTimeData?.lastTradedPrice || 0;
            const entryPrice =
              realTimeData?.entryPrice || order?.entryPrice || 0;
            const quantity = realTimeData?.quantity || order?.quantity || 0;

            if (order?.orderType === 1) {
              // Buy
              totalUnrealizedPL += (currentPrice - entryPrice) * quantity;
            } else if (order?.orderType === 2) {
              // Sell
              totalUnrealizedPL += (entryPrice - currentPrice) * quantity;
            }
          } else {
            // Fallback to order data
            const currentPrice =
              order.lastBuyPrice ||
              order.lastTradedPrice ||
              order.currentPrice ||
              order.entryPrice ||
              0;
            const entryPrice = order.entryPrice || 0;
            const quantity = order.quantity || 0;

            if (order?.orderType === 1) {
              // Buy
              totalUnrealizedPL += (currentPrice - entryPrice) * quantity;
            } else if (order?.orderType === 2) {
              // Sell
              totalUnrealizedPL += (entryPrice - currentPrice) * quantity;
            }
          }
        });

        return convertNumeric(totalUnrealizedPL);
      } catch (error) {
        return 0;
      }
    }, [dataState.activeOrderList, symbolActiveOrder]);

    const totalTransaction = useMemo(() => {
      return (
        (dataState.activeOrderList?.length || 0) +
        (dataState.closedOrderList?.length || 0) +
        (dataState.rejectedOrderList?.length || 0) +
        (dataState.pendingOrderList?.length || 0)
      );
    }, [dataState]);

    // Check if any tab has orders - memoized
    const hasAnyOrders = useMemo(() => {
      return (
        (dataState.activeOrderList?.length || 0) > 0 ||
        (dataState.closedOrderList?.length || 0) > 0 ||
        (dataState.rejectedOrderList?.length || 0) > 0 ||
        (dataState.pendingOrderList?.length || 0) > 0
      );
    }, [dataState]);

    const CalculatePL = useCallback(
      (order) => {
        if (!order || !order.identifier) return 0;

        try {
          // For closed orders, use profitLost directly from API
          if (
            uiState.activeTab === "closed" &&
            order?.profitLost !== undefined &&
            order?.profitLost !== null
          ) {
            return convertNumeric(parseFloat(order.profitLost) || 0);
          }

          // Get real-time data from symbolActiveOrder hook
          const realTimeData = symbolActiveOrder?.[order.identifier];
          if (realTimeData) {
            if (realTimeData?.orderType === 1) {
              // Buy
              return convertNumeric(
                (realTimeData?.lastBuyPrice || 0) *
                  (realTimeData?.quantity || 0) -
                  (realTimeData?.entryPrice || 0) *
                    (realTimeData?.quantity || 0),
              );
            } else if (realTimeData?.orderType === 2) {
              // Sell
              return convertNumeric(
                (realTimeData?.entryPrice || 0) *
                  (realTimeData?.quantity || 0) -
                  (realTimeData?.lastBuyPrice || 0) *
                    (realTimeData?.quantity || 0),
              );
            }
          }

          // Fallback to order data if real-time data not available
          const currentPrice =
            order.lastBuyPrice ||
            order.lastTradedPrice ||
            order.currentPrice ||
            order.entryPrice ||
            0;
          const entryPrice = order.entryPrice || 0;
          const quantity = order.quantity || 0;

          if (!currentPrice || !entryPrice || !quantity) return 0;

          if (order.orderType === 1) {
            // Buy
            return convertNumeric((currentPrice - entryPrice) * quantity);
          } else if (order.orderType === 2) {
            // Sell
            return convertNumeric((entryPrice - currentPrice) * quantity);
          }
        } catch (error) {
          return 0;
        }

        return 0;
      },
      [symbolActiveOrder, uiState.activeTab],
    );

    useEffect(() => {
      asyncGetDayOrderProfitLoss()
        .then((result) => {
          setDataState((prev) => ({
            ...prev,
            todayPL: convertNumeric(result?.data?.result),
          }));
        })
        .catch((err) => {
          handleCatchErrors(err, navigate);
        });
    }, [navigate]);

    // Auto-select first tab with orders - Only on initial load, prioritize Active tab if it has orders
    useEffect(() => {
      // Only set initial tab if it hasn't been set yet (first time load)
      if (!hasInitialTabSelected.current && !uiState.activeTab) {
        // If Active orders exist, select Active tab (highest priority)
        if (dataState.activeOrderList?.length > 0) {
          setUiState((prev) => ({ ...prev, activeTab: "active" }));
          hasInitialTabSelected.current = true;
        } else if (dataState.closedOrderList?.length > 0) {
          setUiState((prev) => ({ ...prev, activeTab: "closed" }));
          hasInitialTabSelected.current = true;
        } else if (dataState.rejectedOrderList?.length > 0) {
          setUiState((prev) => ({ ...prev, activeTab: "rejected" }));
          hasInitialTabSelected.current = true;
        } else if (dataState.pendingOrderList?.length > 0) {
          setUiState((prev) => ({ ...prev, activeTab: "pending" }));
          hasInitialTabSelected.current = true;
        } else {
          // If no orders in any tab, show active tab (all tabs will be visible)
          setUiState((prev) => ({ ...prev, activeTab: "active" }));
          hasInitialTabSelected.current = true;
        }
      }
    }, [
      dataState.activeOrderList,
      dataState.closedOrderList,
      dataState.rejectedOrderList,
      dataState.pendingOrderList,
      uiState.activeTab,
    ]);

    // Update active tab when current tab has no orders (only if user hasn't manually selected)
    useEffect(() => {
      // Only auto-switch if initial tab has been selected (user hasn't manually changed)
      if (hasInitialTabSelected.current && uiState.activeTab) {
        const currentTabOrderCount =
          getFilteredDataByTab(uiState.activeTab)?.length || 0;

        // If current tab has no orders, switch to first tab with orders
        if (currentTabOrderCount === 0) {
          if (dataState.activeOrderList?.length > 0) {
            setUiState((prev) => ({ ...prev, activeTab: "active" }));
          } else if (dataState.closedOrderList?.length > 0) {
            setUiState((prev) => ({ ...prev, activeTab: "closed" }));
          } else if (dataState.rejectedOrderList?.length > 0) {
            setUiState((prev) => ({ ...prev, activeTab: "rejected" }));
          } else if (dataState.pendingOrderList?.length > 0) {
            setUiState((prev) => ({ ...prev, activeTab: "pending" }));
          }
          // If no orders in any tab, keep current tab (all tabs will be visible)
        }
      }
    }, [
      dataState.activeOrderList,
      dataState.closedOrderList,
      dataState.rejectedOrderList,
      dataState.pendingOrderList,
      uiState.activeTab,
      getFilteredDataByTab,
    ]);

    // Initial data loading
    useEffect(() => {
      getActiveOrderList();
      closedData(uiState.filterData);
      getRejectedOrderList();
      getPendingOrderList();
    }, [
      getActiveOrderList,
      closedData,
      getRejectedOrderList,
      getPendingOrderList,
      uiState.filterData,
    ]);

    // Calculate portfolio values when activeOrderList or symbolActiveOrder changes
    useEffect(() => {
      try {
        let totalActiveprice = 0;
        let totalisTakeProfit = 0;

        if (
          dataState.activeOrderList &&
          Array.isArray(dataState.activeOrderList)
        ) {
          dataState.activeOrderList.forEach((val) => {
            if (!val || !val.identifier) return; // Skip invalid entries

            // Use real-time data if available
            const realTimeData = symbolActiveOrder?.[val.identifier];
            if (realTimeData) {
              if (realTimeData?.orderType === 1) {
                totalActiveprice +=
                  (realTimeData?.lastBuyPrice || 0) *
                  (realTimeData?.quantity || 0);
                totalisTakeProfit +=
                  (realTimeData?.entryPrice || 0) *
                  (realTimeData?.quantity || 0);
              } else if (realTimeData?.orderType === 2) {
                totalActiveprice +=
                  (realTimeData?.entryPrice || 0) *
                  (realTimeData?.quantity || 0);
                totalisTakeProfit +=
                  (realTimeData?.lastBuyPrice || 0) *
                  (realTimeData?.quantity || 0);
              }
            } else {
              // Fallback to order data
              const currentPrice =
                val.lastBuyPrice ||
                val.lastTradedPrice ||
                val.currentPrice ||
                val.entryPrice ||
                0;
              const entryPrice = val.entryPrice || 0;
              const quantity = val.quantity || 0;

              if (val?.orderType === 1) {
                totalActiveprice += currentPrice * quantity;
                totalisTakeProfit += entryPrice * quantity;
              } else if (val?.orderType === 2) {
                totalActiveprice += entryPrice * quantity;
                totalisTakeProfit += currentPrice * quantity;
              }
            }
          });
        }

        const totalTodaysPL = convertNumeric(
          totalActiveprice - totalisTakeProfit,
        );

        setPortfolio((prev) => ({
          ...prev,
          todaysPL: totalTodaysPL,
        }));
      } catch (error) {
        // Error calculating portfolio
        setPortfolio((prev) => ({
          ...prev,
          todaysPL: 0,
        }));
      }
    }, [dataState.activeOrderList, symbolActiveOrder]);

    // Call callback to update parent component with real-time data
    useEffect(() => {
      if (onOrderDataUpdate) {
        const activeCount = dataState.activeOrderList?.length || 0;
        const cumulativePL = parseFloat(calculateCumulative) || 0;
        const totalTrades = totalTransaction || 0;
        const unrealizedPL = parseFloat(calculateUnrealizedPL) || 0;
        const activeOrders = activeCount; // Active orders count

        onOrderDataUpdate(
          activeCount,
          cumulativePL,
          totalTrades,
          unrealizedPL,
          activeOrders,
        );
      }
    }, [
      dataState.activeOrderList,
      dataState.todayPL,
      portfolio?.todaysPL,
      onOrderDataUpdate,
      calculateCumulative,
      totalTransaction,
      calculateUnrealizedPL,
    ]);

    return (
      <div
        className={`order-card ${themeMode === "dark" ? "dark" : ""}`}
        data-has-orders={hasAnyOrders}
      >
        {/* Header Section */}
        <div className="order-header">
          <div className="header-title">
            <div
              ref={headerScrollRef}
              className={`order-counts ${
                uiState.headerCanScroll ? "can-scroll" : ""
              }`}
            >
              {/* CUM.P&L - Always visible first */}
              <div
                className="count-item cumulative"
                title="Cumulative Profit & Loss"
              >
                <span className="count-label">C/P</span>
                <span
                  className={`count-value ${
                    calculateCumulative > 0
                      ? "positive"
                      : calculateCumulative < 0
                        ? "negative"
                        : "neutral"
                  }`}
                  style={{ fontSize: "1.1em", fontWeight: "600" }}
                >
                  {calculateCumulative}
                </span>
                <span className="count-subtitle">{totalTransaction} Trade</span>
                {totalTransaction > 0 && (
                  <div
                    className={`pl-indicator ${
                      calculateCumulative > 0
                        ? "positive"
                        : calculateCumulative < 0
                          ? "negative"
                          : "neutral"
                    }`}
                  >
                    {calculateCumulative > 0
                      ? "↗"
                      : calculateCumulative < 0
                        ? "↘"
                        : "→"}
                  </div>
                )}
              </div>

              {/* Unrealized P/L - Always visible second (Display only, not clickable) */}
              <div
                className={`count-item unrealized-pl ${
                  uiState.activeTab === "unrealized" ? "active-tab" : ""
                }`}
                style={{ cursor: "default", pointerEvents: "none" }}
                title="Unrealized Profit & Loss"
              >
                <span className="count-label">U/P</span>
                <span
                  className={`count-value ${
                    calculateUnrealizedPL > 0
                      ? "positive"
                      : calculateUnrealizedPL < 0
                        ? "negative"
                        : "neutral"
                  }`}
                  style={{ fontSize: "1.1em", fontWeight: "600" }}
                >
                  {calculateUnrealizedPL}
                </span>
                <span className="count-subtitle">
                  {dataState.activeOrderList?.length || 0} Active
                </span>
                {dataState.activeOrderList?.length > 0 && (
                  <div
                    className={`pl-indicator ${
                      calculateUnrealizedPL > 0
                        ? "positive"
                        : calculateUnrealizedPL < 0
                          ? "negative"
                          : "neutral"
                    }`}
                  >
                    {calculateUnrealizedPL > 0
                      ? "↗"
                      : calculateUnrealizedPL < 0
                        ? "↘"
                        : "→"}
                  </div>
                )}
              </div>

              {/* Active Orders Tab - Only if has data */}
              {(dataState.activeOrderList?.length || 0) > 0 && (
                <div
                  className={`count-item ${
                    uiState.activeTab === "active" ? "active-tab" : ""
                  }`}
                  onClick={() => {
                    hasInitialTabSelected.current = true; // Mark as manually selected
                    setUiState((prev) => ({ ...prev, activeTab: "active" }));
                  }}
                  data-count={dataState.activeOrderList?.length || 0}
                  title="Active Orders"
                >
                  <span className="count-badge active">
                    {dataState.activeOrderList?.length || 0}
                  </span>
                  <span className="count-label">Active</span>
                </div>
              )}

              {/* Closed Orders Tab - Only if has data */}
              {(dataState.closedOrderList?.length || 0) > 0 && (
                <div
                  className={`count-item ${
                    uiState.activeTab === "closed" ? "active-tab" : ""
                  }`}
                  onClick={() => {
                    hasInitialTabSelected.current = true; // Mark as manually selected
                    setUiState((prev) => ({ ...prev, activeTab: "closed" }));
                  }}
                  data-count={dataState.closedOrderList?.length || 0}
                  title="Closed Orders"
                >
                  <span className="count-badge closed">
                    {dataState.closedOrderList?.length || 0}
                  </span>
                  <span className="count-label">Closed</span>
                </div>
              )}

              {/* Rejected Orders Tab - Only if has data */}
              {(dataState.rejectedOrderList?.length || 0) > 0 && (
                <div
                  className={`count-item ${
                    uiState.activeTab === "rejected" ? "active-tab" : ""
                  }`}
                  onClick={() => {
                    hasInitialTabSelected.current = true; // Mark as manually selected
                    setUiState((prev) => ({ ...prev, activeTab: "rejected" }));
                  }}
                  data-count={dataState.rejectedOrderList?.length || 0}
                  title="Rejected Orders"
                >
                  <span className="count-badge rejected">
                    {dataState.rejectedOrderList?.length || 0}
                  </span>
                  <span className="count-label">Reject</span>
                </div>
              )}

              {/* Pending Orders Tab - Only if has data */}
              {(dataState.pendingOrderList?.length || 0) > 0 && (
                <div
                  className={`count-item ${
                    uiState.activeTab === "pending" ? "active-tab" : ""
                  }`}
                  onClick={() => {
                    hasInitialTabSelected.current = true; // Mark as manually selected
                    setUiState((prev) => ({ ...prev, activeTab: "pending" }));
                  }}
                  data-count={dataState.pendingOrderList?.length || 0}
                  title="Pending Orders"
                >
                  <span className="count-badge pending">
                    {dataState.pendingOrderList?.length || 0}
                  </span>
                  <span className="count-label">Pending</span>
                </div>
              )}

              {/* Show message when no orders in any tab */}
              {totalTransaction === 0 && (
                <div
                  className="count-item no-orders"
                  title="No Orders Available"
                >
                  <span className="count-badge">0</span>
                  <span className="count-label">No Orders</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="table-section">
          {/* Unrealized P/L Summary for unrealized tab */}

          {/* Scroll Navigation with Pagination */}
          <div className="scroll-navigation">
            <button
              className="scroll-btn scroll-left"
              onClick={scrollTableLeft}
              title="Scroll Left"
            >
              ‹
            </button>

            {/* Pagination in Middle */}
            {paginatedData?.length > 0 && totalPages > 1 && (
              <div
                className={`pagination-inline ${
                  uiState.isPageChanging ? "loading" : ""
                }`}
              >
                {/* Previous Page Button */}
                <button
                  className={`pagination-btn ${
                    uiState.currentPage === 1 ? "disabled" : ""
                  }`}
                  onClick={() =>
                    handlePageChange(Math.max(1, uiState.currentPage - 1))
                  }
                  disabled={uiState.currentPage === 1}
                >
                  ‹
                </button>

                {/* Page Numbers */}
                {getPaginationRange(uiState.currentPage, totalPages).map(
                  (page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="pagination-ellipsis">...</span>
                      ) : (
                        <button
                          className={`pagination-btn ${
                            uiState.currentPage === page ? "active" : ""
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ),
                )}

                {/* Next Page Button */}
                <button
                  className={`pagination-btn ${
                    uiState.currentPage === totalPages ? "disabled" : ""
                  }`}
                  onClick={() =>
                    handlePageChange(
                      Math.min(totalPages, uiState.currentPage + 1),
                    )
                  }
                  disabled={uiState.currentPage === totalPages}
                >
                  ›
                </button>
              </div>
            )}

            <button
              className="scroll-btn scroll-right"
              onClick={scrollTableRight}
              title="Scroll Right"
            >
              ›
            </button>
          </div>

          <div
            ref={tableScrollRef}
            className={`table-container ${
              uiState.isPageChanging ? "page-changing" : ""
            } ${uiState.tableCanScroll ? "can-scroll" : ""}`}
          >
            <table className="order-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("identifier")}>
                    <div className="th-content">
                      <span className="th-label">Stock Name</span>
                      {uiState.sortColumn === "identifier" && (
                        <span className="sort-indicator">
                          {uiState.sortOrder === "asc" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                  {uiState.activeTab !== "rejected" && (
                    <th>
                      <div className="th-content">
                        <span className="th-label">Gain & Loss</span>
                      </div>
                    </th>
                  )}
                  {uiState.activeTab !== "rejected" && (
                    <th>
                      <div className="th-content">
                        <span className="th-label">LTP</span>
                      </div>
                    </th>
                  )}
                  <th>
                    <div className="th-content">
                      <span className="th-label">ATP</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span className="th-label">Qty</span>
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      <span className="th-label">Order Type</span>
                    </div>
                  </th>
                  {uiState.activeTab !== "rejected" && (
                    <th>
                      <div className="th-content">
                        <span className="th-label">SL</span>
                      </div>
                    </th>
                  )}
                  {uiState.activeTab !== "rejected" && (
                    <th>
                      <div className="th-content">
                        <span className="th-label">TG</span>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {dataState.isLoading ? (
                  <TableShimmer
                    row={4}
                    column={uiState.activeTab === "rejected" ? 4 : 8}
                  />
                ) : filteredData?.length === 0 ? (
                  <tr>
                    <td
                      colSpan={uiState.activeTab === "rejected" ? 4 : 8}
                      className="no-data"
                    >
                      <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No Orders Found</div>
                        <div className="empty-description">
                          {dataState.activeOrderList?.length === 0 &&
                          dataState.closedOrderList?.length === 0 &&
                          dataState.rejectedOrderList?.length === 0 &&
                          dataState.pendingOrderList?.length === 0
                            ? "No orders available. Please check your connection or try refreshing the page."
                            : `No orders match the current filter for "${uiState.activeTab}" tab.`}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData?.length > 0 ? (
                  paginatedData?.map((val, key) => {
                    const order = val;
                    return (
                      <tr key={key}>
                        <td>
                          <div className="stock-info">
                            <div className="stock-name">
                              {order?.identifier}
                            </div>
                            <div
                              className={`stock-category ${
                                order?.iSAutoTrade ? "auto-trade" : ""
                              }`}
                            >
                              {/* {order?.symbolCategoryName} */}
                              <div className="order-action-buttons">
                                {/* Chart Button */}
                                <Tooltip
                                  title="Open Chart"
                                  arrow
                                  componentsProps={tooltipDesign}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  disableInteractive
                                  PopperProps={{
                                    style: { pointerEvents: "none" },
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="no-design order-action-btn order-chart-btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (
                                        activeSubscriptionFeatures?.charting ==
                                        false
                                      ) {
                                        handleClickSubDialogOpen();
                                      } else {
                                        if (
                                          onNavigateToChart &&
                                          typeof onNavigateToChart ===
                                            "function"
                                        ) {
                                          onNavigateToChart(order?.identifier);
                                        }
                                      }
                                    }}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (
                                        activeSubscriptionFeatures?.charting ==
                                        false
                                      ) {
                                        handleClickSubDialogOpen();
                                      } else {
                                        if (
                                          onNavigateToChart &&
                                          typeof onNavigateToChart ===
                                            "function"
                                        ) {
                                          onNavigateToChart(order?.identifier);
                                        }
                                      }
                                    }}
                                    style={{
                                      touchAction: "manipulation",
                                      WebkitTapHighlightColor: "transparent",
                                      userSelect: "none",
                                      pointerEvents: "auto",
                                    }}
                                  >
                                    <IconRegistry name="chart-area" size={14} />
                                  </button>
                                </Tooltip>

                                {/* Details Button */}
                                <Tooltip
                                  title="Order Details"
                                  arrow
                                  componentsProps={tooltipDesign}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  disableInteractive
                                  PopperProps={{
                                    style: { pointerEvents: "none" },
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="no-design order-action-btn order-details-btn"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (
                                        activeSubscriptionFeatures?.orderDetails ==
                                        false
                                      ) {
                                        handleClickSubDialogOpen();
                                      } else {
                                        handleClickDialogOpen(order, "details");
                                      }
                                    }}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (
                                        activeSubscriptionFeatures?.orderDetails ==
                                        false
                                      ) {
                                        handleClickSubDialogOpen();
                                      } else {
                                        handleClickDialogOpen(order, "details");
                                      }
                                    }}
                                    style={{
                                      touchAction: "manipulation",
                                      WebkitTapHighlightColor: "transparent",
                                      userSelect: "none",
                                      pointerEvents: "auto",
                                    }}
                                  >
                                    <TbListDetails size={15} />
                                  </button>
                                </Tooltip>

                                {/* Exit Button - Only show in Active tab */}
                                {uiState.activeTab === "active" && (
                                  <Tooltip
                                    title="Exit Order"
                                    arrow
                                    componentsProps={tooltipDesign}
                                    enterTouchDelay={0}
                                    leaveTouchDelay={10000}
                                    disableInteractive
                                    PopperProps={{
                                      style: { pointerEvents: "none" },
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="no-design order-action-btn order-exit-btn"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (
                                          activeSubscriptionFeatures?.exitButton ==
                                          false
                                        ) {
                                          handleClickSubDialogOpen();
                                        } else {
                                          handleOrderExit(order?.orderID);
                                        }
                                      }}
                                      onTouchEnd={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (
                                          activeSubscriptionFeatures?.exitButton ==
                                          false
                                        ) {
                                          handleClickSubDialogOpen();
                                        } else {
                                          handleOrderExit(order?.orderID);
                                        }
                                      }}
                                      style={{
                                        touchAction: "manipulation",
                                        WebkitTapHighlightColor: "transparent",
                                        userSelect: "none",
                                        pointerEvents: "auto",
                                      }}
                                    >
                                      <HiOutlineLogout size={16} />
                                    </button>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {uiState.activeTab !== "rejected" && (
                          <td>
                            <div
                              className={`pl-value ${
                                CalculatePL(order) >= 0
                                  ? "positive"
                                  : "negative"
                              }`}
                            >
                              {CalculatePL(order) >= 0 ? (
                                <IconRegistry name="caret-up" size={16} />
                              ) : (
                                <IconRegistry name="caret-down" size={16} />
                              )}
                              ₹{CalculatePL(order)}
                            </div>
                          </td>
                        )}
                        {uiState.activeTab !== "rejected" && (
                          <td className="price-value">
                            {(() => {
                              const realTimeData =
                                symbolActiveOrder[order?.identifier];
                              if (realTimeData?.lastBuyPrice) {
                                return realTimeData.lastBuyPrice;
                              }
                              return (
                                order?.lastBuyPrice ||
                                order?.lastTradedPrice ||
                                order?.currentPrice ||
                                order?.entryPrice ||
                                "-"
                              );
                            })()}
                          </td>
                        )}
                        <td className="price-value">
                          {order?.entryPrice || "-"}
                        </td>
                        <td className="quantity-value">
                          {order?.quantity || "-"}
                        </td>
                        <td>
                          <div className="order-type">
                            <div
                              className={`type-badge ${
                                order?.orderType === 1 ? "buy" : "sell"
                              }`}
                            >
                              {order?.orderType === 1 ? "Buy" : "Sell"}{" "}
                              {order?.productType === 1 ? "CNC" : "MIS"}
                            </div>
                            <div className="broker-name">
                              {order?.brokerName}
                            </div>
                          </div>
                        </td>
                        {uiState.activeTab !== "rejected" && (
                          <td className="price-value">
                            {order?.stopLossEstPrice || "-"}
                          </td>
                        )}
                        {uiState.activeTab !== "rejected" && (
                          <td className="price-value">
                            {order?.takeProfitEstPrice || "-"}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={uiState.activeTab === "rejected" ? 4 : 8}
                      className="no-data"
                    >
                      <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No Orders Found</div>
                        <div className="empty-description">
                          {!dataState.isLoading
                            ? `You don't have any ${uiState.activeTab} orders at the moment.`
                            : "Loading orders..."}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Scroll Navigation */}
          <div className="scroll-navigation bottom">
            <button
              className="scroll-btn scroll-left"
              onClick={() => {
                const tableSection = document.querySelector(".table-section");
                tableSection.scrollBy({ left: -300, behavior: "smooth" });
              }}
            >
              ‹
            </button>
            <button
              className="scroll-btn scroll-right"
              onClick={() => {
                const tableSection = document.querySelector(".table-section");
                tableSection.scrollBy({ left: 300, behavior: "smooth" });
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Dialogs */}
        {dialogState.dialogOpen && (
          <EditOrderDialog
            open={dialogState.dialogOpen}
            handleClose={handleDialogClose}
            orderData={dialogState.singleOrderData}
            defaultTab="details"
            isEditable={1}
            resetFilter={resetFilter}
            symbolActiveOrder={symbolActiveOrder}
            hideExitButton={
              // Hide action buttons for closed or rejected orders
              uiState.activeTab === "closed" || uiState.activeTab === "rejected"
            }
          />
        )}

        {dialogState.dialogSubOpen && (
          <SubscriptionDialog
            open={dialogState.dialogSubOpen}
            handleClose={handleDialogSubClose}
          />
        )}
      </div>
    );
  },
);

export default OrderCard;
