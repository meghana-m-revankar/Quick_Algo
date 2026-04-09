import React from "react";
import {
  OrderHeader,
  ActiveOrder,
  ClosedOrder,
  RejectedOrder,
  PendingOrder,
} from "..";
import "./order.scss";
import { useLocation } from "react-router-dom";

import useOrder from "./order";
import useSymbolDetails from "#hooks/useSymbol";
import { OrderContext } from "../../context";

const Order = () => {
  const location = useLocation();
  const {
    isLoading,
    activeOrderList,
    symbolCategory,
    filterData,
    handleFilterChange,
    isFilter,
    setIsFilter,
    resetFilter,
    handleOrderExit,
    totalBuy,
    todayPL,
    closedOrderList,
    setClosedOrderList,
    closedData,
    totalSell
  } = useOrder();

  return (
    <div className="content orders_page">
      <div className="card-box">
        <OrderContext.Provider
          value={{
            isLoading,
            activeOrderList,
            symbolCategory,
            filterData,
            handleFilterChange,
            isFilter,
            setIsFilter,
            resetFilter,
            handleOrderExit,
            totalBuy,
            todayPL,
            closedOrderList,
            setClosedOrderList,
            closedData,
            totalSell
          }}
        >
          {location.pathname == "/order/active" ? <ActiveOrder /> : ""}
          {location.pathname == "/order/closed" ? <ClosedOrder /> : ""}
          {location.pathname == "/order/rejected" ? <RejectedOrder /> : ""}
          {location.pathname == "/order/pending" ? <PendingOrder /> : ""}
        </OrderContext.Provider>
      </div>
    </div>
  );
};

export default Order;
