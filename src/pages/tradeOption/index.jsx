import React, { useContext } from "react";
import "./tradeOption.scss";
import { images } from "#helpers";
import { LineChart } from "@mui/x-charts/LineChart";
import useTradeOption from "./tradeOption";
import useSymbolDetails from "#hooks/useSymbol";
import { ThemeContext } from "../../context";

// Static chart data - moved outside component to prevent recreation on every render
const CHART_DATA = [
  { date: "Feb 24", price: 22500 },
  { date: "Feb 28", price: 20300 },
  { date: "Mar 5", price: 22600 },
  { date: "Mar 10", price: 19550 },
  { date: "Mar 13", price: 22700 },
  { date: "Mar 19", price: 23000 },
  { date: "Mar 24", price: 18000 },
  { date: "Mar 26", price: 23528.55 },
];

const TradeOption = () => {
  const { headerSymbol, symbolExpiryTime } = useTradeOption();
  const symbolValue = useSymbolDetails(headerSymbol);
  const { themeMode } = useContext(ThemeContext);

  return (
    <section className="trade_option_page">
      <div className="symbol_chart_price">
        {headerSymbol?.map((val, key) => {
          const expiryData = symbolExpiryTime[val?.name];
          return (
            <div className="card-box" key={key}>
              <div className="box-body">
                <h5>
                  Where do you think {val?.name} will go{" "}
                  {Number(expiryData?.remainingDay) >= 0 ? "in" : ""}
                  {Number(expiryData?.remainingDay) >= 0
                    ? ` ${expiryData?.remainingDay} days`
                    : expiryData?.remainingDay}{" "}
                  ?
                  <span
                    className={`badge_expire 
                    ${
                      val?.name == "NIFTY"
                        ? "bg-danger-light"
                        : val?.name == "BANKNIFTY"
                        ? "bg-purple-light"
                        : "bg-green-light"
                    }
                    `}
                  >
                    Expiring{" "}
                    {expiryData?.remainingDay > 4 ? " coming " : " this "}
                    {symbolExpiryTime[val?.name]?.dayName} at 3:30 PM
                  </span>
                </h5>
                <div className="chart_box">
                  <div className="chart_price">
                    <div
                      className={`box-body 
                      ${
                        val?.name == "NIFTY"
                          ? "bg-danger-light"
                          : val?.name == "BANKNIFTY"
                          ? "bg-purple-light"
                          : "bg-green-light"
                      }
                      `}
                    >
                      <div className="main-text">
                        <div className="text-center m-0">
                          <img
                            src={images[`symbols/${val?.name}.png`]}
                            alt="nifty"
                          />
                        </div>
                        <div className="symbol-text">
                          <h3>{val?.name}</h3>
                          <span
                            className={
                              symbolValue[val?.identifier]
                                ?.priceChangePercentage < 0
                                ? "text-danger"
                                : symbolValue[val?.identifier]
                                    ?.priceChangePercentage > 0
                                ? "text-success"
                                : ""
                            }
                          >
                            {symbolValue[val?.identifier]?.lastTradePrice}
                          </span>
                        </div>
                      </div>
                      <p className="charte_price_desc">
                        {val?.name == "NIFTY" &&
                          "NIFTY shows the average price of 50 top Indian companies. When people say the market is up or down, they mean NIFTY is up or down.It is similar to SENSEX."}

                        {val?.name == "BANKNIFTY" &&
                          "BANKNIFTY represents the performance of the banking sector in India. It shows the average price of the most liquid large-cap banking stocks listed on NSE."}

                        {val?.name == "FINNIFTY" &&
                          "FINNIFTY tracks the performance of financial sector companies listed on NSE. FINNIFTY is very closely correlated with BANKNIFTY."}
                      </p>
                    </div>
                  </div>
                  <div className="area_chart">
                    <LineChart
                      dataset={CHART_DATA}
                      xAxis={[{ scaleType: "point", dataKey: "date" }]}
                      series={[
                        {
                          dataKey: "price",
                          color: themeMode === "dark" ? "#4a7cff" : "#3182CE",
                          area: true,
                          showMark: false,
                        },
                      ]}
                      height={
                        window.innerWidth <= 768
                          ? 200
                          : window.innerWidth <= 480
                          ? 180
                          : 270
                      }
                      sx={{
                        ".MuiLineElement-root": {
                          stroke: themeMode === "dark" ? "#4a7cff" : "#3182CE",
                          strokeWidth: window.innerWidth <= 480 ? 1.5 : 2,
                        },
                        ".MuiAreaElement-root": {
                          fill: "url(#colorGradient)",
                        },
                        // Dark mode chart styling
                        ...(themeMode === "dark" && {
                          backgroundColor: "var(--card_box_bg)",
                          color: "var(--text-color-primary)",
                          ".MuiChartsAxis-root": {
                            stroke: "var(--border-color-dark)",
                          },
                          ".MuiChartsAxisLabel-root": {
                            fill: "var(--text-color-primary)",
                            fontSize:
                              window.innerWidth <= 480 ? "10px" : "12px",
                          },
                          ".MuiChartsAxisTick-root": {
                            stroke: "var(--border-color-dark)",
                          },
                        }),
                        // Mobile responsive styling
                        ...(window.innerWidth <= 768 && {
                          ".MuiChartsAxisLabel-root": {
                            fontSize: "11px",
                          },
                        }),
                        ...(window.innerWidth <= 480 && {
                          ".MuiChartsAxisLabel-root": {
                            fontSize: "10px",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TradeOption;
