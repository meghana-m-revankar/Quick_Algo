import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { asyncGetNewsDetail } from "#redux/news";
import { handleCatchErrors } from "#utils/validation";

const useNewsDetail = (id) => {
  const navigate = useNavigate();

  // State management
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch news detail from API
  const fetchNewsDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await asyncGetNewsDetail({ id });

      if (response.data.status) {
        setNews(response.data.data);
      } else {
        setError("Failed to fetch news details");
      }
    } catch (error) {
      handleCatchErrors(error, navigate);
      setError(error.response?.data?.message || "News article not found");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Navigate back to news list
  const goBack = useCallback(() => {
    navigate("/news");
  }, [navigate]);

  // Initialize news detail on component mount
  useEffect(() => {
    fetchNewsDetail();
  }, [fetchNewsDetail]);

  return {
    // State
    news,
    loading,
    error,
    
    // Actions
    fetchNewsDetail,
    formatDate,
    goBack,
  };
};

export default useNewsDetail;
