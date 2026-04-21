import { IconRegistry } from "#components";
import React, { useContext, useEffect, useState } from "react";
import useClosedOrder from "./closed";
import { TbListDetails } from "react-icons/tb";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { HiOutlineChartBarSquare } from "react-icons/hi2";
import { EditOrderDialog, TableShimmer } from "#components";
import { ThemeContext } from "../../../context";
import useSymbolDetails from "#hooks/useSymbol";
import { images } from "#helpers";
import { OrderHeader } from "#pages/index.js";
import { FaChartArea } from "react-icons/fa6";

const ClosedOrder = () => {
  const {
    getPaginationRange,
    isLoading,
    activeOrderList,
    isFilter,
    setIsFilter,
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
    todayPL,
    totalBuy,
    closedOrderList,
    totalSell,
    showData,
    setShowData,
    activeSubscriptionFeatures,
    navigate
  } = useClosedOrder();
  const symbolActiveOrder = useSymbolDetails(activeOrderList, "order");

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
const formatPrice = (val) =>
  Number(val ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const Price = ({ value }) => <>₹{formatPrice(value)}</>;
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

    totalTodaysPL = totalActiveprice - totalisTakeProfit;

    setProtfolio((prev) => ({
      ...prev,
      todaysPL: totalTodaysPL,
    }));
  }, [symbolActiveOrder]);

  const calculateCumulative = () => {
    const totalPL = (todayPL ?? 0) + (portfolio?.todaysPL ?? 0);

    return totalPL;
  };
  const cumulative = calculateCumulative();

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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

          <div className={`profilt_loss_content ${!showData ? "d-none" : "active"}`}>
            <div className="inner_div">
              <span className="buy sym">B</span>
              <div className="details">
                <span className="text-gray">Total BUY</span>
                <span class="fw-500"><Price value={totalBuy} /></span>
                <span className="text-gray">
                  {activeOrderList ? activeOrderList?.length : 0} Transactions
                </span>
              </div>
            </div>
            <div className="inner_div">
              <span className="selling sym">S</span>
              <div className="details">
                <span className="text-gray">Total SELL</span>
                <span class="fw-500"><Price value={totalSell} /></span>
                <span className="text-gray">
                  {closedOrderList?.length} Transactions
                </span>
              </div>
            </div>
            <div className="inner_div">
              <span className="sell sym">R</span>
              <div className="details">
                <span className="text-gray">Realized P/L</span>
              <span
  className={`fw-500 ${
    todayPL > 0
      ? "text-success"
      : todayPL < 0
      ? "text-danger"
      : ""
  }`}
>
  <Price value={todayPL} />
</span>
                <span className="text-gray">
                  {closedOrderList?.length} Transactions
                </span>
              </div>
            </div>
            <div className="inner_div">
              <span className="running sym">U</span>
              <div className="details">
                <span className="text-gray">Unrealized P/L</span>
             <span
  className={`fw-500 ${
    portfolio?.todaysPL > 0
      ? "text-success"
      : portfolio?.todaysPL < 0
      ? "text-danger"
      : ""
  }`}
>
  <Price value={portfolio?.todaysPL} />
</span>
                <span className="text-gray">
                  {activeOrderList ? activeOrderList?.length : 0} Transactions
                </span>
              </div>
            </div>
            <div className="inner_div">
              <span className="final sym">C</span>
              <div className="details">
                <span className="text-gray">
                  Cumulative Trade{" "}
                  <Tooltip
                    arrow
                    placement="top-start"
                    componentsProps={tooltipDesign}
                    title={
                      "In the Cumulative Trade section, the system performs a calculation using both realized and unrealized P/L to show your overall performance."
                    }
                  >
                    <IconRegistry name="exclamation-octagon" className="mb-1" />
                  </Tooltip>{" "}
                </span>
<span
  className={`fw-500 ${
    cumulative > 0
      ? "text-success"
      : cumulative < 0
      ? "text-danger"
      : ""
  }`}
>
  <Price value={cumulative} />
</span>

<span className="text-gray"></span>
                <span className="text-gray">
                  {totalTransaction()} Transactions
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="table-container">
          <table class="sticky-table">
            <thead class="table-thead-new">
              <tr className={`sub-header-row ${isScrolled ? 'scrolled' : ''}`}>
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
                <th>Close</th>
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
                  const ao = val;
                  return (
                    <tr>
                      <td>
                        <p>
                          {" "}
                          {ao?.identifier}
                          <Tooltip
                            title="Order Details"
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                            arrow
                            componentsProps={tooltipDesign}
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

                          <Tooltip
                            title="Chart"
                            enterTouchDelay={0}
                            leaveTouchDelay={10000}
                            arrow
                            componentsProps={tooltipDesign}
                          >
                            <button
                              type="button"
                              className="no-design p-0 chart d-none"
                              onClick={
                                activeSubscriptionFeatures?.liveCharts?.enabled == false
                                  ? () => handleClickDialogOpen()
                                  : () =>
                                      navigate(`/chart`, {
                                        state: {
                                          symbol: ao?.identifier,
                                        },
                                      })
                              }
                            >
                              <IconRegistry name="chart-area d-none" size={20} />
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
                          </Menu>
                        </p>

                        <p className={ao?.iSAutoTrade && "text-success"}>
                          {ao?.symbolCategoryName}
                        </p>
                      </td>
                      <td>
                        <span
                          className={`${ao?.profitLost >= 0 ? "text-success" : "text-danger"
                            }`}
                        >
                          {ao?.profitLost >= 0 ? (
                            <IconRegistry name="caret-up" size={20} />
                          ) : (
                            <IconRegistry name="caret-down" size={20} />
                          )}{" "}
                          {ao?.profitLost}{" "}
                        </span>
                      </td>
                      <td>
                        {" "}
                        <div className="secondary-color">{ao?.closedPrice}</div>
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
                          {ao?.orderType == 1 ? "Buy" : "Sell"} {ao?.productType == 1 ? "CNC" : "MIS"}
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
                      An order that is fully completed — either executed,
                      cancelled, or Pending order expired.
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
            className={`px-3 py-1 rounded ${currentPage === 1
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
                className={`px-3 py-1 rounded ${currentPage === page
                    ? "bg-blue-500"
                    : "bg-gray-200 hover:bg-gray-300"
                  }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            )
          )}

          {/* Next Arrow */}
          <button
            className={`px-3 py-1 rounded ${currentPage === totalPages
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
          defaultTab="details"
          isEditable={0}
          hideExitButton={true}
          hideGainLoss={false}
        />
      )}
    </div>
  );
};

export default ClosedOrder;
