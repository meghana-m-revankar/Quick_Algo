/**
 * Advanced Option Calculations and Payoff Analysis
 * Includes Black-Scholes, Greeks, and Strategy Payoff Calculations
 */

// Black-Scholes Model Implementation
export class BlackScholes {
  static normalCDF(x) {
    // Approximation of the cumulative distribution function of the standard normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  static normalPDF(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  static blackScholes(S, K, T, r, sigma, optionType = 'call') {
    if (T <= 0) {
      // At expiry, return intrinsic value
      if (optionType === 'call') {
        return Math.max(0, S - K);
      } else {
        return Math.max(0, K - S);
      }
    }

    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    let price;
    if (optionType === 'call') {
      price = S * this.normalCDF(d1) - K * Math.exp(-r * T) * this.normalCDF(d2);
    } else {
      price = K * Math.exp(-r * T) * this.normalCDF(-d2) - S * this.normalCDF(-d1);
    }

    return Math.max(0, price);
  }

  static calculateGreeks(S, K, T, r, sigma, optionType = 'call') {
    if (T <= 0) {
      return {
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0
      };
    }

    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    const sqrtT = Math.sqrt(T);

    const pdf_d1 = this.normalPDF(d1);
    const cdf_d1 = this.normalCDF(d1);
    const cdf_d2 = this.normalCDF(d2);

    let delta, theta, rho;

    if (optionType === 'call') {
      delta = cdf_d1;
      theta = -(S * pdf_d1 * sigma) / (2 * sqrtT) - r * K * Math.exp(-r * T) * cdf_d2;
      rho = K * T * Math.exp(-r * T) * cdf_d2;
    } else {
      delta = cdf_d1 - 1;
      theta = -(S * pdf_d1 * sigma) / (2 * sqrtT) + r * K * Math.exp(-r * T) * (1 - cdf_d2);
      rho = -K * T * Math.exp(-r * T) * (1 - cdf_d2);
    }

    const gamma = pdf_d1 / (S * sigma * sqrtT);
    const vega = S * pdf_d1 * sqrtT;

    return {
      delta: parseFloat(delta.toFixed(4)),
      gamma: parseFloat(gamma.toFixed(4)),
      theta: parseFloat(theta.toFixed(4)),
      vega: parseFloat(vega.toFixed(4)),
      rho: parseFloat(rho.toFixed(4))
    };
  }
}

// Option Payoff Calculator
export class OptionPayoffCalculator {
  constructor(riskFreeRate = 0.05) {
    this.riskFreeRate = riskFreeRate;
  }

  // Calculate single option payoff at expiry
  calculateOptionPayoff(spotPrice, strike, premium, optionType, position, quantity = 1) {
    let intrinsicValue = 0;

    if (optionType === 'CE' || optionType === 'call') {
      intrinsicValue = Math.max(0, spotPrice - strike);
    } else if (optionType === 'PE' || optionType === 'put') {
      intrinsicValue = Math.max(0, strike - spotPrice);
    }

    let payoff = intrinsicValue - premium;
    
    if (position === 'SELL' || position === 'sell') {
      payoff = -payoff;
    }

    return payoff * quantity;
  }

  // Calculate MTM (Mark-to-Market) for current position
  // Formula: MTM = ∑((Entry Price - Current Price) × Lot Size × Position)
  // Buy → (Current - Entry) × LotSize
  // Sell → (Entry - Current) × LotSize
  calculateMTM(entryPrice, currentPrice, position, lotSize = 1) {
    let mtm = 0;
    
    if (position === 'SELL' || position === 'sell') {
      // For SELL: MTM = (Entry Price - Current Price) × Lot Size
      mtm = (entryPrice - currentPrice) * lotSize;
    } else {
      // For BUY: MTM = (Current Price - Entry Price) × Lot Size
      mtm = (currentPrice - entryPrice) * lotSize;
    }
    
    return mtm;
  }

  // Calculate strategy payoff (multiple legs)
  calculateStrategyPayoff(spotPrice, legs) {
    return legs.reduce((totalPayoff, leg) => {
      const legPayoff = this.calculateOptionPayoff(
        spotPrice,
        leg.strike,
        leg.premium,
        leg.type,
        leg.position,
        leg.quantity || 1
      );
      return totalPayoff + legPayoff;
    }, 0);
  }

  // Calculate strategy MTM (current market value vs entry)
  calculateStrategyMTM(legs, currentPrices) {
    return legs.reduce((totalMTM, leg) => {
      const entryPrice = leg.premium;
      const currentPrice = currentPrices[leg.identifier] || leg.premium; // Use current LTP or fallback to entry price
      const lotSize = leg.quantity || 1;
      
      const legMTM = this.calculateMTM(entryPrice, currentPrice, leg.position, lotSize);
      return totalMTM + legMTM;
    }, 0);
  }

  // Calculate Maximum Profit based on strategy type
  calculateMaxProfit(legs, spotPrice) {
    const strategyType = this.classifyStrategy(legs);
    const netPremium = this.calculateNetPremium(legs);
    
    switch (strategyType) {
      case 'BUY_CE_SINGLE':
        return 'UNLIMITED'; // Buy CE has unlimited profit potential
      
      case 'SELL_CE_SINGLE':
        return netPremium; // Max profit = premium received
      
      case 'BUY_PE_SINGLE':
        // Max profit = Strike - Premium (if underlying → 0)
        const buyPELeg = legs.find(leg => leg.type === 'PE' && (leg.position === 'BUY' || leg.position === 'buy'));
        return buyPELeg ? buyPELeg.strike - buyPELeg.premium : 0;
      
      case 'SELL_PE_SINGLE':
        return netPremium; // Max profit = premium received
      
      case 'BULL_CALL_SPREAD':
      case 'BEAR_CALL_SPREAD':
      case 'BULL_PUT_SPREAD':
      case 'BEAR_PUT_SPREAD':
      case 'IRON_CONDOR':
        // Limited profit for hedged strategies
        return this.calculateLimitedMaxProfit(legs, spotPrice);
      
      case 'STRADDLE':
      case 'STRANGLE':
        // Unlimited profit on one side, limited on the other
        return 'UNLIMITED';
      
      case 'BOTH_BUY':
        // Check if any CE leg exists for unlimited profit
        const hasCE = legs.some(leg => (leg.type === 'CE' || leg.type === 'call') && (leg.position === 'BUY' || leg.position === 'buy'));
        return hasCE ? 'UNLIMITED' : this.calculateLimitedMaxProfit(legs, spotPrice);
      
      case 'BOTH_SELL':
        return netPremium; // Max profit = total premium received
      
      default:
        return this.calculateLimitedMaxProfit(legs, spotPrice);
    }
  }

  // Calculate Maximum Loss based on strategy type
  calculateMaxLoss(legs, spotPrice) {
    const strategyType = this.classifyStrategy(legs);
    const netPremium = this.calculateNetPremium(legs);
    
    switch (strategyType) {
      case 'BUY_CE_SINGLE':
      case 'BUY_PE_SINGLE':
        return Math.abs(netPremium); // Max loss = premium paid
      
      case 'SELL_CE_SINGLE':
      case 'SELL_PE_SINGLE':
        return 'UNLIMITED'; // Naked sell has unlimited loss
      
      case 'BOTH_BUY':
        return Math.abs(netPremium); // Max loss = total premium paid
      
      case 'BOTH_SELL':
        return 'UNLIMITED'; // Both sell = unlimited loss
      
      case 'BULL_CALL_SPREAD':
      case 'BEAR_CALL_SPREAD':
      case 'BULL_PUT_SPREAD':
      case 'BEAR_PUT_SPREAD':
      case 'IRON_CONDOR':
        // Limited loss for hedged strategies
        return this.calculateLimitedMaxLoss(legs, spotPrice);
      
      case 'STRADDLE':
      case 'STRANGLE':
        return 'UNLIMITED'; // Straddle/Strangle can have unlimited loss
      
      default:
        return Math.abs(netPremium);
    }
  }

  // Calculate Breakeven Points
  calculateBreakevenPoints(legs, spotPrice) {
    const strategyType = this.classifyStrategy(legs);
    const netPremium = this.calculateNetPremium(legs);
    const breakevenPoints = [];
    
    switch (strategyType) {
      case 'BUY_CE_SINGLE':
        const buyCE = legs.find(leg => (leg.type === 'CE' || leg.type === 'call') && (leg.position === 'BUY' || leg.position === 'buy'));
        if (buyCE) {
          breakevenPoints.push(buyCE.strike + buyCE.premium); // Strike + Premium
        }
        break;
      
      case 'BUY_PE_SINGLE':
        const buyPE = legs.find(leg => (leg.type === 'PE' || leg.type === 'put') && (leg.position === 'BUY' || leg.position === 'buy'));
        if (buyPE) {
          breakevenPoints.push(buyPE.strike - buyPE.premium); // Strike - Premium
        }
        break;
      
      case 'STRADDLE':
        const straddleStrike = legs[0]?.strike;
        if (straddleStrike) {
          breakevenPoints.push(straddleStrike + Math.abs(netPremium)); // Strike + Total Premium
          breakevenPoints.push(straddleStrike - Math.abs(netPremium)); // Strike - Total Premium
        }
        break;
      
      case 'STRANGLE':
        const strikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        if (strikes.length >= 2) {
          breakevenPoints.push(strikes[0] - Math.abs(netPremium)); // Lower strike - Total Premium
          breakevenPoints.push(strikes[1] + Math.abs(netPremium)); // Higher strike + Total Premium
        }
        break;
      
      default:
        // For complex strategies, use numerical method
        return this.calculateNumericalBreakeven(legs, spotPrice);
    }
    
    return breakevenPoints.filter(bep => bep > 0);
  }

  // Calculate Risk/Reward Ratio
  calculateRiskRewardRatio(legs, spotPrice) {
    const maxProfit = this.calculateMaxProfit(legs, spotPrice);
    const maxLoss = this.calculateMaxLoss(legs, spotPrice);
    
    if (maxProfit === 'UNLIMITED' || maxLoss === 'UNLIMITED') {
      return maxProfit === 'UNLIMITED' ? 'NA' : 0;
    }
    
    if (maxLoss === 0) {
      return 'NA';
    }
    
    return Math.abs(maxProfit / maxLoss);
  }

  // Calculate Margin Requirement
  calculateMarginRequirement(legs, spotPrice) {
    const strategyType = this.classifyStrategy(legs);
    
    switch (strategyType) {
      case 'BUY_CE_SINGLE':
      case 'BUY_PE_SINGLE':
      case 'BOTH_BUY':
        return 0; // Only premium debit, no margin required
      
      case 'SELL_CE_SINGLE':
      case 'SELL_PE_SINGLE':
      case 'BOTH_SELL':
        // High margin for naked sell
        return spotPrice * 0.2; // Approximate 20% of spot price
      
      case 'BULL_CALL_SPREAD':
      case 'BEAR_CALL_SPREAD':
      case 'BULL_PUT_SPREAD':
      case 'BEAR_PUT_SPREAD':
      case 'IRON_CONDOR':
        // Reduced margin for hedged strategies
        return spotPrice * 0.05; // Approximate 5% of spot price
      
      default:
        return spotPrice * 0.1; // Default 10% of spot price
    }
  }

  // Classify strategy type
  classifyStrategy(legs) {
    if (legs.length === 1) {
      const leg = legs[0];
      if (leg.type === 'CE' || leg.type === 'call') {
        return leg.position === 'BUY' || leg.position === 'buy' ? 'BUY_CE_SINGLE' : 'SELL_CE_SINGLE';
      } else {
        return leg.position === 'BUY' || leg.position === 'buy' ? 'BUY_PE_SINGLE' : 'SELL_PE_SINGLE';
      }
    }
    
    if (legs.length === 2) {
      const buyLegs = legs.filter(leg => leg.position === 'BUY' || leg.position === 'buy');
      const sellLegs = legs.filter(leg => leg.position === 'SELL' || leg.position === 'sell');
      
      if (buyLegs.length === 2) return 'BOTH_BUY';
      if (sellLegs.length === 2) return 'BOTH_SELL';
      
      // Check for spreads
      const ceLegs = legs.filter(leg => leg.type === 'CE' || leg.type === 'call');
      const peLegs = legs.filter(leg => leg.type === 'PE' || leg.type === 'put');
      
      if (ceLegs.length === 2) {
        const strikes = ceLegs.map(leg => leg.strike).sort((a, b) => a - b);
        const buyStrike = ceLegs.find(leg => leg.position === 'BUY' || leg.position === 'buy')?.strike;
        const sellStrike = ceLegs.find(leg => leg.position === 'SELL' || leg.position === 'sell')?.strike;
        
        if (buyStrike < sellStrike) return 'BULL_CALL_SPREAD';
        if (buyStrike > sellStrike) return 'BEAR_CALL_SPREAD';
      }
      
      if (peLegs.length === 2) {
        const strikes = peLegs.map(leg => leg.strike).sort((a, b) => a - b);
        const buyStrike = peLegs.find(leg => leg.position === 'BUY' || leg.position === 'buy')?.strike;
        const sellStrike = peLegs.find(leg => leg.position === 'SELL' || leg.position === 'sell')?.strike;
        
        if (buyStrike > sellStrike) return 'BULL_PUT_SPREAD';
        if (buyStrike < sellStrike) return 'BEAR_PUT_SPREAD';
      }
      
      // Check for straddle
      if (ceLegs.length === 1 && peLegs.length === 1) {
        const ceStrike = ceLegs[0].strike;
        const peStrike = peLegs[0].strike;
        if (Math.abs(ceStrike - peStrike) < 1) return 'STRADDLE';
        return 'STRANGLE';
      }
    }
    
    if (legs.length === 4) {
      // Check for Iron Condor
      const strikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
      const uniqueStrikes = [...new Set(strikes)];
      if (uniqueStrikes.length === 4) return 'IRON_CONDOR';
    }
    
    return 'COMPLEX';
  }

  // Calculate net premium paid/received
  calculateNetPremium(legs) {
    return legs.reduce((total, leg) => {
      const premium = leg.premium * (leg.quantity || 1);
      return total + (leg.position === 'BUY' || leg.position === 'buy' ? premium : -premium);
    }, 0);
  }

  // Calculate limited max profit for hedged strategies
  calculateLimitedMaxProfit(legs, spotPrice) {
    const dataPoints = this.generatePayoffData(legs, spotPrice);
    const payoffs = dataPoints.map(d => d.payoff);
    return Math.max(...payoffs);
  }

  // Calculate limited max loss for hedged strategies
  calculateLimitedMaxLoss(legs, spotPrice) {
    const dataPoints = this.generatePayoffData(legs, spotPrice);
    const payoffs = dataPoints.map(d => d.payoff);
    return Math.min(...payoffs);
  }

  // Calculate breakeven points numerically
  calculateNumericalBreakeven(legs, spotPrice) {
    const dataPoints = this.generatePayoffData(legs, spotPrice);
    const breakevenPoints = [];
    
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const current = dataPoints[i];
      const next = dataPoints[i + 1];
      
      if ((current.payoff <= 0 && next.payoff >= 0) || 
          (current.payoff >= 0 && next.payoff <= 0)) {
        // Linear interpolation for breakeven point
        const ratio = Math.abs(current.payoff) / (Math.abs(current.payoff) + Math.abs(next.payoff));
        const breakevenPrice = current.price + ratio * (next.price - current.price);
        breakevenPoints.push(parseFloat(breakevenPrice.toFixed(2)));
      }
    }
    
    return breakevenPoints;
  }

  // Generate payoff data for chart
  generatePayoffData(legs, spotPrice, priceRange = { min: 0.8, max: 1.2 }, steps = 100) {
    const minPrice = spotPrice * priceRange.min;
    const maxPrice = spotPrice * priceRange.max;
    const stepSize = (maxPrice - minPrice) / steps;

    const dataPoints = [];
    
    for (let i = 0; i <= steps; i++) {
      const price = minPrice + (i * stepSize);
      const payoff = this.calculateStrategyPayoff(price, legs);
      
      dataPoints.push({
        price: parseFloat(price.toFixed(2)),
        payoff: parseFloat(payoff.toFixed(2))
      });
    }

    return dataPoints;
  }

  // Calculate strategy metrics using enhanced formulas
  calculateStrategyMetrics(legs, spotPrice) {
    const dataPoints = this.generatePayoffData(legs, spotPrice);
    
    // Use enhanced calculation methods
    const maxProfit = this.calculateMaxProfit(legs, spotPrice);
    const maxLoss = this.calculateMaxLoss(legs, spotPrice);
    const breakevenPoints = this.calculateBreakevenPoints(legs, spotPrice);
    const netPremium = this.calculateNetPremium(legs);
    const riskRewardRatio = this.calculateRiskRewardRatio(legs, spotPrice);
    const marginRequirement = this.calculateMarginRequirement(legs, spotPrice);
    const strategyType = this.classifyStrategy(legs);

    return {
      maxProfit: maxProfit === 'UNLIMITED' ? 'UNLIMITED' : parseFloat(maxProfit.toFixed(2)),
      maxLoss: maxLoss === 'UNLIMITED' ? 'UNLIMITED' : parseFloat(maxLoss.toFixed(2)),
      breakevenPoints: breakevenPoints,
      netPremium: parseFloat(netPremium.toFixed(2)),
      riskRewardRatio: riskRewardRatio === 'NA' ? 'NA' : parseFloat(riskRewardRatio.toFixed(2)),
      marginRequirement: parseFloat(marginRequirement.toFixed(2)),
      strategyType: strategyType,
      dataPoints: dataPoints
    };
  }

  // Calculate Probability of Profit (POP)
  calculateProbabilityOfProfit(legs, spotPrice, volatility = 0.2, timeToExpiry = 30) {
    const metrics = this.calculateStrategyMetrics(legs, spotPrice);
    const breakevenPoints = metrics.breakevenPoints;
    
    if (breakevenPoints.length === 0) {
      return 0.5; // If no breakeven points, assume 50%
    }

    // Use the first breakeven point for calculation
    const breakevenPrice = breakevenPoints[0];
    
    // Calculate probability using normal distribution
    const timeInYears = timeToExpiry / 365;
    const mean = spotPrice;
    const stdDev = spotPrice * volatility * Math.sqrt(timeInYears);
    
    // Z-score for breakeven price
    const zScore = (breakevenPrice - mean) / stdDev;
    
    // Probability that price will be above breakeven
    const probability = 1 - BlackScholes.normalCDF(zScore);
    
    return Math.max(0, Math.min(1, probability));
  }

  // Calculate Greeks for strategy
  calculateStrategyGreeks(legs, spotPrice, volatility = 0.2, timeToExpiry = 30) {
    const timeInYears = timeToExpiry / 365;
    
    const totalGreeks = legs.reduce((total, leg) => {
      const greeks = BlackScholes.calculateGreeks(
        spotPrice,
        leg.strike,
        timeInYears,
        this.riskFreeRate,
        volatility,
        leg.type === 'CE' || leg.type === 'call' ? 'call' : 'put'
      );

      const multiplier = (leg.position === 'BUY' || leg.position === 'buy' ? 1 : -1) * (leg.quantity || 1);

      return {
        delta: total.delta + (greeks.delta * multiplier),
        gamma: total.gamma + (greeks.gamma * multiplier),
        theta: total.theta + (greeks.theta * multiplier),
        vega: total.vega + (greeks.vega * multiplier),
        rho: total.rho + (greeks.rho * multiplier)
      };
    }, { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });

    return {
      delta: parseFloat(totalGreeks.delta.toFixed(4)),
      gamma: parseFloat(totalGreeks.gamma.toFixed(4)),
      theta: parseFloat(totalGreeks.theta.toFixed(4)),
      vega: parseFloat(totalGreeks.vega.toFixed(4)),
      rho: parseFloat(totalGreeks.rho.toFixed(4))
    };
  }
}

// Strategy Analysis Class
export class StrategyAnalyzer {
  constructor(riskFreeRate = 0.05) {
    this.calculator = new OptionPayoffCalculator(riskFreeRate);
  }

  // Analyze complete strategy with enhanced calculations
  analyzeStrategy(legs, spotPrice, volatility = 0.2, timeToExpiry = 30, currentPrices = {}) {
    const metrics = this.calculator.calculateStrategyMetrics(legs, spotPrice);
    const greeks = this.calculator.calculateStrategyGreeks(legs, spotPrice, volatility, timeToExpiry);
    const pop = this.calculator.calculateProbabilityOfProfit(legs, spotPrice, volatility, timeToExpiry);
    
    // Calculate MTM using current market prices with lot size
    const mtm = this.calculator.calculateStrategyMTM(legs, currentPrices);

    return {
      ...metrics,
      greeks,
      probabilityOfProfit: parseFloat(pop.toFixed(4)),
      mtm: parseFloat(mtm.toFixed(2)),
      spotPrice,
      volatility,
      timeToExpiry,
      legs: legs.map(leg => ({
        ...leg,
        currentPrice: currentPrices[leg.identifier] || leg.premium,
        intrinsicValue: this.calculator.calculateOptionPayoff(
          spotPrice, leg.strike, 0, leg.type, leg.position, leg.quantity || 1
        ),
        timeValue: leg.premium - Math.abs(this.calculator.calculateOptionPayoff(
          spotPrice, leg.strike, 0, leg.type, leg.position, leg.quantity || 1
        )),
        mtm: this.calculator.calculateMTM(
          leg.premium, 
          currentPrices[leg.identifier] || leg.premium, 
          leg.position, 
          leg.quantity || 1
        )
      }))
    };
  }

  // Convert legs format to calculator format
  convertLegsFormat(legs) {
    return legs.map(leg => ({
      strike: parseFloat(leg.strikePrice) || 0,
      premium: parseFloat(leg.lastTradedPrice) || 0,
      type: leg.instrument || 'CE',
      position: leg.action || 'BUY',
      quantity: parseFloat(leg.quantity) || 1,
      identifier: leg.identifier || '',
      expiry: leg.expiry || ''
    }));
  }
}

const OptionCalculations = {
  BlackScholes,
  OptionPayoffCalculator,
  StrategyAnalyzer
};

export default OptionCalculations;

