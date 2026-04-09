import { IconRegistry } from "#components";
import React, { useCallback, useEffect, useRef, useState, memo } from "react";
import "./OptionChainCard.scss";
import useOptionChain from "../../pages/optionChain/optionChain";
import useSymbolDetails from "#hooks/useSymbol";
import usePerformanceMonitor from "#hooks/usePerformanceMonitor";
import { ShimmerTable } from "react-shimmer-effects";
import { fetchSymbolLotSize, fetchSymbolExpiryList } from "#utils/watchList";
import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { handleCatchErrors } from "#utils/validation";
import { ButtonLoader, SubscriptionDialog } from "#components";
import Tooltip from "@mui/material/Tooltip";
import { TextData, tooltipDesign } from "#constant/index";
import { images } from "#helpers";
import { FaChartArea } from "react-icons/fa6";
import OptionChainSkeleton from "./OptionChainSkeleton";

// Memoized option row component to prevent unnecessary re-renders
const OptionRow = memo(
  ({
    peData,
    ceData,
    index,
    symbolValuePE,
    symbolValueCE,
    onHover,
    onHoverLeave,
    onAnalysis,
    isHovered,
    isAnalysis,
    analysis,
    orderData,
    setOrderData,
    handleOrderChange,
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
    setClickedIndex,
    clickedType,
    setClickedType,
    handleScroll,
    chartIdentifier,
    navigate,
  }) => {
    const handleRowHover = useCallback(() => {
      onHover(index, "both");
    }, [index, onHover]);

    const handleRowLeave = useCallback(() => {
      onHoverLeave();
    }, [onHoverLeave]);

    const handleAnalysis = useCallback(
      (type, data) => {
        onAnalysis(type, data);
      },
      [onAnalysis],
    );

    return (
      <div
        className={`options-grid ${isHovered ? "hovered" : ""}`}
        onMouseEnter={handleRowHover}
        onMouseLeave={handleRowLeave}
      >
        {/* PE Data */}
        <div
          className={`option-cell pe-cell ${clickedIndex === index && clickedType === "PE" ? "selected" : ""}`}
          onClick={() => handleAnalysis("PE", peData)}
        >
          <div className="product-name">{peData?.identifier || "-"}</div>
          <div className="ltp-change">
            {symbolValuePE[peData?.identifier]?.priceChangePercentage || "0.00"}
            %
          </div>
          <div className="ltp">
            {symbolValuePE[peData?.identifier]?.lastTradePrice || "0.00"}
          </div>
        </div>

        {/* Strike Price */}
        <div className="strike-cell">
          {peData?.strikePrice || ceData?.strikePrice || "-"}
        </div>

        {/* CE Data */}
        <div
          className={`option-cell ce-cell ${clickedIndex === index && clickedType === "CE" ? "selected" : ""}`}
          onClick={() => handleAnalysis("CE", ceData)}
        >
          <div className="ltp">
            {symbolValueCE[ceData?.identifier]?.lastTradePrice || "0.00"}
          </div>
          <div className="ltp-change">
            {symbolValueCE[ceData?.identifier]?.priceChangePercentage || "0.00"}
            %
          </div>
          <div className="product-name">{ceData?.identifier || "-"}</div>
        </div>
      </div>
    );
  },
);

OptionRow.displayName = "OptionRow";

const OptimizedOptionChainCard = memo(
  ({ currentSymbol, onNavigateToChart }) => {
    // Performance monitoring
    const performanceMetrics = usePerformanceMonitor(
      "OptimizedOptionChainCard",
    );

    const {
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
      setDialogOpen,
      handleClickDialogOpen,
      handleDialogClose,
      clickedIndex,
      setClickedIndex,
      clickedType,
      setClickedType,
      handleScroll,
      chartIdentifier,
      scrollToATM,
      getSymbolExpiryList,
      setOptionChainCEList,
      setOptionChainPEList,
      setFormData,
    } = useOptionChain();

    // Local loading state for symbol changes
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(
      "Loading option chain data...",
    );

    // Memoized symbol details to prevent unnecessary re-calculations
    const symbolValuePE = useSymbolDetails(optionChainPEList, "optionChain");
    const symbolValueCE = useSymbolDetails(optionChainCEList, "optionChain");
    const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);

    // Memoized handlers to prevent unnecessary re-renders
    const handleHover = useCallback(
      (index, type) => {
        setHoveredIndex(index);
        setHoveredType(type);
      },
      [setHoveredIndex, setHoveredType],
    );

    const handleHoverLeave = useCallback(() => {
      setHoveredIndex(null);
      setHoveredType(null);
    }, [setHoveredIndex, setHoveredType]);

    const handleAnalysis = useCallback(
      (type, data) => {
        setIsAnalysis(type);
        setAnalysis({
          ...analysis,
          identifier: data?.identifier,
          strikePrice: data?.strikePrice,
          lotSize: data?.lotSize || 1,
        });
        setClickedIndex(hoveredIndex);
        setClickedType(type);
      },
      [
        setIsAnalysis,
        setAnalysis,
        analysis,
        hoveredIndex,
        setClickedIndex,
        setClickedType,
      ],
    );

    // Watch for currentSymbol changes and update options chain data
    useEffect(() => {
      if (currentSymbol && currentSymbol !== formData.strProduct) {
        const refreshOptionsData = async () => {
          try {
            setIsRefreshing(true);

            // Clear existing options data first to prevent showing old data
            setOptionChainCEList([]);
            setOptionChainPEList([]);

            // First, get the expiry list for the new symbol
            await getSymbolExpiryList(currentSymbol);

            // Now manually fetch options data for the new symbol
            const fetchOptionsForNewSymbol = async () => {
              try {
                // Get expiry data for the new symbol
                const expiryData = await fetchSymbolExpiryList(
                  { strProduct: currentSymbol },
                  navigate,
                );

                if (expiryData && expiryData.length > 0) {
                  const reversedExpiryData = expiryData.reverse();
                  const selectedExpiry = reversedExpiryData[0];

                  // Fetch options data for the new symbol and expiry
                  const [peResult, ceResult] = await Promise.all([
                    asyncGetOptionListPE({
                      formData: {
                        strProduct: currentSymbol,
                        strExpiry: selectedExpiry,
                      },
                    }),
                    asyncGetOptionListCE({
                      formData: {
                        strProduct: currentSymbol,
                        strExpiry: selectedExpiry,
                      },
                    }),
                  ]);

                  // Update the options data
                  setOptionChainPEList(peResult?.data?.result || []);
                  setOptionChainCEList(ceResult?.data?.result || []);

                  // Update form data
                  setFormData({
                    strProduct: currentSymbol,
                    strExpiry: selectedExpiry,
                    strike: "",
                  });
                }
              } catch (error) {
              } finally {
                setIsRefreshing(false);
              }
            };

            fetchOptionsForNewSymbol();
          } catch (error) {
            setIsRefreshing(false);
          }
        };

        refreshOptionsData();
      }
    }, [
      currentSymbol,
      formData.strProduct,
      getSymbolExpiryList,
      setOptionChainCEList,
      setOptionChainPEList,
      setFormData,
      navigate,
    ]);

    // Memoized option rows to prevent unnecessary re-renders
    const optionRows = React.useMemo(() => {
      // Allow rendering even if one list is empty (some strikes might only have CE or PE)
      if (
        (!optionChainPEList || optionChainPEList.length === 0) &&
        (!optionChainCEList || optionChainCEList.length === 0)
      ) {
        return [];
      }

      const maxLength = Math.max(
        optionChainPEList?.length || 0,
        optionChainCEList?.length || 0,
      );
      const rows = [];

      for (let i = 0; i < maxLength; i++) {
        const peData = optionChainPEList?.[i] || null;
        const ceData = optionChainCEList?.[i] || null;

        rows.push(
          <OptionRow
            key={`${peData?.identifier || i}-${ceData?.identifier || i}`}
            peData={peData}
            ceData={ceData}
            index={i}
            symbolValuePE={symbolValuePE}
            symbolValueCE={symbolValueCE}
            onHover={handleHover}
            onHoverLeave={handleHoverLeave}
            onAnalysis={handleAnalysis}
            isHovered={hoveredIndex === i}
            isAnalysis={isAnalysis}
            analysis={analysis}
            orderData={orderData}
            setOrderData={setOrderData}
            handleOrderChange={handleOrderChange}
            handleOrderSubmit={handleOrderSubmit}
            formErrors={formErrors}
            brokerConfigList={brokerConfigList}
            isOrderLoading={isOrderLoading}
            CancelOrder={CancelOrder}
            activeSubscriptionFeatures={activeSubscriptionFeatures}
            dialogOpen={dialogOpen}
            handleClickDialogOpen={handleClickDialogOpen}
            handleDialogClose={handleDialogClose}
            clickedIndex={clickedIndex}
            setClickedIndex={setClickedIndex}
            clickedType={clickedType}
            setClickedType={setClickedType}
            handleScroll={handleScroll}
            chartIdentifier={chartIdentifier}
            navigate={navigate}
          />,
        );
      }

      return rows;
    }, [
      optionChainPEList,
      optionChainCEList,
      symbolValuePE,
      symbolValueCE,
      handleHover,
      handleHoverLeave,
      handleAnalysis,
      hoveredIndex,
      isAnalysis,
      analysis,
      orderData,
      setOrderData,
      handleOrderChange,
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
      setClickedIndex,
      clickedType,
      setClickedType,
      handleScroll,
      chartIdentifier,
      navigate,
    ]);

    return (
      <div className="option_chain_card">
        <div className="card-header">
          <div className="symbol-info">
            <h3>{currentSymbol || "Select Symbol"}</h3>
            <div className="price-info">
              <span className="current-price">
                {watchListSymbol[chartIdentifier?.identifier]?.lastTradePrice ||
                  "0.00"}
              </span>
              <span className="price-change">
                {watchListSymbol[chartIdentifier?.identifier]
                  ?.priceChangePercentage || "0.00"}
                %
              </span>
            </div>
          </div>
          <div className="chart-button">
            <Tooltip
              arrow
              enterTouchDelay={0}
              leaveTouchDelay={10000}
              componentsProps={tooltipDesign}
              title="Chart"
            >
              <span
                className="chart-icon"
                onClick={
                  activeSubscriptionFeatures?.liveCharts?.enabled == false
                    ? () => handleClickDialogOpen()
                    : () => onNavigateToChart?.(chartIdentifier?.identifier)
                }
              >
                <FaChartArea size={20} />
              </span>
            </Tooltip>
          </div>
        </div>

        <div className="options-header">
          <div className="text-danger negative">CALLS</div>
          <div className="strike">Strike</div>
          <div className="text-success positive">PUTS</div>
        </div>

        <div className="options-grid">
          <div>Product</div>
          <div>LTP Change</div>
          <div>LTP</div>
          <div className="strike">Strike</div>
          <div>LTP</div>
          <div>LTP Change</div>
          <div>Product</div>
        </div>

        <div className="price_content">
          {isLoading || isRefreshing ? (
            <div className="loading-container">
              <OptionChainSkeleton rows={20} showHeader={false} />
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <span>{loadingMessage}</span>
              </div>
            </div>
          ) : optionRows.length > 0 ? (
            optionRows
          ) : (
            <div
              className="no-data-message"
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-color-secondary, #666)",
              }}
            >
              <p>No option chain data available</p>
              <p style={{ fontSize: "14px", marginTop: "8px" }}>
                Please select a product and expiry date
              </p>
            </div>
          )}
        </div>

        {activeSubscriptionFeatures?.liveCharts?.enabled == false && (
          <SubscriptionDialog
            open={dialogOpen}
            onClose={handleDialogClose}
            title="Chart Access Required"
            message="Please upgrade your subscription to access charting features."
          />
        )}
      </div>
    );
  },
);

OptimizedOptionChainCard.displayName = "OptimizedOptionChainCard";

export default OptimizedOptionChainCard;
