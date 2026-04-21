import { IconRegistry } from "#components";
import React, { useEffect, useState, useMemo, useRef } from "react";
import "./algo.scss";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import useAlgo from "./algo";
import { FiEdit } from "react-icons/fi";
import useSymbolDetails from "#hooks/useSymbol";
import { images } from "#helpers";
import { TiStarOutline } from "react-icons/ti";

import { ShimmerPostDetails, ShimmerTable } from "react-shimmer-effects";
import { ButtonLoader, SubscriptionDialog } from "#components";
import Tooltip from "@mui/material/Tooltip";
import { toolTipData, tooltipDesign } from "#constant/index";
import { NavLink } from "react-router-dom";
import { RiSearch2Line } from "react-icons/ri";
import { FaChartArea } from "react-icons/fa6";
import { FaChessKnight } from "react-icons/fa";

import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";

const Algo = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const sidebarRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const toggleDrawer = () => {
    setIsOpen((prevState) => !prevState);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        toggleSidebar(); // Close sidebar
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen, toggleSidebar]);

  const {
    symbolCategoryList,
    editAlgo,
    algoOptionData,
    symbolData,
    enableAlgo,
    changeAlgoState,
    handleOptionChange,
    expiryList,
    strategyList,
    brokerList,
    optionTypeList,
    lotSize,
    maxLossToggle,
    maxProfitToggle,
    traillingSLToggle,
    traillingProfitToggle,
    setTraillingSLToggle,
    setMaxLossToggle,
    setMaxProfitToggle,
    setTraillingProfitToggle,
    bsOption,
    algoType,
    handleOptionSubmit,
    setAlgoType,
    formErrors,
    algoNFData,
    handleNFChange,
    handleNFSubmit,
    categoryLoading,
    dataLoading,
    addToWatch,
    isLoading,
    watchLoading,
    listButtonLoading,
    setSymbolCategoryList,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    subscriptionDialogMessage,
    activeSubscriptionFeatures,
    navigate,
  } = useAlgo();

  const symbolValue = useSymbolDetails(symbolData, "optionChain", 0, 0);

  const handleSearch = (e, key) => {
    const { value } = e.target;
    const searchValue = value.toLowerCase();

    const updatedList = symbolCategoryList.map((category, k) => {
      if (k === key) {
        const updatedSymbols = category.symbol.map((item) => {
          const identifier = item.identifier?.toLowerCase() || "";
          const isMatch = identifier.includes(searchValue);
          return { ...item, isVisible: isMatch ? 1 : 0 };
        });
        return { ...category, symbol: updatedSymbols };
      }
      return category;
    });

    setSymbolCategoryList(updatedList);
  };

  return (
    <section className="content_vs_new algo_page">
      <div className="bar-button-mb">
        <div className="mobile_drawer">
          <button className="Btn_show_drawer" onClick={toggleDrawer}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 30 30"
              width="30px"
              height="30px"
            >
              <path d="M 3 7 A 1.0001 1.0001 0 1 0 3 9 L 27 9 A 1.0001 1.0001 0 1 0 27 7 L 3 7 z M 3 14 A 1.0001 1.0001 0 1 0 3 16 L 27 16 A 1.0001 1.0001 0 1 0 27 14 L 3 14 z M 3 21 A 1.0001 1.0001 0 1 0 3 23 L 27 23 A 1.0001 1.0001 0 1 0 27 21 L 3 21 z" />
            </svg>
          </button>
          <Drawer
            open={isOpen}
            onClose={toggleDrawer}
            direction="left"
            className="mobile_nav_menu"
            enableOverlay={true}
          >
            <div className="drawer_nav_mobile">
              <div
                className={`card-box card-height card-box-left-list sidebar ${
                  isSidebarOpen ? "open" : ""
                }`}
              >
                <div className="tab_content">
                  {categoryLoading ? (
                    <ShimmerTable
                      row={10}
                      col={1}
                      border={0}
                      rounded={0.25}
                      colPadding={[5, 5, 5, 5]}
                    />
                  ) : symbolCategoryList?.length > 0 ? (
                    <Tabs
                      defaultActiveKey={symbolCategoryList[0]?.symbolCategoryName.toLowerCase()}
                      id="uncontrolled-tab-example"
                      className="mb-3 vs-nav-ul"
                    >
                      {symbolCategoryList?.map((val, key) => {
                        const categoryName =
                          val?.symbolCategoryName.toLowerCase();
                        return (
                          <Tab
                            eventKey={val?.symbolCategoryName.toLowerCase()}
                            title={val?.symbolCategoryName}
                          >
                            {val?.symbol?.length > 0 ? (
                              <>
                                <div className="position-relative mb-1">
                                  <input
                                    type="text"
                                    placeholder={`SEARCH ${val?.symbolCategoryName} STOCKS`}
                                    className="form-control ps-5 text-input"
                                    onKeyUp={(e) => handleSearch(e, key)}
                                  />
                                  <RiSearch2Line
                                    size={20}
                                    className="algo_search_icon"
                                  />
                                </div>
                                <div className="sidebar-container">
                                  <ul>
                                    {val?.symbol?.map((s, k) => {
                                      return (
                                        (s?.isVisible == undefined ||
                                          s?.isVisible == 1) && (
                                          <li>
                                            <p>{s?.identifier}</p>{" "}
                                            <div className="list-icon-flex">
                                              {s?.watchListID > 0 ||
                                              categoryName == "options" ? (
                                                <React.Fragment>
                                                  {listButtonLoading ? (
                                                    <ButtonLoader
                                                      isloading={true}
                                                    />
                                                  ) : (
                                                    <>
                                                      <button
                                                        type="button"
                                                        className={`list-btn btn btn-${
                                                          s?.addedinAlgoTrade
                                                            ? "danger"
                                                            : changeAlgoState ==
                                                                s?.symbolIdentifierId
                                                              ? "danger"
                                                              : "success"
                                                        }`}
                                                        onClick={(e) => {
                                                          enableAlgo(
                                                            e,
                                                            s,
                                                            val?.symbolCategoryName.toLowerCase(),
                                                            s?.addedinAlgoTrade
                                                              ? false
                                                              : changeAlgoState ==
                                                                  s?.symbolIdentifierId
                                                                ? true
                                                                : false,
                                                          );
                                                          toggleDrawer();
                                                        }}
                                                      >
                                                        {s?.addedinAlgoTrade
                                                          ? "D"
                                                          : changeAlgoState ==
                                                              s?.symbolIdentifierId
                                                            ? "D"
                                                            : "E"}
                                                      </button>{" "}
                                                      {s?.addedinAlgoTrade && (
                                                        <FiEdit
                                                          size={20}
                                                          onClick={() => {
                                                            editAlgo(
                                                              s?.customerAlgoTradeID,
                                                              s,
                                                              val?.symbolCategoryName.toLowerCase(),
                                                            );
                                                            toggleDrawer();
                                                          }}
                                                        />
                                                      )}
                                                    </>
                                                  )}
                                                </React.Fragment>
                                              ) : (
                                                <button
                                                  className="btn fav_btn"
                                                  onClick={() =>
                                                    addToWatch(
                                                      s?.symbolIdentifierId,
                                                    )
                                                  }
                                                  type="button"
                                                  disabled={watchLoading}
                                                >
                                                  <TiStarOutline
                                                    size={22}
                                                    className="fav_icon"
                                                  />
                                                </button>
                                              )}

                                              <FaChartArea
                                                onClick={() =>
                                                  navigate(`/chart`, {
                                                    state: {
                                                      symbol: s?.identifier,
                                                    },
                                                  })
                                                }
                                                style={{ cursor: "pointer" }}
                                              />
                                            </div>
                                          </li>
                                        )
                                      );
                                    })}
                                  </ul>
                                </div>
                              </>
                            ) : (
                              <div className="text-center">
                                <p>No stocks found</p>
                              </div>
                            )}
                          </Tab>
                        );
                      })}
                    </Tabs>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>
          </Drawer>
        </div>
      </div>

      <div className="content-flex">
        <div
          className={`card-box card-height card-box-left-list sidebar vs_desktop_side_bar ${
            isSidebarOpen ? "open" : ""
          }`}
        >
          <div className="tab_content">
            {categoryLoading ? (
              <ShimmerTable
                row={10}
                col={1}
                border={0}
                rounded={0.25}
                colPadding={[5, 5, 5, 5]}
              />
            ) : symbolCategoryList?.length > 0 ? (
              <Tabs
                defaultActiveKey={symbolCategoryList[0]?.symbolCategoryName.toLowerCase()}
                id="uncontrolled-tab-example"
                className="mb-3 vs-nav-ul"
              >
                {symbolCategoryList?.map((val, key) => {
                  const categoryName = val?.symbolCategoryName.toLowerCase();
                  return (
                    <Tab
                      eventKey={val?.symbolCategoryName.toLowerCase()}
                      title={val?.symbolCategoryName}
                    >
                      {val?.symbol?.length > 0 ? (
                        <>
                          <div className="position-relative mb-1">
                            <input
                              type="text"
                              placeholder={`SEARCH ${val?.symbolCategoryName} STOCKS`}
                              className="form-control ps-5 text-input"
                              onKeyUp={(e) => handleSearch(e, key)}
                            />
                            <RiSearch2Line
                              size={20}
                              className="algo_search_icon"
                            />
                          </div>
                          <div className="sidebar-container">
                            <ul>
                              {val?.symbol?.map((s, k) => {
                                return (
                                  (s?.isVisible == undefined ||
                                    s?.isVisible == 1) && (
                                    <li>
                                      <p>{s?.identifier}</p>{" "}
                                      <div className="list-icon-flex">
                                        {s?.watchListID > 0 ||
                                        categoryName == "options" ? (
                                          <React.Fragment>
                                            {listButtonLoading ? (
                                              <ButtonLoader isloading={true} />
                                            ) : (
                                              <>
                                                <Tooltip
                                                  arrow
                                                  componentsProps={
                                                    tooltipDesign
                                                  }
                                                  enterTouchDelay={0}
                                                  leaveTouchDelay={10000}
                                                  title={
                                                    s?.addedinAlgoTrade
                                                      ? "You want to temporarily stop a stock where a strategy is already running"
                                                      : changeAlgoState ==
                                                          s?.symbolIdentifierId
                                                        ? "You want to temporarily stop a stock where a strategy is already running"
                                                        : " You want to create a new strategy on this stock"
                                                  }
                                                >
                                                  <button
                                                    type="button"
                                                    className={`list-btn btn  btn-${
                                                      s?.addedinAlgoTrade
                                                        ? "danger"
                                                        : changeAlgoState ==
                                                            s?.symbolIdentifierId
                                                          ? "danger"
                                                          : "success"
                                                    }`}
                                                    onClick={(e) =>
                                                      enableAlgo(
                                                        e,
                                                        s,
                                                        val?.symbolCategoryName.toLowerCase(),
                                                        s?.addedinAlgoTrade
                                                          ? false
                                                          : changeAlgoState ==
                                                              s?.symbolIdentifierId
                                                            ? true
                                                            : false,
                                                      )
                                                    }
                                                  >
                                                    {s?.addedinAlgoTrade
                                                      ? "D"
                                                      : changeAlgoState ==
                                                          s?.symbolIdentifierId
                                                        ? "D"
                                                        : "E"}
                                                  </button>{" "}
                                                </Tooltip>
                                                {s?.addedinAlgoTrade && (
                                                  <Tooltip
                                                    arrow
                                                    enterTouchDelay={0}
                                                    leaveTouchDelay={10000}
                                                    componentsProps={
                                                      tooltipDesign
                                                    }
                                                    title="View or edit your strategy settings like Target, Stop Loss, etc"
                                                  >
                                                    <FiEdit
                                                      size={20}
                                                      onClick={() => {
                                                        editAlgo(
                                                          s?.customerAlgoTradeID,
                                                          s,
                                                          val?.symbolCategoryName.toLowerCase(),
                                                        );
                                                      }}
                                                    />
                                                  </Tooltip>
                                                )}
                                              </>
                                            )}
                                          </React.Fragment>
                                        ) : (
                                          <Tooltip
                                            arrow
                                            enterTouchDelay={0}
                                            leaveTouchDelay={10000}
                                            componentsProps={tooltipDesign}
                                            title="Add this stock to your list to start using strategies on it"
                                          >
                                            <button
                                              className="btn fav_btn p-0 m-0"
                                              onClick={() =>
                                                addToWatch(
                                                  s?.symbolIdentifierId,
                                                )
                                              }
                                              type="button"
                                              disabled={watchLoading}
                                            >
                                              <TiStarOutline
                                                size={22}
                                                className="fav_icon"
                                              />
                                            </button>
                                          </Tooltip>
                                        )}
                                        <>
                                          <Tooltip
                                            arrow
                                            enterTouchDelay={0}
                                            leaveTouchDelay={10000}
                                            componentsProps={tooltipDesign}
                                            title="Chart"
                                          >
                                            <span
                                              className="no-button"
                                              onClick={
                                                activeSubscriptionFeatures
                                                  ?.liveCharts?.enabled == false
                                                  ? () =>
                                                      handleClickDialogOpen()
                                                  : () =>
                                                      navigate(`/chart`, {
                                                        state: {
                                                          symbol: s?.identifier,
                                                        },
                                                      })
                                              }
                                            >
                                              {" "}
                                       {/*        <IconRegistry
                                                name="chart-area"
                                                size={20}
                                              /> */}
                                            </span>
                                          </Tooltip>
                                        </>
                                      </div>
                                    </li>
                                  )
                                );
                              })}
                            </ul>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <p>No stocks found</p>
                        </div>
                      )}
                    </Tab>
                  );
                })}
              </Tabs>
            ) : (
              ""
            )}
          </div>
        </div>

        <div className="card-box card-box-right">
          {algoType != "" ? (
            dataLoading ? (
              <ShimmerPostDetails card cta variant="SIMPLE" />
            ) : (
              <React.Fragment>
                {algoType == "options" ? (
                  <form onSubmit={handleOptionSubmit}>
                    <div className="heading-flex">
                      <div className="d-flex gap-2">
                        <p className="heading-style">
                          {algoOptionData?.IdentifierName}
                        </p>{" "}
                        <div className="list-icon-flex">
                          {" "}
                          <p
                            className={`stock-price ${
                              symbolValue[algoOptionData?.IdentifierName]
                                ?.priceChangePercentage < 0
                                ? "color-danger"
                                : "color-success"
                            }`}
                          >
                            {
                              symbolValue[algoOptionData?.IdentifierName]
                                ?.lastTradePrice
                            }
                          </p>
                          {symbolValue[algoOptionData?.IdentifierName]
                            ?.priceChangePercentage == 0 ? (
                            symbolValue[algoOptionData?.IdentifierName]
                              ?.priceChangePercentage
                          ) : symbolValue[algoOptionData?.IdentifierName]
                              ?.priceChangePercentage > 0 ? (
                            <div className="text-success">
                              <IconRegistry name="caret-up" size={20} />
                              {
                                symbolValue[algoOptionData?.IdentifierName]
                                  ?.priceChangePercentage
                              }
                            </div>
                          ) : (
                            <div className="text-danger">
                              <IconRegistry name="caret-down" size={20} />
                              {
                                symbolValue[algoOptionData?.IdentifierName]
                                  ?.priceChangePercentage
                              }
                            </div>
                          )}
                          ({" "}
                          {symbolValue[algoOptionData?.IdentifierName]
                            ?.priceChangePercentage > 0
                            ? "+"
                            : ""}
                          {(
                            (symbolValue[algoOptionData?.IdentifierName]
                              ?.priceChangePercentage /
                              symbolValue[algoOptionData?.IdentifierName]
                                ?.lastTradePrice) *
                            100
                          ).toFixed(2)}
                          %)
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ButtonLoader isloading={true} />
                        ) : (
                          "Deploy Strategy"
                        )}
                      </button>
                    </div>
                    <div className="inner_data">
                      <div className="price-box">
                        <div className="price">
                          <p>Product Type</p>
                          <div className="order_button">
                            <label>
                              <input
                                type="radio"
                                name="ProductType"
                                value="1"
                                className="peer radio"
                                checked={
                                  algoOptionData?.ProductType == 1 ?? false
                                }
                                onChange={handleOptionChange}
                              />
                              <div className="icon">CNC</div>
                            </label>

                            <label className="ml-5">
                              <input
                                type="radio"
                                name="ProductType"
                                value="2"
                                className="peer radio"
                                checked={
                                  algoOptionData?.ProductType == 2 ?? false
                                }
                                onChange={handleOptionChange}
                              />
                              <div className="icon">MIS</div>
                            </label>
                          </div>
                        </div>

                        <div className="price">
                          <p>
                            S/L{" "}
                            <Tooltip
                              arrow
                              componentsProps={tooltipDesign}
                              enterTouchDelay={0} // show immediately on touch
                              leaveTouchDelay={10000} // stay for 3s after touch
                              title={
                                <div
                                  style={{
                                    padding: "8px",
                                  }}
                                >
                                  <span>
                                    You can choose between POINT or PERCENT (%).
                                  </span>
                                  <br />
                                  <span>
                                    Based on your selection, the system will
                                    calculate and set your Target and Stop Loss
                                    values from your buy or sell entry price.
                                  </span>
                                  <br />
                                  <strong>POINT:</strong>{" "}
                                  <span>
                                    Fixed number of points from the entry price.
                                  </span>
                                  <br />
                                  <strong>PERCENT(%):</strong>{" "}
                                  <span>
                                    Percentage-based value from the entry price.
                                  </span>
                                  <br />
                                </div>
                              }
                            >
                              <IconRegistry
                                name="exclamation-octagon"
                                className="mb-1"
                              />
                            </Tooltip>{" "}
                          </p>
                          <div className="order_button">
                            <label>
                              <input
                                type="radio"
                                name="AlgoType"
                                value="1"
                                className="peer radio "
                                checked={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    .AlgoType == 1 ?? false
                                }
                                onChange={handleOptionChange}
                              />
                              <div className="icon">POINT</div>
                            </label>
                            <label className="ml-5">
                              <input
                                type="radio"
                                name="AlgoType"
                                value="2"
                                className="peer radio"
                                checked={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    .AlgoType == 2 ?? false
                                }
                                onChange={handleOptionChange}
                              />
                              <div className="icon">PERCENT %</div>
                            </label>
                          </div>
                        </div>

                        <div className="price">
                          <p>
                            B/S <span className="text-danger">*</span>
                          </p>
                          <select
                            name="CallType"
                            value={
                              algoOptionData?.customerOptionsAlgochild[0]
                                .CallType
                            }
                            onChange={handleOptionChange}
                            className="form-control text-input"
                          >
                            <option value="0">Select B/S Option</option>
                            {bsOption?.map((val, key) => {
                              return (
                                <option value={val?.value}>{val?.label}</option>
                              );
                            })}
                          </select>

                          {formErrors?.["CallType.0"] && (
                            <div className="error-message">
                              {formErrors?.["CallType.0"]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="price-box">
                        <div className="price">
                          <p>
                            Expiry <span className="text-danger">*</span>
                          </p>
                          <select
                            name="expiryDate"
                            value={algoOptionData?.expiryDate}
                            className="form-control text-input"
                            onChange={handleOptionChange}
                          >
                            <option value="">Select Expiry</option>
                            {expiryList?.map((val, key) => {
                              return <option value={val}>{val}</option>;
                            })}
                          </select>
                          {formErrors?.expiryDate && (
                            <div className="error-message">
                              {formErrors?.expiryDate}
                            </div>
                          )}
                        </div>
                        <div className="price">
                          <p>
                            Strategy <span className="text-danger">*</span>
                          </p>
                          <div className="select-with-icon">
                            <select
                              name="statergyID"
                              value={algoOptionData?.statergyID}
                              onChange={handleOptionChange}
                              className="form-control text-input"
                            >
                              <option value="0">Select Strategy</option>
                              {strategyList?.map((val, key) => {
                                return (
                                  <option value={val?.stratergyID}>
                                    {val?.stratergyName}
                                  </option>
                                );
                              })}
                            </select>
                            {algoOptionData?.statergyID &&
                            algoOptionData?.statergyID !== "0" ? (
                              <NavLink
                                to={`/strategy/${algoOptionData?.statergyID}`}
                                className="strategy-icon-link"
                              >
                              {/*   <FaChessKnight className="strategy-icon" /> */}
                              </NavLink>
                            ) : (
                              ""
                            )}
                          </div>
                          {formErrors?.statergyID && (
                            <div className="error-message">
                              {formErrors?.statergyID}
                            </div>
                          )}
                        </div>
                        <div className="price">
                          <p>
                            Broker <span className="text-danger">*</span>
                          </p>
                          <select
                            name="customerBrokerID"
                            value={algoOptionData?.customerBrokerID}
                            onChange={handleOptionChange}
                            className="form-control text-input"
                          >
                            <option value="0">Select Broker</option>
                            {brokerList?.map((val, key) => {
                              return (
                                <option value={val?.brokerconfigID}>
                                  {val?.brokerName}
                                </option>
                              );
                            })}
                          </select>
                          {formErrors?.customerBrokerID && (
                            <div className="error-message">
                              {formErrors?.customerBrokerID}
                            </div>
                          )}
                        </div>
                        <div className="price">
                          <p>
                            Op type{" "}
                            <Tooltip
                              arrow
                              componentsProps={tooltipDesign}
                              title={toolTipData?.oP}
                              enterTouchDelay={0}
                              leaveTouchDelay={10000}
                            >
                              <IconRegistry
                                name="exclamation-octagon"
                                className="mb-1"
                              />
                            </Tooltip>{" "}
                            <span className="text-danger">*</span>
                          </p>
                          <select
                            name="OptionsType"
                            value={
                              algoOptionData?.customerOptionsAlgochild[0]
                                .OptionsType
                            }
                            onChange={handleOptionChange}
                            className="form-control text-input"
                          >
                            <option value="0">Select Option Type</option>
                            {optionTypeList?.map((val, key) => {
                              return (
                                <option value={val?.value}>{val?.label}</option>
                              );
                            })}
                          </select>
                          {formErrors?.["OptionsType.0"] && (
                            <div className="error-message">
                              {formErrors?.["OptionsType.0"]}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="price-box">
                        <div className="input-row-flex">
                          <div className="input-inside">
                            <div className="price">
                              <p>
                                Quantity <span className="text-danger">*</span>{" "}
                                <small>
                                  (Lot Size:{lotSize?.quotationLot})
                                </small>
                              </p>
                              <input
                                type="text"
                                name="OrderQuantity"
                                className="form-control text-input"
                                placeholder="Enter Quantity"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    .OrderQuantity
                                }
                                onChange={handleOptionChange}
                              />
                              {formErrors?.["OrderQuantity.0"] && (
                                <div className="error-message">
                                  {formErrors?.["OrderQuantity.0"]}
                                </div>
                              )}
                            </div>
                            <div className="price">
                              <p>
                                Stop Loss (
                                {algoOptionData?.customerOptionsAlgochild[0]
                                  ?.AlgoType == 1
                                  ? "Points"
                                  : "%"}
                                ) <span className="text-danger">*</span>
                              </p>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Quantity"
                                name="Stoploss"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.Stoploss
                                }
                                onChange={handleOptionChange}
                              />
                              {formErrors?.["Stoploss.0"] && (
                                <div className="error-message">
                                  {formErrors?.["Stoploss.0"]}
                                </div>
                              )}
                            </div>
                            <div className="price">
                              <p>
                                TGT(
                                {algoOptionData?.customerOptionsAlgochild[0]
                                  ?.AlgoType == 1
                                  ? "Points"
                                  : "%"}
                                ) <span className="text-danger">*</span>
                              </p>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Profit"
                                name="Takeprofit"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.Takeprofit
                                }
                                onChange={handleOptionChange}
                              />
                              {formErrors?.["Takeprofit.0"] && (
                                <div className="error-message">
                                  {formErrors?.["Takeprofit.0"]}
                                </div>
                              )}
                            </div>
                            <div className="price">
                              <p>
                                Trade Limit{" "}
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  title={toolTipData?.tradeLimit}
                                  enterTouchDelay={0} // show immediately on touch
                                  leaveTouchDelay={10000} // stay for 3s after touch
                                >
                                  <IconRegistry
                                    name="exclamation-octagon"
                                    className="mb-1"
                                  />
                                </Tooltip>{" "}
                                <span className="text-danger">*</span>
                              </p>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Trade Limit"
                                name="SpecificLimitofDay"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.SpecificLimitofDay
                                }
                                onChange={handleOptionChange}
                              />
                              {formErrors?.["SpecificLimitofDay.0"] && (
                                <div className="error-message">
                                  {formErrors?.["SpecificLimitofDay.0"]}
                                </div>
                              )}
                            </div>{" "}
                          </div>
                        </div>
                      </div>
                      <div className="price-box ">
                        <div className="input-row-flex">
                          <div className="input-inside max_div">
                            <div className="price">
                              <div className="max_inner_div">
                                <p>
                                  Max Loss For Day{" "}
                                  <Tooltip
                                    arrow
                                    componentsProps={tooltipDesign}
                                    title={toolTipData?.maxLoss}
                                    enterTouchDelay={0}
                                    leaveTouchDelay={10000}
                                  >
                                    <IconRegistry
                                      name="exclamation-octagon"
                                      className="mb-1"
                                    />
                                  </Tooltip>{" "}
                                </p>
                                <div className="toogle">
                                  <label className="toggle-switch blue">
                                    <input
                                      type="checkbox"
                                      name="algoState"
                                      checked={maxLossToggle ? true : false}
                                      onChange={() =>
                                        setMaxLossToggle(!maxLossToggle)
                                      }
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Max Loss"
                                disabled={!maxLossToggle ?? true}
                                name="OverallCapital"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.OverallCapital
                                }
                                onChange={handleOptionChange}
                              />
                            </div>
                            <div className="price">
                              <div className="max_inner_div">
                                <p>
                                  Max Profit For Day{" "}
                                  <Tooltip
                                    arrow
                                    componentsProps={tooltipDesign}
                                    title={toolTipData?.maxProfit}
                                    enterTouchDelay={0}
                                    leaveTouchDelay={10000}
                                  >
                                    <IconRegistry
                                      name="exclamation-octagon"
                                      className="mb-1"
                                    />
                                  </Tooltip>{" "}
                                </p>
                                <div className="toogle">
                                  <label className="toggle-switch blue">
                                    <input
                                      type="checkbox"
                                      name="algoState"
                                      checked={maxProfitToggle ? true : false}
                                      onChange={() =>
                                        setMaxProfitToggle(!maxProfitToggle)
                                      }
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Max Profit"
                                disabled={!maxProfitToggle ?? true}
                                name="OverallCapitalProfit"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.OverallCapitalProfit
                                }
                                onChange={handleOptionChange}
                              />
                            </div>
                            <div className="price">
                              <div className="max_inner_div">
                                <p>
                                  Trailing S/L{" "}
                                  <Tooltip
                                    arrow
                                    enterTouchDelay={0} // show immediately on touch
                                    leaveTouchDelay={10000} // stay for 3s after touch
                                    componentsProps={tooltipDesign}
                                    title={
                                      <div
                                        style={{
                                          padding: "8px",
                                        }}
                                      >
                                        <span>
                                          Example Logic for Trailing S/L and
                                          Trailing Profit:
                                        </span>
                                        <br />
                                        <span className="">
                                          Let’s say your buy price is 100, Stop
                                          Loss is 50, and Target is 150.
                                        </span>
                                        <br />
                                        <span>You set:</span>
                                        <br />
                                        <span>Trailing S/L = 5</span>
                                        <br />
                                        <span>Trailing Profit = 10</span>
                                        <br />
                                        <strong>This means:</strong>{" "}
                                        <span>
                                          Once the price moves 10 points above
                                          your entry (i.e., reaches 110), your
                                          system will start trailing the stop
                                          loss. It will add 5 points (as per
                                          Trailing S/L) to your original stop
                                          loss of 50 — so the stop loss becomes
                                          55, and will keep moving up as the
                                          price increases.{" "}
                                        </span>
                                        <br />
                                      </div>
                                    }
                                  >
                                    <IconRegistry
                                      name="exclamation-octagon"
                                      className="mb-1"
                                    />
                                  </Tooltip>{" "}
                                </p>
                                <div className="toogle">
                                  <label className="toggle-switch blue">
                                    <input
                                      type="checkbox"
                                      name="algoState"
                                      checked={traillingSLToggle ? true : false}
                                      onChange={() =>
                                        setTraillingSLToggle(!traillingSLToggle)
                                      }
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Trailing S/L"
                                disabled={!traillingSLToggle ?? true}
                                name="TrailingStopLoss"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.TrailingStopLoss
                                }
                                onChange={handleOptionChange}
                              />
                            </div>
                            <div className="price">
                              <div className="max_inner_div">
                                <p>
                                  Trailing Profit{" "}
                                  <Tooltip
                                    arrow
                                    componentsProps={tooltipDesign}
                                    enterTouchDelay={0}
                                    leaveTouchDelay={10000}
                                    title={
                                      <div
                                        style={{
                                          padding: "8px",
                                        }}
                                      >
                                        <span>
                                          Example Logic for Trailing S/L and
                                          Trailing Profit:
                                        </span>
                                        <br />
                                        <span className="">
                                          Let’s say your buy price is 100, Stop
                                          Loss is 50, and Target is 150.
                                        </span>
                                        <br />
                                        <span>You set:</span>
                                        <br />
                                        <span>Trailing S/L = 5</span>
                                        <br />
                                        <span>Trailing Profit = 10</span>
                                        <br />
                                        <strong>This means:</strong>{" "}
                                        <span>
                                          Once the price moves 10 points above
                                          your entry (i.e., reaches 110), your
                                          system will start trailing the stop
                                          loss. It will add 5 points (as per
                                          Trailing S/L) to your original stop
                                          loss of 50 — so the stop loss becomes
                                          55, and will keep moving up as the
                                          price increases.{" "}
                                        </span>
                                        <br />
                                      </div>
                                    }
                                  >
                                    <IconRegistry
                                      name="exclamation-octagon"
                                      className="mb-1"
                                    />
                                  </Tooltip>{" "}
                                </p>
                                <div className="toogle">
                                  <label className="toggle-switch blue">
                                    <input
                                      type="checkbox"
                                      name="algoState"
                                      checked={
                                        traillingProfitToggle ? true : false
                                      }
                                      onChange={() =>
                                        setTraillingProfitToggle(
                                          !traillingProfitToggle,
                                        )
                                      }
                                    />
                                    <span className="slider"></span>
                                  </label>
                                </div>
                              </div>
                              <input
                                type="text"
                                className="form-control text-input"
                                placeholder="Enter Trailing Profit"
                                disabled={!traillingProfitToggle ?? true}
                                name="TrailingProfit"
                                value={
                                  algoOptionData?.customerOptionsAlgochild[0]
                                    ?.TrailingProfit
                                }
                                onChange={handleOptionChange}
                              />
                            </div>{" "}
                          </div>
                        </div>
                      </div>

                      <div class="deploy_content">
                        <p>
                          - Once you deploy your strategy, all your configured
                          settings — such as target, stop loss, and other
                          parameters — will be activated in the algo system.
                        </p>
                        <p>
                          - Trades will be executed based on these settings, so
                          please review everything carefully before deployment.
                        </p>{" "}
                        <p>
                          - We do not provide any guarantees of profit or loss.
                          All outcomes depend entirely on your selected strategy
                          and inputs.
                        </p>
                      </div>
                    </div>
                  </form>
                ) : (
                  ""
                )}

                {/* For Future or NSE */}
                {algoType == "nse" || algoType == "futures" ? (
                  <form onSubmit={handleNFSubmit}>
                    <div className="heading-flex">
                      <div className="d-flex gap-2">
                        <p className="heading-style">
                          {algoNFData?.Identifier}
                        </p>{" "}
                        <div className="list-icon-flex">
                          {" "}
                          <p
                            className={`stock-price ${
                              symbolValue[algoNFData?.Identifier]
                                ?.priceChangePercentage < 0
                                ? "color-danger"
                                : "color-success"
                            }`}
                          >
                            {
                              symbolValue[algoNFData?.Identifier]
                                ?.lastTradePrice
                            }
                          </p>
                          {symbolValue[algoNFData?.Identifier]
                            ?.priceChangePercentage == 0 ? (
                            symbolValue[algoNFData?.Identifier]
                              ?.priceChangePercentage
                          ) : symbolValue[algoNFData?.Identifier]
                              ?.priceChangePercentage > 0 ? (
                            <div className="text-success">
                              <IconRegistry name="caret-up" size={20} />
                              {
                                symbolValue[algoNFData?.Identifier]
                                  ?.priceChangePercentage
                              }
                            </div>
                          ) : (
                            <div className="text-danger">
                              <IconRegistry name="caret-down" size={20} />
                              {
                                symbolValue[algoNFData?.Identifier]
                                  ?.priceChangePercentage
                              }
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ButtonLoader isloading={true} />
                        ) : (
                          "Deploy Strategy"
                        )}
                      </button>
                    </div>
                    <div className="price-box">
                      <div className="price">
                        <p>Product Type</p>
                        <div className="order_button">
                          <label>
                            <input
                              type="radio"
                              name="ProductType"
                              value="1"
                              className="peer radio"
                              checked={algoNFData?.ProductType == 1 ?? false}
                              onChange={handleNFChange}
                            />
                            <div className="icon">CNC</div>
                          </label>

                          <label className="ml-5">
                            <input
                              type="radio"
                              name="ProductType"
                              value="2"
                              className="peer radio"
                              checked={algoNFData?.ProductType == 2 ?? false}
                              onChange={handleNFChange}
                            />
                            <div className="icon">MIS</div>
                          </label>
                        </div>
                      </div>

                      <div className="price">
                        <p>
                          S/L{" "}
                          <Tooltip
                            arrow
                            enterTouchDelay={0} // show immediately on touch
                            leaveTouchDelay={10000} // stay for 3s after touch
                            componentsProps={tooltipDesign}
                            title={
                              <div
                                style={{
                                  padding: "8px",
                                }}
                              >
                                <span>
                                  You can choose between POINT or PERCENT (%).
                                </span>
                                <br />
                                <span>
                                  Based on your selection, the system will
                                  calculate and set your Target and Stop Loss
                                  values from your buy or sell entry price.
                                </span>
                                <br />
                                <strong>POINT:</strong>{" "}
                                <span>
                                  Fixed number of points from the entry price.
                                </span>
                                <br />
                                <strong>PERCENT(%):</strong>{" "}
                                <span>
                                  Percentage-based value from the entry price.
                                </span>
                                <br />
                              </div>
                            }
                          >
                            <IconRegistry
                              name="exclamation-octagon"
                              className="mb-1"
                            />
                          </Tooltip>{" "}
                        </p>
                        <div className="order_button">
                          <label>
                            <input
                              type="radio"
                              name="AlgoType"
                              value="1"
                              className="peer radio "
                              checked={algoNFData?.AlgoType == 1 ?? false}
                              onChange={handleNFChange}
                            />
                            <div className="icon">POINT</div>
                          </label>
                          <label className="ml-5">
                            <input
                              type="radio"
                              name="AlgoType"
                              value="2"
                              className="peer radio"
                              checked={algoNFData?.AlgoType == 2 ?? false}
                              onChange={handleNFChange}
                            />
                            <div className="icon">PERCENT %</div>
                          </label>
                        </div>
                      </div>

                      <div className="price">
                        <p>
                          Strategy <span className="text-danger">*</span>
                        </p>
                        <div className="select-with-icon">
                          <select
                            name="StratergyID"
                            value={algoNFData?.StratergyID}
                            onChange={handleNFChange}
                            className="form-control text-input"
                          >
                            <option value="0">Select Strategy</option>
                            {strategyList?.map((val, key) => {
                              return (
                                <option value={val?.stratergyID}>
                                  {val?.stratergyName}
                                </option>
                              );
                            })}
                          </select>
                          {algoNFData?.StratergyID &&
                          algoNFData?.StratergyID !== "0" ? (
                            <NavLink
                              to={`/strategy/${algoNFData?.StratergyID}`}
                              className="strategy-icon-link"
                            >
                              <FaChessKnight className="strategy-icon" />
                            </NavLink>
                          ) : (
                            ""
                          )}
                        </div>
                        {formErrors?.StratergyID && (
                          <div className="error-message">
                            {formErrors?.StratergyID}
                          </div>
                        )}
                      </div>

                      <div className="price">
                        <p>
                          Broker <span className="text-danger">*</span>
                        </p>
                        <select
                          name="BrokerConfigID"
                          value={algoNFData?.BrokerConfigID}
                          onChange={handleNFChange}
                          className="form-control text-input"
                        >
                          <option value="0">Select Broker</option>
                          {brokerList?.map((val, key) => {
                            return (
                              <option value={val?.brokerconfigID}>
                                {val?.brokerName}
                              </option>
                            );
                          })}
                        </select>
                        {formErrors?.BrokerConfigID && (
                          <div className="error-message">
                            {formErrors?.BrokerConfigID}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="price-box">
                      <div className="input-row-flex">
                        <div className="input-inside">
                          <div className="price">
                            <p>
                              Quantity <span className="text-danger">*</span>{" "}
                              {/* <small>(Lot Size:{lotSize?.quotationLot})</small> */}
                            </p>
                            <input
                              type="text"
                              name="OrderQuantity"
                              className="form-control text-input"
                              placeholder="Enter Quantity"
                              value={algoNFData?.OrderQuantity}
                              onChange={handleNFChange}
                            />
                            {formErrors?.OrderQuantity && (
                              <div className="error-message">
                                {formErrors?.OrderQuantity}
                              </div>
                            )}
                          </div>
                          <div className="price">
                            <p>
                              Stop Loss (
                              {algoNFData?.AlgoType == 1 ? "Points" : "%"}){" "}
                              <span className="text-danger">*</span>
                            </p>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Quantity"
                              name="Stoploss"
                              value={algoNFData?.Stoploss}
                              onChange={handleNFChange}
                            />
                            {formErrors?.Stoploss && (
                              <div className="error-message">
                                {formErrors?.Stoploss}
                              </div>
                            )}
                          </div>
                          <div className="price">
                            <p>
                              TGT ({algoNFData?.AlgoType == 1 ? "Points" : "%"}){" "}
                              <span className="text-danger">*</span>
                            </p>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Profit"
                              name="Takeprofit"
                              value={algoNFData?.Takeprofit}
                              onChange={handleNFChange}
                            />
                            {formErrors?.Takeprofit && (
                              <div className="error-message">
                                {formErrors?.Takeprofit}
                              </div>
                            )}
                          </div>
                          <div className="price">
                            <p>
                              Trade Limit{" "}
                              <Tooltip
                                arrow
                                componentsProps={tooltipDesign}
                                title={toolTipData?.tradeLimit}
                                enterTouchDelay={0} // show immediately on touch
                                leaveTouchDelay={10000} // stay for 3s after touch
                              >
                                <IconRegistry
                                  name="exclamation-octagon"
                                  className="mb-1"
                                />
                              </Tooltip>{" "}
                              <span className="text-danger">*</span>
                            </p>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Trade Limit"
                              name="SpecificLimitofDay"
                              value={algoNFData?.SpecificLimitofDay}
                              onChange={handleNFChange}
                            />
                            {formErrors?.SpecificLimitofDay && (
                              <div className="error-message">
                                {formErrors?.SpecificLimitofDay}
                              </div>
                            )}
                          </div>{" "}
                        </div>
                      </div>
                    </div>
                    <div className="price-box ">
                      <div className="input-row-flex">
                        <div className="input-inside max_div">
                          <div className="price">
                            <div className="max_inner_div">
                              <p>
                                Max Loss For Day{" "}
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  title={toolTipData?.maxLoss}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                >
                                  <IconRegistry
                                    name="exclamation-octagon"
                                    className="mb-1"
                                  />
                                </Tooltip>{" "}
                              </p>
                              <div className="toogle">
                                <label className="toggle-switch blue">
                                  <input
                                    type="checkbox"
                                    name="algoState"
                                    checked={maxLossToggle ? true : false}
                                    onChange={() =>
                                      setMaxLossToggle(!maxLossToggle)
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Max Loss"
                              disabled={!maxLossToggle ?? true}
                              name="OverallCapital"
                              value={algoNFData?.OverallCapital}
                              onChange={handleNFChange}
                            />
                          </div>
                          <div className="price">
                            <div className="max_inner_div">
                              <p>
                                Max Profit For Day{" "}
                                <Tooltip
                                  arrow
                                  componentsProps={tooltipDesign}
                                  title={toolTipData?.maxProfit}
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                >
                                  <IconRegistry
                                    name="exclamation-octagon"
                                    className="mb-1"
                                  />
                                </Tooltip>{" "}
                              </p>
                              <div className="toogle">
                                <label className="toggle-switch blue">
                                  <input
                                    type="checkbox"
                                    name="algoState"
                                    checked={maxProfitToggle ? true : false}
                                    onChange={() =>
                                      setMaxProfitToggle(!maxProfitToggle)
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Max Profit"
                              disabled={!maxProfitToggle ?? true}
                              name="OverallCapitalProfit"
                              value={algoNFData?.OverallCapitalProfit}
                              onChange={handleNFChange}
                            />
                          </div>
                          <div className="price">
                            <div className="max_inner_div">
                              <p>
                                Trailing S/L{" "}
                                <Tooltip
                                  arrow
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  componentsProps={tooltipDesign}
                                  title={
                                    <div
                                      style={{
                                        padding: "8px",
                                      }}
                                    >
                                      <span>
                                        Example Logic for Trailing S/L and
                                        Trailing Profit:
                                      </span>
                                      <br />
                                      <span className="">
                                        Let’s say your buy price is 100, Stop
                                        Loss is 50, and Target is 150.
                                      </span>
                                      <br />
                                      <span>You set:</span>
                                      <br />
                                      <span>Trailing S/L = 5</span>
                                      <br />
                                      <span>Trailing Profit = 10</span>
                                      <br />
                                      <strong>This means:</strong>{" "}
                                      <span>
                                        Once the price moves 10 points above
                                        your entry (i.e., reaches 110), your
                                        system will start trailing the stop
                                        loss. It will add 5 points (as per
                                        Trailing S/L) to your original stop loss
                                        of 50 — so the stop loss becomes 55, and
                                        will keep moving up as the price
                                        increases.{" "}
                                      </span>
                                      <br />
                                    </div>
                                  }
                                >
                                  <IconRegistry
                                    name="exclamation-octagon"
                                    className="mb-1"
                                  />
                                </Tooltip>{" "}
                              </p>
                              <div className="toogle">
                                <label className="toggle-switch blue">
                                  <input
                                    type="checkbox"
                                    name="algoState"
                                    checked={traillingSLToggle ? true : false}
                                    onChange={() =>
                                      setTraillingSLToggle(!traillingSLToggle)
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Trailing S/L"
                              disabled={!traillingSLToggle ?? true}
                              name="TrailingStopLoss"
                              value={algoNFData?.TrailingStopLoss}
                              onChange={handleNFChange}
                            />
                          </div>
                          <div className="price">
                            <div className="max_inner_div">
                              <p>
                                Trailing Profit{" "}
                                <Tooltip
                                  arrow
                                  enterTouchDelay={0}
                                  leaveTouchDelay={10000}
                                  componentsProps={tooltipDesign}
                                  title={
                                    <div
                                      style={{
                                        padding: "8px",
                                      }}
                                    >
                                      <span>
                                        Example Logic for Trailing S/L and
                                        Trailing Profit:
                                      </span>
                                      <br />
                                      <span className="">
                                        Let’s say your buy price is 100, Stop
                                        Loss is 50, and Target is 150.
                                      </span>
                                      <br />
                                      <span>You set:</span>
                                      <br />
                                      <span>Trailing S/L = 5</span>
                                      <br />
                                      <span>Trailing Profit = 10</span>
                                      <br />
                                      <strong>This means:</strong>{" "}
                                      <span>
                                        Once the price moves 10 points above
                                        your entry (i.e., reaches 110), your
                                        system will start trailing the stop
                                        loss. It will add 5 points (as per
                                        Trailing S/L) to your original stop loss
                                        of 50 — so the stop loss becomes 55, and
                                        will keep moving up as the price
                                        increases.{" "}
                                      </span>
                                      <br />
                                    </div>
                                  }
                                >
                                  <IconRegistry
                                    name="exclamation-octagon"
                                    className="mb-1"
                                  />
                                </Tooltip>{" "}
                              </p>
                              <div className="toogle">
                                <label className="toggle-switch blue">
                                  <input
                                    type="checkbox"
                                    name="algoState"
                                    checked={
                                      traillingProfitToggle ? true : false
                                    }
                                    onChange={() =>
                                      setTraillingProfitToggle(
                                        !traillingProfitToggle,
                                      )
                                    }
                                  />
                                  <span className="slider"></span>
                                </label>
                              </div>
                            </div>
                            <input
                              type="text"
                              className="form-control text-input"
                              placeholder="Enter Trailing Profit"
                              disabled={!traillingProfitToggle ?? true}
                              name="TrailingProfit"
                              value={algoNFData?.TrailingProfit}
                              onChange={handleNFChange}
                            />
                          </div>{" "}
                        </div>
                      </div>
                    </div>
                    <div class="deploy_content">
                      <p>
                        - Once you deploy your strategy, all your configured
                        settings — such as target, stop loss, and other
                        parameters — will be activated in the algo system.
                      </p>
                      <p>
                        - Trades will be executed based on these settings, so
                        please review everything carefully before deployment.
                      </p>{" "}
                      <p>
                        - We do not provide any guarantees of profit or loss.
                        All outcomes depend entirely on your selected strategy
                        and inputs.
                      </p>
                    </div>
                  </form>
                ) : (
                  ""
                )}
              </React.Fragment>
            )
          ) : (
            <div className="algo-img-content">
              <img src={images["other/algo.png"]} alt="Run-Algo" />
              <h4>Custom Strategy Setup</h4>
              <p>
                You can create and modify your own strategy based on your
                preferences — including stop loss, target, and other settings.
                All trades are executed as per the rules you define.The system
                may auto-run stock option strategies initially, but you are free
                to adjust or change them as needed.
              </p>
              <small>
                Please note: We do not provide any financial advice, and any
                profit or loss is solely based on your own settings and
                decisions.
              </small>
            </div>
          )}
        </div>
      </div>
      {dialogOpen && (
        <SubscriptionDialog
          open={dialogOpen}
          handleClose={handleDialogClose}
          message={subscriptionDialogMessage}
        />
      )}
    </section>
  );
};

export default Algo;
