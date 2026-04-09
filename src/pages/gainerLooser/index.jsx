import { IconRegistry } from "#components";
import React from "react";
import useGainerLooser from "./gainerLooser";
import { images } from "#helpers";
import useSymbolDetails from "#hooks/useSymbol";
import "./gainerLooser.scss";
import { TableShimmer } from "#components";

const GainerLooser = () => {
  const { topGainer, topLosers, isLoading } = useGainerLooser();
  const gainerSymbolValue = useSymbolDetails(topGainer, "optionChain");
  const looserSymbolValue = useSymbolDetails(topLosers, "optionChain");

  return (
    <section className="content gainer_looser_page">
      <div className="gainer-looser-content-wrapper">
      <div className="card-box full-width">
        <div className="box-body tab_content">
          <div
            className="data-new-row"
            style={{ marginTop: "10px", marginBottom: "0" }}
          >
            <div className="col-data-50">
              <div className="box_section gainer_section">
                <div className="header_section">
                  <h4
                    className="box-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Top Gainers
                    <img
                      src={images["other/gain.png"]}
                      style={{
                        width: "20px",
                        height: "20px",
                        display: "inline-block",
                      }}
                      alt="gainer"
                    />
                  </h4>
                </div>
                <div className="table-responsive buy-sall-table">
                  <table
                    className="table table-hover mb-0"
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "4px solid #E1E7EF",
                    }}
                  >
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Symbol Name
                        </th>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Change(%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <TableShimmer row={4} column={4} />
                      ) : (
                        topGainer?.map((val, key) => {
                          const gv = gainerSymbolValue[val?.identifier];
                          return (
                            <tr
                              key={key}
                              style={{
                                backgroundColor: "var(--card_box_bg)",
                                borderBottom: "1px solid var(--header-border)",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <td
                                style={{
                                  backgroundColor: "#E8FAFD",
                                  color: "#28B4CA",
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {val?.identifier}
                              </td>
                              <td
                                className={
                                  gv?.priceChangePercentage >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                                style={{
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {gv?.priceChangePercentage >= 0 ? (
                                  <IconRegistry name="caret-up" size={20} />
                                ) : (
                                  <IconRegistry name="caret-down" size={20} />
                                )}{" "}
                                {gv?.lastTradePrice}
                              </td>
                              <td
                                className={
                                  gv?.priceChangePercentage >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                                style={{
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {gv?.priceChangePercentage != null
                                  ? (gv.priceChangePercentage >= 0 ? "+" : "")
                                  : ""}
                                {gv?.priceChangePercentage}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="col-data-50">
              <div className="box_section looser_section">
                <div className="header_section">
                  <h4
                    className="box-title"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Top Losers
                    <img
                      src={images["other/loser.png"]}
                      style={{
                        width: "20px",
                        height: "20px",
                        display: "inline-block",
                      }}
                      alt="loser"
                    />
                  </h4>
                </div>

                <div className="table-responsive buy-sall-table">
                  <table
                    className="table table-hover mb-0"
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "4px solid #E1E7EF",
                    }}
                  >
                    <thead
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Symbol Name
                        </th>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Price
                        </th>
                        <th
                          style={{
                            background: "#28B4CA",
                            color: "white",
                            border: "none",
                            padding: "1rem",
                            fontWeight: "500",
                            textAlign: "center",
                          }}
                        >
                          Change(%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <TableShimmer row={4} column={4} />
                      ) : (
                        topLosers?.map((val, key) => {
                          const lv = looserSymbolValue[val?.identifier];
                          return (
                            <tr
                              key={key}
                              style={{
                                backgroundColor: "var(--card_box_bg)",
                                borderBottom: "1px solid var(--header-border)",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <td
                                style={{
                                  backgroundColor: "#E8FAFD",
                                  color: "#28B4CA",
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {val?.identifier}
                              </td>
                              <td
                                className={
                                  lv?.priceChangePercentage >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                                style={{
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {lv?.priceChangePercentage >= 0 ? (
                                  <IconRegistry name="caret-up" size={20} />
                                ) : (
                                  <IconRegistry name="caret-down" size={20} />
                                )}{" "}
                                {lv?.lastTradePrice}
                              </td>
                              <td
                                className={
                                  lv?.priceChangePercentage >= 0
                                    ? "text-success"
                                    : "text-danger"
                                }
                                style={{
                                  fontWeight: "600",
                                  padding: "1rem",
                                  textAlign: "center",
                                  verticalAlign: "middle",
                                }}
                              >
                                {lv?.priceChangePercentage != null
                                  ? (lv.priceChangePercentage >= 0 ? "+" : "")
                                  : ""}
                                {lv?.priceChangePercentage}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default GainerLooser;
