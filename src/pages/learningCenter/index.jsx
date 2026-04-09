import React from "react";
import "./learningCenter.scss";
import { useLearningCenter } from "./learningCenter";
import {
  FiBookOpen,
  FiPlay,
  FiSearch,
  FiVideo,
  FiCalendar,
  FiClock,
} from "react-icons/fi";

const LearningCenter = () => {
  const {
    videos,
    loading,
    error,
    selectedVideo,
    searchTerm,
    displayVideos,
    fetchVideos,
    handleVideoSelect,
    clearSearch,
    formatDate,
    setSearchTerm,
  } = useLearningCenter();

  const renderVideoPlayerUI = () => {
    if (!selectedVideo) {
      return (
        <div className="video-placeholder">
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <FiVideo className="icon" />
            </div>
            <p>Select a video to start learning</p>
            <span className="placeholder-subtitle">
              Choose from our curated collection of trading tutorials
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="video-player">
        <iframe
          src={`https://www.youtube.com/embed/${selectedVideo.video_link}`}
          title={selectedVideo.heading}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="content learning-center-page">
        <div className="card-box card-height">
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading learning content...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="content learning-center-page">
        <div className="card-box card-height">
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <button onClick={fetchVideos} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="content learning-center-page">
      <div className="card-box card-height">
        {/* Compact Header Section */}
        {/* <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <FiBookOpen className="icon" />
            </div>
            <div className="header-text">
              <h1 className="page-title">Learning Center</h1>
              <p className="page-subtitle">
                Expert trading tutorials & strategies
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <FiVideo className="stat-icon" />
              <span className="stat-number">{displayVideos.length}</span>
              <span className="stat-label">Videos</span>
            </div>
            <div className="stat-item">
              <FiClock className="stat-icon" />
              <span className="stat-number">
                {displayVideos.length > 0
                  ? Math.ceil(displayVideos.length * 0.3)
                  : 0}
              </span>
              <span className="stat-label">Hours</span>
            </div>
          </div>
        </div> */}

        <div className="box-body">
          {/* Main Content */}
          <div className="learning-content">
            {/* Video Player Section */}
            <div className="video-section">
              {renderVideoPlayerUI()}

              {/* Video Info */}
              {selectedVideo && (
                <div className="video-info">
                  <div className="video-header">
                    <h2 className="video-title">{selectedVideo.heading}</h2>
                    <div className="video-meta">
                      <span className="video-date">
                        <FiCalendar className="meta-icon" />
                        {formatDate(selectedVideo.created_at)}
                      </span>
                    </div>
                  </div>
                  <div
                    className="video-description"
                    dangerouslySetInnerHTML={{
                      __html: selectedVideo.description,
                    }}
                  />
                </div>
              )}
            </div>

            {/* Compact Sidebar */}
            <div className="video-sidebar">
              <div className="sidebar-header">
                <div className="search-container">
                  <FiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button onClick={clearSearch} className="clear-search">
                      ✕
                    </button>
                  )}
                </div>
                <div className="video-count">
                  <span>{displayVideos.length} videos available</span>
                </div>
              </div>
              <div className="video-list">
                {displayVideos.map((video) => (
                  <div
                    key={video.id}
                    className={`video-item ${
                      selectedVideo?.id === video.id ? "active" : ""
                    }`}
                    onClick={() => handleVideoSelect(video)}
                  >
                    <div className="video-thumbnail">
                      {video.video_link ? (
                        <img
                          src={`https://img.youtube.com/vi/${video.video_link}/mqdefault.jpg`}
                          alt={video.heading}
                          onError={(e) => {
                            e.target.src = "/placeholder-video.jpg";
                          }}
                        />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <FiVideo className="placeholder-icon" />
                        </div>
                      )}
                      <div className="play-overlay">
                        <FiPlay className="play-icon" />
                      </div>
                    </div>
                    <div className="video-details">
                      <h4 className="video-item-title">{video.heading}</h4>
                      <span className="video-item-date">
                        <FiCalendar className="date-icon" />
                        {formatDate(video.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningCenter;
