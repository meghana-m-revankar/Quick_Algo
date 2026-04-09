import { useState, useEffect, useMemo } from 'react';
import useSymbolDetails from './useSymbol';

/**
 * Hook to get real-time Greeks data for option strategies
 * @param {Array} legs - Array of option legs
 * @param {Object} optionChainData - Option chain data with CE and PE lists
 * @returns {Object} Greeks data and analysis
 */
const useOptionGreeks = (legs = [], optionChainData = {}) => {
  // Default fallback object
  const defaultGreeksData = {
    strategy: { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, totalIV: 0, weightedIV: 0 },
    legs: [],
    volatility: 0.25,
    timeToExpiry: 30,
    isLoading: false
  };

  // Ensure we always have valid state
  const [greeksData, setGreeksData] = useState(defaultGreeksData);
  const [isLoading, setIsLoading] = useState(false);

  // Get Greeks data for CE options
  const ceGreeks = useSymbolDetails(
    optionChainData.ceList || [],
    "optionChain",
    0,
    0,
    1 // is_greek = 1
  );

  // Get Greeks data for PE options
  const peGreeks = useSymbolDetails(
    optionChainData.peList || [],
    "optionChain",
    0,
    0,
    1 // is_greek = 1
  );

  // Get regular price data
  const cePrices = useSymbolDetails(
    optionChainData.ceList || [],
    "optionChain",
    0,
    0,
    0 // is_greek = 0
  );

  const pePrices = useSymbolDetails(
    optionChainData.peList || [],
    "optionChain",
    0,
    0,
    0 // is_greek = 0
  );

  // Calculate strategy Greeks
  const strategyGreeks = useMemo(() => {
    if (!legs || legs.length === 0) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
        totalIV: 0,
        weightedIV: 0
      };
    }

    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;
    let totalIV = 0;
    let totalWeight = 0;

    legs.forEach((leg, index) => {
      const strikePrice = leg.strikePrice;
      const instrument = leg.instrument;
      const quantity = parseFloat(leg.quantity) || 1;
      const position = leg.action || 'BUY';
      const multiplier = (position === 'BUY' ? 1 : -1) * quantity;

      // Find Greeks data by matching identifier
      let greeks = null;
      let price = null;
      
      // First try to find by identifier if available
      if (leg.identifier) {
        if (instrument === 'CE') {
          greeks = ceGreeks[`${leg.identifier}_greeks`];
          price = cePrices[leg.identifier];
        } else if (instrument === 'PE') {
          greeks = peGreeks[`${leg.identifier}_greeks`];
          price = pePrices[leg.identifier];
        }
      }
      
      // Fallback: try to find by strike price if identifier method fails
      if (!greeks || !price) {
        if (instrument === 'CE') {
          const ceData = Object.values(ceGreeks).find(item => 
            item && item.strikePrice == strikePrice
          );
          const cePriceData = Object.values(cePrices).find(item => 
            item && item.strikePrice == strikePrice
          );
          greeks = ceData;
          price = cePriceData;
        } else if (instrument === 'PE') {
          const peData = Object.values(peGreeks).find(item => 
            item && item.strikePrice == strikePrice
          );
          const pePriceData = Object.values(pePrices).find(item => 
            item && item.strikePrice == strikePrice
          );
          greeks = peData;
          price = pePriceData;
        }
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
      weightedIV: parseFloat(weightedIV.toFixed(4))
    };
  }, [legs?.length, Object.keys(ceGreeks).length, Object.keys(peGreeks).length, Object.keys(cePrices).length, Object.keys(pePrices).length]); // Use lengths instead of entire objects

  // Get individual leg Greeks
  const legGreeks = useMemo(() => {
    return legs.map((leg, index) => {
      // Create identifier from strike price and instrument
      const strikePrice = leg.strikePrice;
      const instrument = leg.instrument;
      const expiry = leg.expiry;
      
      // Try to find the Greeks data by matching identifier first, then strike price
      let greeks = null;
      let price = null;
      
      // First try to find by identifier if available
      if (leg.identifier) {
        if (instrument === 'CE') {
          greeks = ceGreeks[`${leg.identifier}_greeks`];
          price = cePrices[leg.identifier];
        } else if (instrument === 'PE') {
          greeks = peGreeks[`${leg.identifier}_greeks`];
          price = pePrices[leg.identifier];
        }
      }
      
      // Fallback: try to find by strike price if identifier method fails
      if (!greeks || !price) {
        if (instrument === 'CE') {
          // Find CE Greeks data for this specific strike price
          const ceData = Object.values(ceGreeks).find(item => 
            item && item.strikePrice == strikePrice
          );
          const cePriceData = Object.values(cePrices).find(item => 
            item && item.strikePrice == strikePrice
          );
          greeks = ceData;
          price = cePriceData;
        } else if (instrument === 'PE') {
          // Find PE Greeks data for this specific strike price
          const peData = Object.values(peGreeks).find(item => 
            item && item.strikePrice == strikePrice
          );
          const pePriceData = Object.values(pePrices).find(item => 
            item && item.strikePrice == strikePrice
          );
          greeks = peData;
          price = pePriceData;
        }
      }

      if (greeks && price) {
        return {
          ...leg,
          action: leg.action || 'BUY',
          strikePrice: strikePrice,
          instrument: instrument,
          expiry: expiry,
          greeks: {
            delta: parseFloat(greeks.delta) || 0,
            gamma: parseFloat(greeks.gamma) || 0,
            theta: parseFloat(greeks.theta) || 0,
            vega: parseFloat(greeks.vega) || 0,
            rho: parseFloat(greeks.rho) || 0,
            iv: parseFloat(greeks.iv) || 0
          },
          currentPrice: parseFloat(price.lastTradePrice) || 0,
          priceChange: parseFloat(price.priceChangePercentage) || 0
        };
      }

      // Return fallback data if no Greeks found
      return {
        ...leg,
        action: leg.action || 'BUY',
        strikePrice: strikePrice,
        instrument: instrument,
        expiry: expiry,
        greeks: {
          delta: 0,
          gamma: 0,
          theta: 0,
          vega: 0,
          rho: 0,
          iv: 0
        },
        currentPrice: 0,
        priceChange: 0
      };
    });
  }, [legs, ceGreeks, peGreeks, cePrices, pePrices]);

  // Calculate volatility for the strategy
  const strategyVolatility = useMemo(() => {
    if (strategyGreeks.weightedIV > 0) {
      return strategyGreeks.weightedIV;
    }
    
    // Fallback: calculate average IV from available legs
    const validLegs = legGreeks.filter(leg => leg.greeks.iv > 0);
    if (validLegs.length > 0) {
      const avgIV = validLegs.reduce((sum, leg) => sum + leg.greeks.iv, 0) / validLegs.length;
      return avgIV;
    }
    
    return 0.25; // Default IV
  }, [strategyGreeks.weightedIV, legGreeks]);

  // Calculate time to expiry (simplified)
  const timeToExpiry = useMemo(() => {
    // This is a simplified calculation
    // In a real implementation, you'd calculate from actual expiry dates
    return 30; // Default 30 days
  }, []);

  // Update Greeks data
  useEffect(() => {
    try {
      setGreeksData({
        strategy: strategyGreeks,
        legs: legGreeks,
        volatility: strategyVolatility,
        timeToExpiry,
        isLoading: false
      });
    } catch (error) {
      setGreeksData(defaultGreeksData);
    }
  }, [strategyGreeks, legGreeks, strategyVolatility, timeToExpiry]);

  // Always return greeksData with fallback
  return greeksData || defaultGreeksData;
};

export default useOptionGreeks;

