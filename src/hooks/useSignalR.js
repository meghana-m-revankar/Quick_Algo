import { useSignalR } from "#services/signalR";
import { useEffect } from 'react';

const channelToSubscription = new Map();
const pendingSubscriptions = [];
let isConnected = false;

export function useChartSocket() {
  const signalRContext = useSignalR();
  
  useEffect(() => {
    if (signalRContext) {
   
      isConnected = signalRContext.isConnectionActive;

      if (isConnected) {
  
        pendingSubscriptions.forEach((args) => subscribeOnStream(...args));
        pendingSubscriptions.length = 0;
      }
    }
  }, [signalRContext?.isConnectionActive]);
  
  if (!signalRContext) {
    return {
      subscribeOnStream: () => {},
      unsubscribeOnStream: () => {},
      addTransferChart: () => {},
    };
  }
  
  const { emitter, addTransferChart } = signalRContext; 

  function subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastDailyBar) {
   
    
    if (!isConnected) {
      
      pendingSubscriptions.push([symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback, lastDailyBar]);
      return;
    }

    const channelString = symbolInfo.full_name;
    const handler = { id: subscriberUID, callback: onRealtimeCallback };
    let subscriptionItem = channelToSubscription.get(channelString);

    if (subscriptionItem) {
      subscriptionItem.handlers.push(handler);
      // Ensure SignalR channel is subscribed even if subscription item exists
      if (addTransferChart) {
        addTransferChart(channelString);
      }
      return;
    }

    subscriptionItem = { subscriberUID, resolution, lastDailyBar, handlers: [handler] };
    channelToSubscription.set(channelString, subscriptionItem);

    // Immediately subscribe to SignalR channel for fast live data (no delay)
    if (addTransferChart) {
      addTransferChart(channelString);
    }

    emitter.on(channelString, (message) => {
      try {
        const AllData = JSON.parse(message);
        const tradeTime = parseFloat(AllData.s12);
        const currentPrice = parseFloat(AllData.s8);

        if (!tradeTime || !currentPrice) {
          return;
        }

        const lastBar = subscriptionItem.lastDailyBar;
        
        // Check if we need to reset for new trading day
        if (shouldResetForNewDay(lastBar?.time)) {
          subscriptionItem.lastDailyBar = null;
        }
        
        // CRITICAL: First validate that tradeTime is not in the past compared to lastBar
        if (lastBar && tradeTime < lastBar.time) {
          return;
        }
        
        const nextTime = getNextDailyBarTime(lastBar?.time || tradeTime, subscriptionItem.resolution);

        let bar;
        if (tradeTime >= nextTime) {
          // Create new bar
          bar = { 
            time: nextTime, 
            open: currentPrice, 
            high: currentPrice, 
            low: currentPrice, 
            close: currentPrice 
          };
        } else if (lastBar) {
          // Update existing bar - keep same time as lastBar
          bar = { 
            ...lastBar, 
            high: Math.max(lastBar.high, currentPrice), 
            low: Math.min(lastBar.low, currentPrice), 
            close: currentPrice 
          };
        } else {
          // First bar
          bar = { 
            time: nextTime, 
            open: currentPrice, 
            high: currentPrice, 
            low: currentPrice, 
            close: currentPrice 
          };
        }

        // CRITICAL: Final validation - bar.time must be >= lastBar.time
        // This prevents sending bars with time less than what's already in the chart
        if (lastBar && bar.time < lastBar.time) {
          return;
        }

        // Ensure bar.time is not in the future beyond reasonable limits (e.g., next 24 hours)
        const maxAllowedTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours from now
        if (bar.time > maxAllowedTime) {
          return;
        }

        // Additional safety: Ensure bar.time is not more than 1 hour in the past
        const minAllowedTime = Date.now() - (60 * 60 * 1000); // 1 hour ago
        if (bar.time < minAllowedTime) {
          return;
        }

        subscriptionItem.lastDailyBar = bar;
        subscriptionItem.handlers.forEach((h) => h.callback(bar));
      } catch (error) {
        // Error processing real-time data
      }
    });
  }

  function unsubscribeOnStream(subscriberUID) {
    for (const [channelString, subscriptionItem] of channelToSubscription.entries()) {
      const index = subscriptionItem.handlers.findIndex(h => h.id === subscriberUID);
      if (index !== -1) {
        subscriptionItem.handlers.splice(index, 1);
        if (!subscriptionItem.handlers.length) {
          // Remove all listeners for this channel
          emitter.removeAllListeners(channelString);
          channelToSubscription.delete(channelString);
        }
        break;
      }
    }
  }

  return { subscribeOnStream, unsubscribeOnStream, addTransferChart };
}

function getNextDailyBarTime(barTime, resolution) {
  const date = new Date(barTime);
  const now = new Date();
  const resolutionMs = parseInt(resolution) * 60 * 1000;
  
  // Calculate the next bar time by adding resolution
  date.setTime(date.getTime() + resolutionMs);
  
  // Ensure the calculated time is not too far in the past (more than 1 resolution period behind now)
  const minAllowedTime = now.getTime() - resolutionMs;
  if (date.getTime() < minAllowedTime) {
    // If calculated time is too old, round current time to nearest resolution boundary
    const roundedNow = Math.floor(now.getTime() / resolutionMs) * resolutionMs;
    return roundedNow;
  }
  
  return Math.floor(date.getTime());
}

// Function to check if we need to reset cache for new trading day
function shouldResetForNewDay(barTime) {
  if (!barTime) return true;
  
  const barDate = new Date(barTime);
  const now = new Date();
  
  const barDay = new Date(barDate.getFullYear(), barDate.getMonth(), barDate.getDate());
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return barDay < currentDay;
}
