import React, { useState } from "react";
import useDashboard from "./dashboard";
import { images } from "#helpers";
import "./dashboard.scss";
import { NavLink, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
// Modern icons
import {
  FiTrendingUp,
  FiBarChart,
  FiActivity,
  FiZap,
  FiTarget,
  FiCpu,
  FiDatabase,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiArrowRight,
} from "react-icons/fi";
import useTradeOption from "../tradeOption/tradeOption";
import useSymbolDetails from "#hooks/useSymbol";
import useDashboardBroker from "./useDashboardBroker";
import Storage from "#services/storage";

const Dashboard = () => {
  const navigate = useNavigate();

  const {
    currentTime,
    activeBrokerTab,
    dashboardData,
    isDashboardLoading,
    marketProgress,
    activeMarket,
    marketStatus,
    activeMarketTab,
    isLoading,
   /*  showNewsPopup, */
    selectedNews,
    mcxSymbols,
    isMcxLoading,
    mcxSymbolValue,

    handleRightMarketTab,
    /* openNewsPopup,
    closeNewsPopup, */

    setActiveBrokerTab,
    setActiveMarket,
    setActiveMarketTab,
    userDetail,
    activeSubscription,
    activeSubscriptionFeatures,
    loginTime,
  } = useDashboard();

  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const userName = Storage?.decryptData(localStorage.getItem("UserName"));

  // Safe subscription from activeSubscription state (null-safe)
  const sub =
    activeSubscription != null &&
    typeof activeSubscription === "object" &&
    !Array.isArray(activeSubscription)
      ? activeSubscription
      : null;
  const features =
    activeSubscriptionFeatures != null &&
    typeof activeSubscriptionFeatures === "object" &&
    !Array.isArray(activeSubscriptionFeatures)
      ? activeSubscriptionFeatures
      : null;

  const {
    brokerMasterList,
    isLoading: brokerLoading,
    customerBrokerList,
  } = useDashboardBroker();

  const { headerSymbol } = useTradeOption();
  const symbolValue = useSymbolDetails(headerSymbol);

  const handleVideoSelect = (video, index) => {
    setSelectedVideoIndex(index);
  };

  const getEmbedUrl = (videoLink) => {
    if (!videoLink) return "";

    if (videoLink.includes("/embed/")) {
      return videoLink;
    }

    let videoId = "";

    if (videoLink.includes("youtube.com/watch?v=")) {
      videoId = videoLink.split("v=")[1]?.split("&")[0];
    } else if (videoLink.includes("youtu.be/")) {
      videoId = videoLink.split("youtu.be/")[1]?.split("?")[0];
    } else if (videoLink.includes("youtube.com/embed/")) {
      videoId = videoLink.split("/embed/")[1]?.split("?")[0];
    }

    return videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      : videoLink;
  };

  return (
    <section className="content dashboard_page">
      <div className="dashboard-layout">
        <div className="left-sidebar">
          <div className="sidebar-content">
            <div className="welcome-card welcome-card-desktop-only">
              <div className="welcome-content">
                <div className="welcome-icon">
                  <span className="rotating-icon">👋</span>
                </div>
                <div className="welcome-text">
                  <h3>Welcome {userName}</h3>
                  <p>Ready to trade today?</p>
                </div>
              </div>
            </div>

            <div className="session-info-card-left">
              <div className="card-header">
                <h3>🌐 Session Info</h3>
                <p>Session Information & Details</p>
              </div>

              <div className="session-content">
                <div className="session-section">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">IP Address:</span>
                      <span className="info-value">
                        {localStorage.getItem("ipv4") || "49.43.0.14"}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Login Time:</span>
                      <span className="info-value">
                        {loginTime.format("HH:mm:ss")}
                        <span
                          className="live-indicator"
                          title="Actual login time"
                        >
                          ●
                        </span>
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Login Date:</span>
                      <span className="info-value">
                        {loginTime.format("DD MMM (ddd)")}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Browser:</span>
                      <span className="info-value">
                        {navigator.userAgent.includes("Chrome")
                          ? "Chrome"
                          : navigator.userAgent.includes("Firefox")
                            ? "Firefox"
                            : navigator.userAgent.includes("Safari")
                              ? "Safari"
                              : "Other"}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Current Time:</span>
                      <span className="info-value">
                        {currentTime.format("HH:mm:ss")} -{" "}
                        {currentTime.format("DD MMM (ddd)")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-actions-section">
              <div className="section-header">
                <h3>Quick Actions</h3>
                <p className="section-subtitle">
                  Access essential trading tools
                </p>
              </div>

              <div className="actions-grid">
                <NavLink to="/trade-option" className="action-card">
                  <div className="action-icon">
                    <FiBarChart />
                  </div>
                  <div className="action-content">
                    <h4>New Trade</h4>
                    <p>Place a new order</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink>

                {/* <NavLink to="/algo" className="action-card">
                  <div className="action-icon">
                    <FiCpu />
                  </div>
                  <div className="action-content">
                    <h4>Deploy Algo</h4>
                    <p>Activate strategy</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink> */}

                <NavLink to="/create-strategy" className="action-card">
                  <div className="action-icon">
                    <FiZap />
                  </div>
                  <div className="action-content">
                    <h4>Strategy Builder</h4>
                    <p>Build your own strategy</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink>

                {/* <NavLink to="/scalping" className="action-card">
                  <div className="action-icon">
                    <FiTarget />
                  </div>
                  <div className="action-content">
                    <h4>Scalping</h4>
                    <p>Quick profit strategies</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink> */}

                <NavLink to="/backtest" className="action-card">
                  <div className="action-icon">
                    <FiDatabase />
                  </div>
                  <div className="action-content">
                    <h4>Backtest</h4>
                    <p>Test strategy</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink>

                <NavLink to="/gainer-looser" className="action-card">
                  <div className="action-icon">
                    <FiTrendingUp />
                  </div>
                  <div className="action-content">
                    <h4>Market Scanner</h4>
                    <p>View top movers</p>
                  </div>
                  <div className="action-arrow">
                    <FiArrowRight />
                  </div>
                </NavLink>
              </div>
            </div>

            <div className="order-status-section">
              <div className="section-header">
                <h3>Order Status</h3>
                <p className="section-subtitle">Track your trading orders</p>
              </div>

              <div className="order-cards-grid">
                <NavLink to="/order/pending" className="order-card">
                  <div className="card-header">
                    <div className="card-icon pending">
                      <FiClock />
                    </div>
                    <div className="status-badge pending">Pending</div>
                  </div>
                  <div className="card-content">
                    <h4>Orders waiting for execution</h4>
                  </div>
                </NavLink>

                <NavLink to="/order/active" className="order-card">
                  <div className="card-header">
                    <div className="card-icon active">
                      <FiActivity />
                    </div>
                    <div className="status-badge active">Active</div>
                  </div>
                  <div className="card-content">
                    <h4>Currently executing trades</h4>
                  </div>
                </NavLink>

                <NavLink to="/order/rejected" className="order-card">
                  <div className="card-header">
                    <div className="card-icon rejected">
                      <FiXCircle />
                    </div>
                    <div className="status-badge rejected">Rejected</div>
                  </div>
                  <div className="card-content">
                    <h4>Failed order executions</h4>
                  </div>
                </NavLink>

                <NavLink to="/order/closed" className="order-card">
                  <div className="card-header">
                    <div className="card-icon closed">
                      <FiCheckCircle />
                    </div>
                    <div className="status-badge closed">Closed</div>
                  </div>
                  <div className="card-content">
                    <h4>Successfully completed trades</h4>
                  </div>
                </NavLink>
              </div>
            </div>

            <div className="connect-broker-section">
              <div className="section-header">
                <div className="header-content">
                  <div>
                    <h3>🔗 Connect Broker</h3>
                    <p className="section-subtitle">
                      Execute strategies with live trading
                    </p>
                  </div>
                </div>
              </div>

              <div className="btn-div-both">
                <div className="broker-tabs">
                  <button
                    className={`tab-btn ${
                      activeBrokerTab === "registered" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveBrokerTab("registered");
                    }}
                  >
                    <span className="tab-icon">🏦</span>
                    <span className="tab-text">
                      Registered ({brokerMasterList?.length || 0})
                    </span>
                  </button>
                  <button
                    className={`tab-btn ${
                      activeBrokerTab === "active" ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveBrokerTab("active");
                    }}
                  >
                    <span className="tab-icon">✅</span>
                    <span className="tab-text">
                      Active ({customerBrokerList?.length || 0})
                    </span>
                  </button>
                </div>
              </div>

              {activeBrokerTab === "registered" && (
                <div className="broker-grid-compact">
                  {brokerLoading ? (
                    Array.from({ length: 6 }, (_, index) => (
                      <div key={index} className="broker-item-compact">
                        <div className="broker-loading-shimmer"></div>
                        <span className="broker-name">Loading...</span>
                        <button className="setup-btn-compact" disabled>
                          Setup
                        </button>
                      </div>
                    ))
                  ) : brokerMasterList?.length > 0 ? (
                    brokerMasterList.map((broker, index) => (
                      <div
                        key={broker.brokerID}
                        className="broker-item-compact"
                      >
                        {broker.brokerName === "Demo" ? (
                          <div className="demo-broker-compact">Demo</div>
                        ) : broker.brokerName === "Choice Choice India" ? (
                          <div className="choice-broker-compact">Choice</div>
                        ) : (
                          <img
                            src={images[`broker/${broker.brokerName}.png`]}
                            alt={broker.brokerName}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "block";
                            }}
                          />
                        )}
                        <span className="broker-name">{broker.brokerName}</span>
                        <button
                          className="setup-btn-compact"
                          onClick={() =>
                            navigate(
                              `/setup/${Storage?.encryptFormatData(
                                broker.brokerID,
                              )}`,
                            )
                          }
                        >
                          Setup
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-brokers-message">
                      <p>No brokers available at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              {activeBrokerTab === "active" && (
                <div className="broker-grid-compact">
                  {brokerLoading ? (
                    Array.from({ length: 2 }, (_, index) => (
                      <div
                        key={index}
                        className="broker-item-compact active-broker"
                      >
                        <div className="broker-loading-shimmer"></div>
                        <span className="broker-name">Loading...</span>
                        <span className="status-connected-compact">
                          Loading...
                        </span>
                      </div>
                    ))
                  ) : customerBrokerList?.length > 0 ? (
                    customerBrokerList.map((broker, index) => (
                      <div
                        key={broker.brokerID}
                        className="broker-item-compact active-broker"
                      >
                        <img
                          src={images[`broker/${broker.brokerName}.png`]}
                          alt={broker.brokerName}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "block";
                          }}
                        />
                        <span className="broker-name">{broker.brokerName}</span>
                        <span className="status-connected-compact">
                          Connected
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="no-active-brokers-message">
                      <p>No active brokers. Setup a broker to start trading.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

         {/*    <div className="learning-center-section">
              <div className="section-header">
                <h3>🎓 Learning Center</h3>
                <button
                  className="learn-more-btn"
                  onClick={() => navigate("/learning-center")}
                >
                  LEARN MORE
                </button>
              </div>

              <div className="learning-content">
                <div className="main-video-player">
                  {dashboardData.videos.length > 0 ? (
                    <div className="video-container">
                      <div className="video-title">
                        <h4>
                          {dashboardData.videos[selectedVideoIndex]?.title ||
                            "Loading video..."}
                        </h4>
                      </div>

                      <div className="youtube-embed">
                        {dashboardData.videos[selectedVideoIndex]?.videoLink ? (
                          <iframe
                            src={getEmbedUrl(
                              dashboardData.videos[selectedVideoIndex]
                                .videoLink,
                            )}
                            title={
                              dashboardData.videos[selectedVideoIndex]?.title ||
                              "Video"
                            }
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="youtube-iframe"
                          />
                        ) : (
                          <div className="video-placeholder">
                            <div className="play-button">▶️</div>
                            <div className="video-text">
                              Video not available
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="video-actions">
                        <button className="watch-btn">
                          <span className="icon">📺</span>
                          <span>Watch on YouTube</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="video-container">
                      <div className="video-title">
                        <h4>Loading videos...</h4>
                      </div>
                      <div className="youtube-embed">
                        <div className="loading-placeholder">
                          <div className="loading-spinner">⏳</div>
                          <div>Loading video player...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="video-list-section">
                  <h5>All Videos</h5>

                  {isDashboardLoading ? (
                    <div className="loading-placeholder">Loading videos...</div>
                  ) : dashboardData.videos.length > 0 ? (
                    <div className="simple-video-list">
                      {dashboardData.videos.map((video, index) => (
                        <div
                          key={video.id || index}
                          className={`video-item ${
                            selectedVideoIndex === index ? "active" : ""
                          }`}
                          onClick={() => handleVideoSelect(video, index)}
                        >
                          <div className="video-number">{index + 1}</div>
                          <div className="video-details">
                            <h6 className="video-title-text">
                              {video.title || "Video Title"}
                            </h6>
                            <span className="video-brand">
                              {video.brand || "Angel"}
                            </span>
                          </div>
                          <div className="video-play">▶️</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-videos-placeholder">
                      No videos available
                    </div>
                  )}
                </div>
              </div>
            </div> */}

          {/*   <div className="news-section-full">
              <div className="section-header">
                <h3>📰 Latest Market News</h3>
                <button
                  className="view-all-btn"
                  onClick={() => navigate("/news")}
                >
                  VIEW ALL NEWS
                </button>
              </div>

              <div className="news-container">
                {isDashboardLoading ? (
                  <div className="news-loading">
                    <div className="loading-spinner">⏳</div>
                    <div>Loading latest news...</div>
                  </div>
                ) : dashboardData.news.length > 0 ? (
                  <div className="news-grid-full">
                    {dashboardData.news.map((news, index) => (
                      <div key={news.id || index} className="news-card-full">
                        <div className="news-card-header">
                          <div className="news-meta-top">
                            <span className="news-time">
                              {news.time ||
                                (news.created_at
                                  ? dayjs(news.created_at).format("M/D/YYYY")
                                  : "Just now")}
                            </span>
                          </div>
                        </div>

                        <div className="news-content-full">
                          <h4 className="news-headline-full">
                            {news.headline ||
                              news.heading ||
                              "News headline loading..."}
                          </h4>
                        </div>

                        <div className="news-card-footer">
                          <button
                            className="read-more-btn-full"
                            onClick={() => openNewsPopup(news)}
                          >
                            Read Full Article →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-news-placeholder">
                    <div className="no-news-icon">📰</div>
                    <div>No news available at the moment</div>
                  </div>
                )}
              </div>
            </div> */}

          {/*   {showNewsPopup && (
              <div className="news-popup-overlay" onClick={closeNewsPopup}>
                <div
                  className="news-popup"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="popup-header">
                    <h3>📰 News Details</h3>
                    <button className="close-btn" onClick={closeNewsPopup}>
                      ×
                    </button>
                  </div>
                  <div className="popup-content">
                    <div className="popup-news-image">
                      <div className="popup-news-icon">
                        {selectedNews?.type === "gold"
                          ? "💰"
                          : selectedNews?.type === "mrf"
                            ? "📊"
                            : "📈"}
                      </div>
                    </div>
                    <h4 className="popup-headline">{selectedNews?.headline}</h4>
                    <div className="popup-meta">
                      <span className="popup-source">
                        {selectedNews?.source}
                      </span>
                      <span className="popup-time">{selectedNews?.time}</span>
                    </div>
                    <div className="popup-description">
                      <p>
                        This is a detailed news article about the market
                        developments. Click the button below to read the full
                        article on the news website.
                      </p>
                    </div>
                    <div className="popup-actions">
                      <button
                        className="popup-read-more"
                        onClick={() => {
                          if (selectedNews?.id) {
                            navigate(`/news/article/${selectedNews.id}`);
                          } else if (selectedNews?.url) {
                            navigate(selectedNews.url);
                          } else {
                            navigate("/news");
                          }
                          closeNewsPopup();
                        }}
                      >
                        Read Full Article
                      </button>
                      <button
                        className="popup-share"
                        onClick={() => {
                          navigator.share &&
                            navigator.share({
                              title: selectedNews?.headline,
                              url: selectedNews?.url,
                            });
                        }}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )} */}
          </div>
        </div>

        <div className="right-sidebar">
          <div className="sidebar-content">
            {/* Welcome card - only on mobile, above NSE & BSE MCX */}
            <div className="welcome-card welcome-card-mobile-only">
              <div className="welcome-content">
                <div className="welcome-icon">
                  <span className="rotating-icon">👋</span>
                </div>
                <div className="welcome-text">
                  <h3>Welcome {userName}</h3>
                  <p>Ready to trade today?</p>
                </div>
              </div>
            </div>
            <div className="market-sections">
              <div className="market-tabs">
                <button
                  className={`tab-btn ${
                    activeMarketTab === "nse" ? "active" : ""
                  }`}
                  onClick={() => handleRightMarketTab("nse")}
                >
                  NSE & BSE
                </button>
                <button
                  className={`tab-btn ${
                    activeMarketTab === "mcx" ? "active" : ""
                  }`}
                  onClick={() => handleRightMarketTab("mcx")}
                >
                  MCX
                </button>
              </div>

              <div
                className={`market-indices ${
                  activeMarketTab === "nse" ? "active" : ""
                }`}
              >
                <div className="index-items">
                  {isLoading ? (
                    <div className="loading-indices">
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                    </div>
                  ) : (
                    headerSymbol?.slice(0, 4).map((value, key) => {
                      const sv = symbolValue[value?.identifier];
                      const svPercentage =
                        sv?.lastTradePrice && sv?.priceChange
                          ? (
                              (sv.priceChange / sv.lastTradePrice) *
                              100
                            ).toFixed(2)
                          : "0.00";

                      return (
                        <div
                          className={`index-item ${svPercentage >= 0 ? "index-positive" : "index-negative"}`}
                          key={key}
                        >
                          <div className="index-name">{value?.identifier}</div>
                          <div className="index-price">
                            {sv?.lastTradePrice
                              ? parseFloat(sv.lastTradePrice).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-change ${
                              sv?.priceChange >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {sv?.priceChange >= 0 ? "+" : ""}
                            {sv?.priceChange
                              ? parseFloat(sv.priceChange).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-percent ${
                              svPercentage >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {svPercentage >= 0 ? "+" : ""}
                            {svPercentage}%
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={`market-indices ${
                  activeMarketTab === "bse" ? "active" : ""
                }`}
              >
                <div className="index-items">
                  {isLoading ? (
                    <div className="loading-indices">
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                    </div>
                  ) : (
                    headerSymbol?.slice(4, 7).map((value, key) => {
                      const sv = symbolValue[value?.identifier];
                      const svPercentage =
                        sv?.lastTradePrice && sv?.priceChange
                          ? (
                              (sv.priceChange / sv.lastTradePrice) *
                              100
                            ).toFixed(2)
                          : "0.00";

                      return (
                        <div
                          className={`index-item ${svPercentage >= 0 ? "index-positive" : "index-negative"}`}
                          key={key}
                        >
                          <div className="index-name">{value?.identifier}</div>
                          <div className="index-price">
                            {sv?.lastTradePrice
                              ? parseFloat(sv.lastTradePrice).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-change ${
                              sv?.priceChange >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {sv?.priceChange >= 0 ? "+" : ""}
                            {sv?.priceChange
                              ? parseFloat(sv.priceChange).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-percent ${
                              svPercentage >= 0 ? "positive" : "negative"
                            }`}
                          >
                            {svPercentage >= 0 ? "+" : ""}
                            {svPercentage}%
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={`market-indices ${
                  activeMarketTab === "mcx" ? "active" : ""
                }`}
              >
                <div className="index-items">
                  {isMcxLoading ? (
                    <div className="loading-indices">
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                      <div className="loading-item">Loading...</div>
                    </div>
                  ) : (
                    mcxSymbols?.map((value, key) => {
                      // Use real-time data if available, otherwise use symbol data
                      const sv = mcxSymbolValue[value?.identifier] || value;
                      const svPercentage =
                        sv?.lastTradePrice && sv?.priceChange
                          ? (
                              (parseFloat(sv.priceChange) /
                                parseFloat(sv.lastTradePrice)) *
                              100
                            ).toFixed(2)
                          : "0.00";

                      return (
                        <div
                          className={`index-item ${svPercentage >= 0 ? "index-positive" : "index-negative"}`}
                          key={key}
                        >
                          <div className="index-name">{value?.identifier}</div>
                          <div className="index-price">
                            {sv?.lastTradePrice &&
                            parseFloat(sv.lastTradePrice) > 0
                              ? parseFloat(sv.lastTradePrice).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-change ${
                              sv?.priceChange && parseFloat(sv.priceChange) >= 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {sv?.priceChange && parseFloat(sv.priceChange) >= 0
                              ? "+"
                              : ""}
                            {sv?.priceChange && parseFloat(sv.priceChange) !== 0
                              ? parseFloat(sv.priceChange).toFixed(2)
                              : "0.00"}
                          </div>
                          <div
                            className={`index-percent ${
                              parseFloat(svPercentage) >= 0
                                ? "positive"
                                : "negative"
                            }`}
                          >
                            {parseFloat(svPercentage) >= 0 ? "+" : ""}
                            {parseFloat(svPercentage).toFixed(2)}%
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="modern-holiday-card">
              <div className="holiday-content">
                <h3>📊 Market Progress</h3>

                <div className="market-progress-section">
                  <div className="progress-header">
                    <span className="progress-value">
                      {marketProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${marketProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="market-tabs">
                  <button
                    className={`tab-btn ${
                      activeMarket === "fno" ? "active" : ""
                    }`}
                    onClick={() => setActiveMarket("fno")}
                  >
                    NSE & BSE
                  </button>
                  <button
                    className={`tab-btn ${
                      activeMarket === "mcx" ? "active" : ""
                    }`}
                    onClick={() => setActiveMarket("mcx")}
                  >
                    MCX
                  </button>
                </div>

                <div className="market-status">
                  <div
                    className={`status-badge ${marketStatus[activeMarket].status}`}
                  >
                    <span className="status-icon">
                      {marketStatus[activeMarket].status === "open"
                        ? "🟢"
                        : "🔴"}
                    </span>
                    <span className="status-text">
                      {activeMarket === "fno" ? "NSE & BSE" : "MCX"}
                      {marketStatus[activeMarket].status === "open"
                        ? " OPEN"
                        : " CLOSED"}
                    </span>
                  </div>
                  <div className="market-timing">
                    {activeMarket === "mcx" ? "09:00 - 23:30" : "09:15 - 15:30"}
                  </div>
                </div>
              </div>
            </div>

            {/* <div className="feature-status-card">
              <div className="card-header">
                <h3>🔓 Feature Status</h3>
                <p>
                  {sub?.planName ||
                  sub?.plan?.name ||
                  sub?.plan_name ||
                  sub?.currentPlan
                    ? `Your plan: ${sub?.planName || sub?.plan?.name || sub?.plan_name || sub?.currentPlan}`
                    : "Available features in your current package"}
                </p>
              </div>

              <div className="feature-content">
                <div className="feature-section">
                  <div className="section-title">
                    <span className="section-icon">📊</span>
                    <span>Charting & Analysis</span>
                  </div>
                  <div className="feature-grid">
                    <div
                      className={`feature-item ${
                        features?.liveCharts?.enabled === true
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <div className="feature-icon">
                        {features?.liveCharts?.enabled === true ? "✅" : "❌"}
                      </div>
                      <div className="feature-info">
                        <span className="feature-name">Live Charts</span>
                        <span className="feature-desc">
                          View live charts and analysis
                        </span>
                      </div>
                    </div>

                    <div
                      className={`feature-item ${
                        features?.stratergyViewPage === true
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <div className="feature-icon">
                        {features?.stratergyViewPage === true ? "✅" : "❌"}
                      </div>
                      <div className="feature-info">
                        <span className="feature-name">Strategy View</span>
                        <span className="feature-desc">
                          Demo screenshots and videos
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="feature-section">
                  <div className="section-title">
                    <span className="section-icon">⚡</span>
                    <span>Trading Features</span>
                  </div>
                  <div className="feature-grid">
                    <div
                      className={`feature-item ${
                        features?.apiAccess === true
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <div className="feature-icon">
                        {features?.apiAccess === true ? "✅" : "❌"}
                      </div>
                      <div className="feature-info">
                        <span className="feature-name">API Access</span>
                        <span className="feature-desc">
                          Build and run strategies
                        </span>
                      </div>
                    </div>

                    <div
                      className={`feature-item ${
                        features?.exitButton === true
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <div className="feature-icon">
                        {features?.exitButton === true ? "✅" : "❌"}
                      </div>
                      <div className="feature-info">
                        <span className="feature-name">Exit Button</span>
                        <span className="feature-desc">
                          Manually close trades
                        </span>
                      </div>
                    </div>

                    <div
                      className={`feature-item ${
                        features?.manualTradeButton === true
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      <div className="feature-icon">
                        {features?.manualTradeButton === true ? "✅" : "❌"}
                      </div>
                      <div className="feature-info">
                        <span className="feature-name">Manual Trade</span>
                        <span className="feature-desc">
                          Place manual orders
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="feature-section">
                  <div className="section-title">
                    <span className="section-icon">📈</span>
                    <span>Trading Limits</span>
                  </div>
                  <div className="feature-grid">
                    <div className="feature-item limit-info">
                      <div className="feature-icon">📊</div>
                      <div className="feature-info">
                        <span className="feature-name">Max Lots</span>
                        <span className="feature-desc">
                          Limited to{" "}
                          {sub?.maxLotSet ??
                            features?.maxLotSet ??
                            "N/A"}{" "}
                          lots in F&O
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="upgrade-section">
                  <div className="upgrade-content">
                    <span className="upgrade-icon">🚀</span>
                    <span className="upgrade-text">
                      To unlock all features, contact your profile manager and
                      upgrade your plan
                    </span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
