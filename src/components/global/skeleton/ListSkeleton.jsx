import React from "react";
import "./skeleton.scss";

const ListSkeleton = ({ items = 5 }) => {
  return (
    <div className="skeleton-list">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="skeleton-list-item">
          <div className="skeleton-avatar" />
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;

