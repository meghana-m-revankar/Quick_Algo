import { useEffect, useState, useCallback } from "react";
import { useSignalR } from "#services/signalR";
import { parseOptionData, hasDataChanged, throttle } from "#utils/optionChainOptimizer";


const useSymbolDetails = (
  symbols,
  type = "",
  addTransfer = 0,
  copyPrevState = 1,
  is_greek = 0 
) => {

 
 
  const signalRContext = useSignalR();


 


  // Provide default values if SignalR context is not available
  const { 
    ordersignalr = () => {}, 
    emitter = { on: () => {}, off: () => {} }, 
    isConnectionActive = false, 
    addTransferChart = () => {} 
  } = signalRContext || {};
 
  const [symbolValue, setSymbolValue] = useState({});

  const parseData = useCallback(
    (receivedData, identifierName, is_greek) => {
      try {
        const json = JSON.parse(receivedData);
        
        // Use optimized parsing function
        const parsedData = parseOptionData(json, type, is_greek == 1);

        // Only update if data has actually changed to prevent unnecessary re-renders
        setSymbolValue((prevData) => {
          const currentData = prevData[identifierName] || {};
          
          if (!hasDataChanged(currentData, parsedData)) {
            return prevData; // Return same reference to prevent re-render
          }
          
          return {
            ...prevData,
            [identifierName]: {
              ...currentData,
              ...parsedData,
            },
          };
        });
      } catch (error) {
        // Error parsing SignalR data
      }
    },
    [type, is_greek]
  );

  useEffect(() => {
    if (!symbols) {
      return;
    }

    // Normalize to array
    const symbolList = Array.isArray(symbols) ? symbols : [symbols];

    if (symbolList.length === 0) return;

    // Track listeners for cleanup
    const listeners = [];

    symbolList.forEach((data) => {
    
      const identifierName = data?.identifier;
      const identifierNameGreeks = is_greek === 1 ? `${data?.identifier}_greeks` : data?.identifier;

      if (!identifierName) return;

      // Set initial data only if it's different from current data
      setSymbolValue((prevData) => {
        const currentData = prevData[identifierName];
        if (copyPrevState === 1 && currentData) {
          // Only update if data has changed
          const hasChanged = Object.keys(data).some(key => 
            currentData[key] !== data[key]
          );
          if (!hasChanged) {
            return prevData;
          }
        }
        
        return {
          ...prevData,
          [identifierName]: data,
        };
      });
      
      // Subscribe based on addTransfer
      if (addTransfer === 0) {
        const subscriptionIdentifier = is_greek == 1 ? identifierNameGreeks : identifierName;
        

          ordersignalr(subscriptionIdentifier);
        
      } else {
        const subscriptionIdentifier = is_greek == 1 ? identifierNameGreeks : identifierName;
        addTransferChart(subscriptionIdentifier);
      }

      // Add listener with throttling for high-frequency updates
      // Always subscribe, listener will be added when connection becomes active
      const actualIdentifier = is_greek == 1 ? identifierNameGreeks : identifierName;
      
      // Create throttled parse function for this identifier
      const throttledParseData = throttle((receivedData) => {
        parseData(receivedData, identifierName, is_greek);
      }, 50); // Throttle to max 20 updates per second for faster live price updates
      
      const listener = (receivedData) => {
        throttledParseData(receivedData);
      };
      
      // Always add listener - emitter will buffer events if connection not active yet
      // When connection becomes active, this useEffect will re-run and re-subscribe
      emitter.on(actualIdentifier, listener);
      listeners.push({ identifierName: actualIdentifier, listener });
      
      // Re-subscribe when connection becomes active (in case it wasn't active during initial subscription)
      if (isConnectionActive) {
        // Re-subscribe to ensure we're getting live updates
        if (addTransfer === 0) {
          ordersignalr(actualIdentifier);
        } else {
          addTransferChart(actualIdentifier);
        }
      } 
    });

    // Cleanup listeners
    return () => {
      listeners.forEach(({ identifierName, listener }) => {
        if (emitter.off) {
          emitter.off(identifierName, listener);
        }
      });
    };
  }, [symbols, addTransfer, isConnectionActive, type, is_greek, copyPrevState, ordersignalr, addTransferChart, emitter, parseData]);
  
 

  return symbolValue;
};

export default useSymbolDetails;
