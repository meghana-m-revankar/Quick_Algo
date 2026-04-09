import React, { useState, useEffect, useRef } from "react";
import "./strategyList.scss";
import { NavLink, useNavigate } from "react-router-dom";

import { Nav, Modal, Button, Form } from "react-bootstrap";
import useStrategyList from "./strategyList";
import ActiveStrategies from "./ActiveStrategies";
import {
  asyncGetStrategyDetails,
  asyncGetAdminStrategyDetails,
  asyncDeployAdminStrategy,
} from "#redux/strategy/action";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction";
import Storage from "#services/storage";
import { errorMsg, successMsg, warningMsg } from "#utils/helpers";
import { useGlobalServices } from "#services/global";
import { SubscriptionDialog } from "#components";
import { useSignalR } from "#services/signalR";
import { ORDER_EVENT_EMITTER_NAME } from "#services/signalR";

const StrategyList = () => {
  const navigate = useNavigate();
  const { activeSubscriptionFeatures } = useGlobalServices();

  // Subscription check state
  const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
  const [subscriptionUpgradeMessage, setSubscriptionUpgradeMessage] =
    useState("");
  const [activeTab, setActiveTab] = useState("my-strategies");
  const STRATEGIES_PAGE_SIZE = 4;
  const [strategiesCurrentPage, setStrategiesCurrentPage] = useState(1);
  const {
    loading,
    error,
    adminStrategies,
    clientStrategies,
    fetchClientStrategy,
    fetchAdminStrategy,
  } = useStrategyList();
  const [showModal, setShowModal] = useState(false);
  const [strategyDetails, setStrategyDetails] = useState(null);
  const [detailsSource, setDetailsSource] = useState(null); // 'admin' | 'client' – for Execution section
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  // Deploy modal state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [brokerList, setBrokerList] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState("");
  const [tradeLimit, setTradeLimit] = useState("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [brokerListLoading, setBrokerListLoading] = useState(false);
  const [deployError, setDeployError] = useState(null);
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [selectedSymbolToDeploy, setSelectedSymbolToDeploy] = useState("");
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [brokerDropdownOpen, setBrokerDropdownOpen] = useState(false);
  const symbolDropdownRef = useRef(null);
  const brokerDropdownRef = useRef(null);

  const { emitter } = useSignalR() || {};
  const showModalRef = useRef(showModal);
  const strategyDetailsRef = useRef(strategyDetails);
  const detailsSourceRef = useRef(detailsSource);
  showModalRef.current = showModal;
  strategyDetailsRef.current = strategyDetails;
  detailsSourceRef.current = detailsSource;

  // On order create/close signal → refetch strategy details when details modal is open
  useEffect(() => {
    if (!emitter || !emitter.on) return;
    const onOrderEvent = async () => {
      if (!showModalRef.current || !strategyDetailsRef.current) return;
      const details = strategyDetailsRef.current;
      const strategyId = details.strategyId ?? details.StrategyId;
      if (!strategyId) return;
      // eslint-disable-next-line no-console
      console.log('[StrategyList] Order event → refetch strategy details', {
        source: detailsSourceRef.current,
        strategyId,
      });
      try {
        const response =
          detailsSourceRef.current === "admin"
            ? await asyncGetAdminStrategyDetails(strategyId)
            : await asyncGetStrategyDetails(strategyId);
        if (response?.data?.success) setStrategyDetails(response.data.data);
      } catch (err) {
        // keep current details on error
      }
    };
    emitter.on(ORDER_EVENT_EMITTER_NAME, onOrderEvent);
    return () => {
      if (emitter.off) emitter.off(ORDER_EVENT_EMITTER_NAME, onOrderEvent);
    };
  }, [emitter]);

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setStrategiesCurrentPage(1);

    // Fetch data based on selected tab
    if (tab === "my-strategies") {
      // Fetch client strategies
      if (fetchClientStrategy) {
        await fetchClientStrategy();
      }
    } else if (tab === "admin-strategies") {
      // Fetch admin strategies
      if (fetchAdminStrategy) {
        await fetchAdminStrategy();
      }
    }
    // For "active-strategies" tab, ActiveStrategies component will handle its own API call
  };

  // Format amount with Indian currency format
  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Get transaction type label

  // Get entry type label
  const getEntryTypeLabel = (entryType) => {
    if (!entryType) return "";
    if (entryType === "Long or Short Entry") return "Non-directional";
    return entryType;
  };

  // Format selected days
  const formatSelectedDays = (selectedDays) => {
    if (
      !selectedDays ||
      !Array.isArray(selectedDays) ||
      selectedDays.length === 0
    ) {
      return "N/A";
    }
    return selectedDays.join(", ");
  };

  // Handle strategy card click
  const handleStrategyClick = async (strategy) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      setShowModal(true);
      setDetailsSource(activeTab === "admin-strategies" ? "admin" : "client");

      // Use appropriate API based on active tab
      let response;
      if (activeTab === "admin-strategies") {
        response = await asyncGetAdminStrategyDetails(strategy.strategyId);
      } else {
        response = await asyncGetStrategyDetails(strategy.strategyId);
      }

      if (response.data.success) {
        setStrategyDetails(response.data.data);
      } else {
        setDetailsError(
          response.data.message || "Failed to fetch strategy details",
        );
      }
    } catch (err) {
      setDetailsError(
        err.response?.data?.message || "Failed to fetch strategy details",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setStrategyDetails(null);
    setDetailsSource(null);
    setDetailsError(null);
  };

  // Handle deploy button click
  const handleDeployClick = async (strategy, e) => {
    e.stopPropagation(); // Prevent card click

    // Subscription + createStrategy check (same as Create Strategy)
    if (!checkCreateStrategyAccess()) {
      setSubscriptionUpgradeMessage(
        "Deploy Strategy is not included in your current plan. Please upgrade your subscription to deploy strategies.",
      );
      setSubscriptionUpgradeOpen(true);
      return;
    }

    setSelectedStrategy(strategy);
    setTradeLimit(strategy.tradeLimit || "");
    setSelectedBroker("");
    setSelectedSymbolToDeploy("");
    setShowDeployModal(true);

    // Get available symbols from strategy
    if (
      strategy.selectedSymbols &&
      Array.isArray(strategy.selectedSymbols) &&
      strategy.selectedSymbols.length > 0
    ) {
      setAvailableSymbols(strategy.selectedSymbols);
      // Auto-select first symbol if only one exists
      if (strategy.selectedSymbols.length === 1) {
        setSelectedSymbolToDeploy(JSON.stringify(strategy.selectedSymbols[0]));
      }
    } else {
      setAvailableSymbols([]);
    }

    // Fetch broker list
    setBrokerListLoading(true);
    try {
      const result = await asyncGetCustBrokerConfig({ sendData: "" });
      const activeBrokers =
        result?.data?.result?.filter((broker) => broker.status === true) || [];
      setBrokerList(activeBrokers);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch broker list";
      errorMsg(errorMessage);
    } finally {
      setBrokerListLoading(false);
    }
  };

  // Handle deploy modal close
  const handleCloseDeployModal = () => {
    setShowDeployModal(false);
    setSelectedStrategy(null);
    setSelectedBroker("");
    setTradeLimit("");
    setBrokerList([]);
    setDeployError(null);
    setAvailableSymbols([]);
    setSelectedSymbolToDeploy("");
    setSymbolDropdownOpen(false);
    setBrokerDropdownOpen(false);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        symbolDropdownRef.current &&
        !symbolDropdownRef.current.contains(e.target)
      ) {
        setSymbolDropdownOpen(false);
      }
      if (
        brokerDropdownRef.current &&
        !brokerDropdownRef.current.contains(e.target)
      ) {
        setBrokerDropdownOpen(false);
      }
    };
    if (showDeployModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDeployModal]);

  // Handle deploy submit
  const handleDeploySubmit = async () => {
    // Clear previous error
    setDeployError(null);

    if (!selectedBroker) {
      warningMsg("Please select a broker");
      return;
    }

    // Check if symbol selection is required
    if (availableSymbols.length > 1 && !selectedSymbolToDeploy) {
      warningMsg("Please select a symbol to deploy");
      return;
    }

    const customerId = Storage.decryptData(localStorage.getItem("customerID"));
    const customerToken = Storage.decryptData(localStorage.getItem("tokenID"));

    // Find selected broker details
    const broker = brokerList.find((b) => b.brokerconfigID == selectedBroker);

    if (!broker) {
      errorMsg("Selected broker not found");
      return;
    }

    setDeployLoading(true);
    try {
      // Parse selected symbol if available
      let selectedSymbol = null;
      if (selectedSymbolToDeploy) {
        try {
          selectedSymbol = JSON.parse(selectedSymbolToDeploy);
        } catch (e) {
          console.error("Error parsing selected symbol:", e);
        }
      } else if (availableSymbols.length === 1) {
        // Auto-select first symbol if only one exists
        selectedSymbol = availableSymbols[0];
      }

      const deployData = {
        strategyId: selectedStrategy.strategyId,
        CustomerId: customerId,
        brokerConfigID: selectedBroker,
        tradeLimit: tradeLimit ? parseInt(tradeLimit) : null,
        customerToken: customerToken,
        customerBrokerToken: customerToken,
        brokerID: broker.brokerID,
        selectedSymbol: selectedSymbol, // Add selected symbol to deploy data
      };

      const response = await asyncDeployAdminStrategy(deployData);

      if (response.data.success) {
        successMsg(response.data.message || "Strategy deployed successfully");
        handleCloseDeployModal();
        // Refresh client strategies after deployment
        if (fetchClientStrategy) {
          fetchClientStrategy();
        }
      } else {
        // Show error in modal for 400 status or other errors
        const errorMessage =
          response.data.message || "Failed to deploy strategy";
        setDeployError(errorMessage);
        errorMsg(errorMessage);
      }
    } catch (err) {
      // Handle 400 status and other errors
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to deploy strategy";
      const errorCode = err.response?.data?.error;

      // 403 subscription / createStrategy: show upgrade dialog and close modal
      if (
        err.response?.status === 403 &&
        (errorCode === "SUBSCRIPTION_REQUIRED" ||
          errorCode === "CREATE_STRATEGY_NOT_ALLOWED")
      ) {
        setSubscriptionUpgradeMessage(errorMessage);
        setSubscriptionUpgradeOpen(true);
        handleCloseDeployModal();
        errorMsg(errorMessage);
        return;
      }

      // If backend returns availableSymbols in error, update the modal
      if (
        err.response?.data?.availableSymbols &&
        Array.isArray(err.response.data.availableSymbols)
      ) {
        setAvailableSymbols(err.response.data.availableSymbols);
        setDeployError("Please select a symbol from the list below");
      } else {
        // Show error in modal (especially for 400 status)
        if (err.response?.status === 400 || err.response?.status >= 400) {
          setDeployError(errorMessage);
        }
      }

      errorMsg(errorMessage);
    } finally {
      setDeployLoading(false);
    }
  };

  // Format value for display
  const formatValue = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value))
      return value.length > 0 ? value.join(", ") : "N/A";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Check if createStrategy is available in subscription
  const checkCreateStrategyAccess = () => {
    if (!activeSubscriptionFeatures) {
      return false;
    }
    return activeSubscriptionFeatures.createStrategy === true;
  };

  // Handle Create Strategy button click
  const handleCreateStrategyClick = (e) => {
    e.preventDefault();

    if (!checkCreateStrategyAccess()) {
      setSubscriptionUpgradeMessage(
        "Your current subscription does not include Create Strategy feature. Please upgrade your subscription to create strategies.",
      );
      setSubscriptionUpgradeOpen(true);
      return;
    }

    navigate("/create-strategy");
  };

  // Get strategies based on active tab
  const getCurrentStrategies = () => {
    if (activeTab === "my-strategies") {
      return clientStrategies || [];
    } else if (activeTab === "admin-strategies") {
      return adminStrategies || [];
    }
    return [];
  };

  // Render strategy cards component
  const renderStrategyCards = () => {
    const currentStrategies = getCurrentStrategies();

    if (loading) {
      return (
        <div className="loading-state">
          <p>Loading strategies...</p>
        </div>
      );
    }

    // if (error) {
    //   return (
    //     <div className="error-state">
    //       <p>Error: {error}</p>
    //     </div>
    //   );
    // }

    if (!currentStrategies || currentStrategies.length === 0) {
      return (
        <div className="empty-state">
          <p>No strategies found.</p>
        </div>
      );
    }

    const totalItems = currentStrategies.length;
    const totalPages = Math.ceil(totalItems / STRATEGIES_PAGE_SIZE) || 1;
    const safePage = Math.min(strategiesCurrentPage, totalPages);
    const startIndex = (safePage - 1) * STRATEGIES_PAGE_SIZE;
    const endIndex = startIndex + STRATEGIES_PAGE_SIZE;
    const visibleStrategies = currentStrategies.slice(startIndex, endIndex);

    const handleStrategiesPageChange = (page) => {
      if (page < 1 || page > totalPages) return;
      setStrategiesCurrentPage(page);
    };

    return (
      <div className="strategies-content-wrapper">
        <div className="strategies-cards-row">
        {visibleStrategies.map((strategy) => (
          <div
            key={strategy.strategyId}
            className="strategy-card light"
            onClick={() => handleStrategyClick(strategy)}
            style={{ cursor: "pointer" }}
          >
            <div className="card-header">
              <div className="icon">⏳</div>

              <div className="title-wrap">
                <h3>{strategy.strategyName || "Unnamed Strategy"}</h3>
              </div>
            </div>

            <p className="description">
              {strategy.strategyName
                ? `${strategy.strategyName} strategy for ${
                    strategy.IdentifierName || strategy.ProductName || "trading"
                  }.`
                : "Strategy description not available."}
            </p>

            <div className="strategy-details">
              <div className="detail-section">
                <div className="detail-item full-width">
                  <span className="detail-label">Strategy Type</span>
                  <span
                    className={`detail-value strategy-type-badge ${
                      strategy.strategyType === "indicator-based"
                        ? "indicator"
                        : strategy.strategyType === "time-based"
                          ? "time"
                          : "indicator"
                    }`}
                  >
                    {strategy.strategyType === "indicator-based"
                      ? "Indicator Based"
                      : strategy.strategyType === "time-based"
                        ? "Time Based"
                        : strategy.strategyType || "Indicator Based"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-item">
                  <span className="detail-label">Entry Type</span>
                  <span className="detail-value">
                    {strategy.entryType
                      ? getEntryTypeLabel(strategy.entryType)
                      : "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Transaction Type</span>
                  <span className="detail-value">
                    {strategy.transactionType === "both-side"
                      ? "Both"
                      : strategy.transactionType || "N/A"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-item">
                  <span className="detail-label">Start Time</span>
                  <span className="detail-value">
                    {strategy.StartTime || "N/A"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Squareoff Time</span>
                  <span className="detail-value">
                    {strategy.SquareoffTime || "N/A"}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <div className="detail-item full-width">
                  <span className="detail-label">Trading Days</span>
                  <span className="detail-value">
                    {formatSelectedDays(strategy.selectedDays)}
                  </span>
                </div>
              </div>
            </div>

            {activeTab === "admin-strategies" && (
              <div className="meta-row">
                <div className="meta-data-list">
                  <span className="label">Min. Amount</span>
                  <strong>{formatAmount(strategy.minAmount)}</strong>
                </div>

                <div className="result">
                  <span className="label">Results</span>
                  <button
                    type="button"
                    className="backtest"
                    onClick={() => {
                      navigate(`/strategy-backtest/${strategy.strategyId}`, {
                        state: {
                          strategyName:
                            strategy.StrategyName ||
                            strategy.strategyName ||
                            "Strategy",
                        },
                      });
                    }}
                  >
                    ◀ Backtest
                  </button>
                </div>
              </div>
            )}

            <div className="footer">
              <div className="tags">
                {strategy.IdentifierName && (
                  <span>{strategy.IdentifierName}</span>
                )}
                {strategy.LotSize && <span>Lot: {strategy.LotSize}</span>}
                {strategy.interval && <span>{strategy.interval}</span>}
              </div>

              {activeTab === "admin-strategies" ? (
                <button
                  className="action-btn deploy-btn"
                  onClick={(e) => handleDeployClick(strategy, e)}
                  title="Deploy Strategy"
                >
                  ↗
                </button>
              ) : (
                <button className="action-btn">↗</button>
              )}
            </div>
          </div>
        ))}
        </div>
        {totalPages > 1 && (
          <div className="strategies-pagination">
            <button
              type="button"
              className="page-btn prev"
              onClick={() => handleStrategiesPageChange(safePage - 1)}
              disabled={safePage === 1}
            >
              ‹ Prev
            </button>
            <span className="page-info">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="page-btn next"
              onClick={() => handleStrategiesPageChange(safePage + 1)}
              disabled={safePage === totalPages}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="strategy-page-container">
      {/* <div className="top-header-data">
        <div className="heading">
          <h2>
            Strategy <span> List</span>
          </h2>
          <p>Explore our curated strategies to enhance your trading journey.</p>
        </div>
        <div className="btn-redict">
          <NavLink to="/create-strategy">+ Create Strategy</NavLink>
        </div>
      </div> */}

      <div className="header-data-new">
        <div className="strategy-tabs-wrapper">
          <div className="top-btn-main">
            <Nav variant="tabs" className="strategy-tabs">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "my-strategies"}
                  onClick={() => handleTabChange("my-strategies")}
                >
                  <span className="tab-text">My Strategies</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "admin-strategies"}
                  onClick={() => handleTabChange("admin-strategies")}
                >
                  <span className="tab-text">Admin Strategies</span>
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === "active-strategies"}
                  onClick={() => handleTabChange("active-strategies")}
                >
                  <span className="tab-text">Active Strategies</span>
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </div>

          <div className="btn-redict">
            <button
              onClick={handleCreateStrategyClick}
              className="create-strategy-btn"
            >
              + Create Strategy
            </button>
          </div>
        </div>
      </div>

      <div className="strateg-flex-data">
        {activeTab === "active-strategies" ? (
          <ActiveStrategies key={activeTab} />
        ) : (
          renderStrategyCards()
        )}
      </div>

      {/* Strategy Details Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        className="strategy-details-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Strategy Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsLoading ? (
            <div className="text-center p-4">
              <p>Loading strategy details...</p>
            </div>
          ) : detailsError ? (
            <div className="text-center p-4 text-danger">
              <p>{detailsError}</p>
            </div>
          ) : strategyDetails ? (
            <div className="strategy-details-content">
              {/* Basic Information */}
              <div className="details-section">
                <h5>Basic Information</h5>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Strategy Name:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.StrategyName)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instrument Details */}
              <div className="details-section">
                <h5>Instrument Details</h5>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Instrument Category:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.instrumentCategory)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Product Type:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.ProductType)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Time Configuration */}
              <div className="details-section">
                <h5>Time Configuration</h5>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Start Time:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.StartTime)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Squareoff Time:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.SquareoffTime)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">End Time:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.EndTime)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Selected Days:</span>
                    <span className="detail-value">
                      {formatSelectedDays(strategyDetails.selectedDays)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trading Configuration */}
              <div className="details-section">
                <h5>Trading Configuration</h5>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Transaction Type:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.transactionType)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Chart Type:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.chartType)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Candle Type:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.candleType)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Interval:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.interval)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Strategy Type:</span>
                    <span
                      className={`detail-value strategy-type-badge ${
                        strategyDetails.strategyType === "indicator-based"
                          ? "indicator"
                          : strategyDetails.strategyType === "time-based"
                            ? "time"
                            : "indicator"
                      }`}
                    >
                      {strategyDetails.strategyType === "indicator-based"
                        ? "Indicator Based"
                        : strategyDetails.strategyType === "time-based"
                          ? "Time Based"
                          : strategyDetails.strategyType || "Indicator Based"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Symbols Section */}
              {(strategyDetails.selectedSymbols &&
                strategyDetails.selectedSymbols.length > 0) ||
              strategyDetails.selectedSymbol ? (
                <div className="details-section">
                  <h5>Selected Symbols</h5>
                  <div className="symbols-box">
                    {strategyDetails.selectedSymbols &&
                    strategyDetails.selectedSymbols.length > 0
                      ? strategyDetails.selectedSymbols
                          .map((symbol) => {
                            return (
                              symbol.identifier ||
                              symbol.IdentifierName ||
                              symbol.Identifier ||
                              symbol.symbolName ||
                              symbol.SymbolName ||
                              symbol.name ||
                              symbol.Name ||
                              ""
                            );
                          })
                          .filter((name) => name)
                          .join(", ")
                      : strategyDetails.selectedSymbol
                        ? strategyDetails.selectedSymbol.identifier ||
                          strategyDetails.selectedSymbol.IdentifierName ||
                          strategyDetails.selectedSymbol.Identifier ||
                          strategyDetails.selectedSymbol.symbolName ||
                          strategyDetails.selectedSymbol.SymbolName ||
                          strategyDetails.selectedSymbol.name ||
                          strategyDetails.selectedSymbol.Name ||
                          "Symbol"
                        : "N/A"}
                  </div>
                </div>
              ) : null}

              {/* Order Legs Section - Compact layout */}
              {strategyDetails.qaCustomCustomerOptionsAlgoChild &&
              strategyDetails.qaCustomCustomerOptionsAlgoChild.length > 0 ? (
                <div className="details-section">
                  <h5>
                    Order Legs (
                    {strategyDetails.qaCustomCustomerOptionsAlgoChild.length})
                  </h5>
                  <div className="legs-container legs-compact">
                    {strategyDetails.qaCustomCustomerOptionsAlgoChild.map(
                      (leg, index) => (
                        <div key={leg.id || index} className="leg-item leg-compact">
                          <span className="leg-number">Leg {index + 1}</span>
                          {(leg.qty != null || leg.quantity != null) && (
                            <span className="leg-qty">{leg.qty ?? leg.quantity}</span>
                          )}
                          <span className="leg-type">{leg.optionType || leg.orderLegType || "N/A"}</span>
                          <span
                            className={`action-badge ${
                              (leg.action || leg.CallType) === "BUY"
                                ? "buy"
                                : "sell"
                            }`}
                          >
                            {leg.action || leg.CallType || "N/A"}
                          </span>
                          {leg.OptionsType && (
                            <span
                              className={`options-type-badge ${
                                leg.OptionsType === "ATM"
                                  ? "atm"
                                  : leg.OptionsType?.includes?.("OTM")
                                    ? "otm"
                                    : leg.OptionsType?.includes?.("ITM")
                                      ? "itm"
                                      : ""
                              }`}
                            >
                              {leg.OptionsType}
                            </span>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : null}

              {/* Risk Management */}
              <div className="details-section">
                <h5>Risk Management</h5>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Profit Exit Amount:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.rmProfitExitAmount)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Loss Exit Amount:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.rmLossExitAmount)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Move SL to Cost:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.MoveSlToCost)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      Move SL to Cost Increase Of:
                    </span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.MoveSlToCostIncreaseOf)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      Move SL to Cost Trail By:
                    </span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.MoveSlToCostTrailBy)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Profit Trailing:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.ProfitTrailing)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">
                      PT Lock If Profit Reaches:
                    </span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.pTLockIfProfitReaches)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">PT Lock Profit At:</span>
                    <span className="detail-value">
                      {formatValue(strategyDetails.pTLockProfitAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Execution status (admin strategy only – real-time execution/order data) */}
              {detailsSource === "admin" && (
                <div className="details-section execution-status-section">
                  <h5>Execution status</h5>
                  {strategyDetails.executionSummary ? (
                    <div className="execution-summary-box">
                      <div className="execution-summary-row">
                        <span className="exec-label">Status:</span>
                        <span className="exec-value status-badge">
                          {formatValue(
                            strategyDetails.executionSummary.processStatus,
                          )}
                        </span>
                      </div>
                      <div className="execution-summary-row">
                        <span className="exec-label">Order status:</span>
                        <span className="exec-value order-status-badge">
                          {formatValue(
                            strategyDetails.executionSummary.orderStatus,
                          )}
                        </span>
                      </div>
                      {strategyDetails.executionSummary.entryTime && (
                        <div className="execution-summary-row">
                          <span className="exec-label">Entry time:</span>
                          <span className="exec-value">
                            {strategyDetails.executionSummary.entryTime}
                          </span>
                        </div>
                      )}
                      {strategyDetails.executionSummary.entryPrice != null && (
                        <div className="execution-summary-row">
                          <span className="exec-label">Entry price:</span>
                          <span className="exec-value">
                            {formatValue(
                              strategyDetails.executionSummary.entryPrice,
                            )}
                          </span>
                        </div>
                      )}
                      {strategyDetails.executionSummary.side && (
                        <div className="execution-summary-row">
                          <span className="exec-label">Side:</span>
                          <span className="exec-value">
                            {strategyDetails.executionSummary.side}
                          </span>
                        </div>
                      )}
                      {(strategyDetails.executionSummary.profitLoss != null ||
                        strategyDetails.executionSummary.rejectionReason) && (
                        <div className="execution-summary-row">
                          <span className="exec-label">P&amp;L:</span>
                          <span className="exec-value">
                            {strategyDetails.executionSummary.rejectionReason
                              ? "Rejected"
                              : formatValue(
                                  strategyDetails.executionSummary.profitLoss !=
                                    null
                                    ? strategyDetails.executionSummary
                                        .profitLoss
                                    : "—",
                                )}
                          </span>
                        </div>
                      )}
                      {strategyDetails.executionSummary.errorMessage && (
                        <div className="execution-summary-row error-row">
                          <span className="exec-label">Message:</span>
                          <span className="exec-value">
                            {formatValue(
                              strategyDetails.executionSummary.errorMessage,
                            )}
                          </span>
                        </div>
                      )}
                      {strategyDetails.executionSummary.orderLegs &&
                        strategyDetails.executionSummary.orderLegs.length >
                          0 && (
                          <div className="execution-order-legs">
                            <span className="exec-label">Order legs:</span>
                            <ul className="exec-legs-list">
                              {strategyDetails.executionSummary.orderLegs.map(
                                (leg, idx) => (
                                  <li key={leg.legId || idx}>
                                    {leg.symbol} – {leg.side} {leg.quantity} @{" "}
                                    {formatValue(leg.price)} –{" "}
                                    {formatValue(leg.status)}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ) : (
                    <p className="execution-not-deployed text-muted">
                      Not deployed yet. Deploy this strategy to run it and see
                      live execution and order status here.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Deploy Strategy Modal */}
      <Modal
        show={showDeployModal}
        onHide={handleCloseDeployModal}
        size="sm"
        centered
        className="deploy-strategy-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Deploy Strategy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStrategy && (
            <div className="deploy-strategy-content">
              <div className="mb-3">
                <h6>
                  Strategy:{" "}
                  {selectedStrategy.strategyName || "Unnamed Strategy"}
                </h6>
                {/* <p className="text-muted small">
                  {selectedStrategy.IdentifierName ||
                    selectedStrategy.ProductName ||
                    "N/A"}
                </p> */}
              </div>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Trade Limit</strong>
                </Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter trade limit (optional)"
                  value={tradeLimit}
                  onChange={(e) => setTradeLimit(e.target.value)}
                  min="0"
                />
                <Form.Text className="text-muted">
                  Maximum number of trades per day. Leave empty for no limit.
                </Form.Text>
              </Form.Group>

              {/* Symbol Selection - Show if multiple symbols available */}
              {availableSymbols.length > 1 && (
                <Form.Group className="mb-3 deploy-select-wrapper" ref={symbolDropdownRef}>
                  <Form.Label>
                    <strong>Select Symbol</strong>{" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <div
                    className={`deploy-scrollable-select ${symbolDropdownOpen ? "open" : ""}`}
                    onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
                  >
                    <span className="deploy-select-value">
                      {selectedSymbolToDeploy
                        ? (() => {
                            try {
                              const s = JSON.parse(selectedSymbolToDeploy);
                              return s.identifier || s.IdentifierName || s.symbolName || s.ProductName || "Selected";
                            } catch {
                              return "Select a symbol";
                            }
                          })()
                        : "Select a symbol"}
                    </span>
                    <span className="deploy-select-arrow">▼</span>
                  </div>
                  {symbolDropdownOpen && (
                    <div className="deploy-select-dropdown">
                      <div
                        className="deploy-select-option"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSymbolToDeploy("");
                          setSymbolDropdownOpen(false);
                        }}
                      >
                        Select a symbol
                      </div>
                      {availableSymbols.map((symbol, index) => {
                        const symbolKey = JSON.stringify(symbol);
                        const displayName =
                          symbol.identifier ||
                          symbol.IdentifierName ||
                          symbol.symbolName ||
                          symbol.ProductName ||
                          `Symbol ${index + 1}`;
                        return (
                          <div
                            key={index}
                            className={`deploy-select-option ${selectedSymbolToDeploy === symbolKey ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSymbolToDeploy(symbolKey);
                              setSymbolDropdownOpen(false);
                            }}
                          >
                            {displayName}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    Select the symbol to use for this strategy deployment.
                  </Form.Text>
                </Form.Group>
              )}

              {/* Show selected symbol info if only one symbol */}
              {availableSymbols.length === 1 && (
                <div className="alert alert-info mb-3">
                  <strong>Symbol:</strong>{" "}
                  {availableSymbols[0].identifier ||
                    availableSymbols[0].IdentifierName ||
                    availableSymbols[0].symbolName ||
                    availableSymbols[0].ProductName ||
                    "N/A"}
                  {/* {availableSymbols[0].LotSize && (
                    <span> (Lot Size: {availableSymbols[0].LotSize})</span>
                  )} */}
                </div>
              )}

              <Form.Group className="mb-3 deploy-select-wrapper" ref={brokerDropdownRef}>
                <Form.Label>
                  <strong>Select Broker</strong>{" "}
                  <span className="text-danger">*</span>
                </Form.Label>
                {brokerListLoading ? (
                  <div className="text-center p-3">
                    <p>Loading brokers...</p>
                  </div>
                ) : brokerList.length === 0 ? (
                  <div className="text-center p-3 text-muted">
                    <p>No active brokers found</p>
                  </div>
                ) : (
                  <>
                    <div
                      className={`deploy-scrollable-select ${brokerDropdownOpen ? "open" : ""}`}
                      onClick={() => setBrokerDropdownOpen(!brokerDropdownOpen)}
                    >
                      <span className="deploy-select-value">
                        {selectedBroker
                          ? (brokerList.find((b) => b.brokerconfigID == selectedBroker)?.brokerName ||
                            `Broker ${selectedBroker}`)
                          : "Select a broker"}
                      </span>
                      <span className="deploy-select-arrow">▼</span>
                    </div>
                    {brokerDropdownOpen && (
                      <div className="deploy-select-dropdown">
                        <div
                          className="deploy-select-option"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBroker("");
                            setBrokerDropdownOpen(false);
                          }}
                        >
                          Select a broker
                        </div>
                        {brokerList.map((broker) => (
                          <div
                            key={broker.brokerconfigID}
                            className={`deploy-select-option ${selectedBroker == broker.brokerconfigID ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBroker(String(broker.brokerconfigID));
                              setBrokerDropdownOpen(false);
                            }}
                          >
                            {broker.brokerName || `Broker ${broker.brokerconfigID}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <Form.Text className="text-muted">
                  Select the broker account to use for this strategy.
                </Form.Text>
              </Form.Group>

              {selectedStrategy.minAmount && (
                <div className="alert alert-min-amount">
                  <strong>Minimum Amount Required:</strong>{" "}
                  {formatAmount(selectedStrategy.minAmount)}
                  <br />
                  <small>
                    The broker account must have at least this amount available.
                  </small>
                </div>
              )}

              {deployError && (
                <div className="alert alert-danger mt-3">
                  <strong>Error:</strong> {deployError}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseDeployModal}
            disabled={deployLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeploySubmit}
            disabled={
              deployLoading ||
              !selectedBroker ||
              brokerListLoading ||
              (availableSymbols.length > 1 && !selectedSymbolToDeploy)
            }
          >
            {deployLoading ? "Deploying..." : "Deploy Strategy"}
          </Button>
        </Modal.Footer>
      </Modal>

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

export default StrategyList;
