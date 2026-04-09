import { useState, useEffect } from 'react';
import axios from '../services/axios';
import { FAQ_CATEGORY_IDS, FAQ_API_ENDPOINTS } from '../constant/faqConfig';

export const useFaqData = () => {
  const [faqData, setFaqData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFaqData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data for each category
      const categories = Object.keys(FAQ_CATEGORY_IDS);
      const dataPromises = categories.map(async (category) => {
        try {
          const response = await axios.get(`${FAQ_API_ENDPOINTS.structure}?category_id=${FAQ_CATEGORY_IDS[category]}`);
          
          if (response.data.status && response.data.data) {
            return { [category]: response.data.data };
          }
          return { [category]: {} };
        } catch (err) {
          return { [category]: {} };
        }
      });

      const results = await Promise.all(dataPromises);
      const combinedData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      
      setFaqData(combinedData);
    } catch (err) {
      setError(err.message || 'Failed to fetch FAQ data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqData();
  }, []);

  const refreshData = () => {
    fetchFaqData();
  };

  return {
    faqData,
    loading,
    error,
    refreshData
  };
};
