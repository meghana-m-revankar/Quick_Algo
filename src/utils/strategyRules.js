/**
 * Strategy Rules System
 * Handles fixed calculations and real-time P&L for all option strategies
 * 
 * Basic Rules:
 * 1. Payoff / Max Profit / Max Loss / Breakeven → FIXED (based on strategy creation time premium)
 * 2. Real-time P&L (MTM) → MOVES with market (options price changes with IV, delta, gamma)
 * 3. Expiry Selection:
 *    - Weekly expiry (intraday/short view) → 23rd Sep 2025
 *    - Monthly expiry (positional/hedging) → 30th Sep 2025
 */

import { OptionPayoffCalculator } from './optionCalculations';

export class StrategyRulesManager {
  constructor() {
    this.calculator = new OptionPayoffCalculator();
    this.strategyTypes = {
      // Intraday/Short View Strategies (Weekly Expiry)
      INTRADAY: [
        'naked_ce', 'naked_pe', 'short_straddle', 'short_strangle',
        'scalping_ce', 'scalping_pe', 'quick_spread'
      ],
      // Positional/Hedging Strategies (Monthly Expiry)
      POSITIONAL: [
        'bull_call', 'bear_put', 'long_straddle', 'iron_butter',
        'short_iron_condor', 'calendar_spread', 'butterfly', 'condor'
      ]
    };
    
    // Dynamic expiry dates - will be set from API
    this.expiryDates = {
      weekly: null,  // Will be set from API
      monthly: null  // Will be set from API
    };
  }

  /**
   * Set expiry dates from API data
   */
  setExpiryDates(expiryList) {
    if (expiryList && expiryList.length > 0) {
      // Sort expiry dates to find the correct weekly and monthly expiries
      const sortedExpiries = [...expiryList].sort((a, b) => new Date(a) - new Date(b));
      
      // Find monthly expiry (last Thursday of the month)
      const monthlyExpiry = this.findMonthlyExpiry(sortedExpiries);
      
      // Find weekly expiry (most recent expiry that's not monthly)
      const weeklyExpiry = this.findWeeklyExpiry(sortedExpiries, monthlyExpiry);
      
      this.expiryDates.weekly = weeklyExpiry;
      this.expiryDates.monthly = monthlyExpiry;
      
      // Expiry dates set
    }
  }

  /**
   * Find monthly expiry (last Thursday of the month)
   */
  findMonthlyExpiry(expiryList) {
    const monthlyExpiries = {};
    
    // Group expiries by month-year
    expiryList.forEach(expiry => {
      const date = new Date(expiry);
      const monthYear = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthlyExpiries[monthYear]) {
        monthlyExpiries[monthYear] = [];
      }
      monthlyExpiries[monthYear].push(expiry);
    });
    
    // Find the last Thursday of each month
    const monthlyLastThursdays = Object.values(monthlyExpiries).map(monthExpiries => {
      // Sort by date and find the last one (which should be last Thursday)
      return monthExpiries.sort((a, b) => new Date(b) - new Date(a))[0];
    });
    
    // Return the most recent monthly expiry
    return monthlyLastThursdays.sort((a, b) => new Date(b) - new Date(a))[0];
  }

  /**
   * Find weekly expiry (most recent expiry that's not monthly)
   */
  findWeeklyExpiry(expiryList, monthlyExpiry) {
    // Filter out monthly expiry and find the most recent weekly
    const weeklyExpiries = expiryList.filter(expiry => expiry !== monthlyExpiry);
    
    if (weeklyExpiries.length > 0) {
      // Return the most recent weekly expiry
      return weeklyExpiries.sort((a, b) => new Date(b) - new Date(a))[0];
    }
    
    // Fallback to first available expiry
    return expiryList[0];
  }

  /**
   * Determine strategy type for expiry selection
   */
  getStrategyType(strategyKey) {
    const intradayStrategies = this.strategyTypes.INTRADAY;
    const positionalStrategies = this.strategyTypes.POSITIONAL;
    
    if (intradayStrategies.includes(strategyKey)) {
      return 'INTRADAY';
    } else if (positionalStrategies.includes(strategyKey)) {
      return 'POSITIONAL';
    } else {
      // Default to intraday for unknown strategies
      return 'INTRADAY';
    }
  }

  /**
   * Get appropriate expiry date based on strategy type
   */
  getExpiryDate(strategyKey) {
    const strategyType = this.getStrategyType(strategyKey);
    const expiryDate = strategyType === 'INTRADAY' ? this.expiryDates.weekly : this.expiryDates.monthly;
    
    // If expiry dates are not set from API, return null
    if (!expiryDate) {
      // Expiry dates not set from API
      return null;
    }
    
    return expiryDate;
  }

  /**
   * Calculate FIXED strategy metrics (based on entry premium)
   * These values remain constant throughout the strategy lifecycle
   * NEVER CHANGE - FIXED AT ENTRY TIME
   */
  calculateFixedMetrics(strategyKey, legs, entrySpotPrice) {
    // Calculating fixed metrics
    
    const strategyType = this.getStrategyType(strategyKey);
    const expiryDate = this.getExpiryDate(strategyKey);
    
    // Convert legs to calculator format
    const calculatorLegs = this.convertLegsToCalculatorFormat(legs);
    // Calculator legs processed
    
    // Calculate FIXED metrics using entry prices - THESE NEVER CHANGE
    const maxProfit = this.calculateMaxProfitForStrategy(strategyKey, calculatorLegs, entrySpotPrice);
    const maxLoss = this.calculateMaxLossForStrategy(strategyKey, calculatorLegs, entrySpotPrice);
    const breakevens = this.calculateBreakevensForStrategy(strategyKey, calculatorLegs, entrySpotPrice);
    const netPremium = this.calculator.calculateNetPremium(calculatorLegs);
    
    // Fixed metrics calculated
    
    const fixedMetrics = {
      strategyKey,
      strategyType,
      expiryDate,
      entrySpotPrice,
      entryTimestamp: new Date().toISOString(),
      
      // FIXED VALUES - CALCULATED ONCE AT ENTRY, NEVER CHANGE
      maxProfit,
      maxLoss,
      breakevens,
      netPremium,
      
      // Strategy classification
      riskProfile: this.getRiskProfile(strategyKey),
      timeDecay: this.getTimeDecayProfile(strategyKey),
      
      // Entry leg details (for reference) - FIXED AT ENTRY
      entryLegs: calculatorLegs.map(leg => ({
        ...leg,
        entryPremium: leg.premium, // FIXED - Never changes
        entryTimestamp: new Date().toISOString()
      })),
      
      // Mark as fixed values
      isFixed: true,
      fixedAt: new Date().toISOString()
    };

    // Fixed metrics calculation complete
    return fixedMetrics;
  }

  /**
   * Calculate REAL-TIME P&L (MTM) that changes with market
   * ONLY calculates MTM - does NOT touch fixed values
   */
  calculateRealTimePL(fixedMetrics, currentSpotPrice, currentPrices = {}) {
    const { entryLegs, entrySpotPrice } = fixedMetrics;
    
    // Real-time P&L calculation
    
    // Calculate P&L for each leg based on entry vs current LTP
    let totalPL = 0;
    let currentMTM = 0;
    
    const legPLs = entryLegs.map(leg => {
      const entryLTP = leg.entryPremium; // Entry LTP (fixed reference)
      const currentLTP = currentPrices[leg.identifier] || entryLTP; // Current LTP
      const quantity = leg.quantity || 1;
      
      let legPL = 0;
      
      if (leg.position === 'BUY') {
        // Buy CE/PE → Profit = (Current LTP − Entry LTP) × Quantity
        legPL = (currentLTP - entryLTP) * quantity;
      } else if (leg.position === 'SELL') {
        // Sell CE/PE → Profit = (Entry LTP − Current LTP) × Quantity
        legPL = (entryLTP - currentLTP) * quantity;
      }
      
      totalPL += legPL;
      
      
      return {
        ...leg,
        entryLTP,
        currentLTP,
        legPL,
        quantity
      };
    });
    
    // Calculate current MTM as sum of (Current LTP × Quantity) for all legs
    currentMTM = legPLs.reduce((sum, leg) => sum + (leg.currentLTP * leg.quantity), 0);
    
    // Calculate P&L percentage
    const entryMTM = entryLegs.reduce((sum, leg) => sum + (leg.entryPremium * (leg.quantity || 1)), 0);
    const plPercentage = entryMTM !== 0 ? (totalPL / Math.abs(entryMTM)) * 100 : 0;
    

    return {
      // REAL-TIME VALUES ONLY - These change with market
      currentSpotPrice,
      currentMTM: parseFloat(currentMTM.toFixed(2)),
      totalPL: parseFloat(totalPL.toFixed(2)),
      plPercentage: parseFloat(plPercentage.toFixed(2)),
      
      // Time-based calculations
      daysToExpiry: this.getDaysToExpiry(fixedMetrics.expiryDate),
      
      // Current leg details (for MTM calculation only)
      currentLegs: legPLs,
      
      // Market movement analysis
      spotMovement: isNaN(currentSpotPrice - entrySpotPrice) ? 0 : currentSpotPrice - entrySpotPrice,
      spotMovementPercent: isNaN(((currentSpotPrice - entrySpotPrice) / entrySpotPrice) * 100) ? 0 : ((currentSpotPrice - entrySpotPrice) / entrySpotPrice) * 100,
      
      // Risk metrics based on current P&L vs fixed max loss
      riskLevel: this.calculateRiskLevel(totalPL, fixedMetrics.maxLoss),
      recommendation: this.getTradingRecommendation(totalPL, fixedMetrics, currentSpotPrice),
      
      // Mark as real-time values
      isRealTime: true,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Get comprehensive strategy analysis combining fixed and real-time data
   */
  getStrategyAnalysis(strategyKey, legs, entrySpotPrice, currentSpotPrice, currentPrices = {}) {
    const fixedMetrics = this.calculateFixedMetrics(strategyKey, legs, entrySpotPrice);
    const realTimePL = this.calculateRealTimePL(fixedMetrics, currentSpotPrice, currentPrices);
    
    return {
      // Fixed metrics (don't change)
      fixed: fixedMetrics,
      
      // Real-time metrics (change with market)
      realTime: realTimePL,
      
      // Combined analysis
      summary: {
        strategyName: this.getStrategyDisplayName(strategyKey),
        strategyType: fixedMetrics.strategyType,
        expiryDate: fixedMetrics.expiryDate,
        riskLevel: realTimePL.riskLevel,
        currentStatus: this.getStrategyStatus(realTimePL.totalPL, fixedMetrics),
        recommendation: realTimePL.recommendation
      }
    };
  }

  /**
   * Calculate Max Profit for specific strategy
   */
  calculateMaxProfitForStrategy(strategyKey, legs, spotPrice) {
    switch (strategyKey) {
      case 'naked_ce':
        return 'UNLIMITED'; // Long call has unlimited profit potential
      
      case 'naked_pe':
        // Max profit = Strike - Premium (if underlying goes to 0)
        const peLegProfit = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        return peLegProfit ? peLegProfit.strike - peLegProfit.premium : 0;
      
      case 'short_straddle':
      case 'short_strangle':
        // Max profit = Total premium received
        return legs.reduce((sum, leg) => {
          return leg.position === 'SELL' ? sum + (leg.premium * leg.quantity) : sum;
        }, 0);
      
      case 'bull_call':
        // Max profit = Higher strike - Lower strike - Net premium paid
        const buyCallProfit = legs.find(leg => leg.type === 'CE' && leg.position === 'BUY');
        const sellCallProfit = legs.find(leg => leg.type === 'CE' && leg.position === 'SELL');
        if (buyCallProfit && sellCallProfit) {
          const bullNetPremium = this.calculator.calculateNetPremium(legs);
          const maxProfit = (sellCallProfit.strike - buyCallProfit.strike) - Math.abs(bullNetPremium);
          return maxProfit;
        }
        return 0;
      
      case 'bear_put':
        // Max profit = Higher strike - Lower strike - Net premium paid
        const buyPutProfit = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        const sellPutProfit = legs.find(leg => leg.type === 'PE' && leg.position === 'SELL');
        if (buyPutProfit && sellPutProfit) {
          const bearNetPremium = this.calculator.calculateNetPremium(legs);
          return (buyPutProfit.strike - sellPutProfit.strike) - Math.abs(bearNetPremium);
        }
        return 0;
      
      case 'long_straddle':
        // Max profit = UNLIMITED (both sides)
        return 'UNLIMITED'; // Unlimited profit on both sides
      
      case 'iron_butter':
        // Max profit = Net credit received
        const ironButterNetPremium = this.calculator.calculateNetPremium(legs);
        const ironButterMaxProfit = Math.abs(ironButterNetPremium);
        return ironButterMaxProfit;
      
      case 'short_iron_condor':
        // Max profit = Net credit received
        const shortIronCondorNetPremium = this.calculator.calculateNetPremium(legs);
        const shortIronCondorMaxProfit = Math.abs(shortIronCondorNetPremium);
        return shortIronCondorMaxProfit;
      
      case 'short_straddle':
        // Max profit = Net credit received
        const shortStraddleNetPremium = this.calculator.calculateNetPremium(legs);
        const shortStraddleMaxProfit = Math.abs(shortStraddleNetPremium);
        return shortStraddleMaxProfit;
      
      case 'naked_pe':
        // Max profit = UNLIMITED (neeche)
        return 'UNLIMITED'; // Unlimited profit as spot moves down
      
      case 'bear_put':
        // Max profit = Spread - Net Premium paid
        const buyPutProfitBear = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        const sellPutProfitBear = legs.find(leg => leg.type === 'PE' && leg.position === 'SELL');
        if (buyPutProfitBear && sellPutProfitBear) {
          const bearNetPremiumProfit = this.calculator.calculateNetPremium(legs);
          const bearPutMaxProfit = (buyPutProfitBear.strike - sellPutProfitBear.strike) - Math.abs(bearNetPremiumProfit);
          return bearPutMaxProfit;
        }
        return 0;
      
      case 'short_strangle':
        // Max profit = Net credit received
        const shortStrangleNetPremium = this.calculator.calculateNetPremium(legs);
        const shortStrangleMaxProfit = Math.abs(shortStrangleNetPremium);
        return shortStrangleMaxProfit;
      
      default:
        return this.calculator.calculateMaxProfit(legs, spotPrice);
    }
  }

  /**
   * Calculate Max Loss for specific strategy
   */
  calculateMaxLossForStrategy(strategyKey, legs, spotPrice) {
    switch (strategyKey) {
      case 'naked_ce':
        // Max loss = Premium paid
        const ceLegLoss = legs.find(leg => leg.type === 'CE' && leg.position === 'BUY');
        const nakedCeMaxLoss = ceLegLoss ? ceLegLoss.premium * ceLegLoss.quantity : 0;
        return nakedCeMaxLoss;
      
      case 'naked_pe':
        // Max loss = Premium paid
        const peLegLoss = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        return peLegLoss ? peLegLoss.premium * peLegLoss.quantity : 0;
      
      case 'short_straddle':
      case 'short_strangle':
        return 'UNLIMITED'; // Short strategies have unlimited loss potential
      
      case 'bull_call':
        // Max loss = Net premium paid
        const bullNetPremiumLoss = this.calculator.calculateNetPremium(legs);
        const bullCallMaxLoss = Math.abs(bullNetPremiumLoss);
        return bullCallMaxLoss;
      
      case 'bear_put':
        // Max loss = Net premium paid
        const bearNetPremiumLoss = this.calculator.calculateNetPremium(legs);
        return Math.abs(bearNetPremiumLoss);
      
      case 'long_straddle':
        // Max loss = Total premium paid
        const longStraddleNetPremium = this.calculator.calculateNetPremium(legs);
        const longStraddleMaxLoss = Math.abs(longStraddleNetPremium);
        return longStraddleMaxLoss;
      
      case 'iron_butter':
        // Max loss = (WingDiff × LotSize) - NetPremium
        const ironStrikesLoss = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const ironNetPremiumLoss = this.calculator.calculateNetPremium(legs);
        const wingDiff = ironStrikesLoss[2] - ironStrikesLoss[0]; // Difference between outer strikes
        const lotSize = legs[0].quantity || 1; // Assuming all legs have same quantity
        const ironButterMaxLoss = Math.max(0, (wingDiff * lotSize) - Math.abs(ironNetPremiumLoss));
        return ironButterMaxLoss;
      
      case 'short_iron_condor':
        // Max loss = Spread width - Net credit received
        const shortIronCondorStrikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const shortIronCondorNetPremium = this.calculator.calculateNetPremium(legs);
        const shortIronCondorMaxLoss = Math.max(0, (shortIronCondorStrikes[3] - shortIronCondorStrikes[0]) - Math.abs(shortIronCondorNetPremium));
        return shortIronCondorMaxLoss;
      
      case 'short_straddle':
        // Max loss = UNLIMITED (upar ya neeche breakout)
        return 'UNLIMITED'; // Unlimited loss on both sides
      
      case 'naked_pe':
        // Max loss = Premium paid
        const nakedPeNetPremium = this.calculator.calculateNetPremium(legs);
        const nakedPeMaxLoss = Math.abs(nakedPeNetPremium);
        return nakedPeMaxLoss;
      
      case 'bear_put':
        // Max loss = Net premium paid
        const bearNetPremiumLossBear = this.calculator.calculateNetPremium(legs);
        const bearPutMaxLossBear = Math.abs(bearNetPremiumLossBear);
        return bearPutMaxLossBear;
      
      case 'short_strangle':
        // Max loss = UNLIMITED (upar/neeche breakout)
        return 'UNLIMITED'; // Unlimited loss on both sides
      
      default:
        return this.calculator.calculateMaxLoss(legs, spotPrice);
    }
  }

  /**
   * Calculate Breakevens for specific strategy
   */
  calculateBreakevensForStrategy(strategyKey, legs, spotPrice) {
    switch (strategyKey) {
      case 'naked_ce':
        // Breakeven = Strike + Premium
        const ceLegBE = legs.find(leg => leg.type === 'CE' && leg.position === 'BUY');
        const nakedCeBreakeven = ceLegBE ? [ceLegBE.strike + ceLegBE.premium] : [];
        return nakedCeBreakeven;
      
      case 'naked_pe':
        // Breakeven = Strike - Premium
        const peLegBE = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        return peLegBE ? [peLegBE.strike - peLegBE.premium] : [];
      
      case 'short_straddle':
        // Breakevens = Strike ± Total Premium
        const straddleStrike = legs[0].strike;
        const totalPremium = legs.reduce((sum, leg) => sum + (leg.premium * leg.quantity), 0);
        return [straddleStrike - totalPremium, straddleStrike + totalPremium];
      
      case 'short_strangle':
        // Breakevens = Lower Strike - Premium, Higher Strike + Premium
        const strangleStrikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const strangleNetPremium = legs.reduce((sum, leg) => sum + (leg.premium * leg.quantity), 0);
        return [strangleStrikes[0] - strangleNetPremium, strangleStrikes[1] + strangleNetPremium];
      
      case 'bull_call':
        // Breakeven = Lower Strike + Net Premium
        const buyCallBE = legs.find(leg => leg.type === 'CE' && leg.position === 'BUY');
        const bullNetPremiumBE = this.calculator.calculateNetPremium(legs);
        const bullCallBreakeven = buyCallBE ? [buyCallBE.strike + Math.abs(bullNetPremiumBE)] : [];
        return bullCallBreakeven;
      
      case 'bear_put':
        // Breakeven = Higher Strike - Net Premium
        const buyPutBE = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        const bearNetPremiumBE = this.calculator.calculateNetPremium(legs);
        return buyPutBE ? [buyPutBE.strike - Math.abs(bearNetPremiumBE)] : [];
      
      case 'long_straddle':
        // Breakevens = Strike ± Total Premium
        const longStraddleStrike = legs[0].strike;
        const longTotalPremium = Math.abs(this.calculator.calculateNetPremium(legs));
        const longStraddleBreakevens = [longStraddleStrike - longTotalPremium, longStraddleStrike + longTotalPremium];
        return longStraddleBreakevens;
      
      case 'iron_butter':
        // Breakevens = ATM ± (NetPremium ÷ LotSizePerUnit)
        const ironStrikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const ironNetPremiumBE = Math.abs(this.calculator.calculateNetPremium(legs));
        const lotSizePerUnit = legs[0].quantity || 1; // Assuming all legs have same quantity
        const netPremiumPerUnit = ironNetPremiumBE / lotSizePerUnit;
        const atm = ironStrikes[1]; // Middle strike (ATM)
        const ironButterBreakevens = [atm - netPremiumPerUnit, atm + netPremiumPerUnit];
        return ironButterBreakevens;
      
      case 'short_iron_condor':
        // Breakevens = Lower: Put side, Upper: Call side
        const shortIronCondorStrikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const shortIronCondorNetPremium = Math.abs(this.calculator.calculateNetPremium(legs));
        const shortIronCondorBreakevens = [shortIronCondorStrikes[1] - shortIronCondorNetPremium, shortIronCondorStrikes[2] + shortIronCondorNetPremium];
        return shortIronCondorBreakevens;
      
      case 'short_straddle':
        // Breakevens = Strike ± Net Premium received
        const shortStraddleStrike = legs[0].strike;
        const shortStraddleNetPremium = Math.abs(this.calculator.calculateNetPremium(legs));
        const shortStraddleBreakevens = [shortStraddleStrike - shortStraddleNetPremium, shortStraddleStrike + shortStraddleNetPremium];
        return shortStraddleBreakevens;
      
      case 'naked_pe':
        // Breakeven = Strike - Premium paid
        const nakedPeStrike = legs[0].strike;
        const nakedPeNetPremium = Math.abs(this.calculator.calculateNetPremium(legs));
        const nakedPeBreakeven = [nakedPeStrike - nakedPeNetPremium];
        return nakedPeBreakeven;
      
      case 'bear_put':
        // Breakeven = Higher Strike - Net Premium
        const buyPutBEBear = legs.find(leg => leg.type === 'PE' && leg.position === 'BUY');
        const bearNetPremiumBEBear = this.calculator.calculateNetPremium(legs);
        const bearPutBreakevenBear = buyPutBEBear ? [buyPutBEBear.strike - Math.abs(bearNetPremiumBEBear)] : [];
        return bearPutBreakevenBear;
      
      case 'short_strangle':
        // Breakevens = OTM strikes ± Premium received
        const shortStrangleStrikes = legs.map(leg => leg.strike).sort((a, b) => a - b);
        const shortStrangleNetPremium = Math.abs(this.calculator.calculateNetPremium(legs));
        const shortStrangleBreakevens = [shortStrangleStrikes[0] - shortStrangleNetPremium, shortStrangleStrikes[1] + shortStrangleNetPremium];
        return shortStrangleBreakevens;
      
      default:
        return this.calculator.calculateBreakevenPoints(legs, spotPrice);
    }
  }

  /**
   * Convert legs format to calculator format
   */
  convertLegsToCalculatorFormat(legs) {
    
    const convertedLegs = legs.map(leg => {
      const converted = {
        strike: parseFloat(leg.strikePrice) || 0,
        premium: parseFloat(leg.premium) || parseFloat(leg.lastTradedPrice) || 0,
        type: leg.instrument || leg.type || 'CE',
        position: leg.action || leg.position || 'BUY',
        quantity: parseFloat(leg.quantity) || 1,
        identifier: leg.identifier || `${leg.instrument}_${leg.strikePrice}`,
        expiry: leg.expiry || ''
      };
      
      
      return converted;
    });
    
    return convertedLegs;
  }

  /**
   * Get risk profile for strategy
   */
  getRiskProfile(strategyKey) {
    const riskProfiles = {
      'naked_ce': 'HIGH_RISK',
      'naked_pe': 'HIGH_RISK',
      'short_straddle': 'HIGH_RISK',
      'short_strangle': 'HIGH_RISK',
      'bull_call': 'MODERATE_RISK',
      'bear_put': 'MODERATE_RISK',
      'long_straddle': 'MODERATE_RISK',
      'iron_butter': 'LOW_RISK',
      'short_iron': 'MODERATE_RISK'
    };
    
    return riskProfiles[strategyKey] || 'MODERATE_RISK';
  }

  /**
   * Get time decay profile
   */
  getTimeDecayProfile(strategyKey) {
    const timeDecayProfiles = {
      'naked_ce': 'NEGATIVE', // Long options lose value over time
      'naked_pe': 'NEGATIVE',
      'short_straddle': 'POSITIVE', // Short options gain from time decay
      'short_strangle': 'POSITIVE',
      'bull_call': 'MIXED',
      'bear_put': 'MIXED',
      'long_straddle': 'NEGATIVE',
      'iron_butter': 'POSITIVE',
      'short_iron': 'POSITIVE'
    };
    
    return timeDecayProfiles[strategyKey] || 'MIXED';
  }

  /**
   * Calculate days to expiry
   */
  getDaysToExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate time decay impact
   */
  calculateTimeDecayImpact(fixedMetrics, currentLegs) {
    const daysToExpiry = this.getDaysToExpiry(fixedMetrics.expiryDate);
    const timeDecayProfile = fixedMetrics.timeDecay;
    
    // Simplified time decay calculation
    let timeDecayImpact = 0;
    
    currentLegs.forEach(leg => {
      const theta = 0.1; // Simplified theta value
      const timeDecay = theta * (leg.quantity || 1);
      
      if (timeDecayProfile === 'POSITIVE') {
        timeDecayImpact += timeDecay; // Short options benefit from time decay
      } else if (timeDecayProfile === 'NEGATIVE') {
        timeDecayImpact -= timeDecay; // Long options lose from time decay
      }
    });
    
    return timeDecayImpact * daysToExpiry;
  }

  /**
   * Calculate risk level based on current P&L vs max loss
   */
  calculateRiskLevel(currentPL, maxLoss) {
    if (maxLoss === 0) return 'UNKNOWN';
    
    const riskRatio = Math.abs(currentPL) / Math.abs(maxLoss);
    
    if (riskRatio < 0.25) return 'LOW';
    if (riskRatio < 0.5) return 'MODERATE';
    if (riskRatio < 0.75) return 'HIGH';
    return 'CRITICAL';
  }

  /**
   * Get trading recommendation
   */
  getTradingRecommendation(currentPL, fixedMetrics, currentSpotPrice) {
    const { maxProfit, maxLoss, breakevens } = fixedMetrics;
    const riskLevel = this.calculateRiskLevel(currentPL, maxLoss);
    
    // Check if near breakeven
    const nearBreakeven = breakevens.some(be => 
      Math.abs(currentSpotPrice - be) / currentSpotPrice < 0.02
    );
    
    if (riskLevel === 'CRITICAL') {
      return 'CLOSE_IMMEDIATELY';
    } else if (currentPL > maxProfit * 0.8) {
      return 'TAKE_PROFIT';
    } else if (nearBreakeven && currentPL < 0) {
      return 'CONSIDER_CLOSING';
    } else if (riskLevel === 'HIGH' && currentPL < 0) {
      return 'REDUCE_POSITION';
    } else {
      return 'HOLD';
    }
  }

  /**
   * Get strategy status
   */
  getStrategyStatus(currentPL, fixedMetrics) {
    if (currentPL > 0) {
      return 'PROFITABLE';
    } else if (currentPL < fixedMetrics.maxLoss * 0.5) {
      return 'AT_RISK';
    } else {
      return 'LOSS';
    }
  }

  /**
   * Get display name for strategy
   */
  getStrategyDisplayName(strategyKey) {
    const strategyNames = {
      'naked_ce': 'Naked Call',
      'naked_pe': 'Naked Put',
      'short_straddle': 'Short Straddle',
      'short_strangle': 'Short Strangle',
      'bull_call': 'Bull Call Spread',
      'bear_put': 'Bear Put Spread',
      'long_straddle': 'Long Straddle',
      'iron_butter': 'Iron Butterfly',
      'short_iron_condor': 'Short Iron Condor'
    };
    
    return strategyNames[strategyKey] || 'Custom Strategy';
  }

  /**
   * Validate strategy before execution
   */
  validateStrategy(strategyKey, legs) {
    const errors = [];
    
    if (!strategyKey) {
      errors.push('Strategy key is required');
    }
    
    if (!legs || legs.length === 0) {
      errors.push('At least one leg is required');
    }
    
    // Validate legs
    legs.forEach((leg, index) => {
      if (!leg.strikePrice || leg.strikePrice <= 0) {
        errors.push(`Leg ${index + 1}: Invalid strike price`);
      }
      if (!leg.instrument || !['CE', 'PE'].includes(leg.instrument)) {
        errors.push(`Leg ${index + 1}: Invalid instrument type`);
      }
      if (!leg.action || !['BUY', 'SELL'].includes(leg.action)) {
        errors.push(`Leg ${index + 1}: Invalid action`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const strategyRulesManager = new StrategyRulesManager();

// Export utility functions
export const getStrategyExpiry = (strategyKey) => {
  return strategyRulesManager.getExpiryDate(strategyKey);
};

export const getStrategyType = (strategyKey) => {
  return strategyRulesManager.getStrategyType(strategyKey);
};

export const calculateFixedStrategyMetrics = (strategyKey, legs, entrySpotPrice) => {
  return strategyRulesManager.calculateFixedMetrics(strategyKey, legs, entrySpotPrice);
};

export const calculateRealTimePL = (fixedMetrics, currentSpotPrice, currentPrices) => {
  return strategyRulesManager.calculateRealTimePL(fixedMetrics, currentSpotPrice, currentPrices);
};

export const getStrategyAnalysis = (strategyKey, legs, entrySpotPrice, currentSpotPrice, currentPrices) => {
  return strategyRulesManager.getStrategyAnalysis(strategyKey, legs, entrySpotPrice, currentSpotPrice, currentPrices);
};

export default strategyRulesManager;
