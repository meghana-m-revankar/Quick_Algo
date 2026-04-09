import { IconRegistry } from "#components";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useChartWidget } from "../../hooks/useChartWidget";
import "./ChartPopup.scss";

const ChartPopup = ({ symbol, position, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);

  const popupRef = useRef();
  const chartContainerRef = useRef();

  // Chart options
  const chartOptions = {
    symbol: symbol,
    interval: "1D",
    datafeed: {
      onReady: (callback) => {
        callback({
          supports_time: true,
          supports_marks: true,
          supports_time_scale_marks: true,
          supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
        });
      },
      resolveSymbol: (symbolName, onSymbolResolvedCallback) => {
        onSymbolResolvedCallback({
          session: "0915-1530",
          timezone: "Asia/Kolkata",
          name: symbolName,
          minmov: 1,
          pricescale: 100,
          has_intraday: true,
          supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
        });
      },
      getBars: async (
        symbolInfo,
        resolution,
        periodParams,
        onHistoryCallback,
        onErrorCallback
      ) => {
        try {
          const bars = [];
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;

          for (let i = 0; i < 100; i++) {
            const time = now - (100 - i) * oneDay;
            const basePrice = 100 + Math.random() * 50;
            const change = (Math.random() - 0.5) * 10;

            bars.push({
              time: time,
              open: basePrice,
              high: basePrice + Math.abs(change),
              low: basePrice - Math.abs(change),
              close: basePrice + change,
              volume: Math.floor(Math.random() * 1000000),
            });
          }

          onHistoryCallback(bars, { noData: false });
        } catch (error) {
          onErrorCallback("Error loading historical data");
        }
      },
      subscribeBars: (
        symbolInfo,
        resolution,
        onRealtimeCallback,
        subscriberUID,
        onResetCacheNeededCallback
      ) => {
        // Mock real-time subscription
        const interval = setInterval(() => {
          const now = Date.now();
          const basePrice = 100 + Math.random() * 50;
          const change = (Math.random() - 0.5) * 10;

          onRealtimeCallback({
            time: now,
            open: basePrice,
            high: basePrice + Math.abs(change),
            low: basePrice - Math.abs(change),
            close: basePrice + change,
            volume: Math.floor(Math.random() * 1000000),
          });
        }, 5000);

        return () => clearInterval(interval);
      },
      unsubscribeBars: (subscriberUID) => {
        // Cleanup subscription
      },
      searchSymbols: (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback
      ) => {
        onResultReadyCallback([]);
      },
    },
    library_path: "charting_library/",
    timezone: "Asia/Kolkata",
    locale: "en",
    disabled_features: [
      "header_compare",
      "header_saveload",
      "header_screenshot",
      "countdown",
      "display_market_status",
    ],
    enabled_features: [
      "symbol_search",
      "header_symbol_search",
      "header_widget",
      "header_widget_dom_node",
      "symbol_search_hot_key",
    ],
    fullscreen: false,
    autosize: true,
    height: "100%",
    loading_screen: { backgroundColor: "#ffffff" },
    theme: "Light",
    overrides: {
      "mainSeriesProperties.candleStyle.upColor": "#26a69a",
      "mainSeriesProperties.candleStyle.downColor": "#ef5350",
      "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
      "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350",
    },
  };

  const { widget, isReady, isLoading, error, initializeWidget, destroyWidget } =
    useChartWidget(chartContainerRef, chartOptions);

  // Initialize chart when component mounts
  useEffect(() => {
    if (chartContainerRef.current && !widget && !isLoading) {
      setTimeout(() => {
        initializeWidget();
      }, 100);
    }
  }, [widget, isLoading, initializeWidget]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (widget) {
        destroyWidget();
      }
    };
  }, [widget, destroyWidget]);

  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (e.target.closest(".popup-controls")) return;

    const rect = popupRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    e.currentTarget.style.cursor = "grabbing";
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    // Calculate boundaries
    const maxX = window.innerWidth - (isMaximized ? 40 : 400);
    const maxY = window.innerHeight - (isMaximized ? 40 : 300);

    setCurrentPosition({
      x: Math.max(20, Math.min(newX, maxX)),
      y: Math.max(20, Math.min(newY, maxY)),
    });
  }, [isDragging, dragOffset, isMaximized]);

  const handleMouseUp = () => {
    setIsDragging(false);
    if (popupRef.current) {
      popupRef.current.style.cursor = "move";
    }
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Handle minimize/maximize
  const handleMinimize = () => {
    setIsMinimized(true);
    setIsMaximized(false);
  };

  const handleMaximize = () => {
    setIsMaximized(true);
    setIsMinimized(false);
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setIsMaximized(false);
  };

  // Calculate popup dimensions and position
  const getPopupStyles = () => {
    if (isMaximized) {
      return {
        top: "20px",
        left: "20px",
        right: "20px",
        bottom: "20px",
        width: "auto",
        height: "auto",
      };
    }

    if (isMinimized) {
      return {
        top: `${currentPosition.y}px`,
        left: `${currentPosition.x}px`,
        width: "300px",
        height: "60px",
      };
    }

    return {
      top: `${currentPosition.y}px`,
      left: `${currentPosition.x}px`,
      width: "600px",
      height: "400px",
    };
  };

  return (
    <div className="chart-popup-overlay">
      <div
        ref={popupRef}
        className={`chart-popup ${isMinimized ? "minimized" : ""} ${
          isMaximized ? "maximized" : ""
        }`}
        style={getPopupStyles()}
        onMouseDown={handleMouseDown}
      >
        {/* Popup Header */}
        <div className="popup-header">
          <div className="popup-title">
            <span className="popup-icon">📊</span>
            <span>{symbol} Chart</span>
          </div>
          <div className="popup-controls">
            <button
              className="popup-control-btn minimize-btn"
              onClick={handleMinimize}
              title="Minimize"
            >
              <IconRegistry name="minus" />
            </button>
            <button
              className="popup-control-btn maximize-btn"
              onClick={isMaximized ? handleRestore : handleMaximize}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <IconRegistry name="compress" />
              ) : (
                <IconRegistry name="expand" />
              )}
            </button>
            <button
              className="popup-control-btn close-btn"
              onClick={onClose}
              title="Close"
            >
              <IconRegistry name="times" />
            </button>
          </div>
        </div>

        {/* Chart Content */}
        <div className="popup-content">
          {isMinimized ? (
            <div className="minimized-content">
              <span>{symbol} - Minimized</span>
              <button onClick={handleRestore}>Restore</button>
            </div>
          ) : (
            <div className="chart-content">
              {isLoading && (
                <div className="chart-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading chart...</p>
                </div>
              )}

              {error && (
                <div className="chart-error">
                  <p>Error loading chart: {error}</p>
                  <button onClick={() => initializeWidget()}>Retry</button>
                </div>
              )}

              {isReady && (
                <div
                  ref={chartContainerRef}
                  className="chart-container"
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartPopup;
