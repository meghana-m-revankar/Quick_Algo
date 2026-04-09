import { IconRegistry } from "#components";
import React, { useContext, useEffect, useState } from "react";
import { ThemeContext } from "../../../context";
import { tooltipDesign } from "#constant/index";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import useActiveOrder from "./active";
import { HiOutlineChartBarSquare } from "react-icons/hi2";
import { TbListDetails } from "react-icons/tb";
import { EditOrderDialog, SubscriptionDialog, TableShimmer } from "#components";
import useSymbolDetails from "#hooks/useSymbol";
import { convertNumeric, images } from "#helpers";
import { HiOutlineLogout } from "react-icons/hi";
import { OrderHeader } from "#pages/index.js";

const ActiveOrder = () => {
  const {
    getPaginationRange,
    isLoading,
    activeOrderList,
    symbolCategory,
    resetFilter,
    portfolio,
    setProtfolio,
    currentPage,
    setCurrentPage,
    sortColumn,
    setSortColumn,
    sortOrder,
    setSortOrder,
    paginatedData,
    handleSort,
    totalPages,
    handleClickDialogOpen,
    handleDialogClose,
    dialogOpen,
    singleOrderData,
    defaultTabOpen,
    handleOrderExit,
    totalBuy,
    todayPL,
    closedOrderList,
    dialogSubOpen,
    setDialogSubOpen,
    handleClickSubDialogOpen,
    handleDialogSubClose,
    activeSubscriptionFeatures,
    showData,
    setShowData,
    navigate,
  } = useActiveOrder();
  const symbolActiveOrder = useSymbolDetails(activeOrderList, "order");

  useEffect(() => {
    // Reset values before calculation
    let totalActiveprice = 0;
    let totalisTakeProfit = 0;
    let totalTodaysPL = 0;

    activeOrderList?.forEach((val) => {
      const data = symbolActiveOrder[val?.identifier];
      if (!data) return;

      if (data?.orderType === 1) {
        totalActiveprice += data?.lastBuyPrice * data?.quantity;
        totalisTakeProfit += data?.entryPrice * data?.quantity;
      } else if (data?.orderType === 2) {
        totalActiveprice += data?.entryPrice * data?.quantity;
        totalisTakeProfit += data?.lastBuyPrice * data?.quantity;
      }
    });

    totalTodaysPL = convertNumeric(totalActiveprice - totalisTakeProfit);

    setProtfolio((prev) => ({
      ...prev,
      todaysPL: totalTodaysPL,
    }));
  }, [symbolActiveOrder, activeOrderList]);

  const { themeMode } = useContext(ThemeContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRowIdentifier, setMenuRowIdentifier] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event, identifier) => {
    setAnchorEl(event.currentTarget);
    setMenuRowIdentifier(identifier);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuRowIdentifier(null);
  };

  const CalculatePL = (data) => {
    if (data?.orderType == 1) {
      return convertNumeric(
        data?.lastBuyPrice * data.quantity - data.entryPrice * data.quantity,
      );
    }
    if (data?.orderType == 2) {
      return convertNumeric(
        data.entryPrice * data.quantity - data.lastBuyPrice * data.quantity,
      );
    }
  };

  const calculateCumulative = () => {
    const totalPL = (todayPL ?? 0) + (portfolio?.todaysPL ?? 0);

    return convertNumeric(totalPL);
  };

  const totalTransaction = () => {
    const activeOrderCount = activeOrderList ? activeOrderList?.length : 0;
    const closeOrderCount = closedOrderList ? closedOrderList?.length : 0;

    return parseInt(activeOrderCount + closeOrderCount);
  };

  const handleShowButton = () => {
    setShowData(!showData);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        setShowData(false);
      } else {
        setShowData(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="active_order_page">
      <div className="all-new-data-main-sticky">
        <OrderHeader />

        <div>
          <button className="open-btn" type="button" onClick={handleShowButton}>
            Open
          </button>
        </div>

        <div
          className={`profilt_loss_content ${!showData ? "d-none" : "active"}`}
        >
          <div className="inner_div B-inner-data">
            <span className="buy sym">B</span>
            <div className="details">
              <span className="text-gray">Total BUY</span>
              <span class="fw-500">₹{totalBuy}</span>
              <span className="text-gray">
                {activeOrderList ? activeOrderList?.length : 0} Transactions
              </span>
            </div>
          </div>
          <div className="inner_div R-inner-data">
            <span className="sell sym">R</span>
            <div className="details">
              <span className="text-gray">Realized P/L</span>
              <span
                class={`fw-500 ${
                  todayPL > 0
                    ? "text-success"
                    : todayPL < 0
                      ? "text-danger"
                      : ""
                }`}
              >
                ₹{todayPL}
              </span>
              <span className="text-gray">
                {closedOrderList?.length} Transactions
              </span>
            </div>
          </div>
          <div className="inner_div U-inner-data">
            <span className="running sym">U</span>
            <div className="details">
              <span className="text-gray">Unrealized P/L</span>
              <span
                class={`fw-500 ${
                  portfolio?.todaysPL > 0
                    ? "text-success"
                    : portfolio?.todaysPL < 0
                      ? "text-danger"
                      : ""
                }`}
              >
                ₹{portfolio?.todaysPL}
              </span>
              <span className="text-gray">
                {activeOrderList ? activeOrderList?.length : 0} Transactions
              </span>
            </div>
          </div>
          <div className="inner_div C-inner-data">
            <span className="final sym">C</span>
            <div className="details">
              <span className="text-gray">
                Cumulative Trade{" "}
                <Tooltip
                  arrow
                  enterTouchDelay={0}
                  leaveTouchDelay={10000}
                  placement="top-start"
                  componentsProps={tooltipDesign}
                  title="In the Cumulative Trade section, the system performs a calculation using both realized and unrealized P/L to show your overall performance."
                >
                  <IconRegistry name="exclamation-octagon" className="mb-1" />
                </Tooltip>{" "}
              </span>
              <span
                class={`fw-500 ${
                  calculateCumulative() > 0
                    ? "text-success"
                    : calculateCumulative() < 0
                      ? "text-danger"
                      : ""
                }`}
              >
                ₹{calculateCumulative()}
              </span>
              <span className="text-gray">
                {totalTransaction()} Transactions
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <table class="sticky-table">
          <thead className="table-thead-new">
            <tr className={`sub-header-row ${isScrolled ? "scrolled" : ""}`}>
              <th>
                <div onClick={() => handleSort("identifier")}>
                  Stock Name{" "}
                  {sortColumn == "identifier"
                    ? sortOrder == "asc"
                      ? "▲"
                      : "▼"
                    : ""}
                </div>
              </th>
              <th>Gain & Loss</th>
              <th>LTP</th>
              <th>ATP</th>
              <th>Qty</th>
              <th>Order Type</th>
              <th>SL</th>
              <th>TG</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableShimmer row={4} column={8} />
            ) : paginatedData?.length > 0 ? (
              paginatedData?.map((val, key) => {
                const ao = symbolActiveOrder[val?.identifier];
                return (
                  <tr>
                    <td>
                      <div>
                        <p>
                          {ao?.identifier}
                          <Tooltip
                            title="Order Details"
                            arrow
                            componentsProps={tooltipDesign}
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                          >
                            <button
                              type="button"
                              className="no-design"
                              onClick={(e) =>
                                handleMenuOpen(e, val?.identifier)
                              }
                            >
                              <HiOutlineChartBarSquare size={23} />
                            </button>
                          </Tooltip>

                          <Menu
                            anchorEl={anchorEl}
                            id="account-menu"
                            open={open && menuRowIdentifier === val?.identifier}
                            onClose={handleClose}
                            onClick={handleClose}
                            slotProps={{
                              paper: {
                                elevation: 0,
                                sx: (theme) => ({
                                  bgcolor:
                                    themeMode == "dark" ? "#333" : "#fff",
                                  overflow: "visible",
                                  color: themeMode == "dark" ? "#fff" : "#333",
                                  fontSize: "12px",
                                  fontFamily: "IBM Plex Sans, sans-serif",
                                  filter:
                                    "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                                  mt: 1.5,
                                  "& .MuiAvatar-root": {
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                  },
                                  "&::before": {
                                    content: '""',
                                    display: "block",
                                    position: "absolute",
                                    top: 0,
                                    right: 14,
                                    width: 10,
                                    height: 10,
                                    bgcolor:
                                      themeMode == "dark" ? "#333" : "#fff",
                                    transform: "translateY(-50%) rotate(45deg)",
                                    zIndex: 0,
                                  },
                                }),
                              },
                            }}
                            transformOrigin={{
                              horizontal: "right",
                              vertical: "top",
                            }}
                            anchorOrigin={{
                              horizontal: "right",
                              vertical: "bottom",
                            }}
                          >
                            <MenuItem
                              sx={{
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                              onClick={() =>
                                handleClickDialogOpen(ao, "details")
                              }
                            >
                              <TbListDetails size={15} />
                              Details
                            </MenuItem>

                            <MenuItem
                              sx={{
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                              onClick={
                                activeSubscriptionFeatures?.liveCharts
                                  ?.enabled == false
                                  ? () => handleClickDialogOpen()
                                  : () =>
                                      navigate(`/chart`, {
                                        state: {
                                          symbol: ao?.identifier,
                                        },
                                      })
                              }
                            >
                              <IconRegistry name="chart-area" size={14} />
                              Chart
                            </MenuItem>
                          </Menu>
                        </p>
                        <p className={ao?.iSAutoTrade && "text-success"}>
                          {ao?.symbolCategoryName}
                          <Tooltip
                            title="Exit Order"
                            arrow
                            componentsProps={tooltipDesign}
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                          >
                            <button
                              type="button"
                              className="no-design"
                              onClick={
                                activeSubscriptionFeatures?.manualTradeExitButton ==
                                false
                                  ? () => handleClickSubDialogOpen()
                                  : () => handleOrderExit(ao?.orderID)
                              }
                            >
                              <HiOutlineLogout size={23} />
                            </button>
                          </Tooltip>
                        </p>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${
                          CalculatePL(ao) >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {CalculatePL(ao) >= 0 ? (
                          <IconRegistry name="caret-up" size={20} />
                        ) : (
                          <IconRegistry name="caret-down" size={20} />
                        )}{" "}
                        {CalculatePL(ao)}{" "}
                      </span>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">{ao?.lastBuyPrice}</div>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">{ao?.entryPrice}</div>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">{ao?.quantity}</div>
                    </td>
                    <td>
                      <p
                        className={
                          ao?.orderType == 1
                            ? "text-success fw-500"
                            : "text-danger fw-500"
                        }
                      >
                        {ao?.orderType == 1 ? "Buy" : "Sell"}{" "}
                        {ao?.productType == 1 ? "CNC" : "MIS"}
                      </p>
                      <p className="mt-1">{ao?.brokerName}</p>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">
                        {ao?.stopLossEstPrice}
                      </div>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">
                        {" "}
                        {ao?.takeProfitEstPrice}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr className="text-center">
                <td colSpan={"100%"} className="text-center">
                  <img
                    src={images["other/noData.png"]}
                    className="no_data"
                    alt="No-Record"
                  />
                  <p className="fs-16 fw-500">
                    You don’t have any active orders in the system at this
                    moment.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginatedData?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
          {/* Prev Arrow */}
          <button
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            &lt;
          </button>

          {/* Page Numbers */}
          {getPaginationRange(currentPage, totalPages).map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-3 py-1 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={index}
                className={`px-3 py-1 rounded ${
                  currentPage === page
                    ? "bg-blue-500"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ),
          )}

          {/* Next Arrow */}
          <button
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
            onClick={() =>
              currentPage < totalPages && setCurrentPage(currentPage + 1)
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}

      {dialogOpen && (
        <EditOrderDialog
          open={dialogOpen}
          handleClose={handleDialogClose}
          orderData={singleOrderData}
          defaultTab={defaultTabOpen}
          isEditable={1}
          resetFilter={resetFilter}
          symbolActiveOrder={symbolActiveOrder}
        />
      )}

      {dialogSubOpen && (
        <SubscriptionDialog
          open={dialogSubOpen}
          handleClose={handleDialogSubClose}
        />
      )}
    </div>
  );
};

export default ActiveOrder;
