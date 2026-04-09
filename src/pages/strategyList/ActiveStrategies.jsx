/**
 * ActiveStrategiesTest — TESTING VERSION
 *
 * Actual DB structure match karta hai:
 *   - Har processStrategy ek flat document hai
 *   - Re-entries = same strategyId, alag processStrategyId
 *   - Frontend groupBy(strategyId) karta hai
 *   - Latest entry = sabse naya executionTime wala
 *   - Purani entries = re-entry history
 */

import React, { useState, useMemo } from "react";
import "./strategyList.scss";

// ─────────────────────────────────────────────────────────────────────────────
// DUMMY DATA — exact same shape as actual MongoDB processStrategy documents
// Sirf processStrategyId alag hai, baaki fields same pattern
// ─────────────────────────────────────────────────────────────────────────────
const DUMMY_RAW_ENTRIES = [
  // ═══════════════════════════════════════════════════════════════════════
  // Strategy 1: RSI — 3 entries (2 completed re-entries + 1 current IN_TRADE)
  // ═══════════════════════════════════════════════════════════════════════

  // Entry 1 — COMPLETED (oldest)
  {
    processStrategyId: "z43h34x2o7n4_ENTRY_111111111",
    strategyId: "z43h34x2o7n4",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T04:20:00.000Z",
    executionType: "ENTRY",
    positionType: "long",
    status: "COMPLETED",
    orderStatus: "EXECUTED",
    symbol: "NIFTY",
    identifier: "NIFTY",
    StrategyName: "RSI Index Trading Strategy",
    LotSize: "65",
    transactionType: "both-side",
    interval: "5-min",
    executionPrice: 24120.0,
    exitPrice: 24280.0,
    conditionMatchedAt: "2026-03-18T04:20:00.000Z",
    exitTime: "2026-03-18T05:10:00.000Z",
    profitLoss: 10400,
    errorMessage: null,
    indicatorValues: { RSI: 62.4 },
    customerOptionsAlgochild: [],
    orderDetails: [
      {
        Identifier: "NIFTY",
        Quantity: 65,
        EntryPrice: 24120.0,
        OrderID: "ORD_111_1",
        orderStatus: 2,
      },
    ],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "wvhtet3z1706",
    entryConditions: {
      conditionGroups: [
        {
          id: 1,
          longEntry: {
            indicator1: "rsi",
            comparator: "crosses",
            period: 14,
            threshold: "60",
          },
        },
      ],
    },
  },

  // Entry 2 — COMPLETED (second trade, short)
  {
    processStrategyId: "z43h34x2o7n4_ENTRY_222222222",
    strategyId: "z43h34x2o7n4",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T05:25:00.000Z",
    executionType: "ENTRY",
    positionType: "short",
    status: "COMPLETED",
    orderStatus: "EXECUTED",
    symbol: "NIFTY",
    identifier: "NIFTY",
    StrategyName: "RSI Index Trading Strategy",
    LotSize: "65",
    transactionType: "both-side",
    interval: "5-min",
    executionPrice: 24310.0,
    exitPrice: 24190.0,
    conditionMatchedAt: "2026-03-18T05:25:00.000Z",
    exitTime: "2026-03-18T06:30:00.000Z",
    profitLoss: 7800,
    errorMessage: null,
    indicatorValues: { RSI: 47.1 },
    customerOptionsAlgochild: [],
    orderDetails: [
      {
        Identifier: "NIFTY",
        Quantity: 65,
        EntryPrice: 24310.0,
        OrderID: "ORD_222_1",
        orderStatus: 2,
      },
    ],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "wvhtet3z1706",
    entryConditions: {},
  },

  // Entry 3 — IN_TRADE (latest / current — exact match to DB sample shown)
  {
    processStrategyId: "z43h34x2o7n4_ENTRY_404567445",
    strategyId: "z43h34x2o7n4",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T09:20:28.593Z",
    executionType: "ENTRY",
    positionType: "long",
    status: "IN_TRADE",
    orderStatus: "PLACED",
    symbol: "NIFTY",
    identifier: "NIFTY",
    StrategyName: "RSI Index Trading Strategy",
    LotSize: "65",
    transactionType: "both-side",
    interval: "5-min",
    executionPrice: 24350.5,
    exitPrice: null,
    conditionMatchedAt: "2026-03-18T09:20:28.593Z",
    exitTime: null,
    profitLoss: null,
    errorMessage: null,
    indicatorValues: { RSI: 61.8 },
    customerOptionsAlgochild: [],
    orderDetails: [
      {
        Identifier: "NIFTY",
        Quantity: 65,
        EntryPrice: 24350.5,
        OrderID: "ORD_404_1",
        orderStatus: 1,
      },
    ],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "wvhtet3z1706",
    entryConditions: {
      useCombinedChart: false,
      conditionGroups: [
        {
          id: 1,
          longEntry: {
            indicator1: "rsi",
            comparator: "crosses",
            period: 14,
            multiplier: 3,
            threshold: "60",
            overboughtThreshold: "60",
          },
          shortEntry: {
            indicator1: "rsi",
            comparator: "crosses-below",
            period: 14,
            multiplier: 3,
            threshold: "50",
            overboughtThreshold: "50",
          },
        },
      ],
      groupOperators: [],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Strategy 2: MACD — 2 entries (1 completed + 1 current MONITORING)
  // ═══════════════════════════════════════════════════════════════════════

  {
    processStrategyId: "macd9x2k_ENTRY_111111111",
    strategyId: "macd9x2k",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T04:05:00.000Z",
    executionType: "ENTRY",
    positionType: "long",
    status: "COMPLETED",
    orderStatus: "EXECUTED",
    symbol: "BANKNIFTY",
    identifier: "BANKNIFTY",
    StrategyName: "MACD Divergence 12/26",
    LotSize: "15",
    transactionType: "only-long",
    interval: "5-min",
    executionPrice: 52100.0,
    exitPrice: 52480.0,
    conditionMatchedAt: "2026-03-18T04:05:00.000Z",
    exitTime: "2026-03-18T05:30:00.000Z",
    profitLoss: 5700,
    errorMessage: null,
    indicatorValues: { MACD: 42.5, Signal: 38.1, Histogram: 4.4 },
    customerOptionsAlgochild: [],
    orderDetails: [
      {
        Identifier: "BANKNIFTY",
        Quantity: 15,
        EntryPrice: 52100.0,
        OrderID: "ORD_MACD_1",
        orderStatus: 2,
      },
    ],
    MoveSlToCost: true,
    ProfitTrailing: false,
    adminStrategyId: "macdstrat01",
    entryConditions: {},
  },

  {
    processStrategyId: "macd9x2k_ENTRY_222222222",
    strategyId: "macd9x2k",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T07:45:00.000Z",
    executionType: "ENTRY",
    positionType: null,
    status: "MONITORING",
    orderStatus: "NOT_INITIATED",
    symbol: "BANKNIFTY",
    identifier: "BANKNIFTY",
    StrategyName: "MACD Divergence 12/26",
    LotSize: "15",
    transactionType: "only-long",
    interval: "5-min",
    executionPrice: 0,
    exitPrice: null,
    conditionMatchedAt: null,
    exitTime: null,
    profitLoss: null,
    errorMessage: "Waiting for MACD crossover signal",
    indicatorValues: { MACD: 45.2, Signal: 38.7, Histogram: 6.5 },
    customerOptionsAlgochild: [],
    orderDetails: [],
    MoveSlToCost: true,
    ProfitTrailing: false,
    adminStrategyId: "macdstrat01",
    entryConditions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Strategy 3: SuperTrend — 1 entry (BLOCKED)
  // ═══════════════════════════════════════════════════════════════════════
  {
    processStrategyId: "stx9q1m2_ENTRY_333333333",
    strategyId: "stx9q1m2",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T03:46:00.000Z",
    executionType: "ENTRY",
    positionType: null,
    status: "BLOCKED",
    orderStatus: "BLOCKED",
    symbol: "RELIANCE",
    identifier: "RELIANCE",
    StrategyName: "SuperTrend 7/3",
    LotSize: "25",
    transactionType: "both-side",
    interval: "1-min",
    executionPrice: 0,
    exitPrice: null,
    conditionMatchedAt: null,
    exitTime: null,
    profitLoss: null,
    errorMessage: "Broker token not available",
    indicatorValues: {},
    customerOptionsAlgochild: [],
    orderDetails: [],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "strstrat99",
    entryConditions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Strategy 4: ADX — REJECTED
  // ═══════════════════════════════════════════════════════════════════════
  {
    processStrategyId: "adx7r3k_ENTRY_444444444",
    strategyId: "adx7r3k",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T04:25:00.000Z",
    executionType: "ENTRY",
    positionType: "long",
    status: "FAILED",
    orderStatus: "REJECTED",
    symbol: "INFY",
    identifier: "INFY",
    StrategyName: "ADX Trend Filter 14",
    LotSize: "100",
    transactionType: "only-long",
    interval: "5-min",
    executionPrice: 1845.3,
    exitPrice: null,
    conditionMatchedAt: "2026-03-18T04:25:00.000Z",
    exitTime: null,
    profitLoss: null,
    errorMessage: "Order rejected: Insufficient margin",
    rejectionReason: "Insufficient margin for order placement",
    indicatorValues: { ADX: 28.5, PlusDI: 32.1, MinusDI: 18.4 },
    customerOptionsAlgochild: [],
    orderDetails: [
      {
        Identifier: "INFY",
        Quantity: 100,
        EntryPrice: 1845.3,
        OrderID: "ORD_ADX_1",
        orderStatus: 3,
      },
    ],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "adxstrat44",
    entryConditions: {},
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Strategy 5: SMA — WAITING_FOR_START_TIME
  // ═══════════════════════════════════════════════════════════════════════
  {
    processStrategyId: "sma5p2l_ENTRY_555555555",
    strategyId: "sma5p2l",
    executionDate: "2026-03-18",
    executionTime: "2026-03-18T03:50:28.000Z",
    executionType: "ENTRY",
    positionType: null,
    status: "WAITING_FOR_START_TIME",
    orderStatus: "WAITING_FOR_START_TIME",
    symbol: "HDFCBANK",
    identifier: "HDFCBANK",
    StrategyName: "SMA 20/50 Crossover",
    LotSize: "40",
    transactionType: "both-side",
    interval: "15-min",
    executionPrice: 0,
    exitPrice: null,
    conditionMatchedAt: null,
    exitTime: null,
    profitLoss: null,
    errorMessage: "Strategy is ready, waiting for time window (11:30 - 15:15)",
    indicatorValues: {},
    customerOptionsAlgochild: [],
    orderDetails: [],
    MoveSlToCost: false,
    ProfitTrailing: false,
    adminStrategyId: "smastrat55",
    entryConditions: {},
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GROUPING — strategyId ke basis pe group, executionTime desc sort
// Latest entry = parent row, purani entries = re-entry sub-table
// ─────────────────────────────────────────────────────────────────────────────
const groupEntriesByStrategy = (entries) => {
  const map = new Map();

  entries.forEach((entry) => {
    if (!map.has(entry.strategyId)) map.set(entry.strategyId, []);
    map.get(entry.strategyId).push(entry);
  });

  const grouped = [];
  map.forEach((strategyEntries) => {
    // Desc sort by executionTime — latest = index 0
    strategyEntries.sort(
      (a, b) => new Date(b.executionTime) - new Date(a.executionTime),
    );
    const latest = strategyEntries[0];
    const reEntries = strategyEntries.slice(1); // older entries = history

    grouped.push({
      ...latest,
      allEntries: reEntries,
      totalEntriesToday: strategyEntries.length,
    });
  });

  // Sort grouped list by latest executionTime desc
  grouped.sort((a, b) => new Date(b.executionTime) - new Date(a.executionTime));
  return grouped;
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatPrice = (price) => {
  if (price === null || price === undefined || price === "" || price === 0)
    return "N/A";
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num) || !isFinite(num)) return "N/A";
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateTime = (isoStr) => {
  if (!isoStr) return "—";
  try {
    return new Date(isoStr).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return isoStr;
  }
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "IN_TRADE":
    case "COMPLETED":
      return "status-executed";
    case "MONITORING":
    case "ENTRY_MONITORING":
    case "ENTRY_READY":
      return "status-pending";
    case "BLOCKED":
    case "FAILED":
    case "CANCELLED":
      return "status-failed";
    case "WAITING_FOR_START_TIME":
      return "status-monitoring";
    default:
      return "status-default";
  }
};

const getOrderStatusBadgeClass = (status) => {
  switch (status) {
    case "EXECUTED":
    case "PLACED":
      return "order-executed";
    case "PENDING":
      return "order-pending";
    case "REJECTED":
      return "order-rejected";
    case "BLOCKED":
      return "order-blocked";
    case "CANCELLED":
      return "order-cancelled";
    case "NOT_INITIATED":
    case "WAITING_FOR_START_TIME":
      return "order-not-initiated";
    default:
      return "order-default";
  }
};

const canStopStrategy = (s) => {
  if (s.orderStatus === "PLACED" || s.orderStatus === "EXECUTED") return false;
  if (["CANCELLED", "BLOCKED", "FAILED", "COMPLETED"].includes(s.status))
    return false;
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// ReEntryRow sub-component
// ─────────────────────────────────────────────────────────────────────────────
const ReEntryRow = ({ entry, index }) => {
  const pnl = entry.profitLoss ?? null;
  const pos = pnl !== null ? pnl >= 0 : null;
  return (
    <tr className="cpnl-reentry-row">
      <td className="cpnl-td-reentry-label">
        <span className="reentry-badge">#{index + 1}</span>
      </td>
      <td>
        <span
          className={`cpnl-status-badge ${getStatusBadgeClass(entry.status)}`}
        >
          {entry.status}
        </span>
      </td>
      <td>
        <span
          className={`order-badge ${getOrderStatusBadgeClass(entry.orderStatus)}`}
        >
          {entry.orderStatus}
        </span>
      </td>
      <td>
        <span
          className={
            entry.positionType === "long"
              ? "profit"
              : entry.positionType === "short"
                ? "loss"
                : ""
          }
        >
          {entry.positionType ? entry.positionType.toUpperCase() : "—"}
        </span>
      </td>
      <td>{formatPrice(entry.executionPrice)}</td>
      <td>{formatPrice(entry.exitPrice)}</td>
      <td>
        {pnl !== null ? (
          <span className={pos ? "profit" : "loss"}>
            {pos ? "▲" : "▼"} {formatPrice(pnl)}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td className="cpnl-td-time-small">
        {formatDateTime(entry.conditionMatchedAt || entry.executionTime)}
      </td>
      <td className="cpnl-td-time-small">{formatDateTime(entry.exitTime)}</td>
      <td style={{ fontSize: "10px", color: "#555" }}>
        {entry.processStrategyId}
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const ActiveStrategiesTest = () => {
  const groupedStrategies = useMemo(
    () => groupEntriesByStrategy(DUMMY_RAW_ENTRIES),
    [],
  );

  const [expandedId, setExpandedId] = useState(null);
  const [showReEntries, setShowReEntries] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStrategies = useMemo(() => {
    if (!searchQuery.trim()) return groupedStrategies;
    const q = searchQuery.toLowerCase();
    return groupedStrategies.filter(
      (s) =>
        (s.StrategyName || "").toLowerCase().includes(q) ||
        (s.symbol || "").toLowerCase().includes(q) ||
        (s.status || "").toLowerCase().includes(q),
    );
  }, [groupedStrategies, searchQuery]);

  const totalMTM = useMemo(
    () =>
      filteredStrategies.reduce(
        (sum, s) =>
          sum +
          (s.allEntries || []).reduce((acc, e) => acc + (e.profitLoss || 0), 0),
        0,
      ),
    [filteredStrategies],
  );

  const toggleExpand = (id) => setExpandedId((p) => (p === id ? null : id));
  const toggleReEntries = (e, strategyId) => {
    e.stopPropagation();
    setShowReEntries((p) => ({ ...p, [strategyId]: !p[strategyId] }));
  };

  return (
    <div className="active-strategies-container clientwise-pnl-theme">
      {/* TESTING BANNER */}
      <div
        style={{
          background: "linear-gradient(90deg,#1a1a2e,#16213e)",
          border: "1px solid #f5c518",
          borderRadius: "6px",
          padding: "7px 14px",
          marginBottom: "10px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "12px",
          color: "#f5c518",
          fontWeight: 600,
        }}
      >
        🧪 TESTING MODE — {DUMMY_RAW_ENTRIES.length} flat DB entries →&nbsp;
        grouped into {groupedStrategies.length} strategies&nbsp;
        <span style={{ color: "#888", fontWeight: 400 }}>
          | Same strategyId + alag processStrategyId = re-entry
        </span>
      </div>

      {/* HEADER */}
      <div className="clientwise-pnl-header">
        <div className="cpnl-title-wrap">
          <span className="cpnl-title">Active Strategies (Re-entry Test)</span>
          <span className="cpnl-chevron">▼</span>
          <div className="clientwise-pnl-tabs clientwise-pnl-tabs-in-header">
            <button type="button" className="cpnl-tab active">
              All{" "}
              <span className="cpnl-tab-badge">
                {filteredStrategies.length}
              </span>
            </button>
          </div>
        </div>
        <div className="cpnl-mtm-wrap">
          <span className="cpnl-mtm-label">Cumulative MTM (completed):</span>
          <span
            className={`cpnl-mtm-value ${totalMTM >= 0 ? "profit" : "loss"}`}
          >
            ₹ {totalMTM >= 0 ? "+" : ""}
            {totalMTM.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        <div className="cpnl-search-wrap">
          <span className="cpnl-search-icon">🔍</span>
          <input
            type="text"
            className="cpnl-search-input"
            placeholder="Search by name, symbol, status"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="clientwise-pnl-table-wrap">
        <table className="clientwise-pnl-table">
          <thead>
            <tr>
              <th className="cpnl-th-status">Status</th>
              <th className="cpnl-th-client">Symbol</th>
              <th className="cpnl-th-mtm">Re-entries Today</th>
              <th className="cpnl-th-algo">Strategy Name</th>
              <th className="cpnl-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStrategies.map((strategy) => {
              const isExpanded = expandedId === strategy.processStrategyId;
              const reEntries = strategy.allEntries || [];
              const hasReEntries = reEntries.length > 0;
              const reEntriesVisible = showReEntries[strategy.strategyId];
              const completedPnl = reEntries.reduce(
                (acc, e) => acc + (e.profitLoss || 0),
                0,
              );

              return (
                <React.Fragment key={strategy.processStrategyId}>
                  {/* MAIN ROW */}
                  <tr className={`cpnl-row ${isExpanded ? "expanded" : ""}`}>
                    <td className="cpnl-td-status">
                      <div
                        className={`cpnl-status-with-tooltip cpnl-status-tooltip-${getStatusBadgeClass(strategy.status)}`}
                      >
                        <span
                          className={`cpnl-status-badge ${getStatusBadgeClass(strategy.status)}`}
                        >
                          {strategy.status}
                        </span>
                        {strategy.errorMessage && (
                          <span className="cpnl-status-error-tooltip">
                            {strategy.errorMessage}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="cpnl-td-client">
                      <div>{strategy.symbol}</div>
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#555",
                          marginTop: "2px",
                        }}
                      >
                        {strategy.processStrategyId}
                      </div>
                    </td>

                    {/* Re-entry toggle pill */}
                    <td className="cpnl-td-mtm">
                      {hasReEntries ? (
                        <button
                          type="button"
                          onClick={(e) =>
                            toggleReEntries(e, strategy.strategyId)
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: reEntriesVisible
                              ? "#1e3a5f"
                              : "rgba(255,255,255,0.05)",
                            border: `1px solid ${reEntriesVisible ? "#4a9eff" : "rgba(255,255,255,0.12)"}`,
                            borderRadius: "20px",
                            padding: "3px 10px 3px 6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            color: reEntriesVisible ? "#4a9eff" : "#ccc",
                            fontWeight: 600,
                            transition: "all 0.18s",
                          }}
                        >
                          <span
                            style={{
                              background: "#f5c518",
                              color: "#111",
                              borderRadius: "50%",
                              width: "18px",
                              height: "18px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "10px",
                              fontWeight: 700,
                            }}
                          >
                            {reEntries.length}
                          </span>
                          {reEntriesVisible ? "▲ Hide" : "▼ Show"}
                          {completedPnl !== 0 && (
                            <span
                              className={completedPnl >= 0 ? "profit" : "loss"}
                              style={{ marginLeft: "2px" }}
                            >
                              {completedPnl >= 0 ? "+" : ""}
                              {formatPrice(completedPnl)}
                            </span>
                          )}
                        </button>
                      ) : (
                        <span style={{ color: "#444", fontSize: "12px" }}>
                          —
                        </span>
                      )}
                    </td>

                    <td className="cpnl-td-algo">
                      <button
                        type="button"
                        className="cpnl-algo-link"
                        onClick={() => toggleExpand(strategy.processStrategyId)}
                      >
                        {strategy.StrategyName}
                      </button>
                    </td>

                    <td className="cpnl-td-actions">
                      {canStopStrategy(strategy) && (
                        <button
                          type="button"
                          className="cpnl-action-btn stop"
                          onClick={() =>
                            alert(`[TEST] Stop: ${strategy.StrategyName}`)
                          }
                          title="Stop"
                        >
                          ⏹
                        </button>
                      )}
                      <button
                        type="button"
                        className="cpnl-action-btn expand"
                        onClick={() => toggleExpand(strategy.processStrategyId)}
                        title={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? "▼" : "▶"}
                      </button>
                    </td>
                  </tr>

                  {/* RE-ENTRY HISTORY SUB-TABLE */}
                  {hasReEntries && reEntriesVisible && (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          padding: "0 0 0 24px",
                          background: "rgba(74,158,255,0.02)",
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid rgba(74,158,255,0.2)",
                            borderRadius: "6px",
                            margin: "4px 8px 4px 0",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              padding: "6px 12px",
                              fontSize: "11px",
                              color: "#4a9eff",
                              fontWeight: 600,
                              letterSpacing: "0.5px",
                              borderBottom: "1px solid rgba(74,158,255,0.15)",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            🔄 RE-ENTRY HISTORY — {strategy.StrategyName}
                            <span
                              style={{
                                color: "#555",
                                fontWeight: 400,
                                marginLeft: "auto",
                                fontSize: "10px",
                              }}
                            >
                              strategyId: {strategy.strategyId}
                            </span>
                          </div>
                          <div className="orders-table" style={{ margin: 0 }}>
                            <table style={{ fontSize: "12px" }}>
                              <thead>
                                <tr>
                                  <th style={{ width: "50px" }}>#</th>
                                  <th>Status</th>
                                  <th>Order</th>
                                  <th>Position</th>
                                  <th>Entry ₹</th>
                                  <th>Exit ₹</th>
                                  <th>P&L</th>
                                  <th>Entry Time (IST)</th>
                                  <th>Exit Time (IST)</th>
                                  <th>processStrategyId</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reEntries.map((entry, idx) => (
                                  <ReEntryRow
                                    key={entry.processStrategyId}
                                    entry={entry}
                                    index={idx}
                                  />
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* EXPANDED DETAIL ROW */}
                  {isExpanded && (
                    <tr className="cpnl-expand-row">
                      <td colSpan={5} className="cpnl-expand-cell">
                        {strategy.errorMessage && (
                          <div className="cpnl-expand-error-first">
                            <span className="cpnl-expand-error-label">
                              Info
                            </span>
                            <span className="cpnl-expand-error-msg">
                              {strategy.errorMessage}
                            </span>
                          </div>
                        )}
                        <div className="strategy-quick-info cpnl-quick-info">
                          {(strategy.status === "MONITORING" ||
                            strategy.status === "ENTRY_MONITORING") && (
                            <div className="cpnl-entry-monitoring-note">
                              Monitoring Entry Condition
                            </div>
                          )}
                          <div className="info-item">
                            <span className="info-label">Position</span>
                            <span
                              className={`info-value ${strategy.positionType === "long" ? "profit" : strategy.positionType === "short" ? "loss" : ""}`}
                            >
                              {strategy.positionType
                                ? strategy.positionType.toUpperCase()
                                : "N/A"}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Entry Price</span>
                            <span className="info-value">
                              {formatPrice(strategy.executionPrice)}
                            </span>
                          </div>
                          {strategy.orderStatus === "REJECTED" &&
                            strategy.rejectionReason && (
                              <div className="info-item rejection-reason-item">
                                <span className="info-label">
                                  Rejection Reason
                                </span>
                                <span className="info-value rejected-reason">
                                  {strategy.rejectionReason}
                                </span>
                              </div>
                            )}
                        </div>

                        <div className="strategy-details-expanded">
                          <div className="details-section-header">
                            Current Entry Details
                          </div>
                          <div className="details-section">
                            <div className="details-grid">
                              <div className="detail-item">
                                <span className="detail-label">
                                  processStrategyId
                                </span>
                                <span
                                  className="detail-value"
                                  style={{ fontSize: "11px", color: "#888" }}
                                >
                                  {strategy.processStrategyId}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">strategyId</span>
                                <span
                                  className="detail-value"
                                  style={{ fontSize: "11px", color: "#888" }}
                                >
                                  {strategy.strategyId}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Lot Size</span>
                                <span className="detail-value">
                                  {strategy.LotSize}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Interval</span>
                                <span className="detail-value">
                                  {strategy.interval}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">Status</span>
                                <span
                                  className={`detail-value cpnl-status-badge ${getStatusBadgeClass(strategy.status)}`}
                                >
                                  {strategy.status}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">
                                  Order Status
                                </span>
                                <span
                                  className={`detail-value order-badge ${getOrderStatusBadgeClass(strategy.orderStatus)}`}
                                >
                                  {strategy.orderStatus}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">
                                  Execution Time
                                </span>
                                <span
                                  className="detail-value"
                                  style={{ fontSize: "11px" }}
                                >
                                  {formatDateTime(strategy.executionTime)}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="detail-label">
                                  Total Entries Today
                                </span>
                                <span className="detail-value profit">
                                  {strategy.totalEntriesToday}
                                </span>
                              </div>
                            </div>
                          </div>

                          {strategy.indicatorValues &&
                            Object.keys(strategy.indicatorValues).length >
                              0 && (
                              <div className="details-section">
                                <h4>Indicator Values</h4>
                                <div className="indicator-values">
                                  {Object.entries(strategy.indicatorValues).map(
                                    ([key, value]) => (
                                      <div key={key} className="indicator-item">
                                        <span className="indicator-name">
                                          {key}
                                        </span>
                                        <span className="indicator-value">
                                          {typeof value === "number"
                                            ? value.toFixed(2)
                                            : String(value)}
                                        </span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          {hasReEntries && (
                            <div className="details-section">
                              <h4>Re-entry Summary</h4>
                              <div className="details-grid">
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Total Entries
                                  </span>
                                  <span className="detail-value">
                                    {strategy.totalEntriesToday}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Re-entries
                                  </span>
                                  <span className="detail-value">
                                    {reEntries.length}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Completed P&L
                                  </span>
                                  <span
                                    className={`detail-value ${completedPnl >= 0 ? "profit" : "loss"}`}
                                  >
                                    {formatPrice(completedPnl)}
                                  </span>
                                </div>
                                <div className="detail-item">
                                  <span className="detail-label">
                                    Winning Trades
                                  </span>
                                  <span className="detail-value profit">
                                    {
                                      reEntries.filter(
                                        (e) => (e.profitLoss || 0) > 0,
                                      ).length
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .cpnl-reentry-row { background: rgba(74,158,255,0.03); }
        .cpnl-reentry-row td {
          padding: 6px 10px; font-size: 12px; color: #ccc;
          border-bottom: 1px solid rgba(74,158,255,0.08);
        }
        .reentry-badge {
          display: inline-flex; align-items: center;
          padding: 2px 8px;
          background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.3);
          border-radius: 12px; font-size: 11px; color: #f5c518; font-weight: 700;
        }
        .cpnl-td-time-small { font-size: 11px; color: #777; white-space: nowrap; }
        .cpnl-td-reentry-label { padding-left: 16px !important; }
      `}</style>
    </div>
  );
};

export default ActiveStrategiesTest;
