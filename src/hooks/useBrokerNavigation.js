import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Storage from '#services/storage';

/**
 * Custom hook to manage broker localStorage cleanup on navigation
 * Clears broker setup data when navigating away from broker-related pages
 */
const useBrokerNavigation = () => {
  const location = useLocation();

  useEffect(() => {
    // Define broker-related routes that should preserve broker setup data
    const brokerRoutes = ['/broker', '/setup'];
    
    // Check if current route is a broker-related route
    const isBrokerRoute = brokerRoutes.some(route => 
      location.pathname.startsWith(route)
    );

    // If not on a broker route, clear broker setup data
    if (!isBrokerRoute) {
      Storage.clearBrokerSetupData();
    }
  }, [location.pathname]);

  // Return cleanup function for manual clearing
  const clearBrokerData = () => {
    Storage.clearBrokerSetupData();
  };

  return { clearBrokerData };
};

export default useBrokerNavigation;
