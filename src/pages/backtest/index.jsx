import { IconRegistry } from "#components";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./backtest.scss";
import Tooltip from "@mui/material/Tooltip";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LineChart } from "@mui/x-charts/LineChart";
import useBacktest from "./backtest";
import dayjs from "dayjs";
import { tooltipDesign } from "#constant/index";
import { CloneIcon, RemoveLegIcon } from "#icons";
import { ButtonLoader } from "#components";

const BackTest = () => {
  const navigate = useNavigate();
  const {
    symbolList,
    backtest,
    handleChange,
    handleButton,
    times,
    handleTimeChange,
    handleAddLeg,
    handleDeleteLeg,
    handleCloneLeg,
    startBacktest,
    listing,
    isLoading,
    listSummary,
    resetDatesToToday,
    strategyContext,
  } = useBacktest();

  const chunkedData = [
    listSummary?.slice(0, 6),
    listSummary?.slice(6, 12),
    listSummary?.slice(12),
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalTrades = listing?.length || 0;
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalTrades);
  const paginatedData = listing?.slice(startIdx - 1, endIdx) || [];
  const totalPages = Math.ceil(totalTrades / pageSize);

  // Ellipsis pagination logic
  function getPagination(current, total) {
    const lastCount = 3;
    const neighbors = 2;
    let pages = new Set();

    pages.add(1);

    for (let i = total - lastCount + 1; i <= total; i++) {
      if (i > 1) pages.add(i);
    }

    for (let i = current - neighbors; i <= current + neighbors; i++) {
      if (i > 1 && i < total - lastCount + 1) pages.add(i);
    }

    let arr = Array.from(pages)
      .filter((i) => i >= 1 && i <= total)
      .sort((a, b) => a - b);

    let result = [];
    for (let i = 0; i < arr.length; i++) {
      if (i > 0 && arr[i] !== arr[i - 1] + 1) {
        result.push("...");
      }
      result.push(arr[i]);
    }
    return result;
  }

  // Reset to page 1 if listing changes and currentPage is out of range
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [listing, totalPages, currentPage]);

  // Scroll to results section when backtest completes
  useEffect(() => {
    if (listing?.length > 0) {
      setTimeout(() => {
        const resultsSection = document.querySelector(".results-section");
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [listing]);

  return (
    <div className="backtest-page">
      {/* Header Section - Removed for performance optimization */}

      {/* Main Content */}
      <div className="backtest-content">
        {/* Configuration Section */}
        <div className="config-section">
          <div className="config-grid">
            {/* Trading Instrument Setup */}
            <div className="config-card">
              <div className="card-header">
                <div className="card-icon">📊</div>
                <h3>Trading Instrument Setup</h3>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label>Index</label>
                  <div className="flex-data-div">
                    <select
                      className="form-select"
                      value={backtest?.instrument?.index}
                      name="instrument[index]"
                      onChange={handleChange}
                    >
                      {symbolList.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    {/* Chart Button */}
                    {backtest?.instrument?.index && (
                      <Tooltip
                        arrow
                        enterTouchDelay={0}
                        leaveTouchDelay={10000}
                        componentsProps={tooltipDesign}
                        title="Chart"
                      >
                        <span
                          className="chart-button"
                          onClick={() => {
                            const selectedIndex = backtest?.instrument?.index;
                            if (selectedIndex) {
                              navigate(`/chart`, {
                                state: { symbol: selectedIndex },
                              });
                            }
                          }}
                          style={{ cursor: "pointer", marginLeft: "10px" }}
                        >
                          <IconRegistry name="chart-area" size={16} />
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label-with-tooltip">
                    Underlying Asset
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Select the underlying asset (like NIFTY, BANKNIFTY,
                            RELIANCE, etc.) for backtesting options strategies.
                            Only tradable option instruments are listed. For
                            futures or cash segment, the actual stock/index will
                            be directly used.
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="tooltip-icon"
                      />
                    </Tooltip>
                  </label>
                  <div className="button-group">
                    <button
                      className={`btn-toggle ${
                        backtest?.instrument?.underlying === "cash"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleButton("instrument.underlying", "cash")
                      }
                    >
                      Cash
                    </button>
                    <button
                      className={`btn-toggle ${
                        backtest?.instrument?.underlying === "futures"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleButton("instrument.underlying", "futures")
                      }
                    >
                      Futures
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label-with-tooltip">
                    Backtest Timeframe
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Set the start and end date for the backtest. This
                            defines the time period over which your strategy
                            will be tested.
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="tooltip-icon"
                      />
                    </Tooltip>
                  </label>
                  <div className="date-inputs">
                    <div className="date-input">
                      <label>Start Date</label>
                      <input
                        type="date"
                        className="form-input"
                        name="start_date"
                        value={backtest?.start_date}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="date-input">
                      <label>End Date</label>
                      <input
                        type="date"
                        className="form-input"
                        name="end_date"
                        value={backtest?.end_date}
                        onChange={handleChange}
                        max={strategyContext ? dayjs().format("YYYY-MM-DD") : undefined}
                      />
                    </div>
                  </div>
                  {strategyContext && (
                    <p className="backtest-strategy-hint">
                      Backtest is allowed from strategy creation date to today. Data is used only up to 1 minute before current time.
                    </p>
                  )}
                  <div className="date-reset-section">
                    <div className="current-date-info">
                      <span>Today: {dayjs().format("DD MMM YYYY")}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-reset-dates"
                      onClick={resetDatesToToday}
                    >
                      Reset to Today
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Entry Settings */}
            <div className="config-card">
              <div className="card-header">
                <div className="card-icon">⚡</div>
                <h3>Trade Entry Settings</h3>
              </div>
              <div className="card-content data-right-cpn">
                <div className="form-group">
                  <label className="form-label-with-tooltip">
                    Strategy Type
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Used to define the time when all open positions
                            should be closed. Commonly used in MIS, NRML, or CNC
                            backtesting to auto-exit trades at the end of the
                            trading day or strategy session.
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="tooltip-icon"
                      />
                    </Tooltip>
                  </label>
                  <div className="button-group">
                    <button
                      className={`btn-toggle ${
                        backtest?.entry?.strategy_type === "intraday"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleButton("entry.strategy_type", "intraday")
                      }
                    >
                      Intraday
                    </button>
                    <button
                      className={`btn-toggle ${
                        backtest?.entry?.strategy_type === "positional"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleButton("entry.strategy_type", "positional")
                      }
                    >
                      Positional
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Entry & Exit Times</label>
                  <div className="time-inputs">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["TimePicker"]}>
                        <TimePicker
                          label="Entry Time"
                          value={times.entry_time}
                          onChange={(newValue) =>
                            handleTimeChange(newValue, "entry_time")
                          }
                          timeSteps={{ minutes: 1 }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={["TimePicker"]}>
                        <TimePicker
                          label="Exit Time"
                          value={times.exit_time}
                          onChange={(newValue) =>
                            handleTimeChange(newValue, "exit_time")
                          }
                          timeSteps={{ minutes: 1 }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label-with-tooltip">
                    Range Breakout
                    <Tooltip
                      arrow
                      componentsProps={tooltipDesign}
                      enterTouchDelay={0}
                      leaveTouchDelay={10000}
                      title={
                        <div style={{ padding: "8px" }}>
                          <span>
                            Use this to define the candle range (high/low or
                            open/close) and the specific time range after which
                            trades should be triggered.
                          </span>
                          <br />
                          <br />
                          <span>
                            This ensures that the trade only happens after the
                            price breaks out from the selected candle's range
                            during your defined timeframe.
                          </span>
                        </div>
                      }
                    >
                      <IconRegistry
                        name="exclamation-octagon"
                        className="tooltip-icon"
                      />
                    </Tooltip>
                  </label>
                  <div className="range-bre-data"></div>
                  <div className="range-breakout-controls">
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        name="is_range"
                        onChange={handleChange}
                        checked={!!backtest?.is_range}
                      />
                      <span className="switch-slider"></span>
                    </label>
                    {backtest?.is_range && (
                      <div className="range-options">
                        <select
                          value={backtest?.range_type}
                          onChange={handleChange}
                          name="range_type"
                          className="form-select"
                        >
                          <option value="high">High</option>
                          <option value="low">Low</option>
                        </select>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DemoContainer components={["TimePicker"]}>
                            <TimePicker
                              label="Range Exit Time"
                              value={times.range_exit_time}
                              onChange={(newValue) =>
                                handleTimeChange(newValue, "range_exit_time")
                              }
                              timeSteps={{ minutes: 1 }}
                            />
                          </DemoContainer>
                        </LocalizationProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy Leg Builder */}
        <div className="leg-builder-section">
          <div className="section-header">
            {/* <div className="header-icon">🔧</div> */}
            <h2>Strategy Leg Builder</h2>
            <p>Configure each leg of your strategy with custom settings</p>
          </div>

          <div className="leg-builder-card">
            <div className="leg-config-grid">
              <div className="form-group">
                <label>Segment</label>
                <div className="button-group">
                  <button
                    className={`btn-toggle ${
                      backtest?.leg_builder?.segment === "future"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleButton("leg_builder.segment", "future")
                    }
                  >
                    Futures
                  </button>
                  <button
                    className={`btn-toggle ${
                      backtest?.leg_builder?.segment === "option"
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleButton("leg_builder.segment", "option")
                    }
                  >
                    Options
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Total Lot</label>
                <input
                  type="number"
                  className="form-input"
                  value={backtest?.leg_builder?.lot}
                  name="leg_builder[lot]"
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Position</label>
                <div className="button-group">
                  <button
                    className={`btn-toggle ${
                      backtest?.leg_builder?.position === "buy" ? "active" : ""
                    }`}
                    onClick={() => handleButton("leg_builder.position", "buy")}
                  >
                    Buy
                  </button>
                  <button
                    className={`btn-toggle ${
                      backtest?.leg_builder?.position === "sell" ? "active" : ""
                    }`}
                    onClick={() => handleButton("leg_builder.position", "sell")}
                  >
                    Sell
                  </button>
                </div>
              </div>

              {backtest?.leg_builder?.segment === "option" && (
                <>
                  <div className="form-group">
                    <label>Option Type</label>
                    <div className="button-group">
                      <button
                        className={`btn-toggle ${
                          backtest?.leg_builder?.op_type === "CE"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleButton("leg_builder.op_type", "CE")
                        }
                      >
                        Call
                      </button>
                      <button
                        className={`btn-toggle ${
                          backtest?.leg_builder?.op_type === "PE"
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          handleButton("leg_builder.op_type", "PE")
                        }
                      >
                        Put
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Strike Criteria</label>
                    <select
                      className="form-select"
                      value={backtest?.leg_builder?.strike_type}
                      name="leg_builder[strike_type]"
                      onChange={handleChange}
                    >
                      <option value="strike">Strike Price</option>
                      <option value="both_range">Premium Range</option>
                      <option value="greater_premium">Premium &gt;=</option>
                      <option value="lesser_premium">Premium &lt;=</option>
                    </select>
                  </div>

                  {backtest?.leg_builder?.strike_type === "both_range" ? (
                    <div className="range-inputs">
                      <div className="form-group">
                        <label>Lower Range</label>
                        <input
                          type="number"
                          className="form-input"
                          value={backtest?.leg_builder?.lower_range_value}
                          name="leg_builder[lower_range_value]"
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label>Upper Range</label>
                        <input
                          type="number"
                          className="form-input"
                          value={backtest?.leg_builder?.upper_range_value}
                          name="leg_builder[upper_range_value]"
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Premium</label>
                      <input
                        type={
                          backtest?.leg_builder?.strike_type === "strike"
                            ? "text"
                            : "number"
                        }
                        className="form-input"
                        value={backtest?.leg_builder?.premium}
                        disabled={
                          backtest?.leg_builder?.strike_type === "strike"
                        }
                        name="leg_builder[premium]"
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="add-leg-button">
              <button className="btn-primary" onClick={handleAddLeg}>
                <span className="btn-icon">+</span>
                Add Leg
              </button>
            </div>
          </div>

          {/* Created Legs */}
          {backtest?.legs?.length > 0 && (
            <div className="created-legs">
              <h3>Created Legs</h3>
              {backtest?.legs?.map((v, k) => (
                <div className="leg-card" key={v.id || k}>
                  <div className="leg-header">
                    <span className="leg-number">Leg {k + 1}</span>
                    <div className="leg-actions">
                      <button
                        className="btn-action btn-clone"
                        onClick={() => handleCloneLeg(k)}
                        title="Clone Leg"
                      >
                        <CloneIcon />
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDeleteLeg(k)}
                        title="Delete Leg"
                      >
                        <RemoveLegIcon />
                      </button>
                    </div>
                  </div>

                  <div className="leg-content">
                    <div className="leg-row">
                      <div className="form-group">
                        <label>Lot Size</label>
                        <input
                          type="number"
                          className="form-input"
                          name={`legs[${k}].lot`}
                          value={v?.lot}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="form-group">
                        <label>Position</label>
                        <select
                          className="form-select"
                          name={`legs[${k}].position`}
                          value={v?.position}
                          onChange={handleChange}
                        >
                          <option value="buy">Buy</option>
                          <option value="sell">Sell</option>
                        </select>
                      </div>

                      {v?.segment === "option" && (
                        <>
                          <div className="form-group">
                            <label>Option Type</label>
                            <select
                              className="form-select"
                              name={`legs[${k}].op_type`}
                              value={v?.op_type}
                              onChange={handleChange}
                            >
                              <option value="CE">Call</option>
                              <option value="PE">Put</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Strike Criteria</label>
                            <select
                              className="form-select"
                              name={`legs[${k}].strike_type`}
                              value={v?.strike_type}
                              onChange={handleChange}
                            >
                              <option value="strike">Strike Price</option>
                              <option value="both_range">Premium Range</option>
                              <option value="greater_premium">
                                Premium &gt;=
                              </option>
                              <option value="lesser_premium">
                                Premium &lt;=
                              </option>
                            </select>
                          </div>

                          {v?.strike_type === "both_range" ? (
                            <div className="range-inputs">
                              <div className="form-group">
                                <label>Lower Range</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  name={`legs[${k}].lower_range_value`}
                                  value={v?.lower_range_value}
                                  onChange={handleChange}
                                />
                              </div>
                              <div className="form-group">
                                <label>Upper Range</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  name={`legs[${k}].upper_range_value`}
                                  value={v?.upper_range_value}
                                  onChange={handleChange}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="form-group">
                              <label>Premium</label>
                              <input
                                type="number"
                                className="form-input"
                                name={`legs[${k}].premium`}
                                value={v?.premium}
                                onChange={handleChange}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="leg-row">
                      <div className="form-group">
                        <label className="form-label-with-switch">
                          <span>Target Profit</span>
                          <label className="switch-container">
                            <input
                              type="checkbox"
                              name={`legs[${k}].tp_check`}
                              onChange={handleChange}
                              checked={!!v?.tp_check}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          name={`legs[${k}].tp`}
                          value={v?.tp}
                          disabled={!v?.tp_check}
                          onChange={handleChange}
                          placeholder="Target Profit"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label-with-switch">
                          <span>Stop Loss</span>
                          <label className="switch-container">
                            <input
                              type="checkbox"
                              name={`legs[${k}].sl_check`}
                              onChange={handleChange}
                              checked={!!v?.sl_check}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </label>
                        <input
                          type="number"
                          className="form-input"
                          name={`legs[${k}].sl`}
                          value={v?.sl}
                          disabled={!v?.sl_check}
                          onChange={handleChange}
                          placeholder="Stop Loss"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label-with-switch">
                          <span>Trail SL</span>
                          <label className="switch-container">
                            <input
                              type="checkbox"
                              name={`legs[${k}].trail_sl_check`}
                              onChange={handleChange}
                              checked={!!v?.trail_sl_check}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </label>
                        <div className="trail-inputs">
                          <input
                            type="number"
                            className="form-input"
                            value={v?.trl_pr}
                            disabled={!v?.trail_sl_check}
                            name={`legs[${k}].trl_pr`}
                            onChange={handleChange}
                            placeholder="Profit"
                          />
                          <input
                            type="number"
                            className="form-input"
                            value={v?.trl_sl}
                            disabled={!v?.trail_sl_check}
                            name={`legs[${k}].trl_sl`}
                            onChange={handleChange}
                            placeholder="Stop Loss"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="leg-row">
                      <div className="form-group">
                        <label className="form-label-with-switch">
                          <span>Re-entry on SL</span>
                          <label className="switch-container">
                            <input
                              type="checkbox"
                              value={v?.re_entry_enabled}
                              name={`legs[${k}].re_entry_enabled`}
                              onChange={handleChange}
                            />
                            <span className="switch-slider"></span>
                          </label>
                        </label>
                        <div className="reentry-controls">
                          <select
                            disabled={!v?.re_entry_enabled}
                            value={v?.reentry_type}
                            name={`legs[${k}].reentry_type`}
                            onChange={handleChange}
                            className="form-select"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="get_exit_price">
                              On Exit Price
                            </option>
                            <option value="old_price">Same Old Price</option>
                          </select>
                          <input
                            type="number"
                            className="form-input"
                            value={v?.max_re_entries}
                            disabled={!v?.re_entry_enabled}
                            name={`legs[${k}].max_re_entries`}
                            onChange={handleChange}
                            placeholder="Max Re-Entry"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Section */}
        {(listing?.length > 0 || listSummary?.length > 0) && (
          <div className="results-section">
            <div className="section-header">
              <div className="header-icon">📈</div>
              <h2>Backtest Results</h2>
              <p>Analysis of your strategy performance</p>
            </div>

            {/* Performance Chart - Using real data from API */}
            {listSummary && listSummary.length > 0 && (
              <div className="chart-card">
                <h3>Drawdown Analysis</h3>
                <div className="chart-container">
                  <LineChart
                    dataset={listSummary.map((item, index) => ({
                      date: `Day ${index + 1}`,
                      drawdown: item.value || 0,
                    }))}
                    xAxis={[
                      {
                        scaleType: "point",
                        dataKey: "date",
                        valueFormatter: (value) => value,
                      },
                    ]}
                    yAxis={[
                      {
                        dataKey: "drawdown",
                        valueFormatter: (value) => `${value.toLocaleString()}`,
                        label: "Drawdown",
                      },
                    ]}
                    series={[
                      {
                        dataKey: "drawdown",
                        color: "#e63946",
                        showMark: false,
                      },
                    ]}
                    height={300}
                    sx={{
                      ".MuiLineElement-root": {
                        stroke: "#e63946",
                        strokeWidth: 2,
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Performance Statistics */}
            {listSummary && listSummary.length > 0 && (
              <div className="stats-grid">
                {chunkedData.map((group, i) => (
                  <div key={i} className="stats-column">
                    {group.map((item, idx) => (
                      <div className="stat-item" key={idx}>
                        <div className="stat-label">{item?.title || "-"}</div>
                        <div className={`stat-value ${item?.color || ""}`}>
                          {item?.value || "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Results Table */}
            <div className="results-table-card">
              <div className="table-header">
                <h3>Detailed Trade Report</h3>
                <div className="table-info">
                  <span>
                    {totalTrades > 0 ? (
                      <>
                        Showing {startIdx} - {endIdx} trades out of{" "}
                        {totalTrades}
                      </>
                    ) : (
                      "No trades available"
                    )}
                  </span>
                </div>
              </div>

              <div className="table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Index</th>
                      <th>Entry Date</th>
                      <th>Entry Time</th>
                      <th>Exit Date</th>
                      <th>Exit Time</th>
                      <th>Type</th>
                      <th>Strike</th>
                      <th>B/S</th>
                      <th>Qty</th>
                      <th>Entry Price</th>
                      <th>Exit Price</th>
                      <th>Exit Condition</th>
                      <th>P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((item, i) => (
                        <tr key={i}>
                          <td>{item.index || "-"}</td>
                          <td>{item.entry_date || "-"}</td>
                          <td>{item.leg_entry_timestamp || "-"}</td>
                          <td>{item.exit_date || "-"}</td>
                          <td>{item.leg_exit_time || "-"}</td>
                          <td>{item.type || "-"}</td>
                          <td>
                            {item.type === "OPTION"
                              ? item.symbolname || "-"
                              : item.strike || "-"}
                          </td>
                          <td>{item.b_s || "-"}</td>
                          <td>{item.qty || "-"}</td>
                          <td>{item.entry_price || "-"}</td>
                          <td>{item.exit_price || "-"}</td>
                          <td>
                            {!/^[A-Z]$/.test(item.index)
                              ? item.exit_condition === "No Condition"
                                ? "-"
                                : item.exit_condition || "-"
                              : "-"}
                          </td>
                          <td
                            className={
                              item.p_l === 0
                                ? ""
                                : item.p_l < 0
                                ? "loss"
                                : "profit"
                            }
                          >
                            {item.p_l === 0 ? "-" : item.p_l}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="13"
                          style={{ textAlign: "center", padding: "2rem" }}
                        >
                          No trades found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination and Actions */}
              {totalTrades > 0 && (
                <div className="table-footer">
                  <div className="table-actions">
                    <button className="btn-secondary">
                      <span className="btn-icon">📥</span>
                      Download Report
                    </button>
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination">
                      {getPagination(currentPage, totalPages).map((page, idx) =>
                        page === "..." ? (
                          <span
                            key={"ellipsis-" + idx}
                            className="pagination-ellipsis"
                          >
                            ...
                          </span>
                        ) : (
                          <button
                            key={page}
                            className={`pagination-btn ${
                              currentPage === page ? "active" : ""
                            }`}
                            onClick={() => setCurrentPage(page)}
                            disabled={currentPage === page}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-bar">
        <div className="action-buttons">
          <button
            className="btn-primary btn-start"
            type="button"
            disabled={isLoading}
            onClick={startBacktest}
          >
            {isLoading ? (
              <ButtonLoader isloading={true} />
            ) : (
              <>
                {/* <span className="btn-icon">▶️</span> */}
                Start Backtest
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackTest;
