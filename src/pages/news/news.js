import React, { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { asyncGetNewsList, asyncGetNewsByCategory, asyncGetNewsDetail } from "#redux/news";
import { handleCatchErrors } from "#utils/validation";

const useNews = () => {
  const navigate = useNavigate();

  // State management
  const [activeFilter, setActiveFilter] = useState("all");
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false,
  });


  // Fetch news data from API
  const fetchNews = useCallback(async (page = 1, category_id = null) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (category_id && category_id !== "all") {
        response = await asyncGetNewsByCategory({
          page,
          category_id,
          limit: 10,
        });
      } else {
        response = await asyncGetNewsList({ page, limit: 10 });
      }

      if (response.data.status) {
        setNewsData(response.data.data.news);
        setPagination(response.data.data.pagination);
      } else {
        setError("Failed to fetch news");
        setNewsData([]);
      }
    } catch (err) {
      handleCatchErrors(err, navigate);
      setError(err.response?.data?.message || "Failed to fetch news");
      setNewsData([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    fetchNews(page, activeFilter);
  }, [fetchNews, activeFilter]);

  // Handle filter change
  const handleFilterChange = useCallback((filter) => {
    setActiveFilter(filter);
    fetchNews(1, filter);
  }, [fetchNews]);

  // Handle read full article
  const handleReadFullArticle = useCallback((newsId) => {
    navigate(`/news/article/${newsId}`);
  }, [navigate]);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  }, []);

  // Initialize news on component mount
  useEffect(() => {
    fetchNews(1, activeFilter);
  }, [fetchNews, activeFilter]);

  return {
    // State
    activeFilter,
    newsData,
    loading,
    error,
    pagination,
    
    // Actions
    fetchNews,
    handlePageChange,
    handleFilterChange,
    handleReadFullArticle,
    formatDate,
  };
};

export default useNews;
