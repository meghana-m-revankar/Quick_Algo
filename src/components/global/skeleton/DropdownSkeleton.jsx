import React from "react";
import "./skeleton.scss";

const DropdownSkeleton = ({ width = "200px" }) => {
  return (
    <div className="skeleton-dropdown" style={{ width }}>
      <div className="skeleton-line skeleton-dropdown-line" />
    </div>
  );
};

export default DropdownSkeleton;

