import React from "react";
import TableSkeleton from "./TableSkeleton";
import "./skeleton.scss";

const PageSkeleton = ({ type = "default" }) => {
  if (type === "table") {
    return (
      <div className="skeleton-page">
        <div className="skeleton-page-header">
          <div className="skeleton-line skeleton-title" style={{ width: "200px" }} />
          <div className="skeleton-dropdown" style={{ width: "150px" }} />
        </div>
        <TableSkeleton rows={8} columns={6} />
      </div>
    );
  }

  if (type === "dashboard") {
    return (
      <div className="skeleton-page">
        <div className="skeleton-cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-large" />
            </div>
          ))}
        </div>
        <div className="skeleton-list" style={{ marginTop: "20px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-list-item">
              <div className="skeleton-line" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="skeleton-page">
      <div className="skeleton-page-header">
        <div className="skeleton-line skeleton-title" />
      </div>
      <div className="skeleton-content-area">
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-medium" />
        <div className="skeleton-line skeleton-short" />
      </div>
    </div>
  );
};

export default PageSkeleton;

