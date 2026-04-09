import React from 'react';
import './StrategyTransitionLoader.scss';

const StrategyTransitionLoader = ({ isVisible, message = "Loading strategy..." }) => {
  if (!isVisible) return null;

  return (
    <div className="strategy-transition-loader">
      <div className="loader-overlay">
        <div className="loader-content">
          <div className="loader-spinner">
            <div className="spinner"></div>
          </div>
          <div className="loader-message">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default StrategyTransitionLoader;
