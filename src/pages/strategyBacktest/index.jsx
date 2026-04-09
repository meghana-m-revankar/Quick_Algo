import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { asyncPostStartStrategyBacktest } from "#redux/backtest/action.js";
import { asyncGetAdminStrategyDetails } from "#redux/strategy/action";
import { handleCatchErrors } from "#utils/validation";
import { ButtonLoader } from "#components";
import "./strategyBacktest.scss";

const EVENT_BADGE = {
  ENTRY_CONDITION_MATCHED: { label: "Entry Matched", class: "badge-entry" },
  ORDER_FIRED: { label: "Order Fired", class: "badge-order" },
  EXIT_CONDITION_MATCHED: { label: "Exit Matched", class: "badge-exit" },
  EXIT_SL: { label: "Exit (RM SL)", class: "badge-exit-sl" },
  EXIT_BREAKEVEN_SL: {
    label: "Exit (RM Breakeven)",
    class: "badge-exit-breakeven",
  },
  EXIT_TRAIL_SL: { label: "Exit (RM Trail SL)", class: "badge-exit-trail" },
  EXIT_TARGET: { label: "Exit (RM Target)", class: "badge-exit-target" },
  SQUARE_OFF: { label: "Square Off", class: "badge-square" },
  NO_ENTRY: { label: "No Entry", class: "badge-no-entry" },
  NO_DATA: { label: "No Data", class: "badge-no-data" },
  ERROR: { label: "Error", class: "badge-error" },
};

const EXIT_REASON_LABEL = {
  SL: "RM Stop Loss",
  BREAKEVEN_SL: "RM Breakeven SL",
  TRAIL_SL: "RM Trail SL",
  TARGET: "RM Target",
  EXIT_CONDITION_MATCHED: "Exit Condition Matched",
  "End of session": "Square Off",
};

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: to.toISOString().slice(0, 10),
  };
}

const StrategyBacktest = () => {
  const { strategyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const defaultRange = getDefaultDateRange();
  const todayIso = new Date().toISOString().slice(0, 10);

  const [strategyDetailsLoading, setStrategyDetailsLoading] = useState(true);
  const [symbolsList, setSymbolsList] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dailyProcessList, setDailyProcessList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [strategyName, setStrategyName] = useState(
    location.state?.strategyName || "Strategy",
  );
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [fromDateInput, setFromDateInput] = useState(defaultRange.fromDate);
  const [toDateInput, setToDateInput] = useState(defaultRange.toDate);
  const [dailyPage, setDailyPage] = useState(1);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const symbolDropdownRef = useRef(null);
  const [backtestType, setBacktestType] = useState("full");
  const [strikePriceUsed, setStrikePriceUsed] = useState(null);
  const [legsStrikes, setLegsStrikes] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (symbolDropdownRef.current && !symbolDropdownRef.current.contains(e.target)) {
        setSymbolDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const DAILY_PER_PAGE = 8;
  const totalDailyPages = Math.max(1, Math.ceil((dailyProcessList?.length || 0) / DAILY_PER_PAGE));
  const paginatedDailyList = dailyProcessList.slice(
    (dailyPage - 1) * DAILY_PER_PAGE,
    dailyPage * DAILY_PER_PAGE
  );

  const runBacktest = useCallback(
    (fromDate, toDate, symbol, type) => {
      if (!strategyId) return;
      setIsLoading(true);
      setError(null);
      const payload = { strategyId };
      const hasCustomRange = !!fromDate && !!toDate;
      if (fromDate && toDate) {
        payload.fromDate = fromDate;
        payload.toDate = toDate;
      }
      if (symbol) payload.symbol = symbol;
      const effectiveType = type ?? backtestType;
      payload.backtestType = effectiveType === "spot" ? "spot" : "full";
      asyncPostStartStrategyBacktest(payload)
        .then((res) => {
          const data = res?.data;
          if (data?.status && Array.isArray(data?.data)) {
            setDailyProcessList(data.data);
            setDailyPage(1);
            setSummary(data.summary || null);
            if (data.strategyName) setStrategyName(data.strategyName);
            setStrikePriceUsed(data.strikePriceUsed ?? null);
            setLegsStrikes(Array.isArray(data.legsStrikes) ? data.legsStrikes : []);
            if (hasCustomRange) {
              // User ne manually from/to select kiya hai: inputs ko override mat karo
              setDateRange(data.dateRange || { fromDate, toDate });
            } else if (data.dateRange) {
              setDateRange(data.dateRange);
              setFromDateInput(data.dateRange.fromDate);
              setToDateInput(data.dateRange.toDate);
            } else if (data.data?.length) {
              const first = data.data[0]?.date;
              const last = data.data[data.data.length - 1]?.date;
              if (first && last) {
                setDateRange({ fromDate: first, toDate: last });
                setFromDateInput(first);
                setToDateInput(last);
              }
            }
          } else {
            setDailyProcessList([]);
            setSummary(null);
            setDateRange(null);
            setStrikePriceUsed(null);
            setLegsStrikes([]);
            setError(data?.msg || "No data");
          }
        })
        .catch((err) => {
          handleCatchErrors(err, navigate);
          setError(err?.response?.data?.msg || "Backtest failed");
          setDailyProcessList([]);
          setSummary(null);
          setDateRange(null);
          setStrikePriceUsed(null);
          setLegsStrikes([]);
        })
        .finally(() => setIsLoading(false));
    },
    [strategyId, navigate, backtestType],
  );

  // Fetch strategy details to get symbols list; then run backtest with resolved symbol
  useEffect(() => {
    if (!strategyId) {
      setError("Strategy ID missing");
      setStrategyDetailsLoading(false);
      return;
    }
    setStrategyDetailsLoading(true);
    setError(null);
    asyncGetAdminStrategyDetails(strategyId)
      .then((res) => {
        const data = res?.data?.data;
        if (!data) {
          setSymbolsList([]);
          setSelectedSymbol("");
          setStrategyDetailsLoading(false);
          return;
        }
        if (data.StrategyName || data.strategyName)
          setStrategyName(data.StrategyName || data.strategyName);
        const raw = data.selectedSymbols || [];
        const list = raw
          .map((s) => {
            const val = s.IdentifierName || s.identifier || s.ProductName || "";
            return val ? { value: val, label: val } : null;
          })
          .filter(Boolean);
        const uniq = list.filter(
          (item, i, arr) => arr.findIndex((x) => x.value === item.value) === i,
        );
        setSymbolsList(uniq);
        const firstSymbol = uniq.length > 0 ? uniq[0].value : "";
        setSelectedSymbol(firstSymbol);
        setStrategyDetailsLoading(false);
      })
      .catch((err) => {
        handleCatchErrors(err, navigate);
        setSymbolsList([]);
        setSelectedSymbol("");
        setStrategyDetailsLoading(false);
        setError(err?.response?.data?.message || "Failed to load strategy");
      });
  }, [strategyId]);

  const handleSymbolSelect = (sym) => {
    setSelectedSymbol(sym);
    setSymbolDropdownOpen(false);
    if (sym) {
      const from =
        fromDateInput && toDateInput ? fromDateInput.trim() : undefined;
      const to = fromDateInput && toDateInput ? toDateInput.trim() : undefined;
      runBacktest(from, to, sym, backtestType);
    }
  };

  const handleChangeDatesRun = () => {
    if (!fromDateInput || !toDateInput) return;
    const from = fromDateInput.trim();
    const to = toDateInput.trim();
    if (new Date(from) > new Date(to)) {
      setError("From date must be on or before To date.");
      return;
    }
    setError(null);
    runBacktest(from, to, symbolsList.length > 1 ? selectedSymbol : undefined, backtestType);
  };

  if (strategyDetailsLoading || (isLoading && !dailyProcessList?.length)) {
    return (
      <div className="strategy-backtest-page strategy-backtest-page-loading">
        <div className="strategy-backtest-wrapper">
          <div className="strategy-backtest-loading">
            <div className="strategy-backtest-loading-card">
              <ButtonLoader isloading={true} />
              <p className="strategy-backtest-loading-msg">
                {strategyDetailsLoading
                  ? "Loading strategy…"
                  : "Running backtest…"}
              </p>
              {!strategyDetailsLoading && (
                <p className="strategy-backtest-loading-hint">
                  Please wait, this may take a moment.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && dailyProcessList?.length === 0) {
    return (
      <div className="strategy-backtest-page strategy-backtest-page-error">
        <div className="strategy-backtest-wrapper">
          <div className="strategy-backtest-error">
            <div className="strategy-backtest-error-card">
              <p>{error}</p>
              <div className="strategy-backtest-error-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => runBacktest(undefined, undefined, undefined, backtestType)}
              >
                Retry (last 7 days)
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDisplayDate = (iso) => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const mi = parseInt(m, 10) - 1;
    return `${d}-${m}-${y}`;
  };

  return (
    <div className="strategy-backtest-page">
      <div className="strategy-backtest-wrapper">
        {/* Hero: strategy name + symbol (compact) */}
        <div className="strategy-backtest-hero">
          <div className="strategy-backtest-hero-main">
            <h2 className="strategy-backtest-hero-name">{strategyName}</h2>
            <p className="strategy-backtest-hero-desc">
              Same logic as deploy: 1-min data, indicators, entry/exit conditions
            </p>
          </div>
          {symbolsList.length > 0 && (
            <div className="strategy-backtest-symbol-wrap" ref={symbolDropdownRef}>
              <label>Symbol</label>
              <div
                className={`sb-symbol-dropdown ${symbolDropdownOpen ? "sb-open" : ""}`}
                onClick={() =>
                  !isLoading &&
                  symbolsList.length > 1 &&
                  setSymbolDropdownOpen((o) => !o)
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setSymbolDropdownOpen((o) => !o);
                }}
                aria-expanded={symbolDropdownOpen}
                aria-haspopup="listbox"
              >
                <span className="sb-symbol-value">
                  {selectedSymbol || "Select symbol"}
                </span>
                <span className="sb-symbol-arrow">▼</span>
                {symbolDropdownOpen && symbolsList.length > 1 && (
                  <ul
                    className="sb-symbol-options"
                    role="listbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {symbolsList.map((opt) => (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={selectedSymbol === opt.value}
                        className={`sb-symbol-option ${
                          selectedSymbol === opt.value ? "sb-selected" : ""
                        }`}
                        onClick={() => handleSymbolSelect(opt.value)}
                      >
                        {opt.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Backtest type: Full vs Spot */}
        <div className="strategy-backtest-type-row">
          <span className="sb-type-label">Backtest type</span>
          <label className="sb-radio-label">
            <input
              type="radio"
              name="backtestType"
              checked={backtestType === "full"}
              onChange={() => setBacktestType("full")}
              disabled={isLoading}
            />
            Full backtest
          </label>
          <label className="sb-radio-label">
            <input
              type="radio"
              name="backtestType"
              checked={backtestType === "spot"}
              onChange={() => setBacktestType("spot")}
              disabled={isLoading}
            />
            Spot backtest
          </label>
          {backtestType === "spot" && (
            <span className="sb-spot-hint">Uses strike from selected symbol&apos;s legs</span>
          )}
        </div>

        {/* Date banner + controls: one compact row */}
        <div className="strategy-backtest-top-row">
          {dateRange && (
            <div className="strategy-backtest-date-banner">
              <span className="date-label">Period</span>
              <span className="date-value">
                {formatDisplayDate(dateRange.fromDate)}
                <span className="date-sep">to</span>
                {formatDisplayDate(dateRange.toDate)}
              </span>
            </div>
          )}
          <div className="strategy-backtest-controls-row">
            <div className="form-group-inline">
              <label htmlFor="sb-from">From</label>
              <input
                id="sb-from"
                type="date"
                value={fromDateInput}
                onChange={(e) => setFromDateInput(e.target.value)}
                max={
                  toDateInput && toDateInput < todayIso ? toDateInput : todayIso
                }
              />
            </div>
            <div className="form-group-inline">
              <label htmlFor="sb-to">To</label>
              <input
                id="sb-to"
                type="date"
                value={toDateInput}
                onChange={(e) => setToDateInput(e.target.value)}
                min={fromDateInput || undefined}
                max={todayIso}
              />
            </div>
            <button
              type="button"
              className="btn-run-backtest"
              onClick={handleChangeDatesRun}
              disabled={isLoading}
            >
              {isLoading ? <ButtonLoader isloading={true} /> : "Run Backtest"}
            </button>
            {error && dailyProcessList?.length > 0 && (
              <p className="change-dates-error">{error}</p>
            )}
          </div>
        </div>

        <div
          className={`strategy-backtest-results ${
            dailyProcessList.length === 0 ? "sb-results-empty" : ""
          }`}
        >
          {/* Strike / legs used for this backtest */}
          {(strikePriceUsed != null || legsStrikes.length > 0) && (
            <div className="strategy-backtest-strike-row">
              {strikePriceUsed != null && (
                <span className="sb-strike-used">
                  Strike used: <strong>{strikePriceUsed}</strong>
                </span>
              )}
              {legsStrikes.length > 0 && (
                <span className="sb-legs-strikes">
                  Legs:{" "}
                  {legsStrikes
                    .map(
                      (l) =>
                        `${l.strikePrice != null ? l.strikePrice : "—"} ${(l.optionType || "").toString().toUpperCase()}`
                    )
                    .join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Summary cards */}
          {summary && (
            <div className="strategy-backtest-summary-grid">
              <div className="strategy-backtest-summary-card">
                <span className="summary-label">Total Days</span>
                <span className="summary-value">{summary.totalDays}</span>
              </div>
              <div className="strategy-backtest-summary-card highlight">
                <span className="summary-label">Days with Trade</span>
                <span className="summary-value">{summary.daysWithEntry}</span>
              </div>
              <div
                className={`strategy-backtest-summary-card summary-pnl ${(summary.totalPnl || 0) >= 0 ? "pnl-profit" : "pnl-loss"}`}
              >
                <span className="summary-label">Total P&L</span>
                <span className="summary-value">
                  {(summary.totalPnl ?? 0) >= 0 ? "+" : ""}
                  {summary.totalPnl ?? 0}
                </span>
              </div>
              <div className="strategy-backtest-summary-card">
                <span className="summary-label">Win Rate</span>
                <span className="summary-value">{summary.winRate}%</span>
              </div>
              <div className="strategy-backtest-summary-card summary-win">
                <span className="summary-label">Winning Days</span>
                <span className="summary-value">{summary.winningDays}</span>
              </div>
              <div className="strategy-backtest-summary-card summary-loss">
                <span className="summary-label">Losing Days</span>
                <span className="summary-value">{summary.losingDays}</span>
              </div>
            </div>
          )}

          <div className="strategy-backtest-daily-header">
            <h3 className="strategy-backtest-daily-heading">
              Daily breakdown
              {dailyProcessList.length === 0 &&
                " – run backtest to see day-wise trades and events"}
            </h3>
            {dailyProcessList.length > DAILY_PER_PAGE && (
              <div className="strategy-backtest-pagination">
                <button
                  type="button"
                  className="sb-page-btn"
                  onClick={() => setDailyPage((p) => Math.max(1, p - 1))}
                  disabled={dailyPage <= 1}
                >
                  Prev
                </button>
                <span className="sb-page-info">
                  {dailyPage} / {totalDailyPages}
                </span>
                <button
                  type="button"
                  className="sb-page-btn"
                  onClick={() => setDailyPage((p) => Math.min(totalDailyPages, p + 1))}
                  disabled={dailyPage >= totalDailyPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {dailyProcessList.length === 0 && (
            <div className="strategy-backtest-empty-state">
              <p className="strategy-backtest-empty-msg">
                Select date range and click <strong>Run Backtest</strong> to see day-wise trades and events.
              </p>
            </div>
          )}

          <div className="strategy-backtest-daily-list">
            {paginatedDailyList.map((day, idx) => {
              const dayIdx = (dailyPage - 1) * DAILY_PER_PAGE + idx;
              const hasTrade = !!day.tradeSummary;
              const statusBadge = day.events?.some((e) => e.type === "ERROR")
                ? "Error"
                : day.events?.some((e) => e.type === "NO_DATA")
                  ? "No Data"
                  : hasTrade
                    ? "Trade"
                    : "No Entry";
              const isSimpleCard = !hasTrade && (!day.events || day.events.length <= 1);
              const simpleMsg = day.events?.[0]?.message || "Entry conditions did not match during session";

              return (
                <div key={dayIdx} className={`strategy-backtest-day-card ${isSimpleCard ? "sb-day-simple" : ""}`}>
                  <div className="strategy-backtest-day-header">
                    <span className="strategy-backtest-badge badge-date">{day.date}</span>
                    <span className="strategy-backtest-badge badge-day">{day.dayName}</span>
                    <span
                      className={`strategy-backtest-badge badge-status status-${statusBadge.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {statusBadge}
                    </span>
                    {isSimpleCard && (
                      <span className="sb-day-simple-msg">{simpleMsg}</span>
                    )}
                  </div>

                  {hasTrade && day.tradeSummary && (
                    <div className="strategy-backtest-trade-details">
                      <div className="strategy-backtest-trade-grid">
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">Entry</span>
                          <span className="trade-value">
                            {day.tradeSummary.entryTime}
                          </span>
                        </div>
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">
                            Entry Price (spot)
                          </span>
                          <span className="trade-value">
                            {day.tradeSummary.entryPrice ?? "-"}
                          </span>
                        </div>
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">Exit</span>
                          <span className="trade-value">
                            {day.tradeSummary.exitTime}
                          </span>
                        </div>
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">
                            Exit Price (spot)
                          </span>
                          <span className="trade-value">
                            {day.tradeSummary.exitPrice ?? "-"}
                          </span>
                        </div>
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">Type</span>
                          <span
                            className={`strategy-backtest-badge badge-side ${day.tradeSummary.entryType}`}
                          >
                            {day.tradeSummary.entryType}
                          </span>
                        </div>
                        <div className="strategy-backtest-trade-item">
                          <span className="trade-label">P&L</span>
                          <span
                            className={`trade-value ${
                              (day.tradeSummary.pnl ?? 0) >= 0
                                ? "profit"
                                : "loss"
                            }`}
                          >
                            {(day.tradeSummary.pnl ?? 0) >= 0 ? "+" : ""}
                            {day.tradeSummary.pnl ?? "-"}
                          </span>
                        </div>
                        {day.tradeSummary.identifier && (
                          <div className="strategy-backtest-trade-item">
                            <span className="trade-label">
                              Order Identifier
                            </span>
                            <span className="trade-value">
                              {day.tradeSummary.identifier}
                            </span>
                          </div>
                        )}
                        {Array.isArray(day.tradeSummary.entryIndicators) &&
                          day.tradeSummary.entryIndicators.length > 0 && (
                            <div className="strategy-backtest-trade-item strategy-backtest-indicators">
                              <span className="trade-label">
                                Entry Indicators
                              </span>
                              <div className="trade-value indicators-list">
                                {day.tradeSummary.entryIndicators.map(
                                  (ind, idx) => (
                                    <span key={idx} className="indicator-chip">
                                      {ind.indicator}
                                      {ind.currentValue != null
                                        ? ` (${ind.currentValue})`
                                        : ""}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        {day.tradeSummary.identifier &&
                          day.tradeSummary.identifierDataMissing && (
                            <div className="strategy-backtest-trade-item">
                              <span className="trade-label">
                                Price Source
                              </span>
                              <span className="trade-value warning-text">
                                No historical data found for identifier. P&amp;L
                                is not based on option prices.
                              </span>
                            </div>
                          )}
                        {day.tradeSummary.identifier &&
                          day.tradeSummary.usesIdentifierPrice &&
                          !day.tradeSummary.identifierDataMissing && (
                            <div className="strategy-backtest-trade-item">
                              <span className="trade-label">
                                Price Source
                              </span>
                              <span className="trade-value">
                                Option price ({day.tradeSummary.identifier})
                              </span>
                            </div>
                          )}
                        {day.tradeSummary.exitReason && (
                          <div className="strategy-backtest-trade-item">
                            <span className="trade-label">
                              Exit Reason
                            </span>
                            <span className="trade-value">
                              <span
                                className={`strategy-backtest-badge ${
                                  EVENT_BADGE[
                                    `EXIT_${day.tradeSummary.exitReason}`
                                  ]?.class ||
                                  (day.tradeSummary.exitReason ===
                                  "EXIT_CONDITION_MATCHED"
                                    ? "badge-exit"
                                    : day.tradeSummary.exitReason ===
                                        "End of session"
                                      ? "badge-square"
                                      : "badge-default")
                                }`}
                              >
                                {EXIT_REASON_LABEL[
                                  day.tradeSummary.exitReason
                                ] || day.tradeSummary.exitReason}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isSimpleCard && (
                  <div className="strategy-backtest-events">
                    <span className="strategy-backtest-events-title">Events</span>
                    <ul className="strategy-backtest-event-list">
                      {day.events?.map((ev, evIdx) => {
                        const badge = EVENT_BADGE[ev.type] || {
                          label: ev.type,
                          class: "badge-default",
                        };
                        const hasMatchedCondition =
                          ev.matchedConditionsDetail?.length > 0;
                        return (
                          <li key={evIdx} className="strategy-backtest-event-row">
                            <div className="event-main">
                              <span className={`strategy-backtest-badge ${badge.class}`}>
                                {badge.label}
                              </span>
                              {ev.time && (
                                <span className="event-time">{ev.time}</span>
                              )}
                              {ev.entryType && (
                                <span
                                  className={`strategy-backtest-badge badge-side small ${ev.entryType}`}
                                >
                                  {ev.entryType}
                                </span>
                              )}
                              {ev.currentPrice != null && (
                                <span className="event-extra">
                                  Price: {ev.currentPrice}
                                </span>
                              )}
                              {ev.exitPrice != null && (
                                <span className="event-extra">
                                  Exit: {ev.exitPrice}
                                </span>
                              )}
                              {ev.pnl != null && (
                                <span
                                  className={`event-extra ${ev.pnl >= 0 ? "profit" : "loss"}`}
                                >
                                  P&L: {ev.pnl >= 0 ? "+" : ""}
                                  {ev.pnl}
                                </span>
                              )}
                              {ev.effectiveSL != null && (
                                <span className="event-extra">
                                  SL: {ev.effectiveSL}
                                </span>
                              )}
                              {ev.targetPoints != null && (
                                <span className="event-extra">
                                  Target: {ev.targetPoints}
                                </span>
                              )}
                              {ev.reason && (
                                <span className="event-extra">{ev.reason}</span>
                              )}
                              {ev.message && (
                                <span className="event-extra">
                                  {ev.message}
                                </span>
                              )}
                            </div>
                            {ev.type === "ORDER_FIRED" &&
                              Array.isArray(day.tradeSummary?.legs) &&
                              day.tradeSummary.legs.length > 0 && (
                                <div className="event-detail-box">
                                  <span className="detail-label">
                                    Per-leg details
                                  </span>
                                  <div className="legs-table">
                                    <div className="legs-header-row">
                                      <span className="legs-col legs-col-symbol">
                                        Symbol
                                      </span>
                                      <span className="legs-col legs-col-qty">
                                        Qty
                                      </span>
                                      <span className="legs-col legs-col-entry">
                                        Entry
                                      </span>
                                      <span className="legs-col legs-col-exit">
                                        Exit
                                      </span>
                                      <span className="legs-col legs-col-pnl">
                                        P&amp;L
                                      </span>
                                    </div>
                                    {day.tradeSummary.legs.map((leg) => (
                                      <div
                                        key={leg.index}
                                        className="legs-data-row"
                                      >
                                        <span className="legs-col legs-col-symbol">
                                          {leg.action} {leg.optionType || ""}{" "}
                                          {leg.strikePrice || ""}
                                          {leg.identifier
                                            ? ` (${leg.identifier})`
                                            : ""}
                                        </span>
                                        <span className="legs-col legs-col-qty">
                                          {leg.qty}
                                        </span>
                                        <span className="legs-col legs-col-entry">
                                          {leg.dataMissing
                                            ? "No historical option data"
                                            : leg.entryPrice != null
                                              ? leg.entryPrice
                                              : "-"}
                                        </span>
                                        <span className="legs-col legs-col-exit">
                                          {leg.dataMissing
                                            ? "No historical option data"
                                            : leg.exitPrice != null
                                              ? leg.exitPrice
                                              : "-"}
                                        </span>
                                        <span
                                          className={`legs-col legs-col-pnl ${
                                            (leg.pnlForQty ?? 0) >= 0
                                              ? "profit"
                                              : "loss"
                                          }`}
                                        >
                                          {leg.dataMissing
                                            ? "N/A"
                                            : leg.pnlForQty == null
                                              ? "-"
                                              : leg.pnlForQty === 0
                                                ? "0"
                                                : `${leg.pnlForQty > 0 ? "+" : ""}${leg.pnlForQty}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            {hasMatchedCondition && (
                              <div className="event-detail-box">
                                <span className="detail-label">
                                  Matched indicator & value
                                </span>
                                {ev.matchedConditionsDetail.map((mc, i) => (
                                  <div
                                    key={i}
                                    className="matched-condition-item"
                                  >
                                    <span className="condition-desc">
                                      {mc.indicator}
                                    </span>
                                    <span className="condition-value">
                                      {mc.currentValue != null
                                        ? mc.currentValue
                                        : "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyBacktest;
