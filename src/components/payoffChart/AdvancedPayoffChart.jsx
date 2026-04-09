import React, { useState, useEffect, useMemo } from "react";
import { IconRegistry } from "#components";
import { StrategyAnalyzer } from "#utils/optionCalculations";
import ChartJSPayoffChart from "./ChartJSPayoffChart";
import "./AdvancedPayoffChart.scss";

const AdvancedPayoffChart = ({
  legs = [],
  spotPrice = 0,
  volatility = 0.2,
  timeToExpiry = 30,
  riskFreeRate = 0.05,
  showGreeks = true,
  showMetrics = true,
  greeksData = null, // Real Greeks data from useOptionGreeks hook
  realTimePrices = null, // Real-time prices for CE/PE options
  strategyRules = null, // Strategy rules with real-time P&L
}) => {
  // Ensure spotPrice is always a number
  const safeSpotPrice = Number(spotPrice) || 0;
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(safeSpotPrice);

  const analyzer = useMemo(
    () => new StrategyAnalyzer(riskFreeRate),
    [riskFreeRate]
  );

  // Convert legs format and analyze strategy
  useEffect(() => {
    if (!legs || legs.length === 0 || safeSpotPrice <= 0) {
      setAnalysis(null);
      return;
    }

    setIsLoading(true);

    try {
      const convertedLegs = analyzer.convertLegsFormat(legs);

      // Create current prices object for MTM calculation using real-time prices
      const currentPrices = {};
      convertedLegs.forEach((leg) => {
        if (leg.identifier) {
          // Try to get real-time price first
          let currentPrice = leg.premium; // Default to entry price

          if (realTimePrices) {
            // Look for real-time price in CE or PE data
            if (leg.instrument === "CE" && realTimePrices.ce) {
              const ceData = Object.values(realTimePrices.ce).find(
                (item) => item && item.strikePrice == leg.strikePrice
              );
              if (ceData?.lastTradePrice) {
                currentPrice = parseFloat(ceData.lastTradePrice);
              }
            } else if (leg.instrument === "PE" && realTimePrices.pe) {
              const peData = Object.values(realTimePrices.pe).find(
                (item) => item && item.strikePrice == leg.strikePrice
              );
              if (peData?.lastTradePrice) {
                currentPrice = parseFloat(peData.lastTradePrice);
              }
            }
          }

          currentPrices[leg.identifier] = currentPrice;
        }
      });

      const strategyAnalysis = analyzer.analyzeStrategy(
        convertedLegs,
        safeSpotPrice,
        volatility,
        timeToExpiry,
        currentPrices
      );

      setAnalysis(strategyAnalysis);
      setSelectedPrice(safeSpotPrice);
    } catch (error) {
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    legs,
    safeSpotPrice,
    volatility,
    timeToExpiry,
    analyzer,
    realTimePrices,
    strategyRules,
  ]);

  // Calculate payoff at selected price (for chart interaction)
  const payoffAtSelectedPrice = useMemo(() => {
    if (!analysis) return 0;

    const point = analysis.dataPoints.find(
      (p) =>
        Math.abs(p.price - selectedPrice) <
        (analysis.dataPoints[1]?.price - analysis.dataPoints[0]?.price) / 2
    );

    return point ? point.payoff : 0;
  }, [analysis, selectedPrice]);

  if (isLoading) {
    return (
      <div className="advanced-payoff-chart">
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <p>Calculating strategy analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="advanced-payoff-chart">
        <div className="no-data-message">
          <IconRegistry name="bar-chart" size={48} />
          <h3>No Strategy Data</h3>
          <p>Add legs and select a symbol to see payoff analysis</p>
        </div>
      </div>
    );
  }

  const {
    maxProfit,
    maxLoss,
    breakevenPoints,
    greeks,
    probabilityOfProfit,
    netPremium,
    mtm,
    marginRequirement,
    strategyType,
    riskRewardRatio,
  } = analysis;

  // Calculate total investment (absolute value of net premium)
  const totalInvestment = Math.abs(netPremium || 0);

  // Ensure greeksData is always defined
  const safeGreeksData = greeksData || {
    strategy: {
      delta: 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
      totalIV: 0,
      weightedIV: 0,
    },
    legs: [],
    volatility: 0.25,
    timeToExpiry: 30,
    isLoading: false,
  };

  return (
    <div className="advanced-payoff-chart">
      {/* Chart */}
      <ChartJSPayoffChart
        legs={legs}
        spotPrice={safeSpotPrice}
        volatility={volatility}
        timeToExpiry={timeToExpiry}
        riskFreeRate={riskFreeRate}
        showGreeks={showGreeks}
        showMetrics={showMetrics}
      />
    </div>
  );
};

export default AdvancedPayoffChart;
