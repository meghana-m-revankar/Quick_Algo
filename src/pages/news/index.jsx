import React from "react";
import "./news.scss";
import useNews from "./news";

const News = () => {
  const {
    activeFilter,
    newsData,
    loading,
    error,
    pagination,
    fetchNews,
    handlePageChange,
    handleFilterChange,
    handleReadFullArticle,
    formatDate,
  } = useNews();

  // Handle image error
  const handleImageError = (e) => {
    // Image failed to load
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  // Handle image load success
  const handleImageLoad = (e) => {
    // Image loaded successfully
    e.target.style.display = 'block';
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  };

  // Validate image URL
  const isValidImageUrl = (url) => {
    if (!url) return false;
    if (typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    if (url === 'null' || url === 'undefined') return false;
    return true;
  };

  // Get featured article (first article)
  const featuredArticle = newsData && newsData.length > 0 ? newsData[0] : null;
  const otherArticles = newsData && newsData.length > 1 ? newsData.slice(1) : [];

  return (
    <div className="news-page">
      <div className="news-container">
        {/* Hero Section */}
        {/* <div className="news-hero">
          <div className="hero-content">
            <div className="hero-left">
              <h1 className="hero-title">📰 Latest News & Updates</h1>
              <p className="hero-subtitle">Stay informed with real-time market insights, trading strategies, and financial updates</p>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">{pagination?.total_count || 0}</span>
                  <span className="stat-label">Articles</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{pagination?.total_pages || 0}</span>
                  <span className="stat-label">Pages</span>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-illustration">
                <span className="illustration-icon">📊</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Featured Article */}
        {/* {featuredArticle && (
          <div className="featured-article">
            <div className="featured-content" onClick={() => handleReadFullArticle(featuredArticle.id)}>
              <div className="featured-image-container">
                {isValidImageUrl(featuredArticle.image) ? (
                  <>
                    <img
                      src={featuredArticle.image}
                      alt={featuredArticle.heading}
                      className="featured-image"
                      loading="lazy"
                      onError={handleImageError}
                      onLoad={handleImageLoad}
                    />
                    <div className="image-placeholder" style={{ display: 'none' }}>
                      <span className="placeholder-icon">📰</span>
                      <span className="placeholder-text">Image: {featuredArticle.image}</span>
                    </div>
                  </>
                ) : (
                  <div className="image-placeholder">
                    <span className="placeholder-icon">📰</span>
                    <span className="placeholder-text">No valid image URL</span>
                  </div>
                )}
                {featuredArticle.category_id && (
                  <div className="featured-category">
                    Category {featuredArticle.category_id}
                  </div>
                )}
                <div className="featured-overlay">
                  <span className="read-more-text">Read Full Article →</span>
                </div>
              </div>
              <div className="featured-text">
                <div className="featured-meta">
                  <span className="featured-date">
                    <span className="date-icon">🕒</span>
                    {formatDate(featuredArticle.created_at)}
                  </span>
                  <span className="featured-id">#{featuredArticle.id}</span>
                </div>
                <h2 className="featured-title">{featuredArticle.heading}</h2>
                {featuredArticle.tags && (
                  <div className="featured-tags">
                    {(() => {
                      try {
                        const parsedTags =
                          typeof featuredArticle.tags === "string"
                            ? JSON.parse(featuredArticle.tags)
                            : featuredArticle.tags;
                        if (Array.isArray(parsedTags)) {
                          return parsedTags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag-item featured">
                              {tag.value}
                            </span>
                          ));
                        }
                        return featuredArticle.tags;
                      } catch (error) {
                        return featuredArticle.tags;
                      }
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button
              className="retry-button"
              onClick={() => fetchNews(1, activeFilter)}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading latest news...</p>
            </div>
          </div>
        )}

        {/* Other Articles Grid */}
        {!loading && otherArticles.length > 0 && (
          <>
            <div className="articles-section">
              {/* <div className="section-header">
                <h2 className="section-title">📚 More Articles</h2>
                <p className="section-subtitle">Explore our latest news and insights</p>
              </div> */}
              
              <div className="articles-grid">
                {otherArticles.map((article) => (
                  <div
                    key={article.id}
                    className="article-card"
                    onClick={() => handleReadFullArticle(article.id)}
                  >
                    <div className="article-image-container">
                      {isValidImageUrl(article.image) ? (
                        <>
                          <img
                            src={article.image}
                            alt={article.heading}
                            className="article-image"
                            loading="lazy"
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                          />
                          <div className="image-placeholder" style={{ display: 'none' }}>
                            <span className="placeholder-icon">📰</span>
                            <span className="placeholder-text">Image: {article.image}</span>
                          </div>
                        </>
                    ) : (
                      <div className="image-placeholder">
                          <span className="placeholder-icon">📰</span>
                          <span className="placeholder-text">No valid image URL</span>
                        </div>
                      )}
                      {article.category_id && (
                        <div className="article-category">
                          Category {article.category_id}
                      </div>
                    )}
                      <div className="article-overlay">
                        <span className="read-more-text">Read →</span>
                      </div>
                    </div>
                    <div className="article-content">

                       
                      <div className="article-meta">
                        <h3 className="article-title">{article.heading}</h3>
                        <span className="article-id">#{article.id}</span>
                      </div>
                      
                       <span className="article-date">
                          {/* <span className="date-icon">🕒</span> */}
                          {formatDate(article.created_at)}
                        </span>
                     
                      
                      {article.tags && (
                        <div className="article-tags">
                        {(() => {
                          try {
                            const parsedTags =
                                typeof article.tags === "string"
                                  ? JSON.parse(article.tags)
                                  : article.tags;
                            if (Array.isArray(parsedTags)) {
                                return parsedTags.slice(0, 2).map((tag, index) => (
                                <span key={index} className="tag-item">
                                  {tag.value}
                                </span>
                              ));
                            }
                              return article.tags;
                          } catch (error) {
                              return article.tags;
                          }
                        })()}
                      </div>
                    )}
                      
                      <div className="article-footer">
                        <div className="read-more">
                          Read Article →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
            </div>

            {/* Enhanced Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  <span>Page {pagination.current_page || 1} of {pagination.total_pages || 1}</span>
                </div>
                
                <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  disabled={!pagination.has_prev}
                    onClick={() => handlePageChange((pagination.current_page || 1) - 1)}
                >
                    ← Previous
                </button>

                <button
                  className="pagination-btn"
                  disabled={!pagination.has_next}
                    onClick={() => handlePageChange((pagination.current_page || 1) + 1)}
                >
                    Next →
                </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* No Data State */}
        {!loading && (!newsData || newsData.length === 0) && (
          <div className="no-data-state">
            <div className="no-data-icon">📭</div>
            <h3>No News Found</h3>
            <p>No news articles available at the moment.</p>
            <button
              className="refresh-button"
              onClick={() => fetchNews(1, activeFilter)}
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
