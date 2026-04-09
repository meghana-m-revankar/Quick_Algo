import React from "react";
import { useParams } from "react-router-dom";
import "./news.scss";
import useNewsDetail from "./newsDetail";

const NewsDetail = () => {
  const { id } = useParams();
  const { news, loading, error, formatDate, goBack } = useNewsDetail(id);

  if (loading) {
    return (
      <div className="news-page">
        <div className="news-container">
          <div className="loading-state">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading article...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="news-page">
        <div className="news-container">
          <div className="no-data-state">
            <div className="error-icon">⚠️</div>
            <h3>Article Not Found</h3>
            <p>{error || "The news article you're looking for doesn't exist."}</p>
            <button onClick={goBack} className="refresh-button">
              ← Back to News
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-page new-details-page">
      <div className="news-container">
        {/* Back Navigation */}
        <div className="back-navigation">
          <button onClick={goBack} className="back-button">
            <span className="back-icon">←</span>
            Back to News
          </button>
        </div>

        {/* Article Header */}
        <div className="article-header">
          <div className="article-meta">
            {news.category_id && (
              <div className="article-category">
                Category {news.category_id}
              </div>
            )}
            <div className="article-date">
              <span className="date-icon">🕒</span>
              {formatDate(news.created_at)}
            </div>
          </div>
          
          <h1 className="article-title">{news.heading}</h1>
          
          {news.tags && (
            <div className="article-tags">
              {(() => {
                try {
                  const parsedTags =
                    typeof news.tags === "string"
                      ? JSON.parse(news.tags)
                      : news.tags;
                  if (Array.isArray(parsedTags)) {
                    return parsedTags.map((tag, index) => (
                      <span key={index} className="tag-item">
                        {tag.value}
                      </span>
                    ));
                  }
                  return news.tags;
                } catch (error) {
                  return news.tags;
                }
              })()}
            </div>
          )}
        </div>

        {/* Article Image */}
        {news.image && (
          <div className="news-detail-image-container">
            <img 
              src={news.image} 
              alt={news.heading}
              className="article-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="image-placeholder" style={{ display: 'none' }}>
              <span className="placeholder-icon">📰</span>
              <span className="placeholder-text">Image not available</span>
            </div>
          </div>
        )}

        {/* Article Content */}
        <div className="article-content">
          <div 
            className="article-description"
            dangerouslySetInnerHTML={{ __html: news.description }}
          />
        </div>

        {/* Article Footer */}
        {/* <div className="article-footer">
          <div className="article-actions">
            <button onClick={goBack} className="back-to-news-btn">
              ← Back to News List
            </button>
            <div className="article-info">
              <span className="article-id">Article ID: {news.id}</span>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default NewsDetail;
