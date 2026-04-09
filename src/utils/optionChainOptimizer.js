// Utility functions for optimizing option chain performance

// Memoized data parser to avoid recalculating parsed data
const parseDataCache = new Map();

export const parseOptionData = (data, type = 'optionChain', isGreek = false) => {
  const cacheKey = `${JSON.stringify(data)}_${type}_${isGreek}`;
  
  if (parseDataCache.has(cacheKey)) {
    return parseDataCache.get(cacheKey);
  }

  let parsedData;
  
  try {
    if (isGreek) {
      
      // Try multiple possible field names for Greeks data
      parsedData = {
        delta: parseFloat(data?.g4 || data?.delta || data?.Delta || 0)?.toFixed(4) ?? 0,
        gamma: parseFloat(data?.g7 || data?.gamma || data?.Gamma || 0)?.toFixed(4) ?? 0,
        theta: parseFloat(data?.g9 || data?.theta || data?.Theta || 0)?.toFixed(4) ?? 0,
        vega: parseFloat(data?.g5 || data?.vega || data?.Vega || 0)?.toFixed(4) ?? 0,
        rho: parseFloat(data?.g8 || data?.rho || data?.Rho || 0)?.toFixed(4) ?? 0,
        iv: parseFloat(data?.g6 || data?.iv || data?.IV || data?.impliedVolatility || 0)?.toFixed(4) ?? 0,
        instrumentIdentifier: data?.g2 || data?.identifier || data?.instrumentIdentifier || "",
        time: data?.g3 || data?.time || data?.timestamp || "",
      };
    } else if (type === "optionChain" || type === "order") {
      parsedData = {
        lastBuyPrice: parseFloat(type === "optionChain" ? data?.s4 : data?.s8)?.toFixed(2) ?? 0,
        high: parseFloat(data?.s5)?.toFixed(2) ?? 0,
        low: parseFloat(data?.s6)?.toFixed(2) ?? 0,
        openPrice: parseFloat(data?.s9)?.toFixed(2) ?? 0,
        closePrice: parseFloat(data?.s10)?.toFixed(2) ?? 0,
        sellPrice: parseFloat(data?.s11)?.toFixed(2) ?? 0,
        totalQtyTraded: parseFloat(data?.s12)?.toFixed(2) ?? 0,
        lastTradePrice: parseFloat(data?.s8)?.toFixed(2) ?? 0,
        priceChangePercentage: parseFloat(data?.s14)?.toFixed(2) ?? 0,
        QuotationLot: parseFloat(data?.s15)?.toFixed(2) ?? 0,
      };
    } else {
      parsedData = {
        lastTradePrice: parseFloat(data?.s8)?.toFixed(2) ?? 0,
        priceChange: parseFloat(data?.s14)?.toFixed(2) ?? 0,
      };
    }

    // Cache the parsed data
    parseDataCache.set(cacheKey, parsedData);
    
    // Clean up cache if it gets too large (keep only last 1000 entries)
    if (parseDataCache.size > 1000) {
      const firstKey = parseDataCache.keys().next().value;
      parseDataCache.delete(firstKey);
    }
    
    return parsedData;
  } catch (error) {
    // Error parsing option data
    return {};
  }
};

// Optimized data comparison function
export const hasDataChanged = (oldData, newData) => {
  if (!oldData || !newData) return true;
  
  const keys = Object.keys(newData);
  return keys.some(key => oldData[key] !== newData[key]);
};

// Debounced function to limit API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttled function for high-frequency updates
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Batch update function for multiple state updates
export const batchUpdate = (updates, setState) => {
  setState(prevState => {
    let newState = { ...prevState };
    updates.forEach(update => {
      newState = { ...newState, ...update };
    });
    return newState;
  });
};

// Memory-efficient data filtering
export const filterOptionData = (data, filters) => {
  if (!data || !Array.isArray(data)) return [];
  
  return data.filter(item => {
    return Object.keys(filters).every(key => {
      const filterValue = filters[key];
      const itemValue = item[key];
      
      if (typeof filterValue === 'string') {
        return itemValue?.toLowerCase().includes(filterValue.toLowerCase());
      }
      
      if (typeof filterValue === 'number') {
        return itemValue === filterValue;
      }
      
      if (Array.isArray(filterValue)) {
        return filterValue.includes(itemValue);
      }
      
      return true;
    });
  });
};

// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  if (process.env.NODE_ENV === 'development') {
    // Performance tracking
  }
  
  return result;
};

// Clear cache function
export const clearParseCache = () => {
  parseDataCache.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  return {
    size: parseDataCache.size,
    keys: Array.from(parseDataCache.keys())
  };
};
