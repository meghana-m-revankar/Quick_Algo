import { useState, useCallback, useRef, useEffect } from 'react';

// Individual chart library loader - no more global loader
const waitForTradingView = () => {
  return new Promise((resolve, reject) => {
    // Check if TradingView is already loaded
    if (window.TradingView && window.TradingView.widget) {
      resolve({ widget: window.TradingView.widget });
      return;
    }

    // Wait for TradingView to be loaded by individual chart loaders
    const checkForTradingView = () => {
      if (window.TradingView && window.TradingView.widget) {
        resolve({ widget: window.TradingView.widget });
      } else {
        // Retry after a shorter delay for faster loading
        setTimeout(checkForTradingView, 50);
      }
    };
    
    // Start checking immediately
    checkForTradingView();
    
    // Set a timeout to prevent infinite waiting
    setTimeout(() => {
      if (!window.TradingView || !window.TradingView.widget) {
        reject(new Error('TradingView library failed to load within timeout'));
      }
    }, 10000); // 10 second timeout
  });
};

export const useChartWidget = (containerRef, options) => {
  const [widget, setWidget] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const widgetRef = useRef(null);
  const initializationTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  const initializeWidget = useCallback(async () => {
    if (!containerRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Wait for TradingView to be loaded by individual chart loaders
      const { widget: Widget } = await waitForTradingView();
      
      // Clear any existing timeout
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
      
      const widgetInstance = new Widget({
        ...options,
        container: containerRef.current,
        // Add default options for better stability
        autosize: true,
        height: "100%",
        width: "100%",
        loading_screen: { 
          backgroundColor: "#1e222d",
          foregroundColor: "#ffffff"
        },
        // Set the library path to the correct location
        library_path: "/charting_library/charting_library.js",
        // Disable debug mode to reduce logging
        debug: false,
      });
      
      // Set up chart ready handler with timeout protection
      widgetInstance.onChartReady(() => {
        setIsReady(true);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        
        // Don't try to access activeChart immediately in onChartReady
        // Let the parent component handle chart setup after a delay
      });

      // Set up error handler
      if (widgetInstance.onError) {
        widgetInstance.onError((error) => {
          setError("Chart error occurred. Please try again.");
          setIsLoading(false);
        });
      }

      setWidget(widgetInstance);
      widgetRef.current = widgetInstance;
      
      return widgetInstance;
    } catch (err) {
      setError("Failed to load chart. Please refresh the page.");
      setIsLoading(false);
      
      // Auto-retry on failure (up to 3 attempts)
      if (retryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          initializeWidget();
        }, delay);
      }
    }
  }, [containerRef, options, retryCount]);

  // Watch for options changes and reinitialize widget if symbol changes
  useEffect(() => {
    if (widgetRef.current && options.symbol) {
      const currentSymbol = widgetRef.current.symbol || widgetRef.current._options?.symbol;
      const newSymbol = options.symbol;
      
      if (currentSymbol !== newSymbol) {
        // Clean up existing widget
        if (widgetRef.current) {
          try {
            widgetRef.current.remove();
          } catch (err) {
            // Error removing widget
          }
          widgetRef.current = null;
        }
        
        setWidget(null);
        setIsReady(false);
        setIsLoading(false);
        setError(null);
        
        // Reinitialize with new symbol immediately
        initializeWidget();
      }
    }
  }, [options.symbol, initializeWidget]);

  // Handle other option changes that don't require full reinitialization
  useEffect(() => {
    if (widgetRef.current && isReady) {
      // Update chart properties that can be changed without reinitialization
      try {
        if (options.interval && widgetRef.current.setResolution) {
          widgetRef.current.setResolution(options.interval);
        }
        
        if (options.theme && widgetRef.current.setTheme) {
          widgetRef.current.setTheme(options.theme);
        }
        
        // Update other chart properties as needed
        if (options.overrides && widgetRef.current.applyOverrides) {
          widgetRef.current.applyOverrides(options.overrides);
        }
      } catch (err) {
        // Error updating chart options
      }
    }
  }, [options.interval, options.theme, options.overrides, isReady]);

  const destroyWidget = useCallback(() => {
    // Clear all timeouts
    if (initializationTimeoutRef.current) {
      clearTimeout(initializationTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    if (widgetRef.current) {
      try {
        widgetRef.current.remove();
      } catch (err) {
        // Error destroying widget
      }
      widgetRef.current = null;
    }
    
    setWidget(null);
    setIsReady(false);
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);

  // Manual retry function
  const retry = useCallback(() => {
    destroyWidget();
    setRetryCount(0);
    // Initialize immediately without delay
    initializeWidget();
  }, [destroyWidget, initializeWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyWidget();
    };
  }, [destroyWidget]);

  // Auto-initialize when container becomes available - immediately
  useEffect(() => {
    if (containerRef.current && !widget && !isLoading && !error) {
      initializeWidget();
    }
  }, [containerRef.current, widget, isLoading, error, initializeWidget]);

  return {
    widget,
    isReady,
    isLoading,
    error,
    retryCount,
    initializeWidget,
    destroyWidget,
    retry,
  };
}; 