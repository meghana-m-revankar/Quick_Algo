import React, { useRef, useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";
import { Line } from "react-chartjs-2";
import "./ChartJSPayoffChart.scss";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const ChartJSPayoffChart = ({
  legs = [],
  spotPrice = 0,
  volatility = 0.2,
  timeToExpiry = 30,
  riskFreeRate = 0.05,
}) => {
  const chartRef = useRef();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Ensure spotPrice is always a number
  const safeSpotPrice = Number(spotPrice) || 0;

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate payoff data
  useEffect(() => {
    if (!legs || legs.length === 0 || safeSpotPrice <= 0) {
      setAnalysis(null);
      return;
    }

    setIsLoading(true);

    try {
      // Real payoff calculation using actual legs data
      const calculatePayoff = (price) => {
        let totalPayoff = 0;
        legs.forEach((leg) => {
          const strike = parseFloat(leg.strikePrice) || 0;
          const quantity = parseFloat(leg.quantity) || 0;
          const premium = parseFloat(leg.premium) || 0;
          const isCall = leg.instrument === "CE";

          if (isCall) {
            if (leg.action === "BUY") {
              totalPayoff += (Math.max(0, price - strike) - premium) * quantity;
            } else {
              totalPayoff += (premium - Math.max(0, price - strike)) * quantity;
            }
          } else {
            if (leg.action === "BUY") {
              totalPayoff += (Math.max(0, strike - price) - premium) * quantity;
            } else {
              totalPayoff += (premium - Math.max(0, strike - price)) * quantity;
            }
          }
        });
        return totalPayoff;
      };

      // Generate data points for the chart
      const minPrice = Math.max(0, safeSpotPrice * 0.8);
      const maxPrice = safeSpotPrice * 1.2;
      const priceStep = Math.max(0.1, (maxPrice - minPrice) / 100);

      const dataPoints = [];
      for (let i = 0; i <= 100; i++) {
        const price = minPrice + i * priceStep;
        const payoff = calculatePayoff(price);
        dataPoints.push({
          price: price,
          payoff: payoff,
        });
      }

      // Store priceStep for later use
      const chartPriceStep = priceStep;

      const maxProfit = Math.max(...dataPoints.map((p) => p.payoff));
      const maxLoss = Math.min(...dataPoints.map((p) => p.payoff));
      const breakevenPoints = dataPoints
        .filter((p, i) => i > 0 && dataPoints[i - 1].payoff * p.payoff <= 0)
        .map((p) => p.price);

      setAnalysis({
        dataPoints,
        maxProfit,
        maxLoss,
        breakevenPoints,
        priceStep: chartPriceStep,
      });
    } catch (error) {
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [legs, safeSpotPrice, volatility, timeToExpiry]);

  if (isLoading) {
    return (
      <div className="chart-loading">
        <div className="loading-spinner"></div>
        <p>Calculating strategy analysis...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="no-data-message">
        <h3>No Strategy Data</h3>
        <p>Add legs and select a symbol to see payoff analysis</p>
      </div>
    );
  }

  const { dataPoints, breakevenPoints, priceStep } = analysis;

  // Prepare data for Chart.js
  const labels = dataPoints.map((point) => `₹${point.price.toFixed(0)}`);
  const expiryData = dataPoints.map((point) => point.payoff);
  const currentData = dataPoints.map((point) => point.payoff + 1000); // Slightly offset for current curve

  // Find current spot price index
  const spotIndex = dataPoints.findIndex(
    (p) =>
      Math.abs(p.price - safeSpotPrice) <
      (dataPoints[1].price - dataPoints[0].price) / 2
  );
  const spotPayoff = spotIndex >= 0 ? dataPoints[spotIndex].payoff : 0;

  // Add strike price lines
  const strikeLines = legs
    .map((leg, index) => {
      const strike = parseFloat(leg.strikePrice) || 0;
      const strikeIndex = dataPoints.findIndex(
        (p) => Math.abs(p.price - strike) < priceStep / 2
      );
      return {
        x: strikeIndex,
        strike: strike,
        type: leg.instrument,
        action: leg.action,
      };
    })
    .filter((line) => line.x >= 0);

  // Calculate profit/loss areas for different colors
  const profitAreaData = expiryData.map((value, index) => {
    const currentValue = currentData[index];
    return Math.max(0, Math.max(value, currentValue)); // Only positive values
  });

  const lossAreaData = expiryData.map((value, index) => {
    const currentValue = currentData[index];
    return Math.min(0, Math.min(value, currentValue)); // Only negative values
  });

  const chartData = {
    labels,
    datasets: [
      // Profit area (green background)
      {
        label: "Profit Area",
        data: profitAreaData,
        borderColor: "transparent",
        backgroundColor: "rgba(16, 185, 129, 0.15)",
        borderWidth: 0,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 1,
      },
      // Loss area (red background)
      {
        label: "Loss Area",
        data: lossAreaData,
        borderColor: "transparent",
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderWidth: 0,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
        order: 1,
      },
      // Expiry line (green)
      {
        label: "Expiry",
        data: expiryData,
        borderColor: "#10b981",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#10b981",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
        order: 2,
      },
      // Today's line (blue)
      {
        label: "Today's",
        data: currentData,
        borderColor: "#3b82f6",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        borderDash: [0, 0],
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#3b82f6",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
        opacity: 1,
        order: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: isMobile ? 0.8 : 1,
    interaction: {
      intersect: false,
      mode: "index",
    },
    elements: {
      point: {
        hoverRadius: 4, // Smaller hover radius for faster rendering
      },
    },
    plugins: {
      legend: {
        display: false, // Hide legend for better performance
      },
      // Add zero line plugin
      beforeDraw: function (chart) {
        const ctx = chart.ctx;
        const yAxis = chart.scales.y;
        const zeroLineY = yAxis.getPixelForValue(0);

        ctx.save();
        // Zero line with distinct color
        ctx.strokeStyle = "#6b7280";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(yAxis.left, zeroLineY);
        ctx.lineTo(yAxis.right, zeroLineY);
        ctx.stroke();

        // Add zero line label
        ctx.fillStyle = "#6b7280";
        ctx.font = "12px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("₹0", yAxis.right - 30, zeroLineY - 5);

        ctx.restore();
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#374151",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false, // Disable colors for faster rendering
        padding: 8, // Reduce padding
        animation: false, // Completely disable animation
        intersect: false,
        mode: "index",
        titleFont: {
          size: 13, // Smaller font
          weight: "bold",
        },
        bodyFont: {
          size: 12, // Smaller font
        },
        callbacks: {
          title: function (context) {
            const price = parseFloat(context[0].label.replace("₹", ""));
            return `₹${price.toFixed(0)}`;
          },
          label: function (context) {
            const value = context.parsed.y;
            return `${context.dataset.label}: ₹${value.toFixed(0)}`;
          },
        },
        // Add performance optimizations
        filter: function (tooltipItem) {
          return tooltipItem.datasetIndex < 3; // Only show first 3 datasets
        },
        position: "nearest",
        caretSize: 5,
        caretPadding: 5,
      },
      annotation: {
        annotations: {
          // Spot price line
          spotLine: {
            type: "line",
            xMin: spotIndex,
            xMax: spotIndex,
            borderColor: "#f97316",
            borderWidth: 2,
            borderDash: [0, 0],
            label: {
              content: `MTM: ${spotPayoff.toFixed(
                2
              )} Spot: ${safeSpotPrice.toFixed(0)}`,
              enabled: true,
              position: "start",
              backgroundColor: "rgba(249, 115, 22, 0.9)",
              color: "#ffffff",
              font: {
                size: 12,
                weight: "bold",
              },
              padding: 8,
              cornerRadius: 4,
            },
          },
          // Strike price lines with different colors for buy/sell
          ...strikeLines.reduce((acc, line, index) => {
            const isBuy = line.action === "BUY" || line.action === "buy";
            acc[`strikeLine${index}`] = {
              type: "line",
              xMin: line.x,
              xMax: line.x,
              borderColor: isBuy ? "#10b981" : "#ef4444", // Green for buy, red for sell
              borderWidth: 2,
              borderDash: isBuy ? [0, 0] : [4, 4], // Solid for buy, dashed for sell
              label: {
                content: `${line.type} ${line.strike} (${
                  isBuy ? "BUY" : "SELL"
                })`,
                enabled: true,
                position: "start",
                backgroundColor: isBuy
                  ? "rgba(16, 185, 129, 0.9)"
                  : "rgba(239, 68, 68, 0.9)",
                color: "#ffffff",
                font: {
                  size: 11,
                  weight: "bold",
                },
                padding: 6,
                cornerRadius: 4,
              },
            };
            return acc;
          }, {}),
          // Breakeven lines
          ...breakevenPoints.reduce((acc, bep, index) => {
            const bepIndex = dataPoints.findIndex(
              (p) => Math.abs(p.price - bep) < priceStep / 2
            );
            if (bepIndex >= 0) {
              acc[`breakevenLine${index}`] = {
                type: "line",
                xMin: bepIndex,
                xMax: bepIndex,
                borderColor: "#f59e0b", // Amber color for breakeven
                borderWidth: 2,
                borderDash: [8, 4],
                label: {
                  content: `BE: ₹${bep.toFixed(0)}`,
                  enabled: true,
                  position: "start",
                  backgroundColor: "rgba(245, 158, 11, 0.9)",
                  color: "#ffffff",
                  font: {
                    size: 11,
                    weight: "bold",
                  },
                  padding: 6,
                  cornerRadius: 4,
                },
              };
            }
            return acc;
          }, {}),
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: false,
        },
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
            family: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            weight: "500",
          },
          maxTicksLimit: 10,
          padding: 8,
          callback: function (value, index, values) {
            const price = dataPoints[index]?.price;
            return price ? `₹${price.toFixed(0)}` : "";
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        display: true,
        title: {
          display: false,
        },
        grid: {
          color: "rgba(107, 114, 128, 0.1)",
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 12,
            family: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            weight: "500",
          },
          padding: 8,
          callback: function (value) {
            return `₹${value.toFixed(0)}`;
          },
        },
        border: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        hoverBackgroundColor: "#dc2626",
        hoverBorderColor: "#fff",
        hoverBorderWidth: 2,
      },
    },
  };

  return (
    <div className="chartjs-payoff-chart">
      {/* Chart Container */}
      <div
        className="chart-container"
        style={{
          height: isMobile ? "100%" : "500px",
          minHeight: isMobile ? "300px" : "500px",
        }}
      >
        <div className="chart-wrapper">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default ChartJSPayoffChart;
