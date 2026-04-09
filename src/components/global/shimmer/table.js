import { defaultRow } from "#constant/index";
import React from "react";


const TableShimmer = (props) => {
  const { row, column } = props;
  return (
    <tr>
      <td colSpan={column}>
        <div className="table-shimmer">
          <div className="shimmer-content">
            {Array.from({ length: row ? row : defaultRow }, (_, rowIndex) => (
              <div key={rowIndex} className="shimmer-row">
                {Array.from({ length: column }, (_, colIndex) => (
                  <div key={colIndex} className="shimmer-cell">
                    <div className="shimmer-placeholder"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          .table-shimmer {
            padding: 10px;
          }
          .shimmer-content {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .shimmer-row {
            display: flex;
            gap: 8px;
          }
          .shimmer-cell {
            flex: 1;
            height: 20px;
          }
          .shimmer-placeholder {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </td>
    </tr>
  );
};

export default TableShimmer;
