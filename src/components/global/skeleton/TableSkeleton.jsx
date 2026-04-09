import React from "react";
import "./skeleton.scss";

const TableSkeleton = ({ rows = 5, columns = 4, showHeader = true }) => {
  return (
    <div className="skeleton-table">
      {showHeader && (
        <div className="skeleton-table-header">
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="skeleton-cell skeleton-header-cell" />
          ))}
        </div>
      )}
      <div className="skeleton-table-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="skeleton-cell" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;

