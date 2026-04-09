import { IconRegistry } from "#components";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import "./algotrading.scss";
import "./compact-legs.scss";
import { useNavigate } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { successMsg, errorMsg } from "#utils/helpers";
import useAlgoTrading from "./algotrading";
import useSymbolDetails from "#hooks/useSymbol";
import { AdvancedPayoffChart, SymbolSelectorDropdown } from "#components";

const AlgoTrading = () => {
  const navigate = useNavigate();
  const {
    watchList,
    handleChange,
    lotSize,
    expiryList,
    defaultLegs,
    algoTrading,
    isBoxReplacementVisible,
    formErrors,
    handleDefaultLegsChange,
    qty,
    handleQtyChange,
    addLeg,
    handleChildLegChange,
    strikePriceListArr,
    handleAdjustmentChange,
    futStrikePriceListArr,
    handelSubmit,
    priceType,
    handlePriceType,
    spotFutPrice,
    setLegsFn,
    selectedStrategy,
    totalMargin,
    setTotalMargin,
    totalSpread,
    setTotalSpread,
    strikePriceCEList,
    setAlgoTrading,
    strikePricePEList,
    setDefaultLegs,
    brokerList,
    isLoading,
    fixedStrategyPayoffs,
    fixedLegPrices,
    setSelectedStrategy,
    setFixedStrategyPayoffs,
    setFixedLegPrices,
  } = useAlgoTrading();
  const watchListSymbol = useSymbolDetails(watchList, "optionChain", 1);
  const symbolValuePE = useSymbolDetails(strikePricePEList, "optionChain");
  const symbolValueCE = useSymbolDetails(strikePriceCEList, "optionChain");

  const symbolValueCEGreeks = useSymbolDetails(
    strikePriceCEList,
    "optionChain",
    0,
    0,
    1 // is_greek = 1
  );

  const symbolValuePEGreeks = useSymbolDetails(
    strikePricePEList,
    "optionChain",
    0,
    0,
    1 // is_greek = 1
  );

  const calculateStrategyGreeks = useCallback(() => {
    if (
      !algoTrading?.trendLegMasterRequests ||
      algoTrading.trendLegMasterRequests.length === 0
    ) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        totalIV: 0,
        weightedIV: 0,
        volatility: 0,
        timeToExpiry: 0,
        isLoading: false,
      };
    }

    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;
    let totalIV = 0;
    let totalWeight = 0;

    algoTrading.trendLegMasterRequests.forEach((leg) => {
      const strikePrice = leg.strikePrice;
      const instrument = leg.instrument;
      const quantity = parseFloat(leg.quantity) || 1;
      const position = leg.action || "BUY";
      const multiplier = (position === "BUY" ? 1 : -1) * quantity;

      // Get Greeks data based on instrument type
      let greeks = null;
      let price = null;

      if (instrument === "CE") {
        greeks = symbolValueCEGreeks[leg.identifier];
        price = symbolValueCE[leg.identifier];
      } else if (instrument === "PE") {
        greeks = symbolValuePEGreeks[leg.identifier];
        price = symbolValuePE[leg.identifier];
      }

      if (greeks && price) {
        const delta = parseFloat(greeks.delta) || 0;
        const gamma = parseFloat(greeks.gamma) || 0;
        const theta = parseFloat(greeks.theta) || 0;
        const vega = parseFloat(greeks.vega) || 0;
        const rho = parseFloat(greeks.rho) || 0;
        const iv = parseFloat(greeks.iv) || 0;
        const ltp = parseFloat(price.lastTradePrice) || 0;

        totalDelta += delta * multiplier;
        totalGamma += gamma * multiplier;
        totalTheta += theta * multiplier;
        totalVega += vega * multiplier;
        totalRho += rho * multiplier;
        totalIV += iv * ltp * quantity;
        totalWeight += ltp * quantity;
      }
    });

    const weightedIV = totalWeight > 0 ? totalIV / totalWeight : 0;

    return {
      delta: parseFloat(totalDelta.toFixed(4)),
      gamma: parseFloat(totalGamma.toFixed(4)),
      theta: parseFloat(totalTheta.toFixed(4)),
      vega: parseFloat(totalVega.toFixed(4)),
      rho: parseFloat(totalRho.toFixed(4)),
      totalIV: parseFloat(totalIV.toFixed(4)),
      weightedIV: parseFloat(weightedIV.toFixed(4)),
      volatility: weightedIV / 100, // Convert IV to decimal for POP calculation
      timeToExpiry: 2, // Default 2 days, should be calculated from expiry date
      isLoading: false,
    };
  }, [
    algoTrading?.trendLegMasterRequests,
    symbolValueCEGreeks,
    symbolValuePEGreeks,
    symbolValueCE,
    symbolValuePE,
  ]);

  const greeksData = useMemo(
    () => calculateStrategyGreeks(),
    [calculateStrategyGreeks]
  );

  const [activeButton, setActiveButton] = useState("bullish");
  const [showGreeksTable, setShowGreeksTable] = useState(false);
  const [showProfitLossFields, setShowProfitLossFields] = useState(false);

  // Throttle data updates to reduce frequent re-renders
  const [throttledData, setThrottledData] = useState({
    watchListSymbol: {},
  });

  const handleClick = (button) => {
    setActiveButton(button);
  };

  const toggleProfitLossFields = () => {
    setShowProfitLossFields(!showProfitLossFields);
  };

  const removeLeg = (removeIndex) => {
    try {
      setAlgoTrading((prevData) => {
        const updatedLegs = prevData.trendLegMasterRequests.filter(
          (_, index) => index !== removeIndex
        );

        // If no legs remain, clear strategy data
        if (updatedLegs.length === 0) {
          setSelectedStrategy("");
          setFixedStrategyPayoffs({
            maxProfit: 0,
            maxLoss: 0,
            breakeven: 0,
            breakevenPercentage: 0,
          });
          setFixedLegPrices([]);
          return {
            ...prevData,
            trendLegMasterRequests: [],
            totalMargin: 0,
            totalSpread: 0,
          };
        }

        // If legs remain, recalculate data
        const updatedLegPrices = updatedLegs.map(
          (leg) => leg.lastTradedPrice || 0
        );
        setFixedLegPrices(updatedLegPrices);

        // Recalculate payoffs for remaining legs
        const payoffs = calculateCustomLegPayoffs(updatedLegs);
        setFixedStrategyPayoffs(payoffs);

        return {
          ...prevData,
          trendLegMasterRequests: updatedLegs,
        };
      });
      successMsg("Leg removed successfully!");
    } catch (error) {
      errorMsg("Failed to remove leg. Please try again.");
    }
  };

  // Calculate payoffs for custom legs (non-default strategies)
  // IMPORTANT: Uses ENTRY PRICES (fixedLegPrices) for breakeven calculation, not live prices
  const calculateCustomLegPayoffs = (legs) => {
    if (!legs || legs.length === 0) {
      return { maxProfit: 0, maxLoss: 0, breakeven: 0, breakevenPercentage: 0 };
    }

    const spotPrice = watchListSymbol[spotFutPrice?.spot]?.lastTradePrice || 0;
    let maxProfit = 0;
    let maxLoss = 0;
    let breakeven = spotPrice;
    let breakevenPercentage = 0;

    // For custom legs, we'll calculate basic payoffs based on leg structure
    if (legs.length === 1) {
      // Single leg - similar to naked options
      const leg = legs[0];
      const legIndex = algoTrading?.trendLegMasterRequests?.indexOf(leg) ?? 0;
      // Use ENTRY PRICE (fixedLegPrices) for breakeven, not live price
      const premium = (fixedLegPrices.length > legIndex && fixedLegPrices[legIndex] > 0)
        ? parseFloat(fixedLegPrices[legIndex])
        : parseFloat(leg.entryPrice || leg.lastTradedPrice || 0);
      const quantity = parseInt(leg.quantity || 0);
      const strike = parseFloat(leg.strikePrice) || spotPrice;

      if (leg.action === "BUY") {
        // Buy position - unlimited profit potential, limited loss
        maxProfit = Infinity; // Unlimited
        maxLoss = premium * quantity; // Premium paid
        breakeven =
          leg.instrument === "CE" ? strike + premium : strike - premium;
      } else if (leg.action === "SELL") {
        // Sell position - limited profit, unlimited loss potential
        maxProfit = premium * quantity; // Premium received
        maxLoss = Infinity; // Unlimited
        breakeven =
          leg.instrument === "CE" ? strike + premium : strike - premium;
      }
    } else if (legs.length === 2) {
      // Two legs - could be spread, straddle, etc.
      const leg1 = legs[0];
      const leg2 = legs[1];
      const leg1Index = algoTrading?.trendLegMasterRequests?.indexOf(leg1) ?? 0;
      const leg2Index = algoTrading?.trendLegMasterRequests?.indexOf(leg2) ?? 1;
      
      // Use ENTRY PRICES (fixedLegPrices) for breakeven calculation - FIXED, not live
      const premium1 = (fixedLegPrices.length > leg1Index && fixedLegPrices[leg1Index] > 0)
        ? parseFloat(fixedLegPrices[leg1Index])
        : parseFloat(leg1.entryPrice || leg1.lastTradedPrice || 0);
      const premium2 = (fixedLegPrices.length > leg2Index && fixedLegPrices[leg2Index] > 0)
        ? parseFloat(fixedLegPrices[leg2Index])
        : parseFloat(leg2.entryPrice || leg2.lastTradedPrice || 0);
      const qty1 = parseInt(leg1.quantity || 0);
      const qty2 = parseInt(leg2.quantity || 0);
      const strike1 = parseFloat(leg1.strikePrice) || spotPrice;
      const strike2 = parseFloat(leg2.strikePrice) || spotPrice;

      // Calculate net premium
      const netPremium =
        (leg1.action === "BUY" ? premium1 : -premium1) * qty1 +
        (leg2.action === "BUY" ? premium2 : -premium2) * qty2;

      if (leg1.instrument === leg2.instrument) {
        // Same instrument type - likely a spread
        const lotSizeValue = lotSize?.quotationLot || 1;
        
        // Determine buy and sell strikes for Bull Call Spread
        let buyStrike, sellStrike, buyPremium, sellPremium, buyQty, sellQty;
        let isBullCallSpread = false;
        
        // Determine spread type and calculate breakeven using ENTRY PRICES
        if (leg1.action === "BUY" && leg2.action === "SELL" && strike1 < strike2) {
          // Bull Call Spread: Buy lower strike, Sell higher strike
          buyStrike = strike1;
          sellStrike = strike2;
          buyPremium = premium1;
          sellPremium = premium2;
          buyQty = qty1;
          sellQty = qty2;
          isBullCallSpread = true;
        } else if (leg1.action === "SELL" && leg2.action === "BUY" && strike1 < strike2) {
          // Bear Call Spread: Sell lower strike, Buy higher strike
          buyStrike = strike2;
          sellStrike = strike1;
          buyPremium = premium2;
          sellPremium = premium1;
          buyQty = qty2;
          sellQty = qty1;
        } else if (leg1.action === "SELL" && leg2.action === "BUY" && strike1 > strike2) {
          // Bull Put Spread: Sell higher strike, Buy lower strike
          buyStrike = strike2;
          sellStrike = strike1;
          buyPremium = premium2;
          sellPremium = premium1;
          buyQty = qty2;
          sellQty = qty1;
        } else if (leg1.action === "BUY" && leg2.action === "SELL" && strike1 > strike2) {
          // Bear Put Spread: Buy higher strike, Sell lower strike
          buyStrike = strike1;
          sellStrike = strike2;
          buyPremium = premium1;
          sellPremium = premium2;
          buyQty = qty1;
          sellQty = qty2;
        } else {
          // Both BUY or both SELL - use original logic
          const strikeDiff = Math.abs(strike1 - strike2);
          maxProfit = Math.max(0, strikeDiff - Math.abs(netPremium));
          maxLoss = Math.abs(netPremium);
          const netPremiumPerContract = netPremium / Math.max(qty1, qty2);
          breakeven =
            leg1.action === "BUY" ? strike1 + netPremiumPerContract : strike1 - netPremiumPerContract;
        }
        
        // Calculate for Bull Call Spread (BUY lower strike CE, SELL higher strike CE)
        if (isBullCallSpread && buyQty === sellQty && buyQty > 0) {
          // Net Debit per share = (Buy Premium - Sell Premium) - using ENTRY PRICES
          const netDebitPerShare = (buyPremium - sellPremium);
          
          maxLoss = Math.abs(netPremium);
          maxProfit = Math.max(0, (sellStrike - buyStrike - netDebitPerShare) * buyQty);
          
          // Breakeven = Buy Strike + Net Debit per share (FIXED based on entry prices)
          breakeven = buyStrike + netDebitPerShare;
        } else if (buyQty === sellQty && buyQty > 0) {
          // Other spread types (Bear Call, Bull Put, Bear Put) - use similar logic
          const netDebitPerContract = buyPremium - sellPremium;
          maxLoss = Math.abs(netPremium);
          const strikeDiff = Math.abs(sellStrike - buyStrike);
          maxProfit = Math.max(0, (strikeDiff - Math.abs(netDebitPerContract)) * lotSizeValue * buyQty);
          
          // Breakeven calculation based on spread type
          // Since we're inside the same instrument check, leg1.instrument === leg2.instrument
          if (leg1.instrument === "CE") {
            // Call Spreads: Breakeven = Lower Strike + Net Debit/Credit
            breakeven = Math.min(buyStrike, sellStrike) + netDebitPerContract;
          } else {
            // Put Spreads: Breakeven = Higher Strike - Net Debit/Credit
            breakeven = Math.max(buyStrike, sellStrike) - netDebitPerContract;
          }
        } else {
          // Quantities don't match - use original logic
          const strikeDiff = Math.abs(strike1 - strike2);
          maxProfit = Math.max(0, strikeDiff - Math.abs(netPremium));
          maxLoss = Math.abs(netPremium);
          const netPremiumPerContract = netPremium / Math.max(qty1, qty2);
          breakeven =
            leg1.action === "BUY" ? strike1 + netPremiumPerContract : strike1 - netPremiumPerContract;
        }
      } else {
        // Different instruments - likely a straddle/strangle
        // Use ENTRY PRICES for breakeven calculation
        const netPremiumPerContract = netPremium / Math.max(qty1, qty2);
        
        if (leg1.action === "BUY" && leg2.action === "BUY") {
          // Long straddle - unlimited profit, limited loss
          maxProfit = Infinity;
          maxLoss = Math.abs(netPremium);
          // Long Straddle has two breakevens: Strike ± Net Premium
          // Upper breakeven = Strike + Net Premium
          breakeven = strike1 + Math.abs(netPremiumPerContract);
        } else if (leg1.action === "SELL" && leg2.action === "SELL") {
          // Short straddle - limited profit, unlimited loss
          maxProfit = Math.abs(netPremium);
          maxLoss = Infinity;
          // Short Straddle has two breakevens: Strike ± Net Premium
          breakeven = strike1 + Math.abs(netPremiumPerContract);
        } else {
          // Mixed actions - use net premium
          maxProfit = Math.abs(netPremium);
          maxLoss = Math.abs(netPremium);
          breakeven = strike1 + Math.abs(netPremiumPerContract);
        }
      }
    } else {
      // Multiple legs - complex strategy
      // For now, calculate basic payoffs
      // Use ENTRY PRICES (fixedLegPrices) for breakeven calculation
      const totalPremium = legs.reduce((sum, leg, index) => {
        const legIndex = algoTrading?.trendLegMasterRequests?.indexOf(leg) ?? index;
        // Use ENTRY PRICE (fixedLegPrices) for breakeven, not live price
        const premium = (fixedLegPrices.length > legIndex && fixedLegPrices[legIndex] > 0)
          ? parseFloat(fixedLegPrices[legIndex])
          : parseFloat(leg.entryPrice || leg.lastTradedPrice || 0);
        const qty = parseInt(leg.quantity || 0);
        return sum + (leg.action === "BUY" ? premium : -premium) * qty;
      }, 0);

      maxProfit = Math.max(0, Math.abs(totalPremium) * 2); // Simplified
      maxLoss = Math.abs(totalPremium);
      breakeven = spotPrice;
    }

    breakevenPercentage =
      spotPrice !== 0 ? ((breakeven - spotPrice) / spotPrice) * 100 : 0;

    return {
      maxProfit: maxProfit === Infinity ? 999999 : maxProfit,
      maxLoss: maxLoss === Infinity ? 999999 : maxLoss,
      breakeven: breakeven,
      breakevenPercentage: breakevenPercentage,
    };
  };

  // Calculate POP (Probability of Profit) using exact Black-Scholes formula for all strategies
  const calculatePOP = useCallback(() => {
    // Check if legs are added - if no legs, return 0 (like other metrics)
    const hasLegs = algoTrading?.trendLegMasterRequests?.length > 0;

    // If no strategy selected, return 0
    if (!selectedStrategy) {
      return 0;
    }

    // If no legs added, return 0 (like other metrics)
    if (!hasLegs) {
      return 0; // Return 0 when no legs added, like other metrics
    }

    // Get spot price from throttled real-time data
    let spotPrice =
      throttledData.watchListSymbol[spotFutPrice?.spot]?.lastTradePrice || 0;

    // For different strategy types, use appropriate strike price
    let strikePrice = 0;
    if (["naked_ce", "naked_pe"].includes(selectedStrategy)) {
      // Single leg strategies - use default legs strike
      strikePrice = parseFloat(defaultLegs?.strike) || spotPrice;
    } else if (algoTrading?.trendLegMasterRequests?.length > 0) {
      // Multi-leg strategies - use first leg strike as reference
      strikePrice =
        parseFloat(algoTrading.trendLegMasterRequests[0]?.strikePrice) ||
        spotPrice;
    } else {
      strikePrice = spotPrice;
    }

    // Get volatility and time to expiry from real-time greeks data
    const volatility = greeksData?.volatility || 0.25; // σ (IV)
    const timeToExpiry = greeksData?.timeToExpiry || 2; // days to expiry

    if (spotPrice === 0 || strikePrice === 0) {
      return 0; // Return 0 when no data, like other metrics
    }

    // Additional validation for reasonable values
    if (
      spotPrice < 100 ||
      spotPrice > 100000 ||
      strikePrice < 100 ||
      strikePrice > 100000
    ) {
      return 0;
    }

    // Get premium based on strategy type - use actual leg prices
    let premium = 0; // P

    if (
      algoTrading?.trendLegMasterRequests &&
      algoTrading.trendLegMasterRequests.length > 0
    ) {
      // Use the first leg's premium for POP calculation
      premium = algoTrading.trendLegMasterRequests[0]?.lastTradedPrice || 0;
    } else if (
      fixedLegPrices &&
      fixedLegPrices.length > 0 &&
      fixedLegPrices[0] > 0
    ) {
      premium = fixedLegPrices[0];
    } else if (defaultLegs?.ltp && defaultLegs.ltp > 0) {
      premium = defaultLegs.ltp;
    }

    if (premium <= 0) {
      return 0; // Return 0 when no premium data, like other metrics
    }

    // Validate premium is reasonable (not too high compared to spot price)
    if (premium > spotPrice * 0.5) {
      return 0;
    }

    // Breakeven Calculation
    let breakevenPoint; // BE

    // For Naked CE: BE = K + P, For Naked PE: BE = K - P
    if (selectedStrategy === "naked_ce") {
      breakevenPoint = strikePrice + premium;
    } else if (selectedStrategy === "naked_pe") {
      // Long Put: BE = K - P
      breakevenPoint = strikePrice - premium;
    } else {
      // For other strategies, use strike price as reference
      breakevenPoint = strikePrice + premium;
    }

    if (!breakevenPoint || breakevenPoint <= 0 || !isFinite(breakevenPoint)) {
      return 0; // Return 0 when breakeven is invalid, like other metrics
    }

    // Additional validation for reasonable breakeven
    if (Math.abs(breakevenPoint - spotPrice) < spotPrice * 0.001) {
      return 0;
    }

    // Z-Score Calculation: z = [ln(BE/S) - 0.5*σ²*T] / [σ*√T]
    const T = timeToExpiry / 365; // Convert days to years

    // Validate time to expiry
    if (T <= 0 || T > 1) {
      return 0;
    }

    // Validate volatility
    if (volatility <= 0 || volatility > 5) {
      return 0;
    }

    // Correct Z-score calculation with high precision
    const lnBE_S = Math.log(breakevenPoint / spotPrice); // ln(BE/S)
    const halfSigmaSquaredT = 0.5 * volatility * volatility * T; // 0.5*σ²*T
    const numerator = lnBE_S - halfSigmaSquaredT; // ln(BE/S) - 0.5*σ²*T
    const denominator = volatility * Math.sqrt(T); // σ*√T

    // Round intermediate calculations to avoid floating point errors
    const roundedNumerator = Math.round(numerator * 1000000) / 1000000;
    const roundedDenominator = Math.round(denominator * 1000000) / 1000000;

    // Validate mathematical operations
    if (
      !isFinite(lnBE_S) ||
      !isFinite(roundedNumerator) ||
      !isFinite(roundedDenominator) ||
      roundedDenominator === 0
    ) {
      return 0;
    }

    const z = roundedNumerator / roundedDenominator; // Z-score with rounded values

    // Validate Z-score
    if (!isFinite(z) || Math.abs(z) > 10) {
      return 0;
    }

    // Standard Normal CDF: N(z)
    const normCDF = (x) => {
      return 0.5 * (1 + erf(x / Math.sqrt(2)));
    };

    // Error function approximation (high precision)
    const erf = (x) => {
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;

      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);

      const t = 1.0 / (1.0 + p * x);
      const y =
        1.0 -
        ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

      return sign * y;
    };

    const nZ = normCDF(z); // N(z)

    // Validate N(z) result
    if (!isFinite(nZ) || nZ < 0 || nZ > 1) {
      return 0;
    }

    // POP Calculation with validation for all strategy types
    let pop;

    // For NAKED PE: Use Black-Scholes formula with breakeven
    if (selectedStrategy === "naked_pe") {
      // NAKED PE: POP = N(z) × 100 (Long Put: probability spot < BE)
      // Use the same Black-Scholes formula as other strategies
      if (breakevenPoint > spotPrice) {
        // If breakeven is above current spot, we need spot to go up
        // For long positions: POP = (1 - N(z)) × 100
        pop = (1 - nZ) * 100;
      } else {
        // If breakeven is below current spot, we need spot to stay above breakeven
        // For long positions: POP = N(z) × 100
        pop = nZ * 100;
      }
    } else {
      // For other strategies, use the standard POP formula based on breakeven
      // POP = Probability that spot price will be above breakeven at expiry
      if (breakevenPoint > spotPrice) {
        // If breakeven is above current spot, we need spot to go up
        // For long positions: POP = (1 - N(z)) × 100
        pop = (1 - nZ) * 100;
      } else {
        // If breakeven is below current spot, we need spot to stay above breakeven
        // For long positions: POP = N(z) × 100
        pop = nZ * 100;
      }
    }

    // Round POP to 1 decimal place for better precision
    pop = Math.round(pop * 10) / 10;

    // Validate final POP result
    if (!isFinite(pop) || pop < 0 || pop > 100) {
      return 0;
    }

    return Math.max(0, Math.min(100, pop));
  }, [
    selectedStrategy,
    algoTrading?.trendLegMasterRequests,
    throttledData.watchListSymbol,
    spotFutPrice?.spot,
    greeksData,
    fixedLegPrices,
    defaultLegs,
  ]);

  // Calculate real-time strategy metrics
  const calculateStrategyMetrics = useCallback(() => {
    const spotPrice =
      throttledData.watchListSymbol[spotFutPrice?.spot]?.lastTradePrice || 0;
    const totalMargin = algoTrading?.totalMargin || 0;
    // Calculate Net Position Qty (Buy Qty - Sell Qty) instead of Total Qty
    const netPositionQty =
      (algoTrading?.trendLegMasterRequests || []).reduce(
        (sum, leg) => {
          const qty = Math.abs(parseInt(leg.quantity || 0));
          return sum + (leg.action === "BUY" ? qty : -qty);
        },
        0
      ) || 0;

    // Calculate Individual Position MTM and Total MTM
    const individualMTMs =
      algoTrading?.trendLegMasterRequests?.map((leg, index) => {
        const currentPrice = parseFloat(leg.lastTradedPrice) || 0;
        // For custom legs, use the stored entry price, for default strategies use fixedLegPrices
        const entryPrice =
          fixedLegPrices.length > 0
            ? parseFloat(fixedLegPrices[index]) ||
              parseFloat(leg.lastTradedPrice) ||
              0
            : parseFloat(leg.entryPrice) ||
              parseFloat(leg.lastTradedPrice) ||
              0;
        const quantity = parseInt(leg.quantity || 0);
        const action = leg.action;

        let individualMTM = 0;

        if (action === "BUY") {
          // Buy position: MTM = (Current Price - Buy Price) × Quantity
          individualMTM = (currentPrice - entryPrice) * quantity;
        } else if (action === "SELL") {
          // Sell position: MTM = (Sell Price - Current Price) × Quantity
          individualMTM = (entryPrice - currentPrice) * quantity;
        }

        return {
          ...leg,
          individualMTM: individualMTM,
          entryPrice: entryPrice,
          currentPrice: currentPrice,
          quantity: quantity,
          action: action,
        };
      }) || [];

    // Calculate Total MTM = Sum of all individual MTMs
    const totalMTM = individualMTMs.reduce(
      (sum, leg) => sum + leg.individualMTM,
      0
    );

    // Calculate MTM percentage based on total initial investment
    const totalInitialInvestment = individualMTMs.reduce((sum, leg) => {
      return sum + leg.entryPrice * leg.quantity;
    }, 0);

    const mtmPercentage =
      totalInitialInvestment !== 0
        ? (totalMTM / Math.abs(totalInitialInvestment)) * 100
        : 0;

    // Use fixed payoffs if available (default strategies), otherwise calculate custom leg payoffs
    let maxProfit, maxLoss, breakeven, breakevenPercentage;

    if (
      fixedStrategyPayoffs.maxProfit !== undefined &&
      fixedStrategyPayoffs.maxProfit !== 0
    ) {
      // Default strategy payoffs - use fixed values that don't change
      maxProfit = fixedStrategyPayoffs.maxProfit;
      maxLoss = fixedStrategyPayoffs.maxLoss;
      breakeven = fixedStrategyPayoffs.breakeven;
      breakevenPercentage = fixedStrategyPayoffs.breakevenPercentage;
    } else {
      // Custom leg payoffs
      const customPayoffs = calculateCustomLegPayoffs(
        algoTrading?.trendLegMasterRequests || []
      );
      maxProfit = customPayoffs.maxProfit;
      maxLoss = customPayoffs.maxLoss;
      breakeven = customPayoffs.breakeven;
      breakevenPercentage = customPayoffs.breakevenPercentage;
    }

    const maxProfitPercentage =
      maxProfit === 999999 || maxProfit === Infinity
        ? 0
        : totalMargin !== 0
        ? (maxProfit / totalMargin) * 100
        : 0;

    const pop = calculatePOP();

    // Calculate Risk/Reward (R/R) ratio based on MTM values
    let riskReward = "NA";
    const legCount = algoTrading?.trendLegMasterRequests?.length || 0;
    const maxLossValue = maxLoss;
    const maxProfitValue = maxProfit;

    // Check if we have valid finite values for R/R calculation
    const hasValidMaxLoss =
      maxLossValue > 0 && maxLossValue !== 999999 && maxLossValue !== Infinity;
    const hasValidMaxProfit =
      maxProfitValue > 0 &&
      maxProfitValue !== 999999 &&
      maxProfitValue !== Infinity;

    if (hasValidMaxLoss && hasValidMaxProfit) {
      // Both Max Loss and Max Profit are finite - calculate R/R
      const rrValue = maxLossValue / maxProfitValue;
      riskReward = rrValue.toFixed(3);

      // Add interpretation
      if (rrValue < 1) {
        riskReward += " (Favorable)";
      } else if (rrValue > 1) {
        riskReward += " (Risky)";
      } else {
        riskReward += " (Balanced)";
      }
    } else if (legCount === 1) {
      // Single leg with unlimited values
      if (maxProfitValue === 999999 || maxProfitValue === Infinity) {
        riskReward = "∞ (Unlimited Profit)";
      } else if (maxLossValue === 999999 || maxLossValue === Infinity) {
        riskReward = "∞ (Unlimited Loss)";
      }
    } else if (legCount > 1) {
      // Multi-leg with unlimited values
      if (
        maxProfitValue === 999999 ||
        maxProfitValue === Infinity ||
        maxLossValue === 999999 ||
        maxLossValue === Infinity
      ) {
        riskReward = "NA (Unlimited Risk/Reward)";
      }
    }

    return {
      mtm: totalMTM,
      mtmPercentage: mtmPercentage,
      maxProfit: maxProfit,
      maxProfitPercentage: maxProfitPercentage,
      pop: pop,
      riskReward: riskReward,
      breakeven: breakeven,
      breakevenPercentage: breakevenPercentage,
      totalMargin: totalMargin,
      maxLoss: maxLoss,
      individualMTMs: individualMTMs,
      totalInitialInvestment: totalInitialInvestment,
    };
  }, [
    throttledData.watchListSymbol,
    spotFutPrice?.spot,
    algoTrading?.totalMargin,
    algoTrading?.trendLegMasterRequests,
    fixedStrategyPayoffs,
    totalMargin,
    calculatePOP,
  ]);

  const strategyMetrics = useMemo(
    () => calculateStrategyMetrics(),
    [calculateStrategyMetrics]
  );

  // Add Entry
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

  useEffect(() => {
    let total = 0;
    let totalSpread = 0;

    setAlgoTrading((prevData) => {
      const updatedLegs = prevData.trendLegMasterRequests.map((leg) => {
        const strikeLiveData =
          leg?.instrument === "CE"
            ? symbolValueCE[leg.identifier]
            : symbolValuePE[leg.identifier];
        if (strikeLiveData) {
          const lastTradedPrice =
            strikeLiveData.lastTradePrice * Number(leg.quantity) || 0;
          total += lastTradedPrice;

          // Calculate TOTAL SPREAD using proper formula: (Sell Premium) - (Buy Premium)
          const premium = strikeLiveData.lastTradePrice;
          const isBuy = leg.action === "BUY" || leg.action === "Buy";
          const isSell = leg.action === "SELL" || leg.action === "Sell";

          if (isBuy) {
            // Buy leg - subtract premium (negative contribution)
            totalSpread -= premium;
          } else if (isSell) {
            // Sell leg - add premium (positive contribution)
            totalSpread += premium;
          }

          return {
            ...leg,
            lastTradedPrice: strikeLiveData.lastTradePrice,
          };
        }
        return leg;
      });

      setTotalMargin(total);
      setTotalSpread(totalSpread);

      return {
        ...prevData,
        trendLegMasterRequests: updatedLegs,
      };
    });
  }, [
    symbolValueCE,
    symbolValuePE,
    setAlgoTrading,
    setTotalMargin,
    setTotalSpread,
  ]);

  useEffect(() => {
    setDefaultLegs((prev) => {
      const strikeLiveData =
        defaultLegs?.instrument === "CE"
          ? symbolValueCE[defaultLegs.identifier]
          : symbolValuePE[defaultLegs.identifier];

      if (strikeLiveData) {
        return {
          ...prev,
          ltp: strikeLiveData.lastTradePrice,
        };
      }

      return prev;
    });
  }, [
    defaultLegs?.identifier,
    defaultLegs?.instrument,
    symbolValueCE,
    symbolValuePE,
    setDefaultLegs,
  ]);

  // Throttle data updates to reduce frequent re-renders
  useEffect(() => {
    const throttleTimeout = setTimeout(() => {
      setThrottledData({
        watchListSymbol,
      });
    }, 200);

    return () => clearTimeout(throttleTimeout);
  }, [watchListSymbol]);


  return (
    <div className="algotrading_page">
      <div className="page-color">
        {/* Main Banner Header */}

        <form onSubmit={handelSubmit}>
          <div className="div-flex-header-search">
            <div className="select-sec">
              <label className="select-label">Select Trading Symbol</label>
              {SymbolSelectorDropdown ? (
                <SymbolSelectorDropdown
                  name="strategyReq[symbolIdentifierID]"
                  id="strProduct"
                  valueType="symbolIdentifierId"
                  options={
                    watchList?.map((watch) => {
                      const watchSymbol = watchListSymbol[watch?.identifier];
                      return {
                        symbolIdentifierId: watchSymbol?.symbolIdentifierId,
                        product: watchSymbol?.product,
                        identifier: watchSymbol?.identifier,
                      };
                    }) || []
                  }
                  value={algoTrading?.strategyReq?.symbolIdentifierID || ""}
                  onChange={handleChange}
                  placeholder="Choose a symbol to trade"
                />
              ) : (
                <div className="select-wrapper">
                  <select
                    name="strategyReq[symbolIdentifierID]"
                    className="form-control text-input"
                    onChange={handleChange}
                    value={algoTrading?.strategyReq?.symbolIdentifierID || ""}
                  >
                    <option value="">Choose a symbol to trade</option>
                    {watchList?.map((watch, key) => {
                      const watchSymbol = watchListSymbol[watch?.identifier];
                      return (
                        <option
                          key={key}
                          value={watchSymbol?.symbolIdentifierId}
                        >
                          {watchSymbol?.product}
                        </option>
                      );
                    })}
                  </select>
                  <IconRegistry name="chevron-down" className="select-arrow" />
                </div>
              )}

              {/* Chart Button */}
              {algoTrading?.strategyReq?.symbolIdentifierID && (
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
                      const selectedSymbolId =
                        algoTrading?.strategyReq?.symbolIdentifierID;

                      if (selectedSymbolId && watchList?.length > 0) {
                        const selectedOption = watchList.find((watch) => {
                          const watchSymbol =
                            watchListSymbol[watch?.identifier];
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
            {/* Header Main */}
            <div className="header-top-main">
              <div className="div-flex-header">
                <div className="div-radio-btn-main">
                  <div className="flex-data-div">
                    <div className="form-check">
                      <input
                        type="radio"
                        id="intraday-radio"
                        name="strategyReq[marketPosition]"
                        value="Intraday"
                        checked={
                          algoTrading?.strategyReq?.marketPosition ===
                            "Intraday" ?? false
                        }
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="intraday-radio"
                      >
                        Intraday
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="radio"
                        id="positional-radio"
                        name="strategyReq[marketPosition]"
                        value="Positional"
                        checked={
                          algoTrading?.strategyReq?.marketPosition ===
                            "Positional" ?? false
                        }
                        onChange={handleChange}
                        className="form-check-input"
                      />
                      <label
                        className="form-check-label"
                        htmlFor="positional-radio"
                      >
                        Positional
                      </label>
                    </div>
                  </div>
                </div>
                <div className="info-box-main">
                  <div className="box-one box-border">
                    <h3>SPOT</h3>

                    <p>
                      {watchListSymbol[spotFutPrice?.spot]?.lastTradePrice ??
                        0.0}
                    </p>
                  </div>
                  <div className="box-one">
                    <h3>FUTURE</h3>
                    <p>
                      {watchListSymbol[spotFutPrice?.future]?.lastTradePrice ??
                        0.0}
                    </p>
                  </div>
                </div>
                <div className="tag-div-data">
                  <div className="box-one box-border">
                    {watchListSymbol[spotFutPrice?.spot]?.priceChange < 0 ? (
                      <h3 className="down">
                        BEARISH <IconRegistry name="trending-down" size={20} />
                      </h3>
                    ) : (
                      <h3 className="up">
                        BULLISH <IconRegistry name="trending-up" size={20} />
                      </h3>
                    )}
                  </div>
                </div>
                <select
                  name="strategyReq[BrokerConfigId]"
                  className="form-control text-input"
                  onChange={handleChange}
                  value={algoTrading?.strategyReq?.BrokerConfigId || ""}
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
                {formErrors?.["strategyReq[BrokerConfigId]"] && (
                  <div className="error-message">
                    {formErrors?.["strategyReq[BrokerConfigId]"]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Readymade Strategies */}
          <div className="readymade-main-section">
            {/* <div className="heading-data">
              <h2>
                <IconRegistry name="settings" className="svg-tool" />
                Pre‑Built Strategies
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
                        Library of ready‑to‑use strategy templates that are
                        automatically configured.
                      </span>
                    </div>
                  }
                >
                  <span>
                    <IconRegistry
                      name="exclamation-octagon"
                      className="svg-tool"
                    />
                  </span>
                </Tooltip>{" "}
              </h2>
            </div> */}

            <div className="box-card-main">
              <div className="box-card-flex">
                {/* <div className="box-card-first">
                  <div className="card-desing-Trend">
                    <button
                      className={`btn-1-data ${isActive ? "active" : ""}`}
                      // onClick={handleRemedyStrategy}
                      type="button"
                    >
                      <IconTrend />
                      <p>Trend Based Strategies</p>
                    </button>
                    {isActive && (
                      <button
                        className="btn-close-n"
                        onClick={handleCloseRemedyStrategy}
                        type="button"
                      >
                        <IconRegistry name="close" />
                      </button>
                    )}
                  </div>
                </div> */}

                {/* Pre-Built Strategies Banner */}
                {/* <div className="pre-built-strategies-banner">
                  <div className="banner-content">
                    <h2>Pre-Built Strategies</h2>
                    <p>
                      Choose from proven trading strategies designed for
                      different market conditions
                    </p>
                  </div>
                </div> */}

                <div className="btn-inner-change">
                  {/* Box showing or hiding */}
                  <div
                    className={`box-card-sec-both ${
                      isBoxReplacementVisible ? "hidden" : ""
                    }`}
                  >
                    {/* <div className="box-card-first">
                      <div className="card-desing-time">
                        <button type="button">
                          <IconTimeStraddle />
                          <p>Time Based Straddle</p>
                        </button>
                      </div>
                    </div>

                    <div className="box-card-first">
                      <div className="card-desing-Strangle">
                        <button>
                          <IconTimeStrangle />
                          <p>Time Based Strangle</p>
                        </button>
                      </div>
                    </div> */}
                  </div>

                  <div
                    className={`box-card-sec-replacement ${
                      isBoxReplacementVisible ? "" : "hidden"
                    }`}
                  >
                    <div className="flex-data-div">
                      <div className="btn-tab-data">
                        <button
                          type="button"
                          className={`btn-bullish ${
                            activeButton === "bullish" ? "active" : ""
                          }`}
                          onClick={() => handleClick("bullish")}
                        >
                          {" "}
                          Bullish
                        </button>
                        <button
                          type="button"
                          className={`btn-neutral ${
                            activeButton === "neutral" ? "active" : ""
                          }`}
                          onClick={() => handleClick("neutral")}
                        >
                          {" "}
                          Neutral
                        </button>

                        <button
                          type="button"
                          className={`btn-bearish ${
                            activeButton === "bearish" ? "active" : ""
                          }`}
                          onClick={() => handleClick("bearish")}
                        >
                          {" "}
                          Bearish
                        </button>
                      </div>

                      <div className="btn-data-list">
                        {/* Conditional rendering for Bullish Button */}
                        {activeButton === "bullish" && (
                          <div className="all-bullish-btn fade-in">
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("naked_ce")}
                                className={`${
                                  selectedStrategy == "naked_ce" ? "active" : ""
                                }`}
                              >
                                <IconRegistry name="trending-up" size={50} />
                                <p>Naked CE</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("bC_spread")}
                                className={`${
                                  selectedStrategy == "bC_spread"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="bar-chart" size={50} />
                                <p>Bull Call Spread</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("long_straddle")}
                                className={`${
                                  selectedStrategy == "long_straddle"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="swap-horiz" size={50} />
                                <p>Long Straddle</p>
                              </button>
                            </div>

                            {/* Greeks Button in the middle */}
                            <div className="btn-bullish-main greeks-button-middle">
                              <button
                                type="button"
                                className="greeks-btn-middle"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)",
                                  border: "2px solid #ff4757",
                                  color: "white",
                                  boxShadow:
                                    "0 4px 15px rgba(255, 107, 107, 0.4)",
                                }}
                                onClick={() => {
                                  setShowGreeksTable(!showGreeksTable);
                                }}
                              >
                                <IconRegistry
                                  name="analytics"
                                  size={50}
                                  style={{ color: "white", fill: "white" }}
                                />
                                <p style={{ color: "white" }}>Greeks</p>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Conditional rendering for Neutral Button */}
                        {activeButton === "neutral" && (
                          <div className="all-bullish-btn all-neutral-btn fade-in">
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("iron_butter")}
                                className={`${
                                  selectedStrategy == "iron_butter"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="timeline" size={50} />
                                <p>Iron Butterfly</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("short_iron")}
                                className={`${
                                  selectedStrategy == "short_iron"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="trending-down" size={50} />
                                <p>Short Iron Condor</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("short_straddle")}
                                className={`${
                                  selectedStrategy == "short_straddle"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="trending-down" size={50} />
                                <p>Short Straddle</p>
                              </button>
                            </div>

                            {/* Greeks Button in the middle */}
                            <div className="btn-bullish-main greeks-button-middle">
                              <button
                                type="button"
                                className="greeks-btn-middle"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)",
                                  border: "2px solid #ff4757",
                                  color: "white",
                                  boxShadow:
                                    "0 4px 15px rgba(255, 107, 107, 0.4)",
                                }}
                                onClick={() => {
                                  setShowGreeksTable(!showGreeksTable);
                                }}
                              >
                                <IconRegistry
                                  name="analytics"
                                  size={50}
                                  style={{ color: "white", fill: "white" }}
                                />
                                <p style={{ color: "white" }}>Greeks</p>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Conditional rendering for Bearish Button */}
                        {activeButton === "bearish" && (
                          <div className="all-bullish-btn all-bearish-btn fade-in">
                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("naked_pe")}
                                className={`${
                                  selectedStrategy == "naked_pe" ? "active" : ""
                                }`}
                              >
                                <IconRegistry name="trending-down" size={50} />
                                <p>Naked PE</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("bear_put")}
                                className={`${
                                  selectedStrategy == "bear_put" ? "active" : ""
                                }`}
                              >
                                <IconRegistry name="bar-chart" size={50} />
                                <p>Bear Put Spread</p>
                              </button>
                            </div>

                            <div className="btn-bullish-main">
                              <button
                                type="button"
                                onClick={() => setLegsFn("short_strangle")}
                                className={`${
                                  selectedStrategy == "short_strangle"
                                    ? "active"
                                    : ""
                                }`}
                              >
                                <IconRegistry name="trending-down" size={50} />
                                <p>Short Strangle</p>
                              </button>
                            </div>

                            {/* Greeks Button in the middle */}
                            <div className="btn-bullish-main greeks-button-middle">
                              <button
                                type="button"
                                className="greeks-btn-middle"
                                style={{
                                  background:
                                    "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #ff9ff3 100%)",
                                  border: "2px solid #ff4757",
                                  color: "white",
                                  boxShadow:
                                    "0 4px 15px rgba(255, 107, 107, 0.4)",
                                }}
                                onClick={() => {
                                  setShowGreeksTable(!showGreeksTable);
                                }}
                              >
                                <IconRegistry
                                  name="analytics"
                                  size={50}
                                  style={{ color: "white", fill: "white" }}
                                />
                                <p style={{ color: "white" }}>Greeks</p>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GREEKS TABLE */}
          {showGreeksTable && (
            <div className="greeks-table-section">
              <div className="greeks-table-container">
                <div className="greeks-table-header">
                  <h3>Greeks Analysis</h3>
                  <div className="greeks-header-controls">
                    <div className="greeks-info-header">
                      <span className="info-text">
                        Greeks show both Per Lot and Total values
                      </span>
                    </div>
                    <div className="greeks-header-buttons">
                      <button
                        className="view-full-greeks-btn"
                        onClick={() => {
                          // Navigate to main Greeks page
                          navigate("/optionChain");
                        }}
                      >
                        <IconRegistry name="external-link" size={16} />
                        View Full Greeks
                      </button>
                      <button
                        className="close-greeks-btn"
                        onClick={() => setShowGreeksTable(false)}
                      >
                        <IconRegistry name="close" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="greeks-table-content">
                  <div className="greeks-table-wrapper limited-height">
                    <table className="greeks-table">
                      <colgroup>
                        <col style={{ width: "200px" }} />
                        <col style={{ width: "60px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "60px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "80px" }} />
                        <col style={{ width: "100px" }} />
                        <col style={{ width: "80px" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th>Instrument</th>
                          <th>Qty</th>
                          <th>LTP</th>
                          <th>Entry Price</th>
                          <th>IV</th>
                          <th>Delta</th>
                          <th>Gamma</th>
                          <th>Theta</th>
                          <th>Vega</th>
                          <th>MTM</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {algoTrading?.trendLegMasterRequests?.length > 0 ? (
                          algoTrading.trendLegMasterRequests.map(
                            (leg, index) => {
                              // Get real Greeks data from API
                              let greeks = null;
                              let price = null;

                              if (leg.instrument === "CE") {
                                greeks = symbolValueCEGreeks[leg.identifier];
                                price = symbolValueCE[leg.identifier];
                              } else if (leg.instrument === "PE") {
                                greeks = symbolValuePEGreeks[leg.identifier];
                                price = symbolValuePE[leg.identifier];
                              }

                              // Only show real-time data, no mock data
                              const delta =
                                greeks?.delta && parseFloat(greeks.delta) !== 0
                                  ? parseFloat(greeks.delta).toFixed(4)
                                  : null;
                              const gamma =
                                greeks?.gamma && parseFloat(greeks.gamma) !== 0
                                  ? parseFloat(greeks.gamma).toFixed(6)
                                  : null;
                              const theta =
                                greeks?.theta && parseFloat(greeks.theta) !== 0
                                  ? parseFloat(greeks.theta).toFixed(2)
                                  : null;
                              const vega =
                                greeks?.vega && parseFloat(greeks.vega) !== 0
                                  ? parseFloat(greeks.vega).toFixed(2)
                                  : null;
                              const iv =
                                greeks?.iv && parseFloat(greeks.iv) !== 0
                                  ? parseFloat(greeks.iv).toFixed(2)
                                  : null;

                              const quantity = parseInt(leg.quantity || 0);

                              // Calculate individual MTM for this leg - only use real data
                              const currentPrice =
                                parseFloat(leg.lastTradedPrice) || 0;
                              const entryPrice =
                                parseFloat(fixedLegPrices[index]) ||
                                parseFloat(leg.entryPrice) ||
                                parseFloat(leg.lastTradedPrice) ||
                                0;
                              let individualMTM = 0;

                              if (leg.action === "BUY") {
                                // Buy position: MTM = (Current Price - Buy Price) × Quantity
                                individualMTM =
                                  (currentPrice - entryPrice) * quantity;
                              } else if (leg.action === "SELL") {
                                // Sell position: MTM = (Sell Price - Current Price) × Quantity
                                individualMTM =
                                  (entryPrice - currentPrice) * quantity;
                              }

                              return (
                                <tr
                                  key={index}
                                  style={{
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "rgba(255, 107, 107, 0.1)";
                                    const removeBtn =
                                      e.currentTarget.querySelector(
                                        ".remove-button-greeks"
                                      );
                                    if (removeBtn)
                                      removeBtn.style.opacity = "1";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                    const removeBtn =
                                      e.currentTarget.querySelector(
                                        ".remove-button-greeks"
                                      );
                                    if (removeBtn)
                                      removeBtn.style.opacity = "0";
                                  }}
                                >
                                  <td className="instrument-cell">
                                    {leg.action} {leg.expiry} {leg.strikePrice}{" "}
                                    {leg.instrument}
                                  </td>
                                  <td className="qty-cell">{quantity}</td>
                                  <td className="ltp-cell">
                                    {currentPrice > 0
                                      ? `₹ ${currentPrice.toFixed(2)}`
                                      : "-"}
                                  </td>
                                  <td className="entry-price-cell">
                                    {entryPrice > 0 ? (
                                      <span
                                        className={`entry-price-value ${
                                          leg.action === "BUY"
                                            ? "outflow"
                                            : "inflow"
                                        }`}
                                      >
                                        {leg.action === "BUY" ? "-" : "+"}₹
                                        {entryPrice.toFixed(2)}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="iv-cell">
                                    {iv ? `${iv}%` : "-"}
                                  </td>
                                  <td className="delta-cell">
                                    {delta ? (
                                      <div className="greeks-display">
                                        <div className="per-lot">{delta}</div>
                                        <div className="total">
                                          {(
                                            parseFloat(delta) * quantity
                                          ).toFixed(4)}
                                        </div>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="gamma-cell">
                                    {gamma ? (
                                      <div className="greeks-display">
                                        <div className="per-lot">{gamma}</div>
                                        <div className="total">
                                          {(
                                            parseFloat(gamma) * quantity
                                          ).toFixed(6)}
                                        </div>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="theta-cell">
                                    {theta ? (
                                      <div className="greeks-display">
                                        <div className="per-lot">{theta}</div>
                                        <div className="total">
                                          {Math.round(
                                            parseFloat(theta) * quantity * 100
                                          ) / 100}
                                        </div>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="vega-cell">
                                    {vega ? (
                                      <div className="greeks-display">
                                        <div className="per-lot">{vega}</div>
                                        <div className="total">
                                          {(
                                            parseFloat(vega) * quantity
                                          ).toFixed(2)}
                                        </div>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td
                                    className={`mtm-cell ${
                                      individualMTM >= 0
                                        ? "positive"
                                        : "negative"
                                    }`}
                                  >
                                    {currentPrice > 0 && entryPrice > 0
                                      ? `₹ ${individualMTM.toFixed(2)}`
                                      : "-"}
                                  </td>
                                  <td className="action-cell">
                                    <button
                                      type="button"
                                      className="remove-button-greeks"
                                      onClick={() => removeLeg(index)}
                                      style={{
                                        background:
                                          "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "32px",
                                        height: "32px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        boxShadow:
                                          "0 2px 4px rgba(255, 107, 107, 0.3)",
                                        transition: "all 0.2s ease",
                                        opacity: 0,
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.transform = "scale(1.1)";
                                        e.target.style.boxShadow =
                                          "0 4px 8px rgba(255, 107, 107, 0.5)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.transform = "scale(1)";
                                        e.target.style.boxShadow =
                                          "0 2px 4px rgba(255, 107, 107, 0.3)";
                                      }}
                                    >
                                      <IconRegistry
                                        name="close"
                                        size={16}
                                        style={{ color: "white" }}
                                      />
                                    </button>
                                  </td>
                                </tr>
                              );
                            }
                          )
                        ) : (
                          <tr>
                            <td colSpan="11" className="no-data-row">
                              <div className="no-data-message">
                                <IconRegistry name="info" size={24} />
                                <span>
                                  No strategy legs added yet. Add some options
                                  to see Greeks analysis.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Greeks Data Info Message */}
                        {algoTrading?.trendLegMasterRequests?.length > 0 && (
                          <tr>
                            <td colSpan="11" className="greeks-info-row">
                              <div className="greeks-info-message">
                                <IconRegistry name="info" size={16} />
                                <span>
                                  Greeks data shows real-time values from
                                  market. Values will appear as "-" if no live
                                  data is available.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="summary-row">
                          <td className="summary-label">Total</td>
                          <td className="summary-qty">
                            {algoTrading?.trendLegMasterRequests?.reduce(
                              (sum, leg) => sum + parseInt(leg.quantity || 0),
                              0
                            ) || 0}
                          </td>
                          <td className="summary-ltp">-</td>
                          <td className="summary-entry-price">
                            {(() => {
                              let totalEntryPrice = 0;

                              algoTrading?.trendLegMasterRequests?.forEach(
                                (leg) => {
                                  const entryPrice =
                                    parseFloat(
                                      fixedLegPrices[
                                        algoTrading.trendLegMasterRequests.indexOf(
                                          leg
                                        )
                                      ]
                                    ) ||
                                    parseFloat(leg.entryPrice) ||
                                    parseFloat(leg.lastTradedPrice) ||
                                    0;
                                  const action = leg.action;

                                  if (action === "BUY") {
                                    totalEntryPrice -= entryPrice; // Negative for BUY (premium paid)
                                  } else if (action === "SELL") {
                                    totalEntryPrice += entryPrice; // Positive for SELL (premium received)
                                  }
                                }
                              );

                              return totalEntryPrice !== 0 ? (
                                <span
                                  className={`total-entry-price ${
                                    totalEntryPrice >= 0 ? "inflow" : "outflow"
                                  }`}
                                >
                                  {totalEntryPrice >= 0 ? "+" : ""}₹
                                  {totalEntryPrice.toFixed(2)}
                                </span>
                              ) : (
                                "-"
                              );
                            })()}
                          </td>
                          <td className="summary-iv">-</td>
                          <td className="summary-delta">
                            {(() => {
                              // Calculate per-lot and total delta from individual legs
                              let perLotDelta = 0;
                              let totalDelta = 0;

                              algoTrading?.trendLegMasterRequests?.forEach(
                                (leg, index) => {
                                  const quantity = parseInt(leg.quantity || 0);
                                  let delta = 0;

                                  if (leg.instrument === "CE") {
                                    const greeks =
                                      symbolValueCEGreeks[leg.identifier];
                                    delta =
                                      greeks?.delta &&
                                      parseFloat(greeks.delta) !== 0
                                        ? parseFloat(greeks.delta)
                                        : 0;
                                  } else if (leg.instrument === "PE") {
                                    const greeks =
                                      symbolValuePEGreeks[leg.identifier];
                                    delta =
                                      greeks?.delta &&
                                      parseFloat(greeks.delta) !== 0
                                        ? parseFloat(greeks.delta)
                                        : 0;
                                  }

                                  perLotDelta += delta;
                                  totalDelta += delta * quantity;
                                }
                              );

                              return perLotDelta !== 0 ? (
                                <div className="greeks-display">
                                  <div className="per-lot">
                                    {perLotDelta.toFixed(4)}
                                  </div>
                                  <div className="total">
                                    {totalDelta.toFixed(4)}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              );
                            })()}
                          </td>
                          <td className="summary-gamma">
                            {(() => {
                              // Calculate per-lot and total gamma from individual legs
                              let perLotGamma = 0;
                              let totalGamma = 0;

                              algoTrading?.trendLegMasterRequests?.forEach(
                                (leg, index) => {
                                  const quantity = parseInt(leg.quantity || 0);
                                  let gamma = 0;

                                  if (leg.instrument === "CE") {
                                    const greeks =
                                      symbolValueCEGreeks[leg.identifier];
                                    gamma =
                                      greeks?.gamma &&
                                      parseFloat(greeks.gamma) !== 0
                                        ? parseFloat(greeks.gamma)
                                        : 0;
                                  } else if (leg.instrument === "PE") {
                                    const greeks =
                                      symbolValuePEGreeks[leg.identifier];
                                    gamma =
                                      greeks?.gamma &&
                                      parseFloat(greeks.gamma) !== 0
                                        ? parseFloat(greeks.gamma)
                                        : 0;
                                  }

                                  perLotGamma += gamma;
                                  totalGamma += gamma * quantity;
                                }
                              );

                              return perLotGamma !== 0 ? (
                                <div className="greeks-display">
                                  <div className="per-lot">
                                    {perLotGamma.toFixed(6)}
                                  </div>
                                  <div className="total">
                                    {totalGamma.toFixed(6)}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              );
                            })()}
                          </td>
                          <td className="summary-theta">
                            {(() => {
                              // Calculate per-lot and total theta from individual legs
                              let perLotTheta = 0;
                              let totalTheta = 0;

                              algoTrading?.trendLegMasterRequests?.forEach(
                                (leg, index) => {
                                  const quantity = parseInt(leg.quantity || 0);
                                  let theta = 0;

                                  if (leg.instrument === "CE") {
                                    const greeks =
                                      symbolValueCEGreeks[leg.identifier];
                                    theta =
                                      greeks?.theta &&
                                      parseFloat(greeks.theta) !== 0
                                        ? parseFloat(greeks.theta)
                                        : 0;
                                  } else if (leg.instrument === "PE") {
                                    const greeks =
                                      symbolValuePEGreeks[leg.identifier];
                                    theta =
                                      greeks?.theta &&
                                      parseFloat(greeks.theta) !== 0
                                        ? parseFloat(greeks.theta)
                                        : 0;
                                  }

                                  perLotTheta += theta;
                                  totalTheta += theta * quantity;
                                }
                              );

                              return perLotTheta !== 0 ? (
                                <div className="greeks-display">
                                  <div className="per-lot">
                                    {perLotTheta.toFixed(2)}
                                  </div>
                                  <div className="total">
                                    {Math.round(totalTheta * 100) / 100}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              );
                            })()}
                          </td>
                          <td className="summary-vega">
                            {(() => {
                              // Calculate per-lot and total vega from individual legs
                              let perLotVega = 0;
                              let totalVega = 0;

                              algoTrading?.trendLegMasterRequests?.forEach(
                                (leg, index) => {
                                  const quantity = parseInt(leg.quantity || 0);
                                  let vega = 0;

                                  if (leg.instrument === "CE") {
                                    const greeks =
                                      symbolValueCEGreeks[leg.identifier];
                                    vega =
                                      greeks?.vega &&
                                      parseFloat(greeks.vega) !== 0
                                        ? parseFloat(greeks.vega)
                                        : 0;
                                  } else if (leg.instrument === "PE") {
                                    const greeks =
                                      symbolValuePEGreeks[leg.identifier];
                                    vega =
                                      greeks?.vega &&
                                      parseFloat(greeks.vega) !== 0
                                        ? parseFloat(greeks.vega)
                                        : 0;
                                  }

                                  perLotVega += vega;
                                  totalVega += vega * quantity;
                                }
                              );

                              return perLotVega !== 0 ? (
                                <div className="greeks-display">
                                  <div className="per-lot">
                                    {perLotVega.toFixed(2)}
                                  </div>
                                  <div className="total">
                                    {totalVega.toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                "-"
                              );
                            })()}
                          </td>
                          <td
                            className={`summary-mtm ${
                              strategyMetrics.mtm >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {strategyMetrics.mtm !== 0
                              ? `₹ ${strategyMetrics.mtm.toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="summary-action">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scenario Analysis - Conditional Display Based on Greeks Table */}
          <div className="scenario-analysis-single-line">
            <div className="scenario-metrics-inline">
              {/* When Greeks Table is CLOSED - Show Basic Greeks + All Details */}
              {!showGreeksTable && (
                <>
                  <div className="metric-item">
                    <span className="metric-label">Total Qty:</span>
                    <span className="metric-value" style={{ whiteSpace: 'nowrap' }}>
                      {(() => {
                        // Calculate Buy Qty: Sum of all BUY leg quantities (always positive)
                        const buyQty = Math.abs(
                          (algoTrading?.trendLegMasterRequests || []).reduce(
                            (sum, leg) => {
                              if (leg.action === "BUY") {
                                const qty = Math.abs(parseInt(leg.quantity || 0));
                                return sum + qty;
                              }
                              return sum;
                            },
                            0
                          )
                        );
                        
                        // Calculate Sell Qty: Sum of all SELL leg quantities (always positive)
                        const sellQty = Math.abs(
                          (algoTrading?.trendLegMasterRequests || []).reduce(
                            (sum, leg) => {
                              if (leg.action === "SELL") {
                                const qty = Math.abs(parseInt(leg.quantity || 0));
                                return sum + qty;
                              }
                              return sum;
                            },
                            0
                          )
                        );
                        
                        // Calculate Net Qty: Buy Qty - Sell Qty (can be positive or negative)
                        const netQty = buyQty - sellQty;
                        
                        return `B: ${buyQty} S: ${sellQty} Net: ${netQty}`;
                      })()}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Delta:</span>
                    <span className="metric-value delta">
                      {greeksData?.isLoading ? (
                        <span className="loading-indicator">Loading...</span>
                      ) : (
                        (() => {
                          // Real-time delta from API
                          const realTimeDelta = greeksData?.delta || 0;
                          return realTimeDelta.toFixed(4);
                        })()
                      )}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Gamma:</span>
                    <span className="metric-value gamma">
                      {greeksData?.isLoading ? (
                        <span className="loading-indicator">Loading...</span>
                      ) : (
                        (() => {
                          // Real-time gamma from API
                          const realTimeGamma = greeksData?.gamma || 0;
                          return realTimeGamma.toFixed(6);
                        })()
                      )}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Theta:</span>
                    <span className="metric-value theta">
                      {greeksData?.isLoading ? (
                        <span className="loading-indicator">Loading...</span>
                      ) : (
                        (() => {
                          // Real-time theta from API
                          const realTimeTheta = greeksData?.theta || 0;
                          return realTimeTheta.toFixed(2);
                        })()
                      )}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Vega:</span>
                    <span className="metric-value vega">
                      {greeksData?.isLoading ? (
                        <span className="loading-indicator">Loading...</span>
                      ) : (
                        (() => {
                          // Real-time vega from API
                          const realTimeVega = greeksData?.vega || 0;
                          return realTimeVega.toFixed(2);
                        })()
                      )}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">IV:</span>
                    <span className="metric-value iv">
                      {greeksData?.isLoading ? (
                        <span className="loading-indicator">Loading...</span>
                      ) : (
                        (() => {
                          // Real-time IV from API
                          const realTimeIV = greeksData?.weightedIV || 0;
                          return realTimeIV.toFixed(2) + "%";
                        })()
                      )}
                    </span>
                  </div>
                </>
              )}

              {/* When Greeks Table is OPEN - Show Only Detailed Metrics */}
              {showGreeksTable && (
                <>
                  <div className="metric-item">
                    <span className="metric-label">Total MTM:</span>
                    <span
                      className={`metric-value ${
                        strategyMetrics.mtm >= 0 ? "positive" : "negative"
                      }`}
                    >
                      ₹ {strategyMetrics.mtm.toFixed(2)} (
                      {strategyMetrics.mtmPercentage.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Maximum Profit:</span>
                    <span className="metric-value positive">
                      {strategyMetrics.maxProfit === 999999
                        ? "Unlimited"
                        : `₹ ${strategyMetrics.maxProfit.toFixed(0)}`}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Risk/Reward:</span>
                    <span className="metric-value">
                      {strategyMetrics.riskReward}
                    </span>
                  </div>
                  {(() => {
                    // Check if legs are added - show POP for specific strategies
                    const hasLegs =
                      algoTrading?.trendLegMasterRequests?.length > 0;
                    const hasValidData =
                      watchListSymbol[spotFutPrice?.spot]?.lastTradePrice ||
                      defaultLegs?.ltp ||
                      algoTrading?.trendLegMasterRequests?.[0]?.lastTradedPrice;

                    // Show POP for NAKED CE, NAKED PE (always), and single-leg strategies (when legs present)
                    const showPOP =
                      selectedStrategy === "naked_ce" ||
                      selectedStrategy === "naked_pe" ||
                      (hasLegs &&
                        algoTrading?.trendLegMasterRequests?.length === 1);

                    if (showPOP) {
                      return (
                        <div className="metric-item">
                          <span className="metric-label">POP:</span>
                          <span className="metric-value">
                            {(() => {
                              // For NAKED CE/PE, always show POP (even without legs)
                              if (
                                selectedStrategy === "naked_ce" ||
                                selectedStrategy === "naked_pe"
                              ) {
                                return `${strategyMetrics.pop.toFixed(1)}%`;
                              }

                              // For single-leg strategies, show loading if no data
                              if (!hasValidData && selectedStrategy) {
                                return (
                                  <span className="loading-indicator">
                                    Loading...
                                  </span>
                                );
                              }
                              return `${strategyMetrics.pop.toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      );
                    }
                    return null; // Don't show POP for other strategies
                  })()}
                  <div className="metric-item">
                    <span className="metric-label">Maximum Loss:</span>
                    <span className="metric-value negative">
                      {strategyMetrics.maxLoss === 999999
                        ? "Unlimited"
                        : `₹ ${strategyMetrics.maxLoss.toFixed(0)}`}
                    </span>
                    <button className="limit-btn">Limit</button>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Breakeven:</span>
                    <span className="metric-value breakeven">
                      {typeof strategyMetrics.breakeven === "string"
                        ? strategyMetrics.breakeven
                        : `${strategyMetrics.breakeven.toFixed(
                            0
                          )} (${strategyMetrics.breakevenPercentage.toFixed(
                            1
                          )}%)`}
                    </span>
                  </div>
                </>
              )}

              {/* When Greeks Table is CLOSED - Show All Details + Toggle */}
              {!showGreeksTable && (
                <>
                  <div className="metric-item">
                    <span className="metric-label">Total MTM:</span>
                    <span
                      className={`metric-value ${
                        strategyMetrics.mtm >= 0 ? "positive" : "negative"
                      }`}
                    >
                      ₹ {strategyMetrics.mtm.toFixed(2)} (
                      {strategyMetrics.mtmPercentage.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Maximum Profit:</span>
                    <span className="metric-value positive">
                      {strategyMetrics.maxProfit === 999999
                        ? "Unlimited"
                        : `₹ ${strategyMetrics.maxProfit.toFixed(0)}`}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Risk/Reward:</span>
                    <span className="metric-value">
                      {strategyMetrics.riskReward}
                    </span>
                  </div>
                  {(() => {
                    // Check if legs are added - show POP for specific strategies
                    const hasLegs =
                      algoTrading?.trendLegMasterRequests?.length > 0;
                    const hasValidData =
                      watchListSymbol[spotFutPrice?.spot]?.lastTradePrice ||
                      defaultLegs?.ltp ||
                      algoTrading?.trendLegMasterRequests?.[0]?.lastTradedPrice;

                    // Show POP for NAKED CE, NAKED PE (always), and single-leg strategies (when legs present)
                    const showPOP =
                      selectedStrategy === "naked_ce" ||
                      selectedStrategy === "naked_pe" ||
                      (hasLegs &&
                        algoTrading?.trendLegMasterRequests?.length === 1);

                    if (showPOP) {
                      return (
                        <div className="metric-item">
                          <span className="metric-label">POP:</span>
                          <span className="metric-value">
                            {(() => {
                              // For NAKED CE/PE, always show POP (even without legs)
                              if (
                                selectedStrategy === "naked_ce" ||
                                selectedStrategy === "naked_pe"
                              ) {
                                return `${strategyMetrics.pop.toFixed(1)}%`;
                              }

                              // For single-leg strategies, show loading if no data
                              if (!hasValidData && selectedStrategy) {
                                return (
                                  <span className="loading-indicator">
                                    Loading...
                                  </span>
                                );
                              }
                              return `${strategyMetrics.pop.toFixed(1)}%`;
                            })()}
                          </span>
                        </div>
                      );
                    }
                    return null; // Don't show POP for other strategies
                  })()}
                  <div className="metric-item">
                    <span className="metric-label">Maximum Loss:</span>
                    <span className="metric-value negative">
                      {strategyMetrics.maxLoss === 999999
                        ? "Unlimited"
                        : `₹ ${strategyMetrics.maxLoss.toFixed(0)}`}
                    </span>
                    <button className="limit-btn">Limit</button>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Breakeven:</span>
                    <span className="metric-value breakeven">
                      {typeof strategyMetrics.breakeven === "string"
                        ? strategyMetrics.breakeven
                        : `${strategyMetrics.breakeven.toFixed(
                            0
                          )} (${strategyMetrics.breakevenPercentage.toFixed(
                            1
                          )}%)`}
                    </span>
                  </div>
                  <div className="metric-item toggle-item">
                    <div className="greeks-info">
                      <span className="info-text">
                        Greeks show both Per Lot and Total values
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CREATE CUSTOM STRATEGY */}
          <div className="div-main-create-cus">
            <div
              className={`bottom-div-show ${
                isBoxReplacementVisible ? "" : "hidden"
              }`}
            >
              <div className="flex-data-main">
                <div className="chart-new">
                  {algoTrading?.trendLegMasterRequests?.length > 0 ? (
                    <AdvancedPayoffChart
                      legs={algoTrading?.trendLegMasterRequests || []}
                      spotPrice={
                        watchListSymbol[spotFutPrice?.spot]?.lastTradePrice || 0
                      }
                      volatility={greeksData.volatility || 0.25}
                      timeToExpiry={greeksData.timeToExpiry || 30}
                      riskFreeRate={0.05}
                      showGreeks={true}
                      showMetrics={true}
                    />
                  ) : (
                    <div className="no-chart-message">
                      <h3>Add Legs to View Chart</h3>
                      <p>
                        Configure your trading strategy legs to see the payoff
                        chart
                      </p>
                    </div>
                  )}
                </div>

                <div className="input-data-feilds">
                  {/* Add Legs Section */}
                  <div className="add-legs-main-div">
                    <div className="heading-data">
                      <h2>
                        <IconRegistry name="add" className="svg-tool" />
                        Set Legs
                        <Tooltip
                          arrow
                          componentsProps={tooltipDesign}
                          enterTouchDelay={0}
                          leaveTouchDelay={10000}
                          title={
                            <div style={{ padding: "8px" }}>
                              <span>
                                Add and configure individual legs (positions)
                                within the strategy.
                              </span>
                            </div>
                          }
                        >
                          <span>
                            <IconRegistry
                              name="exclamation-octagon"
                              className="svg-tool"
                            />
                          </span>
                        </Tooltip>
                      </h2>
                    </div>
                    <div className="select-data-fildes">
                      <div className="select-first">
                        <select
                          name="b_s"
                          className="form-control text-input"
                          value={defaultLegs?.b_s || ""}
                          onChange={handleDefaultLegsChange}
                        >
                          <option value="BUY">BUY</option>
                          <option value="SELL">SELL</option>
                        </select>
                      </div>

                      <div className="select-sec">
                        <select
                          name="instrument"
                          className="form-control text-input"
                          value={defaultLegs?.instrument || ""}
                          onChange={handleDefaultLegsChange}
                        >
                          <option value="CE">CE</option>
                          <option value="PE">PE</option>
                          <option value="FUT">FUT</option>
                        </select>
                      </div>

                      <div className="select-sec">
                        <select
                          name="expiry"
                          className="form-control text-input"
                          value={defaultLegs?.expiry || ""}
                          onChange={handleDefaultLegsChange}
                        >
                          {expiryList.map((option, key) => (
                            <option key={key} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="select-sec">
                        <select
                          name="strike"
                          className="form-control text-input"
                          value={defaultLegs?.strike || ""}
                          onChange={handleDefaultLegsChange}
                          disabled={defaultLegs?.instrument == "FUT" ?? false}
                        >
                          {processedStrikePrices(
                            defaultLegs?.strikePriceList
                          )?.map((option, key) => {
                            return (
                              <option key={key} value={option.strikePrice}>
                                {priceType == "price"
                                  ? option.strikePrice
                                  : option?.label}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="counter_btn">
                        <button
                          type="button"
                          className="decrement"
                          onClick={() => handleQtyChange("decrement")}
                        >
                          -
                        </button>
                        <p>{qty}</p>
                        <button
                          type="button"
                          className="increment"
                          onClick={() => handleQtyChange("increment")}
                        >
                          +
                        </button>
                      </div>

                      <div className="mid-value-data">
                        <h3>LTP</h3>
                        <p>{defaultLegs?.ltp}</p>
                      </div>

                      <div className="btn-add-data">
                        <button
                          type="button"
                          onClick={addLeg}
                          disabled={selectedStrategy && selectedStrategy !== ""}
                          style={{
                            opacity:
                              selectedStrategy && selectedStrategy !== ""
                                ? 0.5
                                : 1,
                            cursor:
                              selectedStrategy && selectedStrategy !== ""
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          +ADD
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Legs Added Section */}
                  <div className="legs-added">
                    <div className="heading-data">
                      <h2>
                        <IconRegistry
                          name="check-circle"
                          className="svg-tool"
                        />
                        Legs Added
                        <span className="strategy-info">
                          {(selectedStrategy || "CUSTOM")
                            .replace(/_/g, " ")
                            .toUpperCase()}
                          <span className="leg-count">
                            ({algoTrading?.trendLegMasterRequests?.length || 0}
                            /9 leg
                            {(algoTrading?.trendLegMasterRequests?.length ||
                              0) !== 1
                              ? "s"
                              : ""}
                            )
                          </span>
                        </span>
                      </h2>

                      {/* PRICE/ATM Buttons in Header */}
                      {algoTrading?.trendLegMasterRequests?.length > 0 && (
                        <div className="header-buttons">
                          <button
                            type="button"
                            className={`header-btn ${
                              priceType == "price" ? "active" : ""
                            }`}
                            onClick={() => handlePriceType("price")}
                          >
                            PRICE
                          </button>
                          <button
                            type="button"
                            className={`header-btn ${
                              priceType == "atm" ? "active" : ""
                            }`}
                            onClick={() => handlePriceType("atm")}
                          >
                            ATM
                          </button>
                        </div>
                      )}
                    </div>

                    {algoTrading?.trendLegMasterRequests?.length > 0 && (
                      <>
                        <div className="legs-add-data">
                          {algoTrading?.trendLegMasterRequests?.map(
                            (value, index) => (
                              <div key={index} className="leg-card">
                                <div className="leg-header">
                                  <span className="leg-number">
                                    Leg {index + 1}
                                  </span>
                                  <div className="leg-actions">
                                    <button
                                      type="button"
                                      className="btn-action btn-delete"
                                      onClick={() => removeLeg(index)}
                                      title="Remove Leg"
                                    >
                                      <IconRegistry name="close" size={16} />
                                    </button>
                                  </div>
                                </div>

                                <div className="leg-content">
                                  <div className="leg-row">
                                    <div className="form-group">
                                      <label>Action</label>
                                      <select
                                        name={`trendLegMasterRequests[${index}].action`}
                                        className="form-control text-input"
                                        value={value?.action || ""}
                                        onChange={handleChildLegChange}
                                      >
                                        <option value="BUY">Buy</option>
                                        <option value="SELL">Sell</option>
                                      </select>
                                    </div>

                                    <div className="form-group">
                                      <label>Instrument</label>
                                      <select
                                        name={`trendLegMasterRequests[${index}].instrument`}
                                        className="form-control text-input"
                                        value={value?.instrument || ""}
                                        onChange={handleChildLegChange}
                                      >
                                        <option value="CE">CE</option>
                                        <option value="PE">PE</option>
                                        <option value="FUT">FUT</option>
                                      </select>
                                    </div>

                                    <div className="form-group">
                                      <label>Expiry</label>
                                      <select
                                        name={`trendLegMasterRequests[${index}].expiry`}
                                        className="form-control text-input"
                                        value={value?.expiry || ""}
                                        onChange={handleChildLegChange}
                                      >
                                        {expiryList.map((option, key) => (
                                          <option key={key} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div className="form-group">
                                      <label>Strike Price</label>
                                      <select
                                        name={`trendLegMasterRequests[${index}].strikePrice`}
                                        className="form-control text-input"
                                        value={value?.strikePrice || ""}
                                        onChange={handleChildLegChange}
                                        disabled={
                                          value?.instrument == "FUT" ?? false
                                        }
                                      >
                                        {processedStrikePrices(
                                          strikePriceListArr[index]
                                        )?.map((option, key) => {
                                          return (
                                            <option
                                              key={key}
                                              value={option.strikePrice}
                                            >
                                              {priceType == "price"
                                                ? option.strikePrice
                                                : option?.label}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>

                                    <div className="form-group">
                                      <label>Qty</label>
                                      <div className="counter_btn">
                                        <button
                                          type="button"
                                          className="decrement"
                                          onClick={() =>
                                            handleQtyChange("decrement", index)
                                          }
                                        >
                                          -
                                        </button>
                                        <p>{value?.quantity}</p>
                                        <button
                                          type="button"
                                          className="increment"
                                          onClick={() =>
                                            handleQtyChange("increment", index)
                                          }
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <label>Price</label>
                                      <div className="price-display">
                                        {value?.lastTradedPrice}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="leg-row">
                                    <div className="form-group">
                                      <label>
                                        Leg-Wise Adjustment
                                        <Tooltip
                                          arrow
                                          componentsProps={tooltipDesign}
                                          enterTouchDelay={0}
                                          leaveTouchDelay={10000}
                                          title={
                                            <div style={{ padding: "8px" }}>
                                              <span>
                                                Customize individual leg
                                                behavior after entry (e.g.,
                                                adjust SL, roll to new strike,
                                                hedge, or reverse).
                                              </span>
                                            </div>
                                          }
                                        >
                                          <IconRegistry
                                            name="exclamation-octagon"
                                            className="svg-tool"
                                          />
                                        </Tooltip>
                                      </label>
                                      <select
                                        name={`trendLegMasterRequests[${index}].adjustmentName`}
                                        className="form-control text-input"
                                        value={value?.adjustmentName || ""}
                                        onChange={handleChildLegChange}
                                      >
                                        <option value="">
                                          Select Adjustment
                                        </option>
                                        <option value="sqOffLeg">
                                          Sq Off Leg
                                        </option>
                                        <option value="futSpot">
                                          Future/Spot
                                        </option>
                                        <option value="reEntry">
                                          Re Entry
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {value?.adjustmentName == "sqOffLeg" && (
                                  <div className="leg-row">
                                    <div className="form-group">
                                      <label>Target</label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                        name={`sqTarget`}
                                        value={
                                          value?.adjustment?.sqTarget || ""
                                        }
                                        onChange={(e) =>
                                          handleAdjustmentChange(e, index)
                                        }
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>Stop Loss</label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                        name={`sqStopLoss`}
                                        value={
                                          value?.adjustment?.sqStopLoss || ""
                                        }
                                        onChange={(e) =>
                                          handleAdjustmentChange(e, index)
                                        }
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>Trailing Profit</label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                        name={`sqTrailingProfit`}
                                        value={
                                          value?.adjustment?.sqTrailingProfit
                                        }
                                        onChange={(e) =>
                                          handleAdjustmentChange(e, index)
                                        }
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>Trailing Loss</label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                        name={`sqTrailingLoss`}
                                        value={
                                          value?.adjustment?.sqTrailingLoss
                                        }
                                        onChange={(e) =>
                                          handleAdjustmentChange(e, index)
                                        }
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>S/L Unit</label>
                                      <select
                                        className="form-control text-input"
                                        name={`sqUnitOfChange`}
                                        value={
                                          value?.adjustment?.sqUnitOfChange ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleAdjustmentChange(e, index)
                                        }
                                      >
                                        <option value="Point">Point</option>
                                        <option value="Percentage">
                                          Percentage
                                        </option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                                {value?.adjustmentName == "futSpot" && (
                                  <>
                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>No of times</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`fsNoOfTimes`}
                                          value={
                                            value?.adjustment?.fsNoOfTimes || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>S/L Unit</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsUnitOfChange`}
                                          value={
                                            value?.adjustment?.fsUnitOfChange ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value={"Point"}>Point</option>
                                          <option value={"Percentage"}>
                                            Percentage
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>Future Points Up</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`fsFuturePointsUp`}
                                          value={
                                            value?.adjustment?.fsFuturePointsUp
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>Action</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpuAction`}
                                          value={
                                            value?.adjustment?.fsfpuAction || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value={"BUY"}>Buy</option>
                                          <option value={"SELL"}>Sell</option>
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Instrument</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpuInstrument`}
                                          value={
                                            value?.adjustment
                                              ?.fsfpuInstrument || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value="CE">CE</option>
                                          <option value="PE">PE</option>
                                          <option value="FUT">FUT</option>
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Strike Price</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpuStrikePrice`}
                                          value={
                                            value?.adjustment
                                              ?.fsfpuStrikePrice || ""
                                          }
                                          disabled={
                                            value?.adjustment
                                              ?.fsfpuInstrument == "FUT" ??
                                            false
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          {processedStrikePrices(
                                            futStrikePriceListArr[index]?.up
                                          )?.map((option, key) => {
                                            return (
                                              <option
                                                key={key}
                                                value={option.strikePrice}
                                              >
                                                {priceType == "price"
                                                  ? option.strikePrice
                                                  : option?.label}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Expiry</label>
                                        <select
                                          name={`fsfpuExpiryDate`}
                                          className="form-control text-input"
                                          value={
                                            value?.adjustment
                                              ?.fsfpuExpiryDate || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          {expiryList.map((option, key) => (
                                            <option key={key} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Qty</label>
                                        <div className="counter_btn">
                                          <button
                                            type="button"
                                            className="decrement"
                                            onClick={() =>
                                              handleQtyChange(
                                                "decrement",
                                                index,
                                                "fsfpuQuantity"
                                              )
                                            }
                                          >
                                            -
                                          </button>
                                          <p>
                                            {value?.adjustment?.fsfpuQuantity}
                                          </p>
                                          <button
                                            type="button"
                                            className="increment"
                                            onClick={() =>
                                              handleQtyChange(
                                                "increment",
                                                index,
                                                "fsfpuQuantity"
                                              )
                                            }
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>Future Points Down</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`fsFuturePointsDown`}
                                          value={
                                            value?.adjustment
                                              ?.fsFuturePointsDown
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>Action</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpdAction`}
                                          value={
                                            value?.adjustment?.fsfpdAction || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value={"BUY"}>Buy</option>
                                          <option value={"SELL"}>Sell</option>
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Instrument</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpdInstrument`}
                                          value={
                                            value?.adjustment
                                              ?.fsfpdInstrument || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value="CE">CE</option>
                                          <option value="PE">PE</option>
                                          <option value="FUT">FUT</option>
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Strike Price</label>
                                        <select
                                          className="form-control text-input"
                                          name={`fsfpdStrikePrice`}
                                          value={
                                            value?.adjustment
                                              ?.fsfpdStrikePrice || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                          disabled={
                                            value?.adjustment
                                              ?.fsfpuInstrument == "FUT" ??
                                            false
                                          }
                                        >
                                          {processedStrikePrices(
                                            futStrikePriceListArr[index]?.down
                                          )?.map((option, key) => {
                                            return (
                                              <option
                                                key={key}
                                                value={option.strikePrice}
                                              >
                                                {priceType == "price"
                                                  ? option.strikePrice
                                                  : option?.label}
                                              </option>
                                            );
                                          })}
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Expiry</label>
                                        <select
                                          name={`fsfpdExpiryDate`}
                                          className="form-control text-input"
                                          value={
                                            value?.adjustment
                                              ?.fsfpdExpiryDate || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          {expiryList.map((option, key) => (
                                            <option key={key} value={option}>
                                              {option}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div className="form-group">
                                        <label>Qty</label>
                                        <div className="counter_btn">
                                          <button
                                            type="button"
                                            className="decrement"
                                            onClick={() =>
                                              handleQtyChange(
                                                "decrement",
                                                index,
                                                "fsfpdQuantity"
                                              )
                                            }
                                          >
                                            -
                                          </button>
                                          <p>
                                            {value?.adjustment?.fsfpdQuantity}
                                          </p>
                                          <button
                                            type="button"
                                            className="increment"
                                            onClick={() =>
                                              handleQtyChange(
                                                "increment",
                                                index,
                                                "fsfpdQuantity"
                                              )
                                            }
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                                {value?.adjustmentName == "reEntry" && (
                                  <>
                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>No of times</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`reNoOfTimes`}
                                          value={
                                            value?.adjustment?.reNoOfTimes || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>S/L Unit</label>
                                        <select
                                          className="form-control text-input"
                                          name={`reUnitOfChange`}
                                          value={
                                            value?.adjustment?.reUnitOfChange ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value={"Point"}>Point</option>
                                          <option value={"Percentage"}>
                                            Percentage
                                          </option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>Target</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`reTarget`}
                                          value={
                                            value?.adjustment?.reTarget || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>Target Type</label>
                                        <select
                                          className="form-control text-input"
                                          name={`reTargetType`}
                                          value={
                                            value?.adjustment?.reTargetType ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value="reOnTarget">
                                            Re-entry on target
                                          </option>
                                          <option value="reOnSl">
                                            Re-entry on S/l
                                          </option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="leg-row">
                                      <div className="form-group">
                                        <label>Stop Loss</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="0"
                                          name={`reStopLoss`}
                                          value={
                                            value?.adjustment?.reStopLoss || ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        />
                                      </div>
                                      <div className="form-group">
                                        <label>Stop Loss Type</label>
                                        <select
                                          className="form-control text-input"
                                          name={`reStopLossType`}
                                          value={
                                            value?.adjustment?.reStopLossType ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            handleAdjustmentChange(e, index)
                                          }
                                        >
                                          <option value="reOnTarget">
                                            Re-entry on target
                                          </option>
                                          <option value="reOnSl">
                                            Re-entry on S/l
                                          </option>
                                        </select>
                                      </div>
                                    </div>
                                  </>
                                )}

                                <div className="leg-row">
                                  <div className="form-group">
                                    <label className="form-label-with-switch">
                                      <span>Premium Entry Setup</span>
                                      <Tooltip
                                        arrow
                                        componentsProps={tooltipDesign}
                                        enterTouchDelay={0}
                                        leaveTouchDelay={10000}
                                        title={
                                          <div style={{ padding: "8px" }}>
                                            <span>
                                              Configure automatic entry based on
                                              premium values:
                                            </span>
                                            <br />
                                            <span>
                                              {`Entry when premium > X`}
                                            </span>
                                            <span>
                                              {`Entry when premium < Y`}
                                            </span>
                                            <span>
                                              {`Entry between X and Y`}
                                            </span>
                                          </div>
                                        }
                                      >
                                        <IconRegistry
                                          name="exclamation-octagon"
                                          className="svg-tool"
                                        />
                                      </Tooltip>
                                      <label className="switch-container">
                                        <input
                                          type="checkbox"
                                          name={`trendLegMasterRequests[${index}].isPremiumEntry`}
                                          onChange={handleChildLegChange}
                                          checked={value?.isPremiumEntry}
                                        />
                                        <span className="switch-slider"></span>
                                      </label>
                                    </label>
                                    <span className="span-btm">
                                      Define desired premium for individual legs
                                    </span>
                                  </div>
                                </div>

                                {value?.isPremiumEntry && (
                                  <div className="leg-row">
                                    <div className="form-group">
                                      <label>Range Type</label>
                                      <select
                                        className="form-control text-input"
                                        name={`trendLegMasterRequests[${index}].premiumRange`}
                                        value={value?.premiumRange || ""}
                                        onChange={handleChildLegChange}
                                      >
                                        <option value="range">Range</option>
                                        <option value="greater_range">
                                          Greater than
                                        </option>
                                        <option value="less_range">
                                          Less than
                                        </option>
                                      </select>
                                    </div>

                                    <div className="form-group">
                                      <label>From</label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="108"
                                        name={`trendLegMasterRequests[${index}].premiumRangeFrom`}
                                        value={value?.premiumRangeFrom || ""}
                                        onChange={handleChildLegChange}
                                      />
                                    </div>

                                    {value?.premiumRange == "range" && (
                                      <div className="form-group">
                                        <label>To</label>
                                        <input
                                          type="text"
                                          className="form-control text-input"
                                          placeholder="108"
                                          name={`trendLegMasterRequests[${index}].premiumRangeTo`}
                                          value={value?.premiumRangeTo || ""}
                                          onChange={handleChildLegChange}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          {/* Fixed Bottom Section */}
                          <div className="fixed-bottom-section">
                            <div className="net-premium-info">
                              <p>
                                NET PREMIUM:{" "}
                                <span className="net-premium-value">
                                  {(() => {
                                    // Calculate Net Premium per unit (not multiplied by lot size)
                                    let totalPremiumReceived = 0;
                                    let totalPremiumPaid = 0;

                                    if (
                                      algoTrading?.trendLegMasterRequests
                                        ?.length > 0
                                    ) {
                                      algoTrading.trendLegMasterRequests.forEach(
                                        (leg) => {
                                          const premium =
                                            leg.lastTradedPrice || 0;
                                          const quantity =
                                            parseInt(leg.quantity) || 0;

                                          // Check if it's a BUY or SELL leg based on the action
                                          const isBuy =
                                            leg.action === "BUY" ||
                                            leg.action === "Buy";
                                          const isSell =
                                            leg.action === "SELL" ||
                                            leg.action === "Sell";

                                          if (isBuy) {
                                            // Buy leg - premium paid
                                            totalPremiumPaid += premium;
                                          } else if (isSell) {
                                            // Sell leg - premium received
                                            totalPremiumReceived += premium;
                                          }
                                        }
                                      );
                                    }

                                    const netPremium =
                                      totalPremiumReceived - totalPremiumPaid;

                                    return netPremium.toFixed(2);
                                  })()}
                                </span>
                              </p>
                            </div>

                            <div className="bottom-controls">
                              <div className="control-buttons">
                                <button
                                  type="button"
                                  className="btn-toggle"
                                  onClick={toggleProfitLossFields}
                                >
                                  {showProfitLossFields ? "Hide" : "Display"}{" "}
                                  P/L
                                  <IconRegistry
                                    name={
                                      showProfitLossFields
                                        ? "chevron-up"
                                        : "chevron-down"
                                    }
                                    className="toggle-icon"
                                  />
                                </button>

                                <button type="button" className="btn-secondary">
                                  Manual Order
                                </button>

                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    name="strategyReq[moveStopLoss]"
                                    onChange={handleChange}
                                    checked={
                                      algoTrading?.strategyReq?.moveStopLoss
                                    }
                                  />
                                  Trail to Breakeven
                                </label>
                              </div>

                              {/* Conditional Profit/Loss Fields */}
                              {showProfitLossFields && (
                                <div className="profit-loss-fields">
                                  <div className="leg-row">
                                    <div className="form-group">
                                      <label>
                                        Max Profit
                                        <Tooltip
                                          arrow
                                          componentsProps={tooltipDesign}
                                          enterTouchDelay={0}
                                          leaveTouchDelay={10000}
                                          title={
                                            <div style={{ padding: "8px" }}>
                                              <span>
                                                Exit all legs when the total
                                                combined profit reaches this
                                                level.
                                              </span>
                                            </div>
                                          }
                                        >
                                          <IconRegistry
                                            name="exclamation-octagon"
                                            className="svg-tool"
                                          />
                                        </Tooltip>
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div className="form-group">
                                      <label>
                                        Max Loss
                                        <Tooltip
                                          arrow
                                          componentsProps={tooltipDesign}
                                          enterTouchDelay={0}
                                          leaveTouchDelay={10000}
                                          title={
                                            <div style={{ padding: "8px" }}>
                                              <span>
                                                Exit all legs when the total
                                                combined loss reaches this
                                                level.
                                              </span>
                                            </div>
                                          }
                                        >
                                          <IconRegistry
                                            name="exclamation-octagon"
                                            className="svg-tool"
                                          />
                                        </Tooltip>
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control text-input"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {algoTrading?.trendLegMasterRequests?.length == 0 && (
                      <div className="no-legs-message">
                        <p>No legs added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {algoTrading?.trendLegMasterRequests?.length > 0 && (
                <>
                  {/* Add Entry Conditions  */}
                  <div className="add-entry-data">
                    <div className="heading-data">
                      <h2>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        Entry Conditions
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
                                Configure entry conditions and timing for your
                                strategy.
                              </span>
                            </div>
                          }
                        >
                          <IconRegistry
                            name="exclamation-octagon"
                            className="svg-tool"
                          />
                        </Tooltip>{" "}
                      </h2>
                    </div>
                    <div className="radio-div-data">
                      <div className="radio-flex-data">
                        <div className="flex-radio-1 radio-data-com">
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
                                  type="checkbox"
                                  name="strategyReq[desiredSpreadStrategy]"
                                  onChange={handleChange}
                                  checked={
                                    algoTrading?.strategyReq
                                      ?.desiredSpreadStrategy
                                  }
                                />
                                <span>Premium Difference Setup</span>
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  title={
                                    <div style={{ padding: "8px" }}>
                                      <span>
                                        Set the required difference between the
                                        premiums of two legs for entry to be
                                        allowed.
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
                              <span className="span-btm">
                                {" "}
                                Define desired premium and spread for entry
                              </span>
                            </label>
                          </div>
                          <div className="inner-label-data">
                            {algoTrading?.strategyReq
                              ?.desiredSpreadStrategy && (
                              <div className="section-box-bottom box-one-data">
                                <div className="select-data-fildes box-data-section">
                                  <div className="select-first">
                                    {/* <label>Action</label> */}
                                    <select
                                      className="form-control text-input"
                                      value={
                                        algoTrading?.strategyReq?.dssRange || ""
                                      }
                                      name="strategyReq[dssRange]"
                                      onChange={handleChange}
                                    >
                                      <option value="greater">
                                        Greater than
                                      </option>
                                      <option value="less">Less than</option>
                                    </select>
                                  </div>
                                  <div className="input-text-section">
                                    <input
                                      type="text"
                                      value={
                                        algoTrading?.strategyReq?.dssValue || ""
                                      }
                                      name="strategyReq[dssValue]"
                                      onChange={handleChange}
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                <div className="text-info-main">
                                  <p> For Market orders, Enter value "0"</p>
                                  <div className="text-flex-data">
                                    <p>Live Premium: {totalMargin}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-radio-2 radio-data-com">
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
                                  type="checkbox"
                                  name="strategyReq[timeBasedEntryStrategy]"
                                  onChange={handleChange}
                                  checked={
                                    algoTrading?.strategyReq
                                      ?.timeBasedEntryStrategy
                                  }
                                />
                                <span>Scheduled Time Entry</span>
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  title={
                                    <div style={{ padding: "8px" }}>
                                      <span>
                                        Automatically trigger entry at a
                                        specific time (e.g., 9:30 AM).
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
                              <span className="span-btm">
                                Define time conditions for computation
                              </span>
                            </label>
                          </div>
                          <div className="inner-label-data">
                            {algoTrading?.strategyReq
                              ?.timeBasedEntryStrategy && (
                              <form onSubmit={(e) => e.preventDefault()}>
                                <div className="section-box">
                                  <LocalizationProvider
                                    dateAdapter={AdapterDayjs}
                                  >
                                    <DateTimePicker
                                      timeSteps={{ minutes: 1 }}
                                      label="Start Time"
                                      onChange={() => {}}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          sx: { width: 200 },
                                        },
                                        popper: {
                                          modifiers: [
                                            {
                                              name: "offset",
                                              options: {
                                                offset: [0, 4],
                                              },
                                            },
                                          ],
                                          sx: {
                                            "& .MuiPickersLayout-root": {
                                              transform: "scale(0.85)", // Scale down calendar popup
                                              transformOrigin: "top left",
                                              maxWidth: "unset",
                                              width: "fit-content",
                                            },
                                            "& .MuiPickersCalendarHeader-root, & .MuiPickersDay-root, & .MuiClock-root":
                                              {
                                                fontSize: "0.75rem", // Optional: smaller text
                                              },
                                            "& .MuiCalendarOrClockPicker-root":
                                              {
                                                width: "fit-content",
                                              },

                                            "& .MuiPickersTimePicker-root": {
                                              maxWidth: "10px",
                                            },
                                          },
                                        },
                                      }}
                                    />
                                  </LocalizationProvider>
                                </div>
                                <div className="section-box">
                                  <LocalizationProvider
                                    dateAdapter={AdapterDayjs}
                                  >
                                    <DateTimePicker
                                      timeSteps={{ minutes: 1 }}
                                      label="End Time"
                                      onChange={() => {}}
                                      slotProps={{
                                        textField: {
                                          size: "small",
                                          sx: { width: 200 },
                                        },
                                        popper: {
                                          modifiers: [
                                            {
                                              name: "offset",
                                              options: {
                                                offset: [0, 4],
                                              },
                                            },
                                          ],
                                          sx: {
                                            "& .MuiPickersLayout-root": {
                                              transform: "scale(0.85)", // Scale down calendar popup
                                              transformOrigin: "top left",
                                              maxWidth: "unset",
                                              width: "fit-content",
                                            },
                                            "& .MuiPickersCalendarHeader-root, & .MuiPickersDay-root, & .MuiClock-root":
                                              {
                                                fontSize: "0.75rem", // Optional: smaller text
                                              },
                                            "& .MuiCalendarOrClockPicker-root":
                                              {
                                                width: "fit-content",
                                              },

                                            "& .MuiPickersTimePicker-root": {
                                              maxWidth: "10px",
                                            },
                                          },
                                        },
                                      }}
                                    />
                                  </LocalizationProvider>
                                </div>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Set Legs Banner */}
                  <div className="set-legs-banner">
                    <div className="banner-content">
                      <h2>Set Legs</h2>
                      <p>
                        Configure individual legs with custom parameters and
                        order settings
                      </p>
                    </div>
                  </div>

                  {/* Set Trade Parameters */}
                  <div
                    className="set-parameters-div"
                    style={{
                      opacity:
                        selectedStrategy && selectedStrategy !== "" ? 0.5 : 1,
                      pointerEvents:
                        selectedStrategy && selectedStrategy !== ""
                          ? "none"
                          : "auto",
                    }}
                  >
                    <div className="heading-data">
                      <h2>
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Leg-Wise Order Settings
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
                                Configure each leg with settings like: Stop
                                Loss, Target, Trailing Stoploss, or no exit
                                condition. Applies to all configured legs.
                              </span>
                            </div>
                          }
                        >
                          <IconRegistry
                            name="exclamation-octagon"
                            className="svg-tool"
                          />
                        </Tooltip>{" "}
                      </h2>
                    </div>
                    <div className="parameters-flex-box">
                      <div className="parameters-box-one parameters-box-comm">
                        <div className="box-heading">
                          <h2>Target Parameters</h2>
                        </div>
                        <div className="parameters-flex-data">
                          <div className="select-data-fildes">
                            <div className="input-data wd-50">
                              <label>Fixed Profit</label>
                              <input
                                type="text"
                                placeholder="0"
                                value={
                                  algoTrading?.strategyReq?.fixedProfit || ""
                                }
                                name="strategyReq[fixedProfit]"
                                onChange={handleChange}
                              />
                            </div>
                            <div className="select-first wd-50">
                              <label>Type</label>
                              <select
                                className="form-control text-input"
                                value={
                                  algoTrading?.strategyReq
                                    ?.targetParameterType || ""
                                }
                                name="strategyReq[targetParameterType]"
                                onChange={handleChange}
                              >
                                <option value="leftPr">Log Profit</option>
                                <option value="trailPr">Trail Profit</option>
                                <option value="trailSl">Trailing S/L</option>
                                <option value="logTrailPr">
                                  Log & Trail Profit
                                </option>
                              </select>
                            </div>

                            <div className="select-sec wd-50">
                              <label>If Profit Reaches (X)</label>
                              <div className="value-input-both">
                                <select
                                  className="form-control text-input "
                                  value={
                                    algoTrading?.strategyReq?.profitReachType ||
                                    ""
                                  }
                                  name="strategyReq[profitReachType]"
                                  onChange={handleChange}
                                >
                                  <option value="value">Value</option>
                                  <option value="percent">%</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="0"
                                  value={
                                    algoTrading?.strategyReq?.profitReachValue
                                  }
                                  name="strategyReq[profitReachValue]"
                                  onChange={handleChange}
                                />
                              </div>
                            </div>

                            <div className="input-data wd-50">
                              <label>Lock Profits At (Y)</label>
                              <input
                                type="text"
                                placeholder="0"
                                value={
                                  algoTrading?.strategyReq?.lockProfitValue
                                }
                                name="strategyReq[lockProfitValue]"
                                onChange={handleChange}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="parameters-box-two parameters-box-comm">
                        <div className="box-heading">
                          <h2>Exit & Re Entry Parameters</h2>
                        </div>
                        <div className="parameters-flex-data">
                          <div className="select-data-fildes">
                            <div className="input-data wd-50">
                              <label>Stop Loss</label>
                              <input
                                type="text"
                                placeholder="0"
                                value={algoTrading?.strategyReq?.stopLoss || ""}
                                name="strategyReq[stopLoss]"
                                onChange={handleChange}
                              />
                            </div>
                            <div className="select-first wd-50">
                              <label>Re Entry Criteria</label>
                              <select
                                className="form-control text-input"
                                value={
                                  algoTrading?.strategyReq?.reEntryCriteria ||
                                  ""
                                }
                                name="strategyReq[reEntryCriteria]"
                                onChange={handleChange}
                              >
                                <option value="entrySl">
                                  Entry on stop loss
                                </option>
                                <option value="entryRevSl">
                                  Entry Reverse on stop loss
                                </option>
                              </select>
                            </div>
                          </div>
                          <div className="bottm-input-div">
                            <label>No. Of times</label>
                            <input
                              type="text"
                              placeholder="0"
                              value={algoTrading?.strategyReq?.noOfTimes || ""}
                              name="strategyReq[noOfTimes]"
                              onChange={handleChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Fixed Action Bar - Save Strategy Button */}
      {algoTrading?.trendLegMasterRequests?.length > 0 && (
        <div className="action-bar">
          <div className="action-buttons">
            <button
              className="btn-primary btn-save"
              type="submit"
              disabled={isLoading}
              onClick={handelSubmit}
            >
              {isLoading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span className="btn-icon">💾</span>
                  Save Strategy
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlgoTrading;
