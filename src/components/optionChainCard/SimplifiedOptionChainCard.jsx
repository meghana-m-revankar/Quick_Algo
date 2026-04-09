import { IconRegistry } from "#components";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./SimplifiedOptionChainCard.scss";
import useOptionChain from "../../pages/optionChain/optionChain";
import useSymbolDetails from "#hooks/useSymbol";
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
import SymbolSelectorDropdown from "../SymbolSelectorDropdown";
const SimplifiedOptionChainCard = ({ currentSymbol, onNavigateToChart }) => {
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

  const symbolValuePE = useSymbolDetails(optionChainPEList, "optionChain");
  const symbolValueCE = useSymbolDetails(optionChainCEList, "optionChain");
  const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);

  // Watch for currentSymbol changes and update options chain data
  useEffect(() => {
    if (currentSymbol && currentSymbol !== formData.strProduct) {
      const refreshOptionsData = async () => {
        try {
          setIsRefreshing(true);

          setOptionChainCEList([]);
          setOptionChainPEList([]);

          await getSymbolExpiryList(currentSymbol);

          const fetchOptionsForNewSymbol = async () => {
            try {
              const expiryData = await fetchSymbolExpiryList(
                { strProduct: currentSymbol },
                navigate,
              );

              if (expiryData && expiryData.length > 0) {
                const reversedExpiryData = expiryData.reverse();
                const selectedExpiry = reversedExpiryData[0];

                const formDataForNewSymbol = {
                  strProduct: currentSymbol,
                  strExpiry: selectedExpiry,
                  strike: "",
                };

                const [ceResult, peResult] = await Promise.all([
                  asyncGetOptionListCE({ formData: formDataForNewSymbol }),
                  asyncGetOptionListPE({ formData: formDataForNewSymbol }),
                ]);

                setOptionChainCEList(ceResult?.data?.result || []);
                setOptionChainPEList(peResult?.data?.result || []);

                setFormData({
                  strProduct: currentSymbol,
                  strExpiry: selectedExpiry,
                  strike: "",
                });
              }
            } catch (error) {
              // Error handling
            }
          };

          await fetchOptionsForNewSymbol();
        } catch (error) {
          // Error handling
        } finally {
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

  const handleChartNavigation = (symbol, optionData = null) => {
    if (onNavigateToChart) {
      onNavigateToChart(symbol, optionData);
    } else {
      navigate(`/chart`, {
        state: { symbol: symbol },
      });
    }
  };

  const handleMouseEnter = useCallback((key, type) => {
    return () => {
      if (window.matchMedia("(min-width: 1025px)").matches) {
        setHoveredIndex(key);
        setHoveredType(type);
      }
    };
  }, []);

  const handleClickButton = useCallback((key, type) => {
    return () => {
      if (window.matchMedia("(max-width: 1025px)").matches) {
        setClickedIndex(key);
        setClickedType(type);
      }
    };
  }, []);

  return (
    <div className="simplified-option-chain-card">
      <div className="card-box">
        {/* Header Section */}
        <div className="option-header">
          <div className="symbol-section">
            <div className="symbol-selector">
              <SymbolSelectorDropdown
                options={
                  watchList?.map((watch) => ({
                    value: watch?.product,
                    product: watch?.product,
                    identifier: watch?.identifier,
                    symbolIdentifierId: watch?.symbolIdentifierId,
                  })) || []
                }
                value={formData.strProduct || ""}
                onChange={handleChange}
                placeholder="Select Symbol"
                name="strProduct"
                id="strProduct"
              />
              <span className="current-price">
                {watchListSymbol[chartIdentifier?.identifier]?.lastTradePrice}
              </span>
            </div>

            <div className="expiry-section">
              <label>Expiry</label>
              <select
                name="strExpiry"
                id="strExpiry"
                onChange={handleChange}
                value={formData.strExpiry}
                disabled={isLoading}
              >
                {expiryList?.map((exData, key) => {
                  return (
                    <option key={key} value={exData}>
                      {exData}
                    </option>
                  );
                })}
              </select>
              {isRefreshing && (
                <span className="refreshing-indicator">
                  Refreshing for {currentSymbol}...
                </span>
              )}
            </div>

            <div className="chart-section">
              <Tooltip
                arrow
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                componentsProps={tooltipDesign}
                title="Chart"
              >
                <button
                  className="chart-button"
                  onClick={
                    activeSubscriptionFeatures?.liveCharts?.enabled == false
                      ? () => handleClickDialogOpen()
                      : () =>
                          handleChartNavigation(chartIdentifier?.identifier, {
                            baseSymbol: chartIdentifier?.identifier,
                            type: "index",
                          })
                  }
                >
                  <IconRegistry name="chart-area" size={16} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Options Table */}
        <div className="options-table-container">
          {isLoading || isRefreshing ? (
            <ShimmerTable
              row={15}
              col={5}
              border={0}
              borderColor={"#cbd5e1"}
              rounded={0.25}
              rowGap={1}
              colPadding={[5, 5, 5, 5]}
            />
          ) : (
            <div className="options-table">
              {/* Table Header */}
              <div className="table-header">
                <div className="calls-header">CALLS</div>
                <div className="strike-header">STRIKE</div>
                <div className="puts-header">PUTS</div>
              </div>

              {/* Table Body */}
              <div className="table-body">
                {optionChainCEList?.slice(0, 20).map((val, key) => {
                  const pe = optionChainPEList?.find(
                    (peOption) => peOption?.strikePrice === val?.strikePrice,
                  );

                  const ceProduct = symbolValueCE[val?.identifier]?.product;
                  const peProduct = symbolValuePE[pe?.identifier]?.product;

                  return (
                    <div
                      key={key}
                      className={`option-row ${
                        ceProduct === "ATM" ? "atm-row" : ""
                      }`}
                      onMouseEnter={handleMouseEnter(key, "CE")}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Call Option */}
                      <div
                        className={`call-option ${
                          ceProduct === "ITM" ? "itm" : ""
                        }`}
                      >
                        <div className="option-type">{ceProduct}</div>
                        <div className="price-change">
                          {symbolValueCE[val?.identifier]
                            ?.priceChangePercentage > 0 ? (
                            <div className="price-up">
                              <IconRegistry name="caret-up" size={16} />
                              {
                                symbolValueCE[val?.identifier]
                                  ?.priceChangePercentage
                              }
                              %
                            </div>
                          ) : symbolValueCE[val?.identifier]
                              ?.priceChangePercentage < 0 ? (
                            <div className="price-down">
                              <IconRegistry name="caret-down" size={16} />
                              {Math.abs(
                                symbolValueCE[val?.identifier]
                                  ?.priceChangePercentage,
                              )}
                              %
                            </div>
                          ) : (
                            <span>0%</span>
                          )}
                        </div>
                        <div className="ltp">
                          {symbolValueCE[val?.identifier]?.lastTradePrice}
                        </div>
                        <div className="action-buttons">
                          <button
                            className="chart-btn"
                            onClick={
                              activeSubscriptionFeatures?.liveCharts?.enabled ==
                              false
                                ? () => handleClickDialogOpen()
                                : () =>
                                    handleChartNavigation(val?.identifier, {
                                      baseSymbol: val?.identifier,
                                      type: "CE",
                                      optionData: val,
                                    })
                            }
                          >
                            <IconRegistry name="chart-area" size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Strike Price */}
                      <div className="strike-price">
                        {symbolValueCE[val?.identifier]?.strikePrice}
                      </div>

                      {/* Put Option */}
                      <div
                        className={`put-option ${
                          peProduct === "ITM" ? "itm" : ""
                        }`}
                      >
                        <div className="option-type">{peProduct || "-"}</div>
                        <div className="price-change">
                          {pe &&
                          symbolValuePE[pe?.identifier]?.priceChangePercentage >
                            0 ? (
                            <div className="price-up">
                              <IconRegistry name="caret-up" size={16} />
                              {
                                symbolValuePE[pe?.identifier]
                                  ?.priceChangePercentage
                              }
                              %
                            </div>
                          ) : pe &&
                            symbolValuePE[pe?.identifier]
                              ?.priceChangePercentage < 0 ? (
                            <div className="price-down">
                              <IconRegistry name="caret-down" size={16} />
                              {Math.abs(
                                symbolValuePE[pe?.identifier]
                                  ?.priceChangePercentage,
                              )}
                              %
                            </div>
                          ) : (
                            <span>{pe ? "0%" : "-"}</span>
                          )}
                        </div>
                        <div className="ltp">
                          {pe
                            ? symbolValuePE[pe?.identifier]?.lastTradePrice
                            : "-"}
                        </div>
                        <div className="action-buttons">
                          {pe && (
                            <button
                              className="chart-btn"
                              onClick={
                                activeSubscriptionFeatures?.liveCharts
                                  ?.enabled == false
                                  ? () => handleClickDialogOpen()
                                  : () =>
                                      handleChartNavigation(pe?.identifier, {
                                        baseSymbol: pe?.identifier,
                                        type: "PE",
                                        optionData: pe,
                                      })
                              }
                            >
                              <IconRegistry name="chart-area" size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {dialogOpen && (
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}
    </div>
  );
};

export default SimplifiedOptionChainCard;
