import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for fast page loading with optimistic rendering
 * Shows page immediately and updates when API responses arrive
 */
const useFastPageLoad = (initialData = null, apiCalls = []) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const mountedRef = useRef(true);
  const abortControllersRef = useRef([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Abort all pending requests
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  /**
   * Execute API calls in parallel
   * @param {Array} calls - Array of async functions that return promises
   * @param {Object} options - Options for loading behavior
   */
  const loadData = useCallback(async (calls = [], options = {}) => {
    const { 
      showLoading = false, 
      updateOnSuccess = true,
      onSuccess,
      onError 
    } = options;

    if (showLoading) {
      setIsLoading(true);
    }

    setErrors({});

    // Create abort controllers for each call
    const controllers = calls.map(() => new AbortController());
    abortControllersRef.current = controllers;

    try {
      // Execute all API calls in parallel
      const results = await Promise.allSettled(
        calls.map((call, index) => {
          const controller = controllers[index];
          return call(controller.signal);
        })
      );

      if (!mountedRef.current) return;

      const successResults = {};
      const errorResults = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successResults[index] = result.value;
        } else {
          errorResults[index] = result.reason;
        }
      });

      // Update data if any calls succeeded
      if (updateOnSuccess && Object.keys(successResults).length > 0) {
        if (onSuccess) {
          onSuccess(successResults, errorResults);
        } else {
          // Default: merge all success results
          setData(prevData => ({
            ...prevData,
            ...successResults
          }));
        }
      }

      // Store errors
      if (Object.keys(errorResults).length > 0) {
        setErrors(errorResults);
        if (onError) {
          onError(errorResults);
        }
      }
    } catch (error) {
      if (mountedRef.current) {
        setErrors({ general: error });
        if (onError) {
          onError({ general: error });
        }
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Update data manually
   */
  const updateData = useCallback((newData) => {
    if (mountedRef.current) {
      setData(prevData => ({
        ...prevData,
        ...(typeof newData === "function" ? newData(prevData) : newData)
      }));
    }
  }, []);

  /**
   * Reset to initial state
   */
  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(initialData);
      setErrors({});
      setIsLoading(false);
    }
  }, [initialData]);

  return {
    data,
    isLoading,
    errors,
    loadData,
    updateData,
    reset,
    setData,
    setIsLoading
  };
};

export default useFastPageLoad;

