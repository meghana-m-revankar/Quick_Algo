import { asyncGetCustBrokerConfig } from "#redux/symbol/symbolAction.js";
import { asyncGetOptionListCE, asyncGetOptionListPE } from "#redux/optionChain/optionChainAction.js";
import { fetchSymbolExpiryList, fetchSymbolLotSize } from "#utils/watchList";
import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from "react";

const TradingBoxContext = createContext();

export const useTradingBox = () => { 
  const context = useContext(TradingBoxContext);
  if (!context) {
    throw new Error("useTradingBox must be used within a TradingBoxProvider");
  }
  return context;
};

export const TradingBoxProvider = ({ children }) => {
  const [tradingBoxes, setTradingBoxes] = useState([]);
  const [nextId, setNextId] = useState(1);
  
  // Per-box state management
  const [boxStates, setBoxStates] = useState({});
  
  // Global option chain data cache (shared across all boxes)
  const [optionChainCache, setOptionChainCache] = useState({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  // Track in-flight fetches per (product, expiry) to prevent API loops/duplicates
  const inFlightOptionFetchRef = useRef({});
  
  // Broker configuration
  const [brokerConfigList, setBrokerConfigList] = useState([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);

  // Debounce mechanism to prevent rapid-fire box creation
  const addBoxTimeoutRef = useRef(null);
  const isAddingBoxRef = useRef(false);

  // Initialize box state
  const initializeBoxState = useCallback((boxId, productName, strategy = null) => {
    // Set default option type based on strategy
    let defaultOptionType = "CE";
    if (strategy === "naked_pe") {
      defaultOptionType = "PE";
    } else if (strategy === "naked_ce") {
      defaultOptionType = "CE";
    }
    
    setBoxStates(prev => ({
      ...prev,
      [boxId]: {
        selectedProduct: productName,
        selectedExpiry: "",
        selectedStrike: null,
        selectedOptionType: defaultOptionType,
        expiryList: [],
        isLoadingOptions: false,
        currentOptionPrice: null,
        lotSize: null,
        strategy: strategy // Store the strategy for reference
      }
    }));
  }, []);

  // Get box state
  const getBoxState = useCallback((boxId) => {
   
    
    const boxState = boxStates[boxId] || {
      selectedProduct: "NIFTY",
      selectedExpiry: "",
      selectedStrike: null,
      selectedOptionType: "CE",
      expiryList: [],
      isLoadingOptions: false,
      currentOptionPrice: null,
      lotSize: null,
      strategy: null
    };
    
    return boxState;
  }, [boxStates]);

  // Update box state
  const updateBoxState = useCallback((boxId, updates) => {
    setBoxStates(prev => ({
      ...prev,
      [boxId]: {
        ...prev[boxId],
        ...updates
      }
    }));
  }, []);

  const getLotSize = useCallback(
    async (boxId, symbolIdentifierId) => {
      // If we don't have a valid identifier, skip API call and use default lot size later
      if (!symbolIdentifierId) {
        updateBoxState(boxId, { lotSize: null });
        return null;
      }

      const lotSize = await fetchSymbolLotSize({ identifierid: symbolIdentifierId });
      updateBoxState(boxId, { lotSize });
      return lotSize;
    },
    [updateBoxState]
  );

  // Get broker configuration
  const getBrokerConfig = useCallback(async () => {
    try {
      setIsLoadingBrokers(true);
      const result = await asyncGetCustBrokerConfig({ sendData: "" });
      const activeBrokers = result?.data?.result?.filter(
        (broker) => broker.status === true
      );
      setBrokerConfigList(activeBrokers || []);
      return activeBrokers || [];
    } catch (error) {
      return [];
    } finally {
      setIsLoadingBrokers(false);
    }
  }, []);

  // Refresh broker list - can be called externally
  const refreshBrokerList = useCallback(async () => {
    return await getBrokerConfig();
  }, [getBrokerConfig]);

  // Get symbol expiry list for a specific box
  const getSymbolExpiryList = useCallback(
    async (boxId, strProduct) => {
      try {
        const expiryData = await fetchSymbolExpiryList({ strProduct });
        const reversedExpiryData = expiryData?.reverse() || [];
        
        updateBoxState(boxId, {
          expiryList: reversedExpiryData,
          selectedExpiry: reversedExpiryData[0] || ""
        });
        
        return reversedExpiryData;
      } catch (error) {
        return [];
      }
    },
    [updateBoxState]
  );

    // Process strike prices with ATM/ITM/OTM labels
  const processedStrikePrices = useCallback((strikePriceList) => {
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
  }, []);

  // Fetch option chain data for a specific box
  const fetchOptionChainData = useCallback(async (boxId, product, expiry) => {
    if (!product || !expiry) {
      return;
    }
    
    const cacheKey = `${product}_${expiry}`;
    
    // Check if data is already cached
    if (optionChainCache[cacheKey]) {
      return;
    }

    // Prevent duplicate in-flight requests for same key
    if (inFlightOptionFetchRef.current[cacheKey]) {
      return;
    }
    inFlightOptionFetchRef.current[cacheKey] = true;
    
    
    updateBoxState(boxId, { isLoadingOptions: true });
    setIsLoadingOptions(true);
    
    try {
      const formData = { strProduct: product, strExpiry: expiry };
      
      
      const [ceResult, peResult] = await Promise.all([
        asyncGetOptionListCE({ formData }),
        asyncGetOptionListPE({ formData })
      ]);
      
      
      const ceList = ceResult?.data?.result || [];
      const peList = peResult?.data?.result || [];
      
      
      // Cache the data
      setOptionChainCache(prev => ({
        ...prev,
        [cacheKey]: {
          ceList,
          peList,
          timestamp: Date.now()
        }
      }));

      
      
              // Set default strike to ATM option for this box
        if (ceList.length > 0) {
          // Find the ATM option from the API data
          const allOptions = [...ceList, ...peList];
          const processedOptions = processedStrikePrices(allOptions);
          const atmOption = processedOptions.find(option => option.label === "ATM");
          
          if (atmOption) {
            updateBoxState(boxId, {
              selectedStrike: atmOption.strikePrice
            });
          } else {
            // Fallback to first option if ATM not found
            updateBoxState(boxId, {
              selectedStrike: ceList[0].strikePrice
            });
          }
        }
    } catch (error) {
    } finally {
      updateBoxState(boxId, { isLoadingOptions: false });
      setIsLoadingOptions(false);
      delete inFlightOptionFetchRef.current[cacheKey];
    }
  }, [optionChainCache, updateBoxState, processedStrikePrices]);

  // Get available strikes for a specific box
  const getAvailableStrikes = useCallback((boxId) => {
    const boxState = getBoxState(boxId);
    const cacheKey = `${boxState.selectedProduct}_${boxState.selectedExpiry}`;
    const cachedData = optionChainCache[cacheKey];
    
   
    
    if (!cachedData) {
      return [];
    }
    
    // Combine CE and PE lists and process them
    const allOptions = [...cachedData.ceList, ...cachedData.peList];
    const processedOptions = processedStrikePrices(allOptions);
    
    return processedOptions;
  }, [getBoxState, optionChainCache, processedStrikePrices]);

  // Get current option data for a specific box
  const getCurrentOptionData = useCallback((boxId) => {
    const boxState = getBoxState(boxId);
    if (!boxState.selectedStrike || !boxState.selectedOptionType) return null;
    
    const cacheKey = `${boxState.selectedProduct}_${boxState.selectedExpiry}`;
    const cachedData = optionChainCache[cacheKey];
    
    if (!cachedData) return null;
    
    // Get the processed options to find the current selection
    const allOptions = [...cachedData.ceList, ...cachedData.peList];
    const processedOptions = processedStrikePrices(allOptions);
    
    // Find the option that matches the selected strike price
    const currentOption = processedOptions.find(option => option.strikePrice === boxState.selectedStrike);
    

    
    return currentOption;
  }, [getBoxState, optionChainCache, processedStrikePrices]);

  // Update functions for specific box
  const updateOptionType = useCallback((boxId, type) => {
    updateBoxState(boxId, { selectedOptionType: type });
  }, [updateBoxState]);

  const updateStrikePrice = useCallback((boxId, strike) => {
    updateBoxState(boxId, { selectedStrike: strike });
  }, [updateBoxState]);

  const updateProduct = useCallback(async (boxId, product) => {
    updateBoxState(boxId, { selectedProduct: product });
    await getSymbolExpiryList(boxId, product);
  }, [updateBoxState, getSymbolExpiryList]);

  const updateExpiry = useCallback((boxId, expiry) => {
    updateBoxState(boxId, { selectedExpiry: expiry });
  }, [updateBoxState]);

  
  const addTradingBox = async (symbol, strategy = null) => {
    // Prevent rapid-fire calls
    if (isAddingBoxRef.current) {
      return Promise.resolve();
    }

    // Clear any existing timeout
    if (addBoxTimeoutRef.current) {
      clearTimeout(addBoxTimeoutRef.current);
    }

    // Return a promise that resolves when the box is added
    return new Promise((resolve, reject) => {
      // Debounce the function
      addBoxTimeoutRef.current = setTimeout(async () => {
      try {
        isAddingBoxRef.current = true;
        
        // Check if this is an update to an existing box (has id property)
        if (symbol && typeof symbol === 'object' && symbol.id) {
          // This is an update to existing box
          setTradingBoxes((prev) => {
            const updatedBoxes = prev.map(box => 
              box.id === symbol.id ? { ...box, ...symbol } : box
            );
            return updatedBoxes;
          });
          
          // Update the box state with new symbol
          const productName = symbol?.product || symbol?.name || symbol?.identifier || symbol?.tradeSymbol || "NIFTY";
          initializeBoxState(symbol.id, productName, symbol.strategy);
          
          // Fetch new data for the updated box
          try {
            // Pass the correct symbolIdentifierId from the symbol object
            const symbolIdentifierId = symbol?.symbolIdentifierId || symbol?.identifierId || symbol?.id;
            await getLotSize(symbol.id, symbolIdentifierId);
            const expiryList = await getSymbolExpiryList(symbol.id, productName);
            resolve(symbol);
          } catch (error) {
            resolve(symbol); // Resolve even if data fetch fails
          }
          return;
        }
        
        // Extract product name and identifier from symbol
        let productName = "NIFTY"; // default fallback
        let symbolIdentifier = null;
        
        if (typeof symbol === 'string') {
          productName = symbol;
          symbolIdentifier = symbol;
        } else if (symbol && typeof symbol === 'object') {
          productName = symbol?.product || symbol?.name || symbol?.identifier || symbol?.tradeSymbol || "NIFTY";
          symbolIdentifier = symbol?.symbolIdentifierId || symbol?.identifierId || symbol?.id || symbol?.identifier;
        }
        
        // IMPROVED: Check for existing boxes with multiple criteria
        const existingBox = tradingBoxes.find(box => {
          // Check by symbol name
          if (box.symbol === productName) return true;
          
          // Check by symbol identifier if available
          if (symbolIdentifier && box.symbolIdentifier === symbolIdentifier) return true;
          
          // Check by symbol identifier ID if available
          if (symbol?.symbolIdentifierId && box.symbolIdentifierId === symbol.symbolIdentifierId) return true;
          
          return false;
        });
        
        if (existingBox) {
          closeTradingBox(existingBox.id);
          // Add a small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const newBoxId = nextId;
        
        // Initialize box state first
        initializeBoxState(newBoxId, productName, strategy);
        
        // Create the new box object with center positioning
        const boxCount = tradingBoxes.length;
        // Position expanded boxes in center with proper offset to ensure header is visible
        const offsetX = 100 + (boxCount * 50); // Center X with stagger
        const offsetY = 100 + (boxCount * 50); // Center Y with stagger, ensuring header is visible
        
        const newBox = {
          id: newBoxId,
          symbol: productName,
          symbolIdentifier: symbolIdentifier,
          symbolIdentifierId: symbol?.symbolIdentifierId,
          position: { x: offsetX, y: offsetY },
        };

        // Add the box to the trading boxes array immediately
        setTradingBoxes((prev) => {
          // Double-check for duplicates before adding
          const hasDuplicate = prev.some(box => 
            box.symbol === productName || 
            (symbolIdentifier && box.symbolIdentifier === symbolIdentifier) ||
            (symbol?.symbolIdentifierId && box.symbolIdentifierId === symbol.symbolIdentifierId)
          );
          
          if (hasDuplicate) {
            return prev;
          }
          
          const newTradingBoxes = [...prev, newBox];
          return newTradingBoxes;
        });
        
        setNextId((prev) => prev + 1);
        
        // Then fetch the data asynchronously
        try {
          await getLotSize(newBoxId, symbol?.symbolIdentifierId);
          const expiryList = await getSymbolExpiryList(newBoxId, productName);
          resolve(newBox);
        } catch (error) {
          resolve(newBox); // Resolve even if data fetch fails
        }
      } catch (error) {
        reject(error);
      } finally {
        isAddingBoxRef.current = false;
      }
      }, 150); // 150ms debounce delay
    });
  };

  // Initialize option chain data when product or expiry changes for any box
  useEffect(() => {
  
    
    Object.keys(boxStates).forEach(boxId => {
      const boxState = boxStates[boxId];
      
      
      if (boxState.selectedProduct && boxState.selectedExpiry && !boxState.isLoadingOptions) {
        // Only fetch if we don't have cached data
        const cacheKey = `${boxState.selectedProduct}_${boxState.selectedExpiry}`;
        if (!optionChainCache[cacheKey]) {
         
          fetchOptionChainData(boxId, boxState.selectedProduct, boxState.selectedExpiry);
        } 
      } 
    });
  }, [boxStates, optionChainCache, fetchOptionChainData]);

  // Set default strike when cached data is available but selectedStrike is null
  useEffect(() => {
    Object.keys(boxStates).forEach(boxId => {
      const boxState = boxStates[boxId];
      if (boxState.selectedProduct && boxState.selectedExpiry && !boxState.selectedStrike) {
        const cacheKey = `${boxState.selectedProduct}_${boxState.selectedExpiry}`;
        const cachedData = optionChainCache[cacheKey];
        
        if (cachedData && cachedData.ceList && cachedData.ceList.length > 0) {
          
          // Find the ATM option from the cached data
          const allOptions = [...cachedData.ceList, ...cachedData.peList];
          const processedOptions = processedStrikePrices(allOptions);
          const atmOption = processedOptions.find(option => option.label === "ATM");
          
          if (atmOption) {
            updateBoxState(boxId, {
              selectedStrike: atmOption.strikePrice
            });
          } else {
            // Fallback to first option if ATM not found
            updateBoxState(boxId, {
              selectedStrike: cachedData.ceList[0].strikePrice
            });
          }
        }
      }
    });
  }, [boxStates, optionChainCache, processedStrikePrices, updateBoxState]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (addBoxTimeoutRef.current) {
        clearTimeout(addBoxTimeoutRef.current);
      }
    };
  }, []);

  const closeTradingBox = (id) => {
    
    // Remove the box from trading boxes
    setTradingBoxes((prev) => prev?.filter((box) => box.id !== id));
    
    // Clean up box state to prevent memory leaks
    setBoxStates((prev) => {
      const newStates = { ...prev };
      delete newStates[id];
      return newStates;
    });
    
    // Clean up option chain cache for this box if no other boxes are using it
    setOptionChainCache((prev) => {
      const newCache = { ...prev };
      // Remove cache entries that are no longer needed
      Object.keys(newCache).forEach(key => {
        const isUsedByOtherBoxes = tradingBoxes.some(box => 
          box.id !== id && box.symbol === key
        );
        if (!isUsedByOtherBoxes) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  };

  // Cleanup function to remove all boxes
  const clearAllTradingBoxes = useCallback(() => {
    setTradingBoxes([]);
    setBoxStates({});
    setOptionChainCache({});
    setNextId(1);
  }, []);

  // Get unique symbols to prevent duplicates
  const getUniqueSymbols = useCallback(() => {
    const symbols = tradingBoxes.map(box => box.symbol);
    return [...new Set(symbols)];
  }, [tradingBoxes]);


  const updateBoxPosition = (id, newPosition) => {
    setTradingBoxes((prev) =>
      prev.map((box) =>
        box.id === id ? { ...box, position: newPosition } : box
      )
    );
  };

  const value = {
    tradingBoxes,
    addTradingBox,
    closeTradingBox,
    updateBoxPosition,
    getBoxState,
    updateBoxState,
    updateProduct,
    updateExpiry,
    optionChainCache,
    isLoadingOptions,
    brokerConfigList,
    isLoadingBrokers,
    getLotSize,
    clearAllTradingBoxes,
    getUniqueSymbols,
    // Add back the missing functions
    getAvailableStrikes,
    getCurrentOptionData,
    updateOptionType,
    updateStrikePrice,
    getSymbolExpiryList,
    fetchOptionChainData,
    processedStrikePrices,
    getBrokerConfig,
    refreshBrokerList
  };

  return (
    <TradingBoxContext.Provider value={value}>
      {children}
    </TradingBoxContext.Provider>
  );
}; 