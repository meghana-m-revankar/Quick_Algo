import { useEffect, useState } from "react";

// Optimized chart preloader with shared instance
let sharedPreloadPromise = null;
const preloadWidget = () => {
  if (!sharedPreloadPromise) {
    sharedPreloadPromise = new Promise((resolve, reject) => {
      // Check if TradingView is already loaded
      if (window.TradingView && window.TradingView.widget) {
        resolve({ widget: window.TradingView.widget });
        return;
      }

      // Load the script from public folder
      const script = document.createElement("script");
      script.src = "/charting_library/charting_library.js";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        if (window.TradingView && window.TradingView.widget) {
          resolve({ widget: window.TradingView.widget });
        } else {
          reject(new Error("TradingView widget not found after script load"));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load TradingView charting library"));
      };

      document.head.appendChild(script);
    });
  }
  return sharedPreloadPromise;
};

const ChartPreloader = ({ onLibraryLoaded, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only preload when user navigates to chart-related pages
    const shouldPreload = () => {
      const path = window.location.pathname;
      return path.includes("/chart") || path.includes("/trading");
    };

    if (shouldPreload() && !isLoaded && !isLoading) {
      setIsLoading(true);

      preloadWidget()
        .then(({ widget }) => {
          widgetModule = { widget };
          setIsLoaded(true);
          setIsLoading(false);
          if (onLibraryLoaded) {
            onLibraryLoaded({ widget });
          }
        })
        .catch((error) => {
          setIsLoading(false);
          if (onError) {
            onError(error);
          }
        });
    }
  }, [isLoaded, isLoading, onLibraryLoaded, onError]);

  return null; // This component doesn't render anything
};

export default ChartPreloader;
