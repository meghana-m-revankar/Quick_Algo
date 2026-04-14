import { useState, useEffect } from 'react'
import { asyncGetAdminStrategy, asyncGetClientStrategy } from '#redux/strategy/action';
import Storage from '#services/storage';

const useStrategyList = () => {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminStrategies, setAdminStrategies] = useState([]);
  const [clientStrategies, setClientStrategies] = useState([]);

  const fetchAdminStrategy = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await asyncGetAdminStrategy();

      if (response.data.success ) {
        setAdminStrategies(response.data.data);
      } else {
        setError("Failed to fetch admin strategies");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch admin strategies"
      );
    } finally {
      setLoading(false);
    }
  };



  const fetchClientStrategy = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get CustomerId from localStorage
      const customerId = localStorage.getItem("customerID");
      
      if (!customerId) {
        setError("Customer ID not found. Please login again.");
        setClientStrategies([]);
        return;
      }

      const response = await asyncGetClientStrategy(customerId);

      if (response.data.success ) {
        setClientStrategies(response.data.data);
      } else {
        setError("Failed to fetch client strategies");
        setClientStrategies([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch client strategies"
      );
      setClientStrategies([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch both strategies on mount
  useEffect(() => {
    fetchAdminStrategy();
    fetchClientStrategy();
  }, []);
  
  return{
    loading,
    error,
    adminStrategies,
    clientStrategies,
    fetchAdminStrategy,
    fetchClientStrategy
  }
}

export default useStrategyList
