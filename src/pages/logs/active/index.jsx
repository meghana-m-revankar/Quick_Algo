import { IconRegistry } from "#components";
import React, { useEffect, useState } from "react";
import useActiveLogs from "./active";
import { SubscriptionDialog, TableShimmer } from "#components";
import { images } from "#helpers";
import useSymbolDetails from "#hooks/useSymbol";
import dayjs from "dayjs";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { LogsHeader } from "#pages/index.js";

const ActiveLogs = () => {
  const {
    activeLogsList,
    isLoading,
    getPaginationRange,
    handleSort,
    totalPages,
    paginatedData,
    search,
    sortColumn,
    sortOrder,
    currentPage,
    setCurrentPage,
    setSearch,
    filterData,
    symbolAllCategory,
    handleFilterChange,
    handlePL,
    dialogOpen,
    handleClickDialogOpen,
    handleDialogClose,
    activeSubscriptionFeatures,
    navigate,
  } = useActiveLogs();

  const symbolActiveLogs = useSymbolDetails(activeLogsList, "order");

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="active_logs_page">
      <div className="all-new-data-main-sticky">
        <LogsHeader />
      </div>

      <div className="table-container">
        <table className="sticky-table">
          <thead className="table-thead-new">
            <tr className={`sub-header-row ${isScrolled ? "scrolled" : ""}`}>
              <th onClick={() => handleSort("userName")}>
                ID{" "}
                {sortColumn == "userName"
                  ? sortOrder == "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th>Symbol</th>
              <th>P/L</th>
              <th>LTP</th>
              <th>Quantity</th>
              <th>Trigger</th>
              <th>Order Type</th>
              <th>Strategy</th>
              <th>TGT</th>
              <th>SL</th>
              <th>Broker Order Date</th>
              <th>Broker Order No.</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableShimmer row={4} column={12} />
            ) : paginatedData?.length > 0 ? (
              paginatedData?.map((val, key) => {
                const ao = symbolActiveLogs[val?.identifier];

                return (
                  <tr key={key}>
                    <td>{ao?.userName}</td>
                    <td>
                      {ao?.identifier}

                      <p>
                        <span className={ao?.iSAutoTrade ? "text-success" : ""}>
                          {ao?.symbolCategoryName}{" "}
                        </span>
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
                              activeSubscriptionFeatures?.liveCharts?.enabled ==
                              false
                                ? () => handleClickDialogOpen()
                                : () =>
                                    navigate(`/chart`, {
                                      state: {
                                        symbol: ao?.identifier,
                                      },
                                    })
                            }
                          >
                            {" "}
                            <IconRegistry name="chart-area" size={20} />
                          </span>
                        </Tooltip>
                      </p>
                    </td>
                    <td>
                      <p
                        className={
                          ao?.profitLost > 0
                            ? "text-success fw-500"
                            : "text-danger fw-500"
                        }
                      >
                        {(
                          (ao?.lastBuyPrice - ao?.entryPrice) *
                          ao?.quantity
                        ).toFixed(2)}
                      </p>
                    </td>
                    <td>
                      <p
                        className={
                          ao?.profitLost > 0
                            ? "text-success fw-500"
                            : "text-danger fw-500"
                        }
                      >
                        {ao?.lastBuyPrice}
                      </p>
                    </td>
                    <td>{ao?.quantity}</td>
                    <td>{ao?.entryPrice}</td>
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

                    <td>{ao?.stratergyName}</td>

                    <td>
                      <p className={"text-success fw-500"}>
                        {ao?.takeProfitEstPrice ? ao?.takeProfitEstPrice : 0}
                      </p>
                    </td>
                    <td>
                      <p className={"text-danger fw-500"}>
                        {ao?.stopLossEstPrice ? ao?.stopLossEstPrice : 0}
                      </p>
                    </td>

                    <td>
                      {dayjs(ao?.brokerOrderDate).format("YYYY-MM-D H:m:s")}
                    </td>
                    <td>
                      {ao?.brokerOrderNo}
                      <p>{ao?.brokerReason}</p>
                      <p>{ao?.brokerOrderResponse || "-"}</p>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={"100%"} className="text-center">
                  <img
                    src={images["other/noData.png"]}
                    className="no_data"
                    alt="No-Record"
                  />
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
                    ? "bg-blue-500 active"
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
        <SubscriptionDialog open={dialogOpen} handleClose={handleDialogClose} />
      )}
    </div>
  );
};

export default ActiveLogs;
