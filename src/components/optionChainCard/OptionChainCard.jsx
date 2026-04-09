import { IconRegistry } from "#components";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "./OptionChainCard.scss";
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
const OptionChainCard = ({ currentSymbol, onNavigateToChart }) => {
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
      // Force a complete refresh by calling getSymbolExpiryList directly
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
                const formDataForNewSymbol = {
                  strProduct: currentSymbol,
                  strExpiry: selectedExpiry,
                  strike: "",
                };

                // Manually fetch options data
                const [ceResult, peResult] = await Promise.all([
                  asyncGetOptionListCE({ formData: formDataForNewSymbol }),
                  asyncGetOptionListPE({ formData: formDataForNewSymbol }),
                ]);

                // Update the options data
                setOptionChainCEList(ceResult?.data?.result || []);
                setOptionChainPEList(peResult?.data?.result || []);

                // Also update the form data to keep everything in sync
                setFormData({
                  strProduct: currentSymbol,
                  strExpiry: selectedExpiry,
                  strike: "",
                });
              } else {
              }
            } catch (error) {
              // Error manually fetching options
            }
          };

          // Execute immediately without setTimeout
          await fetchOptionsForNewSymbol();

          // Successfully refreshed options data
        } catch (error) {
          // Error refreshing options data
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

  const updateAnalysis = async (Producttype, type, data) => {
    if (clickedIndex) {
      handleScroll();
    }

    const lotSize = await fetchSymbolLotSize(
      { identifierid: data?.symbolIdentifierId },
      navigate,
    );

    setIsAnalysis(Producttype);
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
    setOrderData({
      ...orderData,
      IdentifierId: data?.symbolIdentifierId,
      OrderType: type == "buy" ? 1 : 2,
      TotalPurchaseAmt: parseFloat(parseFloat(TotalPurchaseAmt).toFixed(2)),
    });
  };

  useEffect(() => {
    if (isAnalysis != "") {
      let IdntSym = "";
      if (isAnalysis == "CE") {
        IdntSym = symbolValueCE[analysis?.identifier];
      } else {
        IdntSym = symbolValuePE[analysis?.identifier];
      }

      if (IdntSym != "") {
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

        setOrderData({
          ...orderData,
          EntryPrice: parseFloat(IdntSym?.lastTradePrice),
          SellPrice: parseFloat(IdntSym?.sellPrice),
          BuyPrice: parseFloat(IdntSym?.buyPrice),
          StopLossEstPrice: parseFloat(parseFloat(StopLossEstPrice).toFixed(2)),
        });
      }
    }
  }, [isAnalysis, optionChainCEList, symbolValueCE, analysis?.type]);

  const updatePriceType = (priceType, strikePrice) => {
    let data = [];

    if (priceType == "CE") {
      data = Object.entries(symbolValueCE).find(
        ([key, value]) => value.strikePrice == strikePrice,
      );
    }

    if (priceType == "PE") {
      data = Object.entries(symbolValuePE).find(
        ([key, value]) => value.strikePrice == strikePrice,
      );
    }

    if (data?.length > 0) {
      updateAnalysis(priceType, analysis?.type, data[1]);
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

  const handleChartNavigation = (symbol, optionData = null) => {
    if (onNavigateToChart) {
      onNavigateToChart(symbol, optionData);
    } else {
      navigate(`/chart`, {
        state: { symbol: symbol },
      });
    }
  };

  return (
    <div className="option-chain-card">
      <div className="card-box card-height">
        <div className="fixed-header">
          <div className="option_chain_header">
            <div className="select-container">
              <SymbolSelectorDropdown
                options={
                  watchList?.map((watch) => ({
                    value: watch?.product,
                    product: watch?.product,
                    identifier: watch?.identifier,
                    symbolIdentifierId: watch?.symbolIdentifierId,
                  })) || []
                }
                value={
                  watchList?.find(
                    (watch) => watch?.product === watchList?.[0]?.product,
                  )?.product || ""
                }
                onChange={handleChange}
                placeholder="Select Symbol"
                name="strProduct"
                id="strProduct"
              />
              <span className="mr-10">
                {watchListSymbol[chartIdentifier?.identifier]?.lastTradePrice}
              </span>
            </div>
            <div className="expiry_div">
              <p>
                Expiry{" "}
                {isRefreshing && (
                  <span style={{ fontSize: "12px", color: "#ff6b6b" }}>
                    (Refreshing for {currentSymbol}...)
                  </span>
                )}
              </p>
              <div className="expiry-container">
                <select
                  name="strExpiry"
                  id="strExpiry"
                  onChange={handleChange}
                  value={formData.strExpiry}
                  disabled={isLoading}
                >
                  {expiryList?.map((exData, key) => {
                    const isSelected = formData.strExpiry === exData;
                    return (
                      <option key={key} value={exData}>
                        {exData}
                      </option>
                    );
                  })}
                </select>
                <Tooltip
                  arrow
                  enterTouchDelay={0}
                  leaveTouchDelay={10000}
                  componentsProps={tooltipDesign}
                  title="Chart"
                >
                  <span
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
                  </span>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="options-grid option-top-grid">
            <div className="text-danger negative" colSpan="5">
              CALLS
            </div>
            <div className="strike ">Strike</div>
            <div className="text-success positive" colSpan="5">
              PUTS
            </div>
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
        </div>
        <div className="price_content">
          {isLoading || isRefreshing ? (
            <ShimmerTable
              row={20}
              col={7}
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
                (peOption) => peOption?.strikePrice === val?.strikePrice,
              );

              const ceProduct = symbolValueCE[val?.identifier]?.product;
              const peProduct = symbolValuePE[pe?.identifier]?.product;

              return (
                <div
                  key={key}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`${
                    ceProduct == "ATM" ? "main-content" : ""
                  } row position-relative`}
                  ref={ceProduct == "ATM" ? sectionRef : null}
                >
                  <div
                    className={`${ceProduct == "ITM" ? "secondary-color" : ""}`}
                    onMouseEnter={handleMouseEnter(key, "CE")}
                  >
                    {symbolValueCE[val?.identifier]?.product}
                  </div>
                  <div
                    onMouseEnter={handleMouseEnter(key, "CE")}
                    className={`${ceProduct == "ITM" ? "secondary-color" : ""}`}
                  >
                    {symbolValueCE[val?.identifier]?.priceChangePercentage ==
                    0 ? (
                      symbolValueCE[val?.identifier]?.priceChangePercentage
                    ) : symbolValueCE[val?.identifier]?.priceChangePercentage >
                      0 ? (
                      <div className="text-success">
                        <IconRegistry name="caret-up" size={20} />
                        {symbolValueCE[val?.identifier]?.priceChangePercentage}
                      </div>
                    ) : (
                      <div className="text-danger">
                        <IconRegistry name="caret-down" size={20} />
                        {symbolValueCE[val?.identifier]?.priceChangePercentage}
                      </div>
                    )}
                  </div>
                  <div
                    onMouseEnter={handleMouseEnter(key, "CE")}
                    className={`${ceProduct == "ITM" ? "secondary-color" : ""}`}
                  >
                    {symbolValueCE[val?.identifier]?.lastTradePrice}
                    {/* <div className="btn-action-main">
                                                <button
                            onClick={handleClickButton(key, "CE")}
                          >
                        <IconRegistry name="dots-horizontal" size={20} />
                      </button>

                      {(clickedIndex === key && clickedType === "CE") ||
                      (isAnalysis == "CE" &&
                        val?.identifier == analysis?.identifier) ? (
                        <div className="btn-both-side">
                          <button
                            type="button"
                            className={`option-chain-btn`}
                            onClick={
                              activeSubscriptionFeatures?.liveCharts?.enabled == false
                                ? () => handleClickDialogOpen()
                                : () => handleChartNavigation(val?.identifier, { baseSymbol: val?.identifier, type: 'CE', optionData: val })
                            }
                          >
                            <Tooltip
                              arrow
                              enterTouchDelay={0}
                              leaveTouchDelay={10000}
                              componentsProps={tooltipDesign}
                              title="Chart"
                            >
                              <IconRegistry name="chart-area" size={13} />
                            </Tooltip>
                          </button>
                        </div>
                      ) : (
                        ""
                      )}
                    </div> */}
                  </div>

                  <div className="strike">
                    {symbolValueCE[val?.identifier]?.strikePrice}
                  </div>

                  {(hoveredIndex === key && hoveredType === "CE") ||
                  (isAnalysis == "CE" &&
                    val?.identifier == analysis?.identifier &&
                    clickedIndex == null) ? (
                    <div className="left-box-btn">
                      <button
                        type="button"
                        className={`option-chain-btn`}
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
                        <Tooltip
                          arrow
                          enterTouchDelay={0}
                          leaveTouchDelay={10000}
                          componentsProps={tooltipDesign}
                          title="Chart"
                        >
                          <IconRegistry name="chart-area" size={13} />
                        </Tooltip>
                      </button>
                    </div>
                  ) : (
                    ""
                  )}
                  {pe ? (
                    <>
                      <div
                        onMouseEnter={handleMouseEnter(key, "PE")}
                        className={`${
                          peProduct == "ITM" ? "secondary-color" : ""
                        }`}
                      >
                        {/* <div className="btn-action-main">
                          <button
                            onClick={handleClickButton(key, "PE")}
                          >
                            <IconRegistry name="dots-horizontal" size={20} />
                          </button>

                          {(clickedIndex === key && clickedType === "PE") ||
                          (isAnalysis == "PE" &&
                            pe?.identifier == analysis?.identifier) ? (
                            <div className="btn-both-side">
                              <button
                                type="button"
                                className={`option-chain-btn`}
                                onClick={
                                  activeSubscriptionFeatures?.liveCharts?.enabled == false
                                    ? () => handleClickDialogOpen()
                                    : () => handleChartNavigation(pe?.identifier, { baseSymbol: pe?.identifier, type: 'PE', optionData: pe })
                                }
                              >
                                <Tooltip
                                  arrow
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  componentsProps={tooltipDesign}
                                  title="Chart"
                                >
                                  <IconRegistry name="chart-area" size={13} />
                                </Tooltip>
                              </button>
                            </div>
                          ) : (
                            ""
                          )}
                        </div> */}
                        {symbolValuePE[pe?.identifier]?.lastTradePrice}
                      </div>
                      <div
                        onMouseEnter={handleMouseEnter(key, "PE")}
                        className={`${
                          peProduct == "ITM" ? "secondary-color" : ""
                        }`}
                      >
                        {symbolValuePE[pe?.identifier]?.priceChangePercentage ==
                        0 ? (
                          symbolValuePE[pe?.identifier]?.priceChangePercentage
                        ) : symbolValuePE[pe?.identifier]
                            ?.priceChangePercentage > 0 ? (
                          <div className="text-success">
                            <IconRegistry name="caret-up" size={20} />
                            {
                              symbolValuePE[pe?.identifier]
                                ?.priceChangePercentage
                            }
                          </div>
                        ) : (
                          <div className="text-danger">
                            <IconRegistry name="caret-down" size={20} />
                            {
                              symbolValuePE[pe?.identifier]
                                ?.priceChangePercentage
                            }
                          </div>
                        )}
                      </div>
                      <div
                        onMouseEnter={handleMouseEnter(key, "PE")}
                        className={`${
                          peProduct == "ITM" ? "secondary-color" : ""
                        }`}
                      >
                        {symbolValuePE[pe?.identifier]?.product}{" "}
                      </div>
                      {(hoveredIndex === key && hoveredType === "PE") ||
                      (isAnalysis == "PE" &&
                        pe?.identifier == analysis?.identifier &&
                        clickedIndex == null) ? (
                        <div className="left-box-btn right-box-btn">
                          <button
                            type="button"
                            className={`option-chain-btn`}
                            onClick={
                              activeSubscriptionFeatures?.liveCharts?.enabled ==
                              false
                                ? () => handleClickDialogOpen()
                                : () =>
                                    handleChartNavigation(pe?.identifier, {
                                      baseSymbol: pe?.identifier,
                                      type: "PE",
                                      optionData: pe,
                                    })
                            }
                          >
                            <Tooltip
                              arrow
                              enterTouchDelay={0}
                              leaveTouchDelay={10000}
                              componentsProps={tooltipDesign}
                              title="Chart"
                            >
                              <IconRegistry name="chart-area" size={13} />
                            </Tooltip>
                          </button>
                        </div>
                      ) : (
                        ""
                      )}
                    </>
                  ) : (
                    <>
                      <div>-</div>
                      <div>-</div>
                      <div>-</div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      {dialogOpen && (
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}
    </div>
  );
};

export default OptionChainCard;
