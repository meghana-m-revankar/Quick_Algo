import { IconRegistry } from "#components";
import React, { useContext, useEffect, useState } from "react";
import { TbListDetails } from "react-icons/tb";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { tooltipDesign } from "#constant/index";
import { HiOutlineChartBarSquare } from "react-icons/hi2";
import { EditOrderDialog, TableShimmer } from "#components";
import { ThemeContext } from "../../../context";
import useRejectedOrder from "./reject";
import { images } from "#helpers";
import { OrderHeader } from "#pages/index.js";

const RejectedOrder = () => {
  const {
    getPaginationRange,
    isLoading,
    handleFilterChange,
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
    handleShowButton,
  } = useRejectedOrder();

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

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="active_order_page rejected_page">
      <div className="all-new-data-main-sticky">
        <OrderHeader />

        <div>
          <button className="open-btn" type="button" onClick={handleShowButton}>
            Open
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="sticky-table">
          <thead class="table-thead-new">
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
              <th>Order Type</th>
              <th>Qty</th>
              <th>ATP</th>
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
                        {ao?.identifier}
                        <Tooltip
                          title="Order Details"
                          arrow
                          enterTouchDelay={0}
                          leaveTouchDelay={10000}
                          componentsProps={tooltipDesign}
                        >
                          <button
                            type="button"
                            className="no-design"
                            onClick={(e) => handleMenuOpen(e, val?.identifier)}
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
                                bgcolor: themeMode == "dark" ? "#333" : "#fff",
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
                            onClick={() => handleClickDialogOpen(ao, "details")}
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
                      <div className="secondary-color">{ao?.quantity}</div>
                    </td>
                    <td>
                      {" "}
                      <div className="secondary-color">{ao?.entryPrice}</div>
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
            )
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
          defaultTab="details"
          isEditable={0}
          hideExitButton={true}
          hideGainLoss={true}
        />
      )}
    </div>
  );
};

export default RejectedOrder;
