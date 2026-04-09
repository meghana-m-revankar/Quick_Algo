import { IconRegistry } from "#components";
import React, { useEffect, useState } from "react";
import "./FixedOptionChainCard.scss";
import useOptionChain from "../../pages/optionChain/optionChain";
import useSymbolDetails from "#hooks/useSymbol";
import { ShimmerTable } from "react-shimmer-effects";
import { fetchSymbolExpiryList } from "#utils/watchList";
import {
  asyncGetOptionListCE,
  asyncGetOptionListPE,
} from "#redux/optionChain/optionChainAction.js";
import { SubscriptionDialog } from "#components";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { FaChartArea } from "react-icons/fa6";
import SymbolSelectorDropdown from "../SymbolSelectorDropdown";

const FixedOptionChainCard = ({ currentSymbol, onNavigateToChart }) => {
  const {
    formData,
    optionChainPEList,
    optionChainCEList,
    watchList,
    expiryList,
    handleChange,
    isLoading,
    navigate,
    activeSubscriptionFeatures,
    dialogOpen,
    setDialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    chartIdentifier,
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

  // Get limited options for fixed display (show only 10-12 rows)
  const limitedOptions = optionChainCEList?.slice(0, 12) || [];

  return (
    <div className="fixed-option-chain-card">
      <div className="card-container">
        {/* Header Section */}
        <div className="card-header">
          <div className="header-top">
            <div className="symbol-section">
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
                className="expiry-select"
              >
                {expiryList?.map((exData, key) => {
                  return (
                    <option key={key} value={exData}>
                      {exData}
                    </option>
                  );
                })}
              </select>
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

          {/* Table Header */}
          <div className="table-header">
            <div className="calls-header">CALLS</div>
            <div className="strike-header">Strike</div>
            <div className="puts-header">PUTS</div>
          </div>

          {/* Column Headers */}
          <div className="column-headers">
            <div className="call-columns">
              <div>Product</div>
              <div>LTP Change</div>
              <div>LTP</div>
            </div>
            <div className="strike-column">Strike</div>
            <div className="put-columns">
              <div>LTP</div>
              <div>LTP Change</div>
              <div>Product</div>
            </div>
          </div>
        </div>

        {/* Fixed Height Options Table */}
        <div className="options-container">
          {isLoading || isRefreshing ? (
            <div className="loading-container">
              <ShimmerTable
                row={10}
                col={7}
                border={0}
                borderColor={"#cbd5e1"}
                rounded={0.25}
                rowGap={1}
                colPadding={[5, 5, 5, 5]}
              />
            </div>
          ) : (
            <div className="options-table">
              {limitedOptions.map((val, key) => {
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
                  >
                    {/* Call Option Columns */}
                    <div
                      className={`call-data ${
                        ceProduct === "ITM" ? "itm" : ""
                      }`}
                    >
                      {symbolValueCE[val?.identifier]?.product}
                    </div>
                    <div
                      className={`call-data ${
                        ceProduct === "ITM" ? "itm" : ""
                      }`}
                    >
                      {symbolValueCE[val?.identifier]?.priceChangePercentage >
                      0 ? (
                        <div className="price-up">
                          <IconRegistry name="caret-up" size={16} />
                          {
                            symbolValueCE[val?.identifier]
                              ?.priceChangePercentage
                          }
                        </div>
                      ) : symbolValueCE[val?.identifier]
                          ?.priceChangePercentage < 0 ? (
                        <div className="price-down">
                          <IconRegistry name="caret-down" size={16} />
                          {Math.abs(
                            symbolValueCE[val?.identifier]
                              ?.priceChangePercentage,
                          )}
                        </div>
                      ) : (
                        <span>0</span>
                      )}
                    </div>
                    <div
                      className={`call-data ${
                        ceProduct === "ITM" ? "itm" : ""
                      }`}
                    >
                      {symbolValueCE[val?.identifier]?.lastTradePrice}
                    </div>

                    {/* Strike Price */}
                    <div className="strike-price">
                      {symbolValueCE[val?.identifier]?.strikePrice}
                    </div>

                    {/* Put Option Columns */}
                    <div
                      className={`put-data ${peProduct === "ITM" ? "itm" : ""}`}
                    >
                      {pe ? symbolValuePE[pe?.identifier]?.lastTradePrice : "-"}
                    </div>
                    <div
                      className={`put-data ${peProduct === "ITM" ? "itm" : ""}`}
                    >
                      {pe &&
                      symbolValuePE[pe?.identifier]?.priceChangePercentage >
                        0 ? (
                        <div className="price-up">
                          <IconRegistry name="caret-up" size={16} />
                          {symbolValuePE[pe?.identifier]?.priceChangePercentage}
                        </div>
                      ) : pe &&
                        symbolValuePE[pe?.identifier]?.priceChangePercentage <
                          0 ? (
                        <div className="price-down">
                          <IconRegistry name="caret-down" size={16} />
                          {Math.abs(
                            symbolValuePE[pe?.identifier]
                              ?.priceChangePercentage,
                          )}
                        </div>
                      ) : (
                        <span>{pe ? "0" : "-"}</span>
                      )}
                    </div>
                    <div
                      className={`put-data ${peProduct === "ITM" ? "itm" : ""}`}
                    >
                      {peProduct || "-"}
                    </div>
                  </div>
                );
              })}
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

export default FixedOptionChainCard;
