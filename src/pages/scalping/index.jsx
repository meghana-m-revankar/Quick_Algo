import { IconRegistry } from "#components";
import React, { useEffect, useRef } from "react";
import "./scalping.scss";
import { useNavigate } from "react-router-dom";
import Form from "react-bootstrap/Form";
import Tooltip from "@mui/material/Tooltip";
import flatpickr from "flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { SymbolSelectorDropdown } from "#components";

import useScalping from "./scalping";
import useSymbolDetails from "#hooks/useSymbol";
import { tooltipDesign } from "#constant/index";
import { ButtonLoader } from "#components";
const Scalping = () => {
  const navigate = useNavigate();
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const {
    watchList,
    handleChange,
    lotSize,
    expiryList,
    spotFutPrice,
    strikePriceCEList,
    strikePricePEList,
    formErrors,
    scalpingData,
    setScalpingData,
    strikePriceList,
    handleQtyChange,
    priceType,
    setPriceType,
    handlePriceType,
    handleDay,
    handleSubmit,
    isLoading,
    handleChildChange,
    handleCustomScalpingBtn,
    addCustomScalping,
    handleDeleteCustomScalpingRow,
    brokerList,
    handleDayChange,
  } = useScalping();

  const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);

  // Initialize flatpickr instances
  useEffect(() => {
    if (startTimeRef.current) {
      const startTimePicker = flatpickr(startTimeRef.current, {
        enableTime: true,
        noCalendar: false,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        placeholder: "Select start date and time",
        onChange: (selectedDates) => {
          const dateTimeString = selectedDates[0]
            ? selectedDates[0]
                .toLocaleString("sv-SE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
                .replace(",", "")
            : "";
          setScalpingData((prevState) => ({
            ...prevState,
            start_time: dateTimeString,
          }));
        },
      });

      return () => {
        startTimePicker.destroy();
      };
    }
  }, []);

  useEffect(() => {
    if (endTimeRef.current) {
      const endTimePicker = flatpickr(endTimeRef.current, {
        enableTime: true,
        noCalendar: false,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        placeholder: "Select end date and time",
        onChange: (selectedDates) => {
          const dateTimeString = selectedDates[0]
            ? selectedDates[0]
                .toLocaleString("sv-SE", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
                .replace(",", "")
            : "";
          setScalpingData((prevState) => ({
            ...prevState,
            end_time: dateTimeString,
          }));
        },
      });

      return () => {
        endTimePicker.destroy();
      };
    }
  }, []);

  const processedStrikePrices = (strikePriceList) => {
    let itmCounter = 0;
    let otmCounter = 0;

    return strikePriceList?.map((option) => {
      let label = "";

      if (option.product === "ITM") {
        itmCounter++;
        label = `ITM-${itmCounter}`;
      } else if (option.product === "OTM") {
        otmCounter++;
        label = `OTM-${otmCounter}`;
      } else {
        label = "ATM";
      }

      return { ...option, label };
    });
  };

  return (
    <div className="page-color data-scalping-page">
      <Form className="flex-data-div" onSubmit={handleSubmit}>
        <div className="div-flex-header-search">
          <div className="select-sec">
            <label className="select-label">Select Trading Symbol</label>
            <div className="select-wrapper">
              <SymbolSelectorDropdown
                name="SymbolIdentifierID"
                value={scalpingData?.SymbolIdentifierID || ""}
                onChange={handleChange}
                placeholder="Choose a symbol to trade"
                valueType="symbolIdentifierId"
                options={
                  watchList?.map((watch) => {
                    const watchSymbol = watchListSymbol[watch?.identifier];
                    return {
                      product: watchSymbol?.product,
                      identifier: watch?.identifier,
                      symbolIdentifierId: watchSymbol?.symbolIdentifierId,
                    };
                  }) || []
                }
              />
            </div>

            {/* Chart Button */}
            {scalpingData?.SymbolIdentifierID && (
              <Tooltip
                arrow
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                componentsProps={tooltipDesign}
                title="View Chart"
              >
                <span
                  className="chart-button"
                  onClick={() => {
                    const selectedSymbolId = scalpingData?.SymbolIdentifierID;

                    if (selectedSymbolId && watchList?.length > 0) {
                      const selectedOption = watchList.find((watch) => {
                        const watchSymbol = watchListSymbol[watch?.identifier];
                        return (
                          watchSymbol?.symbolIdentifierId == selectedSymbolId
                        );
                      });

                      if (selectedOption) {
                        navigate(`/chart`, {
                          state: { symbol: selectedOption?.identifier },
                        });
                      } else {
                        // Fallback: navigate with the ID itself
                        navigate(`/chart`, {
                          state: { symbol: selectedSymbolId },
                        });
                      }
                    }
                  }}
                >
                  <IconRegistry name="chart-area" />
                </span>
              </Tooltip>
            )}

            {formErrors?.["strategyReq[symbolIdentifierID]"] && (
              <div className="error-message">
                {formErrors?.["strategyReq[symbolIdentifierID]"]}
              </div>
            )}

            {(lotSize || (expiryList && expiryList.length > 0)) && (
              <div className="symbol-info-display">
                {lotSize && (
                  <div className="lot-size-section">
                    <span>Lot Size: {lotSize?.quotationLot}</span>
                  </div>
                )}

                {expiryList && expiryList.length > 0 && (
                  <div className="expiry-section">
                    <span>Expiry:</span>
                    <div className="expiry-dates-list">
                      {expiryList.slice(0, 3).map((expiry, index) => (
                        <span key={index} className="expiry-date-item">
                          {expiry}
                        </span>
                      ))}
                      {expiryList.length > 3 && (
                        <span className="expiry-more">
                          +{expiryList.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="header-top-main">
            <div className="div-flex-header">
              <div className="div-radio-btn-main">
                <Form className="flex-data-div">
                  <Form.Check
                    type="radio"
                    id="intraday-radio"
                    label="Intraday"
                    name="MarketPosition"
                    value={"Intraday"}
                    onChange={handleChange}
                    checked={scalpingData?.MarketPosition == "Intraday"}
                  />

                  <Form.Check
                    type="radio"
                    id="positional-radio"
                    label="Positional"
                    name="MarketPosition"
                    value={"Positional"}
                    onChange={handleChange}
                    checked={scalpingData?.MarketPosition == "Positional"}
                  />
                </Form>
              </div>
              <div className="info-box-main">
                <div className="box-one box-border">
                  <h3>SPOT</h3>
                  <p>
                    {" "}
                    {watchListSymbol[spotFutPrice?.spot]?.lastTradePrice ?? 0.0}
                  </p>
                </div>
                <div className="box-one">
                  <h3>FUTURE</h3>
                  <p>
                    {" "}
                    {watchListSymbol[spotFutPrice?.future]?.lastTradePrice ??
                      0.0}
                  </p>
                </div>
              </div>
              <select
                name="BrokerConfigId"
                className="form-control text-input"
                onChange={handleChange}
                value={scalpingData?.BrokerConfigId}
              >
                <option value="">Select Broker</option>
                {brokerList?.map((val, key) => {
                  return (
                    <option value={val?.brokerconfigID}>
                      {val?.brokerName}
                    </option>
                  );
                })}
              </select>
              {formErrors?.BrokerConfigId && (
                <div className="error-message">
                  {formErrors?.BrokerConfigId}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* flex-box-data */}
        <div class="scalping-box-flex">
          <div className="scalping-box-flex-one">
            <div className="label-div-data">
              <label style={{ display: "flex", flexDirection: "column" }}>
                <div
                  className="label-text-data"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    name="IsDesiredSpreadStrategy"
                    checked={scalpingData?.IsDesiredSpreadStrategy || false}
                    onChange={handleChange}
                  />
                  <span>Entry Spread Condition</span>
                  <Tooltip
                    arrow
                    componentsProps={tooltipDesign}
                    enterTouchDelay={0}
                    leaveTouchDelay={10000}
                    title={
                      <div style={{ padding: "8px" }}>
                        <span>
                          If you select Bank Nifty PE 49000 (Expiry –
                          weekly/monthly), Qty – 900, Step Quantity – 300, and
                          Range – 48700–49200 (Spot Basis):
                        </span>
                        <br />
                        <br />
                        <span>
                          It will split your order into 3 parts of 300 Qty each
                          and place them only when the spot price is within
                          48700–49200.
                        </span>
                        <br />
                        <br />
                        <span>
                          If the market moves out of this range, the system will
                          pause order placement and resume once the price comes
                          back within the range.
                        </span>
                      </div>
                    }
                  >
                    <IconRegistry
                      name="exclamation-octagon"
                      className="svg-tool"
                    />
                  </Tooltip>
                </div>
                <span className="span-btm">Market Orders Only</span>
              </label>
            </div>

            <div
              className={`new ${
                !scalpingData?.IsDesiredSpreadStrategy ? "disabled-section" : ""
              }`}
            >
              <div className="select-data-fildes">
                <div className="select-first">
                  <label>Action</label>
                  <select
                    name="DSSAction"
                    className="form-control text-input"
                    value={scalpingData?.DSSAction}
                    onChange={handleChange}
                    disabled={!scalpingData?.IsDesiredSpreadStrategy}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>

                <div className="select-sec">
                  <label>Instrument</label>
                  <select
                    name="DSSInstrument"
                    className="form-control text-input"
                    value={scalpingData?.DSSInstrument}
                    onChange={handleChange}
                    disabled={!scalpingData?.IsDesiredSpreadStrategy}
                  >
                    <option value="CE">CE</option>
                    <option value="PE">PE</option>
                    <option value="FUT">FUT</option>
                  </select>
                </div>

                <div className="select-sec">
                  <label>Expiry</label>
                  <select
                    name="DSSExpiryDate"
                    className="form-control text-input"
                    value={scalpingData?.DSSExpiryDate}
                    onChange={handleChange}
                    disabled={!scalpingData?.IsDesiredSpreadStrategy}
                  >
                    {expiryList.map((option, key) => (
                      <option key={key} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-sec">
                  <label>Strike</label>
                  <select
                    name="DSSStrikePrice"
                    className="form-control text-input "
                    value={scalpingData?.DSSStrikePrice}
                    onChange={handleChange}
                    disabled={scalpingData?.DSSInstrument == "FUT" ?? false}
                  >
                    {processedStrikePrices(strikePriceList)?.map(
                      (option, key) => {
                        return (
                          <option key={key} value={option.strikePrice}>
                            {priceType == "price"
                              ? option.strikePrice
                              : option?.label}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                <div className="mid-value-data">
                  <h3>LTP</h3>
                  <p>{scalpingData?.DSSLastTradedPrice}</p>
                </div>

                <div className="counter_btn_new">
                  <div>
                    <label>Quantity</label>
                  </div>
                  <div className="counter_btn">
                    <button
                      className="decrement"
                      onClick={() =>
                        handleQtyChange("decrement", "DSSQuantity")
                      }
                      disabled={!scalpingData?.IsDesiredSpreadStrategy}
                    >
                      -
                    </button>
                    <p>{scalpingData?.DSSQuantity}</p>
                    <button
                      className="increment"
                      onClick={() =>
                        handleQtyChange("increment", "DSSQuantity")
                      }
                      disabled={!scalpingData?.IsDesiredSpreadStrategy}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Slicing Section - Independent checkbox */}
              <div className="check-Slicing">
                <div className="label-div-data">
                  <label style={{ display: "flex", flexDirection: "column" }}>
                    <div
                      className="label-text-data"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="IsSlicing"
                        checked={scalpingData?.IsSlicing || false}
                        onChange={handleChange}
                      />
                      <span>Slicing</span>
                    </div>
                  </label>
                </div>

                {/* Slicing section always enabled (or can be styled differently) */}
                <div className="select-data-fildes">
                  <div className="counter_btn_new">
                    <div>
                      <label>Step Quantity</label>
                    </div>
                    <div className="counter_btn">
                      <button
                        className="decrement"
                        onClick={() =>
                          handleQtyChange("decrement", "SLStepQuantity")
                        }
                        disabled={!scalpingData?.IsSlicing}
                      >
                        -
                      </button>
                      <p>{scalpingData?.SLStepQuantity}</p>
                      <button
                        className="increment"
                        onClick={() =>
                          handleQtyChange("increment", "SLStepQuantity")
                        }
                        disabled={!scalpingData?.IsSlicing}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="mid-value-data">
                    <h3>No. Of Orders : </h3>
                    <p>{scalpingData?.SLNoOfOrders}</p>
                  </div>
                  <div className="select-sec">
                    <label>Initial Order Range</label>
                    <select
                      name="SLInitialOrderRange"
                      className="form-control text-input "
                      value={scalpingData?.SLInitialOrderRange}
                      onChange={handleChange}
                    >
                      <option value="SpotPrice">Spot Price</option>
                      <option value="FutPrice">Future Price</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                  <div className="input-data">
                    <label htmlFor="">From</label>
                    <input
                      type="text"
                      className="form-control text-input"
                      placeholder="0"
                      name="SLFrom"
                      onChange={handleChange}
                      value={scalpingData?.SLFrom}
                    />
                  </div>
                  <div className="input-data">
                    <label htmlFor="">To</label>
                    <input
                      type="text"
                      className="form-control text-input"
                      placeholder="0"
                      name="SLTo"
                      onChange={handleChange}
                      value={scalpingData?.SLTo}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="scalping-box-flex-two">
            <div className="label-div-data">
              <label style={{ display: "flex", flexDirection: "column" }}>
                <div
                  className="label-text-data"
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="checkbox"
                    name="IsDefineTime"
                    checked={scalpingData?.IsDefineTime || false}
                    onChange={handleChange}
                  />
                  <span>
                    Execution Time Frame{" "}
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div
                          style={{
                            padding: "8px",
                          }}
                        >
                          <span>
                            Create your scalping strategy by setting Start & End
                            Time, selecting days (e.g., Wed/Thu) and enabling
                            Intraday mode.
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="svg-tool"
                      />
                    </Tooltip>{" "}
                  </span>
                </div>
              </label>
            </div>

            {/* Time Configuration Banner */}
            <div className="time-configuration-banner">
              <div className="banner-content">
                <h2>Time Configuration</h2>
                <p>
                  Set trading days, expiry preferences, and execution timing for
                  your scalping strategy
                </p>
              </div>
            </div>

            <div
              className={`define-time-section ${
                !scalpingData?.IsDefineTime ? "disabled-section" : ""
              }`}
            >
              <div className="day-list-flex">
                <div className="day-list-data">
                  <label>DAY</label>
                  <ul>
                    <li
                      onClick={() => handleDayChange("Dtmonday", true)}
                      className={`${
                        scalpingData?.Dtmonday ? "active" : ""
                      } cursor-pointer`}
                    >
                      M
                    </li>
                    <li
                      onClick={() => handleDayChange("Dttuesday", true)}
                      className={`${
                        scalpingData?.Dttuesday ? "active" : ""
                      } cursor-pointer`}
                    >
                      T
                    </li>
                    <li
                      onClick={() => handleDayChange("Dtwednesday", true)}
                      className={`${
                        scalpingData?.Dtwednesday ? "active" : ""
                      } cursor-pointer`}
                    >
                      W
                    </li>
                    <li
                      onClick={() => handleDayChange("Dtthursday", true)}
                      className={`${
                        scalpingData?.Dtthursday ? "active" : ""
                      } cursor-pointer`}
                    >
                      T
                    </li>
                    <li
                      onClick={() => handleDayChange("Dtfriday", true)}
                      className={`${
                        scalpingData?.Dtfriday ? "active" : ""
                      } cursor-pointer`}
                    >
                      F
                    </li>
                    <li
                      onClick={() => handleDayChange("Dtsaturday", true)}
                      className={`${
                        scalpingData?.Dtsaturday ? "active" : ""
                      } cursor-pointer`}
                    >
                      S
                    </li>
                    <li
                      onClick={() => handleDayChange("Dtsunday", true)}
                      className={`${
                        scalpingData?.Dtsunday ? "active" : ""
                      } cursor-pointer`}
                    >
                      S
                    </li>
                  </ul>
                </div>

                <div className="expiry-list-data">
                  <label>EXPIRY</label>
                  <div className="btn-exp">
                    <button
                      className={`${
                        scalpingData?.DTExpiry == "weekly" ? "active" : ""
                      }`}
                      type="button"
                      onClick={() => handleDay("weekly")}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
              </div>

              {/* Time Selection */}
              <div className="time-selection-section">
                <div className="time-input-group">
                  <div className="time-input">
                    <label>Start Date & Time</label>
                    <input
                      ref={startTimeRef}
                      type="text"
                      className="form-control text-input"
                      placeholder="Select start date and time"
                      value={scalpingData?.start_time || ""}
                      readOnly
                    />
                  </div>

                  <div className="time-input">
                    <label>End Date & Time</label>
                    <input
                      ref={endTimeRef}
                      type="text"
                      className="form-control text-input"
                      placeholder="Select end date and time"
                      value={scalpingData?.end_time || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scalping Parameters */}
        <div className="scal-new-mid-data">
          <div className="heading-data">
            <h2>
              Scalping Configuration
              <Tooltip
                arrow
                componentsProps={tooltipDesign}
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                title={
                  <div
                    style={{
                      padding: "8px",
                    }}
                  >
                    <span>
                      Scalping Parameters let you control how and when positions
                      are added. Set Up/Down Points (based on Spot or Future) to
                      trigger entries
                    </span>
                    <br />
                    <br />
                    <span>
                      Choose Leg-wise Target/Stoploss or Continuous Buy/Sell
                    </span>
                  </div>
                }
              >
                <IconRegistry name="exclamation-octagon" className="svg-tool" />
              </Tooltip>{" "}
            </h2>
            <div className="top-button-pr-at">
              <button
                type="button"
                className={`${priceType == "price" ? "active" : ""}`}
                onClick={() => handlePriceType("price")}
              >
                {" "}
                PRICE
              </button>
              <button
                type="button"
                className={`${priceType == "atm" ? "active" : ""}`}
                onClick={() => handlePriceType("atm")}
              >
                ATM
              </button>
            </div>
          </div>
          <div className="all-input-main-data">
            <div className="select-up-down">
              <div className="select-new-data">
                <div className="select-first wd-50">
                  <select
                    name="Points"
                    className="form-control text-input"
                    value={scalpingData?.Points}
                    onChange={handleChange}
                  >
                    <option value="spotPoint">Spot Points</option>
                    <option value="futPoint">Future Points</option>
                  </select>
                </div>
              </div>
              <div className="up-down-arrow">
                <span className="up-arr">UP</span>
                <span className="dn-arr">DN</span>
              </div>
              <div className="point-data-input">
                <div className="label-flex">
                  <label>Point</label>
                  <div className="input-data wd-50">
                    <input
                      type="text"
                      name="UPPoint"
                      value={scalpingData?.UPPoint}
                      onChange={handleChange}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="input-data wd-50">
                  <input
                    type="text"
                    name="DNPoint"
                    value={scalpingData?.DNPoint}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div className="mid-arrow-data">
              <div className="select-data-fildes">
                <div className="select-first">
                  <label>Action</label>
                  <select
                    name="UPAction"
                    className="form-control text-input"
                    value={scalpingData?.UPAction}
                    onChange={handleChange}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>

                <div className="select-sec">
                  <label>Expiry</label>
                  <select
                    name="UPExpiryDate"
                    className="form-control text-input"
                    value={scalpingData?.UPExpiryDate}
                    onChange={handleChange}
                  >
                    {expiryList.map((option, key) => (
                      <option key={key} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-sec">
                  <label>Instrument</label>
                  <select
                    name="UPInstrument"
                    className="form-control text-input"
                    value={scalpingData?.UPInstrument}
                    onChange={handleChange}
                  >
                    <option value="CE">CE</option>
                    <option value="PE">PE</option>
                    <option value="FUT">FUT</option>
                  </select>
                </div>
                <div className="select-sec">
                  <label>Strike</label>
                  <select
                    name="UPStrikePrice"
                    className="form-control text-input "
                    value={scalpingData?.UPStrikePrice}
                    onChange={handleChange}
                    disabled={scalpingData?.UPInstrument == "FUT" ?? false}
                  >
                    {processedStrikePrices(strikePriceList)?.map(
                      (option, key) => {
                        return (
                          <option key={key} value={option.strikePrice}>
                            {priceType == "price"
                              ? option.strikePrice
                              : option?.label}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                <div className="counter_btn_new">
                  <div>
                    <label>Quantity</label>
                  </div>
                  <div className="counter_btn">
                    <button
                      className="decrement"
                      onClick={() => handleQtyChange("decrement", "UPQuantity")}
                    >
                      -
                    </button>
                    <p>{scalpingData?.UPQuantity}</p>
                    <button
                      className="increment"
                      onClick={() => handleQtyChange("increment", "UPQuantity")}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="select-data-fildes">
                <div className="select-first">
                  {/* <label>Action</label> */}
                  <select
                    name="DNAction"
                    className="form-control text-input"
                    value={scalpingData?.DNAction}
                    onChange={handleChange}
                  >
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>

                <div className="select-sec">
                  {/* <label>Expiry</label> */}
                  <select
                    name="DNExpiryDate"
                    className="form-control text-input"
                    value={scalpingData?.DNExpiryDate}
                    onChange={handleChange}
                  >
                    {expiryList.map((option, key) => (
                      <option key={key} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="select-sec">
                  {/* <label>Instrument</label> */}
                  <select
                    name="DNInstrument"
                    className="form-control text-input"
                    value={scalpingData?.DNInstrument}
                    onChange={handleChange}
                  >
                    <option value="CE">CE</option>
                    <option value="PE">PE</option>
                    <option value="FUT">FUT</option>
                  </select>
                </div>
                <div className="select-sec">
                  {/* <label>Strike</label> */}
                  <select
                    name="DNStrikePrice"
                    className="form-control text-input "
                    value={scalpingData?.DNStrikePrice}
                    onChange={handleChange}
                    disabled={scalpingData?.DNInstrument == "FUT" ?? false}
                  >
                    {processedStrikePrices(strikePriceList)?.map(
                      (option, key) => {
                        return (
                          <option key={key} value={option.strikePrice}>
                            {priceType == "price"
                              ? option.strikePrice
                              : option?.label}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>

                <div className="counter_btn_new">
                  {/* <div>
                  <label>Quantity</label>
                </div> */}
                  <div className="counter_btn">
                    <button
                      className="decrement"
                      onClick={() => handleQtyChange("decrement", "DNQuantity")}
                    >
                      -
                    </button>
                    <p>{scalpingData?.DNQuantity}</p>
                    <button
                      className="increment"
                      onClick={() => handleQtyChange("increment", "DNQuantity")}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Risk Management Banner */}
          <div className="risk-management-banner">
            <div className="banner-content">
              <h2>Risk Management</h2>
              <p>
                Configure target prices, stop losses, and exit strategies for
                optimal risk control
              </p>
            </div>
          </div>

          {/* Scalping Strategy Banner */}
          <div className="scalping-strategy-banner">
            <div className="banner-content">
              <h2>Scalping Strategy</h2>
              <p>
                Choose between target-based exit or continuous buy/sell
                execution strategy
              </p>
            </div>
          </div>

          <div className="last-arrow-data">
            <div className="radio-flex-data">
              <div className="flex-radio-1 radio-data-com">
                <div className="inner-label-data">
                  {scalpingData?.TradeStrategyType == "TargetSL" && (
                    <div className="section-box-bottom box-one-data">
                      <div className="select-data-fildes box-data-section">
                        <div className="select-sec">
                          <select
                            name="LWUPPRMType"
                            className="form-control text-input"
                            value={scalpingData?.LWUPPRMType}
                            onChange={handleChange}
                          >
                            <option value="point">PRM Pts</option>
                            <option value="%">PRM %</option>
                          </select>
                        </div>

                        <div className="input-text-section">
                          <label
                            className="d-block"
                            htmlFor="TakeProfitEstPrice"
                          >
                            Target
                          </label>
                          <input
                            type="text"
                            name="LWUPTarget"
                            value={scalpingData?.LWUPTarget}
                            onChange={handleChange}
                            placeholder="0"
                          />
                        </div>
                        <div className="input-text-section">
                          <label
                            className="d-block"
                            htmlFor="TakeProfitEstPrice"
                          >
                            Stop Loss
                          </label>
                          <input
                            type="text"
                            name="LWUPStopLoss"
                            value={scalpingData?.LWUPStopLoss}
                            onChange={handleChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div className="select-data-fildes box-data-section">
                        <div className="select-sec">
                          <select
                            name="LWDNPRMType"
                            className="form-control text-input"
                            value={scalpingData?.LWDNPRMType}
                            onChange={handleChange}
                          >
                            <option value="point">PRM Pts</option>
                            <option value="%">PRM %</option>
                          </select>
                        </div>

                        <div className="input-text-section">
                          <label
                            className="d-block"
                            htmlFor="TakeProfitEstPrice"
                          >
                            Target
                          </label>
                          <input
                            type="text"
                            name="LWDNTarget"
                            value={scalpingData?.LWDNTarget}
                            onChange={handleChange}
                            placeholder="0"
                          />
                        </div>
                        <div className="input-text-section">
                          <label
                            className="d-block"
                            htmlFor="TakeProfitEstPrice"
                          >
                            Stop Loss
                          </label>
                          <input
                            type="text"
                            name="LWDNStopLoss"
                            value={scalpingData?.LWDNStopLoss}
                            onChange={handleChange}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="label-div-data">
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      className="label-text-data"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="radio"
                        name="TradeStrategyType"
                        value="TargetSL"
                        onChange={handleChange}
                        checked={scalpingData?.TradeStrategyType == "TargetSL"}
                      />
                      <span>Leg-wise Target/ SL</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex-radio-2 radio-data-com">
                <div className="inner-label-data"></div>
                <div className="label-div-data">
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      className="label-text-data"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="radio"
                        name="TradeStrategyType"
                        value="ContinuousBS"
                        onChange={handleChange}
                        checked={
                          scalpingData?.TradeStrategyType == "ContinuousBS"
                        }
                      />
                      <span>Continuous Buy/Sell</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="scal-gparameters-mid">
          <div className="btm-gparameters-mid">
            <div className="no-times">
              <div className="label-div-data">
                <label style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    className="label-text-data"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>Repeat Entry Count </span>
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Set how many times to add positions on both Up and
                            Down moves
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="svg-tool"
                      />
                    </Tooltip>
                  </div>
                </label>
              </div>
              <div className="no-input">
                <input
                  type="text"
                  name="NoOfTimes"
                  value={scalpingData?.NoOfTimes}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="no-times">
              <div className="label-div-data">
                <label style={{ display: "flex", flexDirection: "column" }}>
                  <div
                    className="label-text-data"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="checkbox"
                      name="IsDefineRange"
                      checked={scalpingData?.IsDefineRange || false}
                      onChange={handleChange}
                    />
                    <span>Range for Scalping Trigger </span>
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Define Entry Range based on Spot or Future
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="svg-tool"
                      />
                    </Tooltip>
                  </div>
                </label>
              </div>
              <div className="select-data-fildes">
                <div className="select-first">
                  <label>Range Type</label>
                  <select
                    name="RangeType"
                    className="form-control text-input"
                    value={scalpingData?.RangeType}
                    disabled={!scalpingData?.IsDefineRange}
                    onChange={handleChange}
                  >
                    <option value="Futprice">Future Price</option>
                    <option value="SpotPrice">Spot Price</option>
                  </select>
                </div>
                <div className="no-input">
                  <input
                    type="text"
                    name="From"
                    className="form-control text-input"
                    value={scalpingData?.From}
                    disabled={!scalpingData?.IsDefineRange}
                    onChange={handleChange}
                    placeholder="From"
                  />
                </div>
                <div className="no-input">
                  <input
                    type="text"
                    name="To"
                    className="form-control text-input"
                    value={scalpingData?.To}
                    disabled={!scalpingData?.IsDefineRange}
                    onChange={handleChange}
                    placeholder="To"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Scalping */}
        <div className="scalping-parameters">
          <div className="heading-data">
            <h2>
              Smart Entry Scalping
              <Tooltip
                arrow
                componentsProps={tooltipDesign}
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                title={
                  <div
                    style={{
                      padding: "8px",
                    }}
                  >
                    <span>
                      Custom Scalping allows you to trade breakouts using Spot,
                      Future, or Premium basis.
                    </span>
                    <br />

                    <span>You define:</span>
                    <br />
                    <br />
                    <span>Entry Price (e.g., Bank Nifty 49500)</span>
                    <br />
                    <br />
                    <span>Target & Stoploss (e.g., TGT: 49800, SL: 49200)</span>
                    <br />
                    <br />
                    <span>
                      Instrument (e.g., Bank Nifty CE 49600), Expiry Weekly,
                      Quantity (e.g., 600)
                    </span>
                    <br />
                    <br />
                    <span>
                      Once the spot price crosses 49500, the system fires orders
                      based on your setup and exits automatically at the Target
                      or Stoploss level.
                    </span>
                  </div>
                }
              >
                <IconRegistry name="exclamation-octagon" className="svg-tool" />
              </Tooltip>{" "}
            </h2>
          </div>
          <div className="all-scalping-input">
            <div className="parameters-flex-data">
              {scalpingData?.CustomScalpingArr?.map((s, i) => {
                return (
                  <div className="select-data-fildes" key={i}>
                    <div className="select-first wd-50">
                      <label>Condition</label>
                      <select
                        className="form-control text-input"
                        name={`CustomScalpingArr[${i}].Condition`}
                        value={s?.Condition}
                        onChange={handleChildChange}
                      >
                        <option value="SpotPrice">Spot Price</option>
                        <option value="Futprice">Future Price</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                    <div className="select-first wd-50">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "2px",
                        }}
                      >
                        <button
                          type="button"
                          className={`operator-btn${
                            s?.GreaterOrSmall == "Greater" ? " active-gt" : ""
                          }`}
                          onClick={() =>
                            handleCustomScalpingBtn(
                              "GreaterOrSmall",
                              i,
                              "Greater"
                            )
                          }
                        >
                          &gt;
                        </button>
                        <button
                          type="button"
                          className={`operator-btn${
                            s?.GreaterOrSmall == "Small" ? " active-lt" : ""
                          }`}
                          onClick={() =>
                            handleCustomScalpingBtn(
                              "GreaterOrSmall",
                              i,
                              "Small"
                            )
                          }
                        >
                          &lt;
                        </button>
                      </div>
                    </div>

                    <div className="input-data wd-50">
                      <label>Value</label>
                      <input
                        type="text"
                        name={`CustomScalpingArr[${i}].Value`}
                        value={s?.Value}
                        onChange={handleChildChange}
                        placeholder="0"
                      />
                    </div>

                    <div className="select-first wd-50">
                      <label>Action</label>
                      <select
                        className="form-control text-input"
                        name={`CustomScalpingArr[${i}].Action`}
                        value={s?.Action}
                        onChange={handleChildChange}
                      >
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                      </select>
                    </div>

                    <div className="select-first wd-50">
                      <label>Instrument</label>
                      <select
                        className="form-control text-input"
                        name={`CustomScalpingArr[${i}].Instrument`}
                        value={s?.Instrument}
                        onChange={handleChildChange}
                      >
                        <option value="CE">CE</option>
                        <option value="PE">PE</option>
                        <option value="FUT">FUT</option>
                      </select>
                    </div>

                    <div className="select-first wd-50">
                      <label>Strike</label>
                      <select
                        className="form-control text-input"
                        name={`CustomScalpingArr[${i}].StrikePrice`}
                        value={s?.StrikePrice}
                        onChange={handleChildChange}
                        disabled={s?.Instrument == "FUT" ?? false}
                      >
                        {processedStrikePrices(strikePriceList)?.map(
                          (option, key) => {
                            return (
                              <option key={key} value={option.strikePrice}>
                                {priceType == "price"
                                  ? option.strikePrice
                                  : option?.label}
                              </option>
                            );
                          }
                        )}
                      </select>
                    </div>

                    <div className="select-sec">
                      <label>Expiry</label>
                      <select
                        className="form-control text-input"
                        name={`CustomScalpingArr[${i}].ExpiryDate`}
                        value={s?.ExpiryDate}
                        onChange={handleChildChange}
                      >
                        {expiryList.map((option, key) => (
                          <option key={key} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="counter_btn_new">
                      <div>
                        <label>Quantity</label>
                      </div>
                      <div className="counter_btn">
                        <button
                          className="decrement"
                          onClick={() =>
                            handleQtyChange("decrement", "Quantity", i)
                          }
                        >
                          -
                        </button>
                        <p>{s?.Quantity}</p>
                        <button
                          className="increment"
                          onClick={() =>
                            handleQtyChange("increment", "Quantity", i)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="input-data wd-50">
                      <label>Target Price</label>
                      <input
                        type="text"
                        name={`CustomScalpingArr[${i}].TargetPrice`}
                        value={s?.TargetPrice}
                        onChange={handleChildChange}
                        placeholder="0"
                      />
                    </div>

                    <div className="bottm-input-div">
                      <label>Stop Loss Price</label>
                      <input
                        type="text"
                        name={`CustomScalpingArr[${i}].StopLossPrice`}
                        value={s?.StopLossPrice}
                        onChange={handleChildChange}
                        placeholder="0"
                      />
                    </div>
                    {i > 0 ? (
                      <button
                        type="button"
                        className="btn btn-danger delete-row-btn"
                        style={{ padding: "10px" }}
                        onClick={() => handleDeleteCustomScalpingRow(i)}
                      >
                        <IconRegistry name="close" size={16} />
                      </button>
                    ) : (
                      ""
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => addCustomScalping()}
                className="btn btn-success"
              >
                +Add
              </button>
            </div>
          </div>
        </div>

        {/* Set Trade Parameters */}
        <div className="scalping-parameters mt-4">
          <div className="heading-data">
            <h2>
              Set Trade Parameters
              <Tooltip
                arrow
                componentsProps={tooltipDesign}
                enterTouchDelay={0}
                leaveTouchDelay={10000}
                title={
                  <div
                    style={{
                      padding: "8px",
                    }}
                  >
                    <span>You can choose between POINT or PERCENT (%).</span>
                  </div>
                }
              >
                <IconRegistry name="exclamation-octagon" className="svg-tool" />
              </Tooltip>{" "}
            </h2>
          </div>
          <div className="all-scalping-input">
            <div className="parameters-flex-data">
              <div className="select-data-fildes">
                <div className="input-data wd-50">
                  <label>Fixed Profit</label>
                  <input
                    type="text"
                    name="TpfixedProfit"
                    value={scalpingData?.TpfixedProfit}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>
                <div className="select-first wd-50">
                  <label>Type</label>
                  <select
                    className="form-control text-input"
                    name="Tptype"
                    value={scalpingData?.Tptype}
                    onChange={handleChange}
                  >
                    <option value="none">None</option>
                    <option value="LtProfit">Lock & trail Profit</option>
                    <option value="TP">Trail Profit</option>
                    <option value="TrailSL">Trailing S/L</option>
                    <option value="LGProfit">Log & Trail Profit</option>
                  </select>
                </div>

                <div className="select-sec wd-50">
                  <label>
                    {" "}
                    {scalpingData?.Tptype == "none" ||
                    scalpingData?.Tptype == "LtProfit" ||
                    scalpingData?.Tptype == "LGProfit"
                      ? "If Profit Reaches (X)"
                      : scalpingData?.Tptype == "TP"
                      ? "For Every increase in profit by (Fixed profit + X)"
                      : "For Every increase in profit by (X)"}{" "}
                  </label>
                  <div className="value-input-both">
                    <select
                      className="form-control text-input "
                      name="TpderivativeInstructions"
                      value={scalpingData?.TpderivativeInstructions}
                      onChange={handleChange}
                      disabled={scalpingData?.Tptype == "none" ? true : false}
                    >
                      <option value="value">value</option>
                      <option value="%">%</option>
                    </select>
                    <input
                      type="text"
                      name="TpderivativeValue"
                      value={scalpingData?.TpderivativeValue}
                      onChange={handleChange}
                      disabled={scalpingData?.Tptype == "none" ? true : false}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="input-data wd-50">
                  <label>
                    {" "}
                    {scalpingData?.Tptype == "none" ||
                    scalpingData?.Tptype == "LtProfit" ||
                    scalpingData?.Tptype == "LGProfit"
                      ? "Lock Profits At (Y)"
                      : scalpingData?.Tptype == "TP"
                      ? "Trail minimum profit by(Y)"
                      : "Trail Stoploss by (Y )"}{" "}
                  </label>
                  <input
                    type="text"
                    name="TplockProfitValue"
                    value={scalpingData?.TplockProfitValue}
                    onChange={handleChange}
                    disabled={scalpingData?.Tptype == "none" ? true : false}
                    placeholder="0"
                  />
                </div>

                <div className="bottm-input-div">
                  <label>Stop Loss</label>
                  <input
                    type="text"
                    name="TpstopLoss"
                    value={scalpingData?.TpstopLoss}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                {scalpingData?.Tptype == "LGProfit" ? (
                  <>
                    <div className="value-input-both">
                      <label>For Every increase in profit by (A)</label>
                      <select
                        name="PbderivativeInstructions"
                        value={scalpingData?.PbderivativeInstructions}
                        onChange={handleChange}
                        className="form-control text-input "
                      >
                        <option value="">value</option>
                        <option value="">%</option>
                      </select>
                      <input
                        type="text"
                        name="PbderivativeValue"
                        value={scalpingData?.PbderivativeValue}
                        onChange={handleChange}
                        className="form-control text-input "
                        placeholder="0"
                      />
                    </div>
                    <div className="value-input-both">
                      <label>Trail minimu profit by (B)</label>

                      <input
                        type="text"
                        name="TptrailMinProfit"
                        value={scalpingData?.TptrailMinProfit}
                        onChange={handleChange}
                        className="form-control text-input "
                        placeholder="0"
                      />
                    </div>
                  </>
                ) : (
                  ""
                )}
              </div>
            </div>
          </div>
        </div>
      </Form>

      {/* Fixed Action Bar - Submit Button */}
      <div className="action-bar">
        <div className="action-buttons">
          <button
            className="btn-primary btn-submit"
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <ButtonLoader isloading={true} />
            ) : (
              <>
                <span className="btn-icon">📤</span>
                Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Scalping;
