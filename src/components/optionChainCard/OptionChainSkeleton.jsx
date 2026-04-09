import React, { memo } from "react";
import { ShimmerTable } from "react-shimmer-effects";

const OptionChainSkeleton = memo(({ rows = 20, showHeader = true }) => {
  return (
    <div className="option-chain-skeleton">
      {showHeader && (
        <div className="skeleton-header">
          <div className="skeleton-symbol-selector">
            <div className="skeleton-search-icon"></div>
            <div className="skeleton-select"></div>
            <div className="skeleton-price"></div>
            <div className="skeleton-chart-icon"></div>
          </div>
          <div className="skeleton-expiry-selector">
            <div className="skeleton-label"></div>
            <div className="skeleton-select"></div>
          </div>
        </div>
      )}
      
      <div className="skeleton-options-header">
        <div className="skeleton-calls-label"></div>
        <div className="skeleton-strike-label"></div>
        <div className="skeleton-puts-label"></div>
      </div>
      
      <div className="skeleton-options-grid">
        <div className="skeleton-product"></div>
        <div className="skeleton-ltp-change"></div>
        <div className="skeleton-ltp"></div>
        <div className="skeleton-strike"></div>
        <div className="skeleton-ltp"></div>
        <div className="skeleton-ltp-change"></div>
        <div className="skeleton-product"></div>
      </div>
      
      <div className="skeleton-options-content">
        <ShimmerTable
          row={rows}
          col={7}
          border={0}
          borderColor={"#e2e8f0"}
          rounded={0.25}
          rowGap={1}
          colPadding={[8, 8, 8, 8]}
        />
      </div>
    </div>
  );
});

OptionChainSkeleton.displayName = 'OptionChainSkeleton';

export default OptionChainSkeleton;
