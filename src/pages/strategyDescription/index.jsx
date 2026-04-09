import { IconRegistry } from "#components";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { asyncGetStrategyDescription } from "#redux/strategy/action";
import { useGlobalServices } from "#services/global";
import "./strategyDescription.scss";

const StrategyDescription = () => {
  const { strategy_id } = useParams();
  const navigate = useNavigate();
  const { strategyList } = useGlobalServices();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    fetchStrategyDescription();
  }, [strategy_id]);

  const fetchStrategyDescription = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await asyncGetStrategyDescription(strategy_id);

      if (response.data.status) {
        setStrategy(response.data.data);
      } else {
        setError("Failed to fetch strategy description");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch strategy description"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleStrategyChange = (newStrategyId) => {
    if (newStrategyId && newStrategyId !== strategy_id) {
      navigate(`/strategy/${newStrategyId}`);
    }
  };

  if (loading) {
    return (
      <section className="content strategy_page">
        <div className="card-box card-height">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading strategy description...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="content strategy_page">
        <div className="card-box card-height">
          <div className="error-state">
            <div className="error-icon">
              <IconRegistry name="alert-circle" className="icon" />
            </div>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={handleBackClick} className="btn btn-primary">
              <IconRegistry name="arrow-left" /> Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!strategy) {
    return (
      <section className="content strategy_page">
        <div className="card-box card-height">
          <div className="error-state">
            <div className="error-icon">
              <IconRegistry name="alert-circle" className="icon" />
            </div>
            <h3>Strategy Not Found</h3>
            <p>The requested strategy could not be found.</p>
            <button onClick={handleBackClick} className="btn btn-primary">
              <IconRegistry name="arrow-left" /> Go Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="content strategy_page">
      {/* Page Header */}
      <div className="page-header-section">
        <div className="header-container">
          <div className="header-left">
            <div className="header-icon">
              <IconRegistry name="book" className="icon" />
            </div>
            <div className="header-text">
              <h1 className="page-title">Strategy Guide</h1>
              <p className="page-subtitle">
                Comprehensive strategy descriptions and tutorials
              </p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <IconRegistry name="target" />
              </div>
              <div className="stat-content">
                <span className="stat-label">Current Strategy</span>
                <span className="stat-value">#{strategy_id}</span>
              </div>
            </div>
            {strategyList && (
              <div className="stat-card">
                <div className="stat-icon">
                  <IconRegistry name="file-text" />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Strategies</span>
                  <span className="stat-value">{strategyList.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="strategy-main-content">
        <div className="content-container">
          {/* Content Grid */}
          <div className="content-grid">
            {/* Main Description */}
            <div className="description-section">
              <div className="section-header">
                <div className="section-title">
                  <IconRegistry name="file-text" className="title-icon" />
                  <h3>Strategy Description</h3>
                </div>
              </div>
              <div className="section-content">
                <div className="description-content">
                  <div
                    className="strategy-description-text"
                    dangerouslySetInnerHTML={{
                      __html:
                        strategy?.description ||
                        "<p>No description available for this strategy.</p>",
                    }}
                  />

                  {strategy?.video_link && (
                    <div className="video-tutorial">
                      <div className="video-header">
                        <IconRegistry name="play" className="video-icon" />
                        <h4>Video Tutorial</h4>
                      </div>
                      <a
                        href={strategy.video_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="video-button"
                      >
                        <IconRegistry name="play" className="btn-icon" />
                        <span>Watch Tutorial</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Strategy Selector Sidebar */}
            <div className="strategy-selector-sidebar">
              {/* Strategy Selector */}
              {strategyList && strategyList.length > 0 && (
                <div className="sidebar-section">
                  <div className="section-header">
                    <h4>Choose Strategy</h4>
                  </div>
                  <div className="selector-body">
                    <select
                      id="strategy-select"
                      value={strategy_id}
                      onChange={(e) => handleStrategyChange(e.target.value)}
                      className="strategy-dropdown"
                    >
                      <option value="">-- Select --</option>
                      {strategyList.map((strat) => (
                        <option
                          key={strat.stratergyID}
                          value={strat.stratergyID}
                        >
                          Strategy {strat.stratergyID} -{" "}
                          {strat.stratergyName || `Unnamed Strategy`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Strategy Details */}

              {/* Quick Actions */}
              <div className="sidebar-section">
                <div className="section-header">
                  <h4>Quick Actions</h4>
                </div>
                <div className="action-buttons">
                  <button
                    className="action-btn primary"
                    onClick={() => navigate("/algo")}
                  >
                    <IconRegistry name="target" className="btn-icon" />
                    <span>Use in Algo</span>
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={handleBackClick}
                  >
                    <IconRegistry name="arrow-left" className="btn-icon" />
                    <span>Go Back</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StrategyDescription;
