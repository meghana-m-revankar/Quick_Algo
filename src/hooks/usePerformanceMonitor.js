import { useEffect, useRef, useState } from 'react';

const usePerformanceMonitor = (componentName) => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderCount: 0,
    lastRenderTime: 0
  });
  
  const startTime = useRef(performance.now());
  const renderCount = useRef(0);
  
  useEffect(() => {
    const endTime = performance.now();
    const loadTime = endTime - startTime.current;
    
    setMetrics(prev => ({
      ...prev,
      loadTime: Math.round(loadTime),
      renderCount: renderCount.current,
      lastRenderTime: Date.now()
    }));
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      // Performance metrics logged
        loadTime: `${loadTime.toFixed(2)}ms`,
        renderCount: renderCount.current,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  useEffect(() => {
    renderCount.current += 1;
  });
  
  return metrics;
};

export default usePerformanceMonitor;
