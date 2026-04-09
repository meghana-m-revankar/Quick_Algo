// Simple performance monitoring for chart optimization
export const performanceMonitor = {
  // Track chart loading performance
  trackChartLoad: (chartId, startTime) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    return loadTime;
  },

  // Track memory usage
  trackMemoryUsage: () => {
    if (performance.memory) {
      const memory = performance.memory;
    }
  }
};

export default performanceMonitor;  