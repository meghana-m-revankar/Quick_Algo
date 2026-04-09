import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state structure
const initialState = {
  // Strategy selection
  selectedStrategy: "",
  selectedSymbol: null,
  
  // Legs data
  legsData: [],
  strikePriceListArr: [],
  futStrikePriceListArr: [],
  
  // P&L and metrics data
  pnlData: {
    totalMargin: 0,
    totalSpread: 0,
    realTimePL: null,
    fixedMetrics: null,
  },
  
  // UI state
  isExecutingStrategy: false,
  isClearingStrategy: false,
  isClearingImmediately: false,
  strategyKey: 0,
  
  // Form data
  formErrors: {},
  isLoading: false,
  
  // Strategy rules
  strategyRules: {
    fixedMetrics: null,
    realTimePL: null,
  },
  
  // Default legs configuration
  defaultLegs: {
    b_s: "BUY",
    instrument: "CE",
    expiry: "",
    strikePriceList: [],
    lot: "",
    ltp: 0.0,
    strike: "",
  },
  
  // Symbol and market data
  symbolProduct: "",
  spotFutPrice: {
    spot: 0.0,
    future: 0.0,
  },
  
  // Broker data
  brokerList: [],
  
  // Price type
  priceType: "price",
};

// Action types
const ACTION_TYPES = {
  // Strategy management
  SET_SELECTED_STRATEGY: 'SET_SELECTED_STRATEGY',
  SET_SELECTED_SYMBOL: 'SET_SELECTED_SYMBOL',
  
  // Legs management
  SET_LEGS_DATA: 'SET_LEGS_DATA',
  ADD_LEG: 'ADD_LEG',
  REMOVE_LEG: 'REMOVE_LEG',
  UPDATE_LEG: 'UPDATE_LEG',
  CLEAR_LEGS: 'CLEAR_LEGS',
  
  // Strike price management
  SET_STRIKE_PRICE_LISTS: 'SET_STRIKE_PRICE_LISTS',
  CLEAR_STRIKE_PRICE_LISTS: 'CLEAR_STRIKE_PRICE_LISTS',
  
  // P&L and metrics
  SET_PNL_DATA: 'SET_PNL_DATA',
  UPDATE_METRICS: 'UPDATE_METRICS',
  
  // UI state
  SET_EXECUTING_STRATEGY: 'SET_EXECUTING_STRATEGY',
  SET_CLEARING_STRATEGY: 'SET_CLEARING_STRATEGY',
  SET_CLEARING_IMMEDIATELY: 'SET_CLEARING_IMMEDIATELY',
  INCREMENT_STRATEGY_KEY: 'INCREMENT_STRATEGY_KEY',
  
  // Form state
  SET_FORM_ERRORS: 'SET_FORM_ERRORS',
  CLEAR_FORM_ERRORS: 'CLEAR_FORM_ERRORS',
  SET_LOADING: 'SET_LOADING',
  
  // Strategy rules
  SET_STRATEGY_RULES: 'SET_STRATEGY_RULES',
  
  // Default legs
  SET_DEFAULT_LEGS: 'SET_DEFAULT_LEGS',
  UPDATE_DEFAULT_LEGS: 'UPDATE_DEFAULT_LEGS',
  
  // Symbol and market data
  SET_SYMBOL_PRODUCT: 'SET_SYMBOL_PRODUCT',
  SET_SPOT_FUT_PRICE: 'SET_SPOT_FUT_PRICE',
  
  // Broker data
  SET_BROKER_LIST: 'SET_BROKER_LIST',
  
  // Price type
  SET_PRICE_TYPE: 'SET_PRICE_TYPE',
  
  // Soft reset
  SOFT_RESET_STRATEGY: 'SOFT_RESET_STRATEGY',
  SOFT_RESET_ALL: 'SOFT_RESET_ALL',
};

// Reducer function
const strategyStateReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_SELECTED_STRATEGY:
      return {
        ...state,
        selectedStrategy: action.payload,
      };
      
    case ACTION_TYPES.SET_SELECTED_SYMBOL:
      return {
        ...state,
        selectedSymbol: action.payload,
      };
      
    case ACTION_TYPES.SET_LEGS_DATA:
      return {
        ...state,
        legsData: action.payload,
      };
      
    case ACTION_TYPES.ADD_LEG:
      return {
        ...state,
        legsData: [...state.legsData, action.payload],
      };
      
    case ACTION_TYPES.REMOVE_LEG:
      return {
        ...state,
        legsData: state.legsData.filter((_, index) => index !== action.payload),
      };
      
    case ACTION_TYPES.UPDATE_LEG:
      return {
        ...state,
        legsData: state.legsData.map((leg, index) => 
          index === action.payload.index ? { ...leg, ...action.payload.updates } : leg
        ),
      };
      
    case ACTION_TYPES.CLEAR_LEGS:
      return {
        ...state,
        legsData: [],
        strikePriceListArr: [],
        futStrikePriceListArr: [],
      };
      
    case ACTION_TYPES.SET_STRIKE_PRICE_LISTS:
      return {
        ...state,
        strikePriceListArr: action.payload.strikePriceListArr || state.strikePriceListArr,
        futStrikePriceListArr: action.payload.futStrikePriceListArr || state.futStrikePriceListArr,
      };
      
    case ACTION_TYPES.CLEAR_STRIKE_PRICE_LISTS:
      return {
        ...state,
        strikePriceListArr: [],
        futStrikePriceListArr: [],
      };
      
    case ACTION_TYPES.SET_PNL_DATA:
      return {
        ...state,
        pnlData: { ...state.pnlData, ...action.payload },
      };
      
    case ACTION_TYPES.UPDATE_METRICS:
      return {
        ...state,
        pnlData: {
          ...state.pnlData,
          ...action.payload,
        },
      };
      
    case ACTION_TYPES.SET_EXECUTING_STRATEGY:
      return {
        ...state,
        isExecutingStrategy: action.payload,
      };
      
    case ACTION_TYPES.SET_CLEARING_STRATEGY:
      return {
        ...state,
        isClearingStrategy: action.payload,
      };
      
    case ACTION_TYPES.SET_CLEARING_IMMEDIATELY:
      return {
        ...state,
        isClearingImmediately: action.payload,
      };
      
    case ACTION_TYPES.INCREMENT_STRATEGY_KEY:
      return {
        ...state,
        strategyKey: state.strategyKey + 1,
      };
      
    case ACTION_TYPES.SET_FORM_ERRORS:
      return {
        ...state,
        formErrors: { ...state.formErrors, ...action.payload },
      };
      
    case ACTION_TYPES.CLEAR_FORM_ERRORS:
      return {
        ...state,
        formErrors: {},
      };
      
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case ACTION_TYPES.SET_STRATEGY_RULES:
      return {
        ...state,
        strategyRules: { ...state.strategyRules, ...action.payload },
      };
      
    case ACTION_TYPES.SET_DEFAULT_LEGS:
      return {
        ...state,
        defaultLegs: { ...state.defaultLegs, ...action.payload },
      };
      
    case ACTION_TYPES.UPDATE_DEFAULT_LEGS:
      return {
        ...state,
        defaultLegs: { ...state.defaultLegs, ...action.payload },
      };
      
    case ACTION_TYPES.SET_SYMBOL_PRODUCT:
      return {
        ...state,
        symbolProduct: action.payload,
      };
      
    case ACTION_TYPES.SET_SPOT_FUT_PRICE:
      return {
        ...state,
        spotFutPrice: { ...state.spotFutPrice, ...action.payload },
      };
      
    case ACTION_TYPES.SET_BROKER_LIST:
      return {
        ...state,
        brokerList: action.payload,
      };
      
    case ACTION_TYPES.SET_PRICE_TYPE:
      return {
        ...state,
        priceType: action.payload,
      };
      
    case ACTION_TYPES.SOFT_RESET_STRATEGY:
      return {
        ...state,
        selectedStrategy: "",
        legsData: [],
        strikePriceListArr: [],
        futStrikePriceListArr: [],
        pnlData: {
          totalMargin: 0,
          totalSpread: 0,
          realTimePL: null,
          fixedMetrics: null,
        },
        strategyRules: {
          fixedMetrics: null,
          realTimePL: null,
        },
        isExecutingStrategy: false,
        isClearingStrategy: false,
        isClearingImmediately: false,
        strategyKey: state.strategyKey + 1, // Increment to force re-render
        formErrors: {},
      };
      
    case ACTION_TYPES.SOFT_RESET_ALL:
      return {
        ...initialState,
        strategyKey: state.strategyKey + 1, // Increment to force re-render
      };
      
    default:
      return state;
  }
};

// Context creation
const StrategyStateContext = createContext();

// Provider component
export const StrategyStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(strategyStateReducer, initialState);

  // Action creators
  const actions = {
    // Strategy management
    setSelectedStrategy: useCallback((strategy) => {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_STRATEGY, payload: strategy });
    }, []),
    
    setSelectedSymbol: useCallback((symbol) => {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_SYMBOL, payload: symbol });
    }, []),
    
    // Legs management
    setLegsData: useCallback((legs) => {
      dispatch({ type: ACTION_TYPES.SET_LEGS_DATA, payload: legs });
    }, []),
    
    addLeg: useCallback((leg) => {
      dispatch({ type: ACTION_TYPES.ADD_LEG, payload: leg });
    }, []),
    
    removeLeg: useCallback((index) => {
      dispatch({ type: ACTION_TYPES.REMOVE_LEG, payload: index });
    }, []),
    
    updateLeg: useCallback((index, updates) => {
      dispatch({ type: ACTION_TYPES.UPDATE_LEG, payload: { index, updates } });
    }, []),
    
    clearLegs: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_LEGS });
    }, []),
    
    // Strike price management
    setStrikePriceLists: useCallback((strikePriceListArr, futStrikePriceListArr) => {
      dispatch({ 
        type: ACTION_TYPES.SET_STRIKE_PRICE_LISTS, 
        payload: { strikePriceListArr, futStrikePriceListArr } 
      });
    }, []),
    
    clearStrikePriceLists: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_STRIKE_PRICE_LISTS });
    }, []),
    
    // P&L and metrics
    setPnlData: useCallback((pnlData) => {
      dispatch({ type: ACTION_TYPES.SET_PNL_DATA, payload: pnlData });
    }, []),
    
    updateMetrics: useCallback((metrics) => {
      dispatch({ type: ACTION_TYPES.UPDATE_METRICS, payload: metrics });
    }, []),
    
    // UI state
    setExecutingStrategy: useCallback((isExecuting) => {
      dispatch({ type: ACTION_TYPES.SET_EXECUTING_STRATEGY, payload: isExecuting });
    }, []),
    
    setClearingStrategy: useCallback((isClearing) => {
      dispatch({ type: ACTION_TYPES.SET_CLEARING_STRATEGY, payload: isClearing });
    }, []),
    
    setClearingImmediately: useCallback((isClearing) => {
      dispatch({ type: ACTION_TYPES.SET_CLEARING_IMMEDIATELY, payload: isClearing });
    }, []),
    
    incrementStrategyKey: useCallback(() => {
      dispatch({ type: ACTION_TYPES.INCREMENT_STRATEGY_KEY });
    }, []),
    
    // Form state
    setFormErrors: useCallback((errors) => {
      dispatch({ type: ACTION_TYPES.SET_FORM_ERRORS, payload: errors });
    }, []),
    
    clearFormErrors: useCallback(() => {
      dispatch({ type: ACTION_TYPES.CLEAR_FORM_ERRORS });
    }, []),
    
    setLoading: useCallback((isLoading) => {
      dispatch({ type: ACTION_TYPES.SET_LOADING, payload: isLoading });
    }, []),
    
    // Strategy rules
    setStrategyRules: useCallback((rules) => {
      dispatch({ type: ACTION_TYPES.SET_STRATEGY_RULES, payload: rules });
    }, []),
    
    // Default legs
    setDefaultLegs: useCallback((legs) => {
      dispatch({ type: ACTION_TYPES.SET_DEFAULT_LEGS, payload: legs });
    }, []),
    
    updateDefaultLegs: useCallback((updates) => {
      dispatch({ type: ACTION_TYPES.UPDATE_DEFAULT_LEGS, payload: updates });
    }, []),
    
    // Symbol and market data
    setSymbolProduct: useCallback((product) => {
      dispatch({ type: ACTION_TYPES.SET_SYMBOL_PRODUCT, payload: product });
    }, []),
    
    setSpotFutPrice: useCallback((price) => {
      dispatch({ type: ACTION_TYPES.SET_SPOT_FUT_PRICE, payload: price });
    }, []),
    
    // Broker data
    setBrokerList: useCallback((brokers) => {
      dispatch({ type: ACTION_TYPES.SET_BROKER_LIST, payload: brokers });
    }, []),
    
    // Price type
    setPriceType: useCallback((type) => {
      dispatch({ type: ACTION_TYPES.SET_PRICE_TYPE, payload: type });
    }, []),
    
    // Soft reset functions
    softResetStrategy: useCallback(() => {
      dispatch({ type: ACTION_TYPES.SOFT_RESET_STRATEGY });
    }, []),
    
    softResetAll: useCallback(() => {
      dispatch({ type: ACTION_TYPES.SOFT_RESET_ALL });
    }, []),
    
    // Strategy change handler - main function for smooth transitions
    handleStrategyChange: useCallback((newStrategy, loadStrategyData) => {
      // Soft reset strategy data
      dispatch({ type: ACTION_TYPES.SOFT_RESET_STRATEGY });
      
      // Set new strategy
      dispatch({ type: ACTION_TYPES.SET_SELECTED_STRATEGY, payload: newStrategy });
      
      // Load fresh data if provided
      if (loadStrategyData && typeof loadStrategyData === 'function') {
        loadStrategyData(newStrategy);
      }
    }, []),
  };

  const value = {
    state,
    actions,
  };

  return (
    <StrategyStateContext.Provider value={value}>
      {children}
    </StrategyStateContext.Provider>
  );
};

// Custom hook to use the context
export const useStrategyState = () => {
  const context = useContext(StrategyStateContext);
  if (!context) {
    throw new Error('useStrategyState must be used within a StrategyStateProvider');
  }
  return context;
};

export default StrategyStateContext;
