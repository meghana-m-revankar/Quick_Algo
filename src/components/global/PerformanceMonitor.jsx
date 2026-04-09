import { useEffect, useState } from "react";

const PerformanceMonitor = () => {
  const [, setMetrics] = useState({
    chartLoadTime: 0,
    libraryLoadTime: 0,
    dataLoadTime: 0,
  });

  useEffect(() => {
    // Monitor chart loading performance
    const startTime = performance.now();

    const measureChartLoad = () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      setMetrics((prev) => ({
        ...prev,
        chartLoadTime: loadTime,
      }));

      // Log performance metrics
      // Chart loaded

      // Store in localStorage for analytics
      const performanceData = {
        timestamp: Date.now(),
        chartLoadTime: loadTime,
        userAgent: navigator.userAgent,
      };

      const existingData = JSON.parse(
        localStorage.getItem("chartPerformance") || "[]"
      );
      existingData.push(performanceData);

      // Keep only last 10 entries
      if (existingData.length > 10) {
        existingData.splice(0, existingData.length - 10);
      }

      localStorage.setItem("chartPerformance", JSON.stringify(existingData));
    };

    // Listen for chart ready event
    const handleChartReady = () => {
      measureChartLoad();
    };

    // Add event listener for chart ready
    window.addEventListener("chartReady", handleChartReady);

    return () => {
      window.removeEventListener("chartReady", handleChartReady);
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default PerformanceMonitor;
