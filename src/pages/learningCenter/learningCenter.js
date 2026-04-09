import { useEffect, useState } from "react";
import {
  asyncGetVideosList,
} from "#redux/learningCenter/action";

export const useLearningCenter = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await asyncGetVideosList();

      if (response.data.status) {
        setVideos(response.data.data);
        if (response.data.data.length > 0) {
          setSelectedVideo(response.data.data[0]);
        }
      } else {
        setError(response.data.message || "Failed to fetch videos");
      }
    } catch (error) {
      setError("Error loading videos");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    fetchVideos();
  }, []);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchTerm("");
  };

  // Get current videos to display (search results or all videos)
  const displayVideos = searchResults.length > 0 ? searchResults : videos;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return {
    // State
    videos,
    loading,
    error,
    selectedVideo,
    searchResults,
    searchTerm,
    displayVideos,
    
    // Actions
    fetchVideos,
    handleVideoSelect,
    clearSearch,
    
    // Utilities
    formatDate,
    
    // Setters
    setSearchTerm
  };
};
