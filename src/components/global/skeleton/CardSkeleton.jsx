import React from "react";
import "./skeleton.scss";

const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="skeleton-cards">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-card-header">
            <div className="skeleton-line skeleton-title" />
          </div>
          <div className="skeleton-card-body">
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-short" />
            <div className="skeleton-line skeleton-medium" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;

